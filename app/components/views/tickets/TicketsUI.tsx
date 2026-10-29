"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Mail, Ticket as TicketIcon, User } from "lucide-react";
import toast from "react-hot-toast";

import { TicketDay, TicketsUIProps, TICKET_TYPE_OPTIONS } from "./ticketTypes";
import { EYEBROW, Pill, QtyStepper, LabeledInput } from "./TicketAtoms";
import { DayCard } from "./DayCard";
import { TicketsPreviewModal } from "./TicketsPreviewModal";

import { formatMoney } from "@lib/utils";
import type { Ticket } from "@services/ticket.service";
import { payTicketsWithMercadoPago, getTicketTypes, type PayWithMercadoPagoPayload, type TicketTypeKey, type TicketTypeOption } from "@services/ticket.service";
import { getMpPublicKey } from "@services/order.service";
import { useQuery } from "@tanstack/react-query";
import { uploadImage } from "@services/upload.service";
import { useEdition } from "@provider/editionProvider";
import PhoneInput, { isValidPhone } from "@components/PhoneInput";
import LegalDisclaimer from "@components/LegalDisclaimer";

/* ──────────────────────────────────────────────────────────────
   Entradas — diseño editorial v2 (mismos tokens que catálogo, obra
   y checkout: --bg/--fg/--acc/--panel del layout, Jost, versalitas).
   Cada tipo de entrada puede traer su propio banner (lo sube el
   panel, tarjeta por tarjeta); sin banner, la tarjeta es tipográfica.
   ────────────────────────────────────────────────────────────── */

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const PAGE_CSS = `
  .fdm-tix { --on-panel: var(--fdm-on-dark,#F5F4EF); }
  .fdm-tix *, .fdm-tix *::before, .fdm-tix *::after { box-sizing: border-box; }
  .fdm-tix-wrap { max-width: 1180px; margin: 0 auto; padding: clamp(22px,3vw,44px) clamp(16px,3vw,32px) clamp(48px,6vw,88px); display: flex; flex-direction: column; gap: clamp(34px,4vw,56px); }
  .fdm-tix-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 18px 32px; padding-bottom: clamp(18px,2vw,26px); border-bottom: 1px solid ${mix(14)}; }
  .fdm-tix-h1 { margin: 0; font-weight: 200; font-size: clamp(40px,6vw,76px); line-height: .98; letter-spacing: -0.02em; text-wrap: balance; }
  .fdm-tix-h1 em { font-style: normal; color: var(--acc); }
  .fdm-tix-sec { display: flex; flex-direction: column; gap: 18px; }
  .fdm-tix-sec-h { display: flex; align-items: baseline; gap: 14px; }
  .fdm-tix-sec-h h2 { margin: 0; font-weight: 300; font-size: clamp(22px,2.4vw,30px); letter-spacing: -0.01em; }
  .fdm-tix-sec-h .n { ${Object.entries(EYEBROW).map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${typeof v === "number" ? v + "px" : v}`).join(";")}; color: var(--acc); }
  .fdm-tix-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,250px), 1fr)); gap: 14px; }
  .fdm-tix-days { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%,200px), 1fr)); gap: 14px; }
  .fdm-tix-card { position: relative; width: 100%; background: transparent; color: inherit; border: 1px solid ${mix(16)}; border-radius: 0; font-family: inherit; transition: border-color .3s ease, background-color .3s ease, color .3s ease, transform .3s ease; }
  .fdm-tix-card:hover:not(:disabled) { border-color: var(--fg); }
  .fdm-tix-card.is-selected { background: var(--panel); color: var(--on-panel); border-color: var(--panel); }
  .fdm-tix-card:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
  .fdm-tix-type { display: flex; flex-direction: column; text-align: left; cursor: pointer; overflow: hidden; }
  .fdm-tix-type:disabled { cursor: not-allowed; opacity: .5; }
  .fdm-tix-type .banner { aspect-ratio: 3 / 2; width: 100%; overflow: hidden; background: ${mix(6)}; }
  .fdm-tix-type .banner img { width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(1) contrast(1.05); transition: filter .45s ease, transform .6s ease; }
  .fdm-tix-type:hover .banner img, .fdm-tix-type.is-selected .banner img { filter: none; }
  .fdm-tix-type:hover .banner img { transform: scale(1.03); }
  .fdm-tix-type .body { display: flex; flex-direction: column; gap: 10px; padding: 18px 18px 16px; flex: 1; }
  .fdm-tix-type .check { position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; border-radius: 999px; border: 1px solid ${mix(30)}; display: inline-flex; align-items: center; justify-content: center; transition: all .3s ease; background: var(--bg); }
  .fdm-tix-type.is-selected .check { background: var(--acc); border-color: var(--acc); color: #0B0B0A; }
  .fdm-tix-two { display: grid; grid-template-columns: minmax(0,3fr) minmax(0,2fr); gap: clamp(18px,2.4vw,36px); align-items: start; }
  .fdm-tix-form { display: flex; flex-direction: column; gap: 26px; min-width: 0; }
  .fdm-tix-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%,220px), 1fr)); gap: 22px 28px; }
  .fdm-tix-aside { position: sticky; top: 92px; background: var(--panel); color: var(--on-panel); padding: clamp(20px,2.4vw,30px); display: flex; flex-direction: column; gap: 18px; min-width: 0; }
  .fdm-tix-aside .line { display: flex; justify-content: space-between; gap: 12px; font-size: 14.5px; padding: 9px 0; border-bottom: 1px solid rgba(245,244,239,.14); }
  .fdm-tix-btn { display: inline-flex; align-items: center; justify-content: center; height: 52px; padding: 0 30px; border-radius: 999px; border: 1px solid var(--fg); background: var(--fg); color: var(--bg); font-family: inherit; cursor: pointer; transition: all .3s ease; width: 100%; }
  .fdm-tix-btn:hover:not(:disabled) { background: var(--acc); border-color: var(--acc); color: #0B0B0A; }
  .fdm-tix-btn:disabled { cursor: not-allowed; opacity: .35; }
  .fdm-tix-aside .fdm-tix-btn { background: var(--on-panel); border-color: var(--on-panel); color: #0B0B0A; }
  .fdm-tix-aside .fdm-tix-btn:hover:not(:disabled) { background: var(--acc); border-color: var(--acc); }
  .fdm-in:focus-within { border-color: var(--acc) !important; }
  .fdm-step button:disabled { opacity: .3; cursor: not-allowed; }
  .fdm-tix select { background: transparent; border: 0; border-bottom: 1px solid ${mix(25)}; color: inherit; font: inherit; font-size: 16px; padding: 6px 0 8px; outline: none; }
  .fdm-tix select:focus { border-color: var(--acc); }
  .fdm-tix input[type=file] { font-size: 13px; color: inherit; }
  .fdm-tix input[type=file]::file-selector-button { ${Object.entries(EYEBROW).map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}:${typeof v === "number" ? v + "px" : v}`).join(";")}; margin-right: 12px; height: 38px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--fg); background: transparent; color: inherit; cursor: pointer; font-family: inherit; }
  .fdm-tix input[type=file]::file-selector-button:hover { background: var(--fg); color: var(--bg); }
  #mp-card-form { margin-top: 10px; }
  @media (max-width: 900px) { .fdm-tix-two { grid-template-columns: 1fr; } .fdm-tix-aside { position: static; } }
  @media (prefers-reduced-motion: reduce) { .fdm-tix * { transition: none !important; } }
`;

/** Si la config del evento no carga, se muestran los tipos del documento. */
const FALLBACK_TYPES: TicketTypeOption[] = TICKET_TYPE_OPTIONS.map((t, i) => ({
  key: t.key as TicketTypeKey,
  label: t.label,
  desc: t.desc,
  price: t.price ?? null,
  pickDay: !!t.pickDay,
  allDays: !t.pickDay,
  quantities: t.quantities ?? null,
  packPrices: t.packPrices ?? null,
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

function SectionHead({ n, title, children }: { n: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="fdm-tix-sec-h">
      <span className="n">{n}</span>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

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
  const [buyerPhone, setBuyerPhone] = useState("");
  const [ticketType, setTicketType] = useState<TicketTypeKey>("general");

  // Preventa: el backend manda precio, cupo, ventana de venta y banner de cada tipo.
  const { data: config } = useQuery({
    queryKey: ["ticketTypes", eventId],
    queryFn: () => getTicketTypes(eventId!),
    enabled: !!eventId,
    staleTime: 60_000,
  });
  // Un tipo apagado en el panel (Tickets → Preventa) no se muestra; uno que aún
  // no abre o ya cerró sí sale, con su aviso.
  // (Si los apagaran todos, se muestran igual como "No disponible" para que la página no quede vacía.)
  const shown = config?.types?.filter((t) => t.enabled !== false) ?? [];
  const typeOptions = shown.length ? shown : config?.types?.length ? config.types : FALLBACK_TYPES;
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

  // Paquetes (empresas): el precio por persona depende de la cantidad elegida.
  const unitPrice = spec.packPrices?.[qty] ?? spec.price ?? selectedDay?.price ?? 0;
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
    buyerPhone === "" || isValidPhone(buyerPhone); // con país: "+573001234567"

  // Pases multi-día no consumen cupo de un día: tienen su propio cupo.
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

    let bricksBuilder: any = null;

    const renderCardBrick = async () => {
      // @ts-expect-error: MercadoPago viene del script global
      const MP = window.MercadoPago as any;
      if (!MP) {
        console.error("MercadoPago SDK no cargó (¿bloqueador de contenido?)");
        toast.error("No cargó el formulario de tarjeta. Desactiva el bloqueador de contenido para este sitio e intenta de nuevo.");
        return;
      }
      let mpPublicKey = "";
      try {
        mpPublicKey = await getMpPublicKey();
      } catch { /* sin llave: se avisa abajo */ }
      if (!mpPublicKey) {
        console.error("Falta la llave pública de Mercado Pago (MERCADOPAGO_PUBLIC_KEY)");
        toast.error("Falta configurar Mercado Pago. Intenta más tarde.");
        return;
      }
      try {
        bricksBuilder = new MP(mpPublicKey, { locale: "es-CO" }).bricks();
        await bricksBuilder.create("cardPayment", "mp-card-form", {
          initialization: {
            amount: total, // toma el 100% del total
          },
          customization: {},
          callbacks: {
            onReady: () => {
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
      try {
        bricksBuilder?.unmount("mp-card-form");
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

  const firstDay = days[0];
  const lastDay = days[days.length - 1];
  const dateRange = firstDay && lastDay
    ? firstDay.date === lastDay.date ? firstDay.display : `${firstDay.display.split(" ").slice(1).join(" ")} – ${lastDay.display.split(" ").slice(1).join(" ")}`
    : "";
  const priceLabel = (t: TicketTypeOption) => {
    const packs = t.packPrices ? Object.values(t.packPrices).filter((n) => typeof n === "number") : [];
    if (packs.length && Math.min(...packs) < Math.max(...packs)) return `desde ${formatMoney(Math.min(...packs), currency)}`;
    return t.price === null ? "según el día" : t.price === 0 ? "Gratis" : formatMoney(t.price, currency);
  };
  const stepDatos = spec.pickDay ? "03" : "02";

  return (
    <div className="fdm-tix">
      <style>{PAGE_CSS}</style>
      <div className="fdm-tix-wrap">
        {/* Cabecera */}
        <header className="fdm-tix-head">
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <span style={{ ...EYEBROW, opacity: 0.65 }}>Entradas · {eventName}</span>
            <h1 className="fdm-tix-h1">Elige tu <em>entrada</em>.</h1>
            <p style={{ margin: 0, maxWidth: "52ch", fontSize: 15.5, lineHeight: 1.6, opacity: 0.8 }}>
              Compra en línea y recibe tus códigos QR por correo. Un QR por persona: preséntalo en la entrada, impreso o en el celular.
            </p>
          </div>
          {dateRange && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: "right" }}>
              <span style={{ ...EYEBROW, opacity: 0.65 }}>Días de feria</span>
              <span style={{ fontSize: "clamp(18px,2vw,24px)", fontWeight: 300, whiteSpace: "nowrap" }}>{dateRange}</span>
            </div>
          )}
        </header>

        {/* 01 · Tipo de entrada */}
        <section className="fdm-tix-sec">
          <SectionHead n="01" title="Tipo de entrada" />
          <div className="fdm-tix-grid">
            {typeOptions.map((t) => {
              const selected = ticketType === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  disabled={!t.open}
                  onClick={() => setTicketType(t.key)}
                  aria-pressed={selected}
                  className={`fdm-tix-card fdm-tix-type${selected ? " is-selected" : ""}`}
                >
                  {t.image && (
                    <div className="banner">
                      <img src={t.image} alt="" loading="lazy" />
                    </div>
                  )}
                  <span className="check" aria-hidden="true">
                    {selected && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5 4 7.5 10 1" stroke="currentColor" strokeWidth="1.6" /></svg>}
                  </span>
                  <div className="body">
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, paddingRight: t.image ? 0 : 28 }}>
                      <span style={{ fontSize: 19, fontWeight: 400, lineHeight: 1.2 }}>{t.label}</span>
                      <span style={{ fontSize: 14, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", opacity: t.price === null ? 0.7 : 1 }}>{priceLabel(t)}</span>
                    </div>
                    {t.desc && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, opacity: 0.72 }}>{t.desc}</p>}
                    <div style={{ marginTop: "auto", paddingTop: 6, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", ...EYEBROW, fontSize: 9.5, opacity: 0.7 }}>
                      {!t.open ? (
                        <span>
                          {CLOSED_LABEL[t.closedReason || ""] || "No disponible"}
                          {t.closedReason === "not_started" && t.salesFrom ? ` · abre el ${fmtDate(t.salesFrom)}` : ""}
                        </span>
                      ) : (
                        <>
                          {t.remaining !== null && t.remaining <= 20 && <span style={{ color: "var(--acc)", opacity: 1 }}>Quedan {t.remaining}</span>}
                          {t.salesTo && <span>Preventa hasta el {fmtDate(t.salesTo)}</span>}
                          {!t.salesTo && t.remaining === null && <span>En venta</span>}
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* 02 · Día */}
        {spec.pickDay && (
          <section className="fdm-tix-sec">
            <SectionHead n="02" title="Elige el día" />
            {days.length ? (
              <div className="fdm-tix-days">
                {days.map((d) => (
                  <DayCard key={d.date} day={d} selected={selectedDay?.date === d.date} onSelect={setSelectedDay} currency={currency} />
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>Los días de la feria se anuncian pronto.</p>
            )}
          </section>
        )}

        {/* 03 · Datos + resumen */}
        <section className="fdm-tix-sec">
          <SectionHead n={stepDatos} title="Tus datos" />
          <div className="fdm-tix-two">
            <div className="fdm-tix-form">
              <div className="fdm-tix-row">
                <LabeledInput label="Nombre completo" placeholder="Como aparece en tu documento" value={buyerName} onChange={setBuyerName} icon={<User size={16} />} />
                <LabeledInput label="Correo" placeholder="tucorreo@dominio.com" value={buyerEmail} onChange={setBuyerEmail} icon={<Mail size={16} />} type="email" hint="Ahí llegan los QR." />
              </div>
              <div className="fdm-tix-row">
                <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                  <label htmlFor="fdm-tix-phone" style={{ ...EYEBROW, fontSize: 9.5, opacity: 0.65 }}>Teléfono (opcional)</label>
                  <PhoneInput
                    id="fdm-tix-phone"
                    value={buyerPhone}
                    onChange={setBuyerPhone}
                    className="fdm-in"
                    style={{ alignItems: "center", borderBottom: `1px solid ${mix(25)}`, paddingBottom: 8, transition: "border-color .3s ease" }}
                    selectStyle={{ background: "transparent", border: 0, outline: "none", color: "inherit", fontSize: 16, fontFamily: "inherit", padding: 0, cursor: "pointer" }}
                    inputStyle={{ background: "transparent", border: 0, outline: "none", color: "inherit", fontSize: 16, fontFamily: "inherit", padding: 0 }}
                  />
                </div>
                {ticketType === "empresa" ? (
                  <LabeledInput label="Empresa" placeholder="Razón social" value={company} onChange={setCompany} />
                ) : (
                  <div />
                )}
              </div>
              {buyerPhone && !isPhoneValid && (
                <p style={{ margin: "-14px 0 0", fontSize: 12.5, color: "#C0392B" }}>El número está incompleto para el país elegido.</p>
              )}
              {ticketType === "empresa" && (
                <div className="fdm-tix-row">
                  <LabeledInput label="NIT" placeholder="900123456-7" value={nit} onChange={setNit} />
                  <div />
                </div>
              )}

              {ticketType === "estudiante" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ ...EYEBROW, fontSize: 9.5, opacity: 0.65 }}>Foto del carné vigente 2026</span>
                  <input type="file" accept="image/*" onChange={(e) => onStudentId(e.target.files?.[0])} />
                  <span style={{ fontSize: 12.5, opacity: 0.65 }}>
                    {uploadingId ? "Subiendo…" : studentIdUrl ? "Carné cargado. Preséntalo también en la entrada." : "Obligatorio. Lo verificamos en la entrada."}
                  </span>
                </div>
              )}

              {/* Cantidad */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 18, paddingTop: 6, borderTop: `1px solid ${mix(12)}` }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 16 }}>
                  <span style={{ ...EYEBROW, fontSize: 9.5, opacity: 0.65 }}>Cantidad</span>
                  {spec.quantities ? (
                    <select value={qty} onChange={(e) => setQty(Number(e.target.value))}>
                      {spec.quantities.map((q) => {
                        const u = spec.packPrices?.[q] ?? spec.price ?? selectedDay?.price ?? 0;
                        const full = spec.price ?? u;
                        const off = full > u ? Math.round((1 - u / full) * 100) : 0;
                        return (
                          <option key={q} value={q}>
                            {q} entradas · {formatMoney(u * q, currency)}{off ? ` (${off}% dto.)` : ""}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <QtyStepper value={qty} min={1} max={Math.min(spec.maxQty ?? 10, Math.max(1, remaining))} onChange={setQty} />
                  )}
                  {!!selectedDay && spec.pickDay && (
                    <span style={{ fontSize: 12.5, opacity: 0.65 }}>
                      {remaining > 0 ? `${remaining.toLocaleString("es-CO")} disponibles para ese día` : "Cupo completo para ese día"}
                    </span>
                  )}
                </div>
                <div style={{ textAlign: "right", paddingTop: 16 }}>
                  <span style={{ ...EYEBROW, fontSize: 9.5, opacity: 0.65, display: "block" }}>Total</span>
                  <span style={{ fontSize: "clamp(26px,3vw,34px)", fontWeight: 300, fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}>{formatMoney(total, currency)}</span>
                </div>
              </div>

              <button type="button" className="fdm-tix-btn" disabled={!canBuy || qty > remaining} onClick={handleBuy} style={{ ...EYEBROW, fontSize: 11 }}>
                {total === 0 ? "Obtener mi entrada" : "Continuar al pago"}
              </button>

              {readyToPay && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ ...EYEBROW, fontSize: 9.5, opacity: 0.65 }}>Pago con tarjeta · Mercado Pago</span>
                  <div id="mp-card-form" style={{ border: `1px solid ${mix(12)}`, padding: 12 }} />
                </div>
              )}

              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, opacity: 0.6, maxWidth: "60ch" }}>
                Usa un correo al que tengas acceso: ahí recibirás la confirmación y los códigos QR. No compartas tu código con desconocidos.
              </p>
            </div>

            {/* Resumen */}
            <aside className="fdm-tix-aside">
              <span style={{ ...EYEBROW, opacity: 0.6 }}>Tu selección</span>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 300, lineHeight: 1.15 }}>{spec.label}</div>
                  <div style={{ fontSize: 13.5, opacity: 0.7, marginTop: 4 }}>
                    {spec.pickDay
                      ? selectedDay ? `${selectedDay.display} · ${formatMoney(unitPrice, currency)} por persona` : "Elige un día para ver el detalle"
                      : spec.allDays ? `Todos los días de feria · ${formatMoney(unitPrice, currency)} por persona` : `${formatMoney(unitPrice, currency)} por persona`}
                  </div>
                </div>
                <Pill tone="acc">{qty} {qty === 1 ? "boleto" : "boletos"}</Pill>
              </div>
              <div>
                <div className="line"><span style={{ opacity: 0.7 }}>Subtotal</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{formatMoney(total, currency)}</span></div>
                <div className="line"><span style={{ opacity: 0.7 }}>Cargos</span><span>—</span></div>
                <div className="line" style={{ borderBottom: 0, paddingTop: 14 }}>
                  <span style={{ ...EYEBROW, fontSize: 9.5, opacity: 0.7, alignSelf: "center" }}>Total a pagar</span>
                  <span style={{ fontSize: 26, fontWeight: 300, fontVariantNumeric: "tabular-nums" }}>{formatMoney(total, currency)}</span>
                </div>
              </div>
              <LegalDisclaimer>El pago se procesa con Mercado Pago y tus QR llegan a tu correo.</LegalDisclaimer>
            </aside>
          </div>
        </section>
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
