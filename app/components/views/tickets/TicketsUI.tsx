"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CreditCard, Mail, Phone, QrCode, Sparkles, Ticket as TicketIcon, User } from "lucide-react";
import toast from "react-hot-toast";

import { TicketDay, TicketsUIProps, classNames } from "./ticketTypes";
import { Pill, QtyStepper, LabeledInput } from "./TicketAtoms";
import { DayCard } from "./DayCard";
import { TicketsPreviewModal } from "./TicketsPreviewModal";

import { formatMoney } from "@lib/utils";
import type { Ticket } from "@services/ticket.service";
import {
  payTicketsWithMercadoPago,
  type PayWithMercadoPagoPayload,
} from "@services/ticket.service";
import { useEdition } from "@provider/editionProvider";
import { ColombianPhoneInput } from "@components/ColombianInput";

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

  const total = useMemo(
    () => (!selectedDay ? 0 : selectedDay.price * qty),
    [selectedDay, qty],
  );

  const emailValid = /\S+@\S+\.\S+/.test(buyerEmail);
  const isPhoneValid =
    buyerPhone === "" || /^3\d{9}$/.test(buyerPhone); // 10 dígitos, empieza en 3

  const remaining = useMemo(() => {
    if (!selectedDay) return 0;
    return Math.max(0, selectedDay.cap - selectedDay.sold);
  }, [selectedDay]);

  const canBuy = Boolean(
    selectedDay &&
    qty > 0 &&
    buyerName.trim().length > 1 &&
    emailValid &&
    remaining > 0,
  );
  const resetState = () => {
    setSelectedDay(days[0] ?? null);
    setQty(initialQty);
    setBuyerName("");
    setBuyerEmail("");
    setGeneratedTickets([]);
    setShowPreview(false);
    setReadyToPay(false); // esto desmonta el Brick de MP
    idemKeyRef.current = ""; // nuevo intento → nueva key la próxima vez
  };
  const handleBuy = () => {
    if (!selectedDay || !canBuy) return;

    if (!eventId) {
      toast.error("No se encontró el evento para esta compra.");
      return;
    }

    // Una key por intento de compra (se reusa en reintentos del mismo pago).
    idemKeyRef.current =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

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
    if (!selectedDay) return;
    if (!canBuy) return;

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

              // Key ESTABLE del intento (generada en handleBuy). Se reusa en
              // reintentos → nunca doble cobro. Fallback por si faltara.
              const idempotencyKey =
                idemKeyRef.current ||
                (typeof crypto !== "undefined" && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

              const loadingId = toast.loading(
                "Procesando pago y generando tus boletos...",
              );

              try {
                const res = await payTicketsWithMercadoPago({
                  eventId: eventId!,
                  date: selectedDay.date, // "YYYY-MM-DD"
                  quantity: qty,
                  channel: "online",
                  presale: false,
                  idempotencyKey,
                  buyer: {
                    // estos vienen de tu propio formulario (NO confiamos en el Brick)
                    name: buyerName.trim(),
                    email: buyerEmail.trim(),
                  },
                  card: {
                    token,
                    installments: Number(installments) || 1,
                    paymentMethodId: payment_method_id,
                    issuerId: issuer_id,
                    identification: payer?.identification,
                  },
                });

                toast.dismiss(loadingId);

                if (res.ok && res.tickets?.length) {
                  setGeneratedTickets(res.tickets);
                  setShowPreview(true);
                  toast.success(<span>Pago registrado y boletos generados <TicketIcon size={16} style={{ verticalAlign: "-2px" }} /></span>);
                } else {
                  console.error("Respuesta de payTicketsWithMercadoPago:", res);
                  toast.error(
                    "No se pudieron generar los boletos. Intenta de nuevo o cambia de día.",
                  );
                }
              } catch (err: any) {
                console.error("Error en payTicketsWithMercadoPago:", err);
                toast.dismiss(loadingId);

                if (err?.response?.data?.error === "capacity_reached") {
                  toast.error("Capacidad alcanzada para este día.");
                } else if (err?.response?.data?.message) {
                  toast.error(err.response.data.message);
                } else {
                  toast.error(
                    "Ocurrió un error procesando el pago. Intenta de nuevo.",
                  );
                }
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

      {/* Days */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 sm:text-base">
          Tickets disponibles este día
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

          {/* Qty + total */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">Cantidad</div>
              <div className="mt-1">
                <QtyStepper
                  value={qty}
                  min={1}
                  max={Math.min(10, Math.max(1, remaining))}
                  onChange={setQty}
                />
              </div>

              {!!selectedDay && (
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
            disabled={!canBuy || !selectedDay || qty > remaining}
            onClick={handleBuy}
            className={classNames(
              "mt-1 w-full rounded-2xl py-3 text-sm font-semibold text-white transition-all sm:text-base",
              canBuy && qty <= remaining
                ? "bg-slate-900 hover:bg-slate-800 active:translate-y-[1px]"
                : "cursor-not-allowed bg-slate-300",
            )}
          >
            Continuar al pago
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
                    {selectedDay ? selectedDay.display : "Selecciona un día"}
                  </div>
                  <div className="text-xs text-slate-600">
                    {selectedDay
                      ? `${formatMoney(selectedDay.price, currency)} por boleto`
                      : "Elige un día para ver el detalle"}
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