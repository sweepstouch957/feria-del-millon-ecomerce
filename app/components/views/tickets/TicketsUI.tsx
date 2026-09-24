"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CreditCard, Mail, QrCode, Sparkles, Ticket as TicketIcon, User } from "lucide-react";
import toast from "react-hot-toast";

import { TicketDay, TicketsUIProps, classNames, TICKET_TYPE_OPTIONS } from "./ticketTypes";
import { Pill, QtyStepper, LabeledInput } from "./TicketAtoms";
import { DayCard } from "./DayCard";
import { TicketsPreviewModal } from "./TicketsPreviewModal";

import { formatMoney } from "@lib/utils";
import type { Ticket } from "@services/ticket.service";
import { payTicketsWithMercadoPago, getTicketTypes, type PayWithMercadoPagoPayload, type TicketTypeKey, type TicketTypeOption } from "@services/ticket.service";
import { useQuery } from "@tanstack/react-query";
import { uploadImage } from "@services/upload.service";
import { useEdition } from "@provider/editionProvider";
import { ColombianPhoneInput } from "@components/ColombianInput";

/** Si la config del evento no carga, se muestran los tipos del documento. */
const FALLBACK_TYPES: TicketTypeOption[] = TICKET_TYPE_OPTIONS.map((t, i) => ({
  key: t.key as TicketTypeKey,
  label: t.label,
  desc: t.desc,
  price: t.price ?? null,
  pickDay: !!t.pickDay,
  allDays: !t.pickDay,
  quantities: t.quantities ?? null,
  maxQty: t.maxQty ?? null,
  cap: null,
  sold: 0,
  remaining: null,
  enabled: true,
  salesFrom: null,
  salesTo: null,
  open: true,
  closedReason: null,
  requiresStudentId: t.key === "estudiante",
  sortOrder: i,
}));

const CLOSED_LABEL: Record<string, string> = {
  disabled: "No disponible",
  not_started: "Aún no abre",
  ended: "Preventa cerrada",
  sold_out: "Agotado",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "long" });

type MercadoPagoCardFormData = {
  token: string;
  installments: number;
  payment_method_id: string;
  issuer_id: string;
  payer?: {
    email?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  transaction_amount: number; // no lo vamos a confiar, solo lo recibimos
};
export default function TicketsUI({
  eventId: eventIdProp,
  eventName: eventNameProp,
  currency = "COP",
  days,
  initialQty = 1,
  onBuyClick,
}: TicketsUIProps & { eventId?: string }) {
  const edition = useEdition();
  const eventId = eventIdProp ?? edition.eventId;
  const eventName = eventNameProp ?? edition.eventName;
  const [selectedDay, setSelectedDay] = useState<TicketDay | null>(
    days[0] ?? null,
  );
  const [qty, setQty] = useState<number>(initialQty);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState(""); // nuevo estado teléfono
  const [ticketType, setTicketType] = useState<TicketTypeKey>("general");

  // Preventa: el backend manda precio, cupo y ventana de venta de cada tipo.
  const { data: config } = useQuery({
    queryKey: ["ticketTypes", eventId],
    queryFn: () => getTicketTypes(eventId!),
    enabled: !!eventId,
    staleTime: 60_000,
  });
  const typeOptions = config?.types?.length ? config.types : FALLBACK_TYPES;
  const spec = typeOptions.find((t) => t.key === ticketType) ?? typeOptions[0];
  const [company, setCompany] = useState("");
  const [nit, setNit] = useState("");
  const [studentIdUrl, setStudentIdUrl] = useState("");
  const [uploadingId, setUploadingId] = useState(false);

  const submittingRef = React.useRef(false);
  // Clave de idempotencia ESTABLE por intento de compra: se genera al abrir el
  // pago y se reusa en cada reintento → si el cobro tuvo éxito pero se perdió
  // la respuesta, un reintento con la misma key NO vuelve a cobrar (MP dedupea).
  const idemKeyRef = React.useRef<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [generatedTickets, setGeneratedTickets] = useState<Ticket[]>([]);
  const [readyToPay, setReadyToPay] = useState(false);

  // Por ahora sólo tenemos un método: Mercado Pago
  const [method] = useState<"mercadopago">("mercadopago");

  // Si el tipo elegido deja de estar en venta, saltamos al primero disponible.
  useEffect(() => {
    if (spec?.open) return;
    const next = typeOptions.find((t) => t.open);
    if (next && next.key !== ticketType) setTicketType(next.key);
  }, [spec?.open, typeOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  const unitPrice = spec.price ?? selectedDay?.price ?? 0;
  const total = unitPrice * qty;

  useEffect(() => {
    setQty(spec.quantities ? spec.quantities[0] : 1);
    setReadyToPay(false);
  }, [ticketType]); // eslint-disable-line react-hooks/exhaustive-deps

  const onStudentId = async (file?: File) => {
    if (!file) return;
    setUploadingId(true);
    try {
      const { url } = await uploadImage(file, "carnets");
      setStudentIdUrl(url);
    } catch {
      toast.error("No se pudo subir la foto del carné.");
    } finally {
      setUploadingId(false);
    }
  };

  const emailValid = /\S+@\S+\.\S+/.test(buyerEmail);
  const isPhoneValid =
    buyerPhone === "" || /^3\d{9}$/.test(buyerPhone); // 10 dígitos, empieza en 3

  // Pases multi-día / preview no consumen cupo de un día: tienen su propio cupo.
  const remaining = useMemo(() => {
    if (!spec.pickDay) return spec.remaining ?? Infinity;
    if (!selectedDay) return 0;
    return Math.max(0, selectedDay.cap - selectedDay.sold);
  }, [selectedDay, spec.pickDay, spec.remaining]);

  const canBuy = Boolean(
    spec.open &&
    (selectedDay || !spec.pickDay) &&
    qty > 0 &&
    buyerName.trim().length > 1 &&
    emailValid &&
    remaining > 0 &&
    (ticketType !== "estudiante" || studentIdUrl) &&
    (ticketType !== "empresa" || company.trim()),
  );

  /** Compra (con tarjeta del Brick, o sin tarjeta si es gratis). */
  const purchase = async (card?: PayWithMercadoPagoPayload["card"]) => {
    const idempotencyKey =
      idemKeyRef.current ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const loadingId = toast.loading("Procesando y generando tus boletos...");
    try {
      const res = await payTicketsWithMercadoPago({
        eventId: eventId!,
        type: ticketType,
        date: spec.pickDay ? selectedDay?.date : undefined,
        quantity: qty,
        channel: "online",
        presale: false,
        idempotencyKey,
        studentIdUrl: ticketType === "estudiante" ? studentIdUrl : undefined,
        buyer: {
          // estos vienen de tu propio formulario (NO confiamos en el Brick)
          name: buyerName.trim(),
          email: buyerEmail.trim(),
          phone: buyerPhone || undefined,
          company: ticketType === "empresa" ? company.trim() : undefined,
          nit: ticketType === "empresa" ? nit.trim() || undefined : undefined,
        },
        card,
      });
      toast.dismiss(loadingId);
      if (res.ok && res.tickets?.length) {
        setGeneratedTickets(res.tickets);
        setShowPreview(true);
        toast.success(<span>Boletos generados <TicketIcon size={16} style={{ verticalAlign: "-2px" }} /></span>);
      } else {
        toast.error("No se pudieron generar los boletos. Intenta de nuevo o cambia de día.");
      }
    } catch (err: any) {
      toast.dismiss(loadingId);
      const code = err?.response?.data?.error;
      toast.error(
        code === "capacity_reached" ? "No quedan cupos para esta entrada."
          : code === "student_ticket_already_issued" ? "Este correo ya tiene una entrada de estudiante."
            : code === "student_id_required" ? "Sube la foto de tu carné."
              : err?.response?.data?.message || "Ocurrió un error procesando el pago. Intenta de nuevo.",
      );
    }
  };
  const resetState = () => {
    setSelectedDay(days[0] ?? null);
    setQty(initialQty);
    setBuyerName("");
    setBuyerEmail("");
    setStudentIdUrl("");
    setCompany("");
    setNit("");
    setGeneratedTickets([]);
    setShowPreview(false);
    setReadyToPay(false); // esto desmonta el Brick de MP
    idemKeyRef.current = ""; // nuevo intento → nueva key la próxima vez
  };
  const handleBuy = () => {
    if (!canBuy) return;

    if (!eventId) {
      toast.error("No se encontró el evento para esta compra.");
      return;
    }

    // Una key por intento de compra (se reusa en reintentos del mismo pago).
    idemKeyRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Gratis (estudiantes): sin pasarela.
    if (total === 0) {
      if (submittingRef.current) return;
      submittingRef.current = true;
      purchase().finally(() => {
        submittingRef.current = false;
      });
      return;
    }

    // callback opcional (por si el parent quiere loggear algo)
    onBuyClick?.({
      day: selectedDay,
      quantity: qty,
      buyer: { name: buyerName, email: buyerEmail, phone: buyerPhone || "" },
    } as any);

    setReadyToPay(true);

    toast("Ahora completa los datos de tu tarjeta para pagar.", {
      icon: <CreditCard size={16} />,
    });

    // Opcional: hacer scroll al formulario
    const el = document.getElementById("mp-card-form");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Mercado Pago Brick (adaptado para tickets)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (method !== "mercadopago") return;
    if (!readyToPay) return;
    if (typeof window === "undefined") return;
    if (!canBuy || total === 0) return;

    // @ts-expect-error: MercadoPago viene del script global
    const MP = window.MercadoPago as any;
    const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

    if (!MP || !mpPublicKey) {
      console.error(
        "MercadoPago SDK o NEXT_PUBLIC_MP_PUBLIC_KEY no están configurados",
      );
      toast.error(
        "No se pudo cargar el formulario de Mercado Pago. Intenta más tarde.",
      );
      return;
    }

    const mp = new MP(mpPublicKey, { locale: "es-CO" });
    const bricksBuilder = mp.bricks();

    const renderCardBrick = async () => {
      try {
        await bricksBuilder.create("cardPayment", "mp-card-form", {
          initialization: {
            amount: total, // toma el 100% del total
          },
          customization: {
            // Aquí puedes meter opciones de estilo/labels si quieres
          },
          callbacks: {
            onReady: () => {
              console.log("Mercado Pago Card Brick listo");
              toast.success("Listo para pagar con Mercado Pago");
            },
            onError: (error: unknown) => {
              console.error("Error en Brick de Mercado Pago:", error);
              toast.error(
                "Hubo un error cargando el formulario de Mercado Pago.",
              );
            },
            onSubmit: async (cardFormData: MercadoPagoCardFormData) => {
              // Guard contra doble submit concurrente (doble click, Brick
              // reinvocando onSubmit antes de que resuelva el primero).
              if (submittingRef.current) return;
              submittingRef.current = true;

              const {
                token,
                installments,
                payment_method_id,
                issuer_id,
                payer,
              } = cardFormData;

              try {
                await purchase({
                  token,
                  installments: Number(installments) || 1,
                  paymentMethodId: payment_method_id,
                  issuerId: issuer_id,
                  identification: payer?.identification,
                });
              } finally {
                submittingRef.current = false;
              }
            },

          },
        });
      } catch (err) {
        console.error("Error montando Brick de Mercado Pago:", err);
        toast.error("No se pudo inicializar Mercado Pago.");
      }
    };

    renderCardBrick();

    return () => {
      // Limpieza al desmontar o cambiar dependencia
      try {
        bricksBuilder.unmount("mp-card-form");
      } catch {
        // ignorar si ya está desmontado
      }
    };
  }, [
    method,
    readyToPay,
    total,
    eventId,
    selectedDay,
    qty,
    buyerName,
    buyerEmail,
    canBuy,
    ticketType,
    studentIdUrl,
    company,
    nit,
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 pt-4 sm:px-6 md:space-y-8 md:pb-10 md:pt-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900/5">
              <Sparkles className="size-5 text-slate-900" />
            </span>
            <div>
              <h2 className="text-lg font-bold leading-tight sm:text-xl md:text-2xl">
                {eventName}
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Elige tu día, completa tus datos y paga con tarjeta. Recibirás
                tus boletos con QR por correo.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tipo de entrada */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 sm:text-base">Tipo de entrada</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {typeOptions.map((t) => (
            <button
              key={t.key}
              type="button"
              disabled={!t.open}
              onClick={() => setTicketType(t.key)}
              className={classNames(
                "rounded-2xl border p-4 text-left transition-all",
                !t.open
                  ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                  : ticketType === t.key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:border-slate-400",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{t.label}</span>
                <span className="text-sm">
                  {t.price === null ? "según el día" : t.price === 0 ? "Gratis" : formatMoney(t.price, currency)}
                </span>
              </div>
              <p className={classNames("mt-1 text-xs", ticketType === t.key && t.open ? "text-white/70" : "text-slate-500")}>{t.desc}</p>
              {!t.open ? (
                <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {CLOSED_LABEL[t.closedReason || ""] || "No disponible"}
                  {t.closedReason === "not_started" && t.salesFrom ? ` · abre el ${fmtDate(t.salesFrom)}` : ""}
                </p>
              ) : (
                <>
                  {t.remaining !== null && t.remaining <= 20 && (
                    <p className={classNames("mt-2 text-[11px] font-medium", ticketType === t.key ? "text-white/80" : "text-amber-600")}>
                      Quedan {t.remaining} cupos
                    </p>
                  )}
                  {t.salesTo && (
                    <p className={classNames("mt-1 text-[11px]", ticketType === t.key ? "text-white/60" : "text-slate-400")}>
                      Preventa hasta el {fmtDate(t.salesTo)}
                    </p>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Days */}
      {spec.pickDay && (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 sm:text-base">
          Elige el día
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {days.map((d) => (
            <DayCard
              key={d.date}
              day={d}
              selected={selectedDay?.date === d.date}
              onSelect={setSelectedDay}
              currency={currency}
            />
          ))}
        </div>
      </div>
      )}

      {/* Order + Summary */}
      <div className="grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Compra */}
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-5 text-slate-800" />
            <h3 className="text-base font-semibold sm:text-lg">
              Completar datos de compra
            </h3>
          </div>

          {/* Inputs */}
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput
              label="Nombre"
              placeholder="Tu nombre completo"
              value={buyerName}
              onChange={setBuyerName}
              icon={<User className="size-4 text-slate-500" />}
            />

            <LabeledInput
              label="Email"
              placeholder="tucorreo@dominio.com"
              value={buyerEmail}
              onChange={setBuyerEmail}
              icon={<Mail className="size-4 text-slate-500" />}
              type="email"
            />
          </div>
          {/* Teléfono opcional (colombiano) */}
          <div className="grid gap-3 sm:grid-cols-2">
            <ColombianPhoneInput
              value={buyerPhone}
              onChange={setBuyerPhone}
            />
            {/* espacio para que se mantenga alineado en desktop */}
            <div className="hidden sm:block" />
          </div>
          {buyerPhone && !isPhoneValid && (
            <p className="text-[11px] text-red-500 sm:text-xs">
              Ingresa un celular colombiano válido
            </p>
          )}

          {ticketType === "empresa" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <LabeledInput label="Empresa" placeholder="Razón social" value={company} onChange={setCompany} />
              <LabeledInput label="NIT" placeholder="900123456-7" value={nit} onChange={setNit} />
            </div>
          )}

          {ticketType === "estudiante" && (
            <div className="space-y-1">
              <div className="text-xs text-slate-500">Foto del carné estudiantil vigente 2026</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onStudentId(e.target.files?.[0])}
                className="block w-full text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-white"
              />
              <p className="text-[11px] text-slate-500">
                {uploadingId ? "Subiendo…" : studentIdUrl ? "Carné cargado ✓. Preséntalo también en la entrada." : "Obligatorio. Lo verificamos en la entrada."}
              </p>
            </div>
          )}

          {/* Qty + total */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">Cantidad</div>
              <div className="mt-1">
                {spec.quantities ? (
                  <select
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {spec.quantities.map((q) => <option key={q} value={q}>{q} entradas</option>)}
                  </select>
                ) : (
                  <QtyStepper
                    value={qty}
                    min={1}
                    max={Math.min(spec.maxQty ?? 10, Math.max(1, remaining))}
                    onChange={setQty}
                  />
                )}
              </div>

              {!!selectedDay && spec.pickDay && (
                <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                  {remaining > 0
                    ? `Disponibles para este día: ${remaining}`
                    : "Capacidad completa para este día"}
                </p>
              )}
            </div>

            <div className="ml-auto text-right">
              <div className="text-xs text-slate-500">Total estimado</div>
              <div className="mt-1 text-xl font-bold sm:text-2xl">
                {formatMoney(total, currency)}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!canBuy || qty > remaining}
            onClick={handleBuy}
            className={classNames(
              "mt-1 w-full rounded-2xl py-3 text-sm font-semibold text-white transition-all sm:text-base",
              canBuy && qty <= remaining
                ? "bg-slate-900 hover:bg-slate-800 active:translate-y-[1px]"
                : "cursor-not-allowed bg-slate-300",
            )}
          >
            {total === 0 ? "Obtener mi entrada" : "Continuar al pago"}
          </button>

          {/* Contenedor del Brick de Mercado Pago */}
          {readyToPay && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-slate-600">
                Completa los datos de tu tarjeta a continuación para finalizar
                el pago:
              </p>
              <div
                id="mp-card-form"
                className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3"
              />
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-slate-500 sm:text-xs">
            Usa un correo al que tengas acceso. Ahí recibirás la confirmación y
            los códigos QR de tus boletos.
          </p>
        </div>

        {/* Resumen */}
        <div className="lg:sticky lg:top-24">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:p-6">
            <div className="flex items-center gap-2">
              <QrCode className="size-5 text-slate-800" />
              <h3 className="text-base font-semibold sm:text-lg">
                Resumen de tu selección
              </h3>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                  <QrCode className="size-4 text-slate-500" />
                </span>

                <div className="min-w-[8rem] flex-1">
                  <div className="text-sm font-semibold">
                    {spec.label}{spec.pickDay ? ` · ${selectedDay ? selectedDay.display : "Selecciona un día"}` : ""}
                  </div>
                  <div className="text-xs text-slate-600">
                    {spec.pickDay && !selectedDay
                      ? "Elige un día para ver el detalle"
                      : `${formatMoney(unitPrice, currency)} por boleto`}
                  </div>
                </div>

                <Pill className="bg-slate-900 text-[11px] text-white sm:text-xs">
                  {qty} boleto{qty !== 1 ? "s" : ""}
                </Pill>
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-semibold">
                    {formatMoney(total, currency)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Cargos</span>
                  <span className="font-semibold">—</span>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="text-sm font-medium">Total a pagar</span>
                  <span className="text-lg font-bold">
                    {formatMoney(total, currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] leading-relaxed text-slate-500 sm:text-xs">
              Al continuar aceptas los términos del evento. El pago se procesa
              con Mercado Pago y tus QR se enviarán a tu correo. No compartas tu
              código con personas desconocidas.
            </div>
          </div>
        </div>
      </div>

      {/* Preview modal con tickets reales */}
      <TicketsPreviewModal
        open={showPreview}
        onClose={() => {
          setShowPreview(false);
          resetState();
        }}
        tickets={generatedTickets}
        currency={currency}
      />
    </div>
  );
}