// components/Payment/PaymentForm.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Check, Hourglass } from "lucide-react";
import { EYEBROW, mix } from "@components/views/checkout/checkoutTheme";
import type { PaymentMethod } from "@services/order.service";
import { formatMoney } from "@lib/utils";

import { TrustBadges } from "./PaymentInfoBlocks";
import LegalDisclaimer from "@components/LegalDisclaimer";
import {
  PaymentMethodSelector,
} from "./PaymentMethodSelector";
import { chargeMercadoPagoCard, getMpPublicKey, getOrderPayStatus } from "@services/order.service";
import toast from "react-hot-toast";

export type PaymentFormPayload = {
  method: PaymentMethod;
};

export type PaymentFormProps = {
  total: number;
  isProcessing: boolean;
  onPay: (payload: PaymentFormPayload) => void;
  onBack: () => void;
  /** Necesario para asociar el pago de MP con la orden */
  orderId: string;
};

export default function PaymentForm({
  total,
  isProcessing,
  onPay,
  onBack,
  orderId,
}: PaymentFormProps) {
  // solo usamos estos 2 métodos: mercado_pago | whatsapp
  const [method, setMethod] = useState<PaymentMethod>("mercadopago");
  // Rechazo o falla de Mercado Pago: queda en pantalla (un toast se va y el
  // comprador no sabe si la obra quedó suya). null = sin problema.
  const [failure, setFailure] = useState<{ title: string; reason: string } | null>(null);
  // Pago "en revisión": Mercado Pago responde pending y decide segundos o minutos
  // después (a veces rechaza). No se muestra "gracias" hasta saber. "slow" = pasó
  // el tiempo de espera y sigue sin respuesta.
  const [review, setReview] = useState<null | "waiting" | "slow">(null);

  // ────────────────────────────────────────────────────────────────────────────
  // Mercado Pago Brick (NO lo quitamos, solo le metemos toasts)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (method !== "mercadopago") return;
    if (typeof window === "undefined") return;

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
        toast.error("Falta configurar Mercado Pago. Paga con un asesor por WhatsApp mientras tanto.");
        return;
      }
      try {
        bricksBuilder = new MP(mpPublicKey, { locale: "es-CO" }).bricks();
        await bricksBuilder.create("cardPayment", "mp-card-form", {
          initialization: {
            amount: total, // toma el 100% del total
          },
          customization: {
            // Opcional: estilos, textos, etc.
          },
          callbacks: {
            onReady: () => {
              console.log("Mercado Pago Card Brick listo");
              toast.success("Listo para pagar con Mercado Pago");
            },
            onError: (error: any) => {
              console.error("Error en Brick de Mercado Pago:", error);
              setFailure({
                title: "No pudimos cargar el pago con tarjeta",
                reason: "Mercado Pago no respondió. Puedes recargar la página o terminar la compra con un asesor por WhatsApp.",
              });
            },
            onSubmit: async (cardFormData: any) => {
              const {
                token,
                installments,
                payer,
              } = cardFormData;
              // El Brick los entrega en snake_case; se acepta también el otro por si cambia.
              const paymentMethodId = cardFormData.payment_method_id ?? cardFormData.paymentMethodId;
              const issuerId = cardFormData.issuer_id ?? cardFormData.issuerId;

              const loadingId = toast.loading("Procesando pago...");
              setFailure(null);

              try {
                const res = await chargeMercadoPagoCard({
                  orderId,
                  token,
                  installments,
                  paymentMethodId,
                  issuerId,
                  email: payer?.email,
                });

                toast.dismiss(loadingId);

                if (res.ok && res.status === "approved") {
                  toast.success(<span>Pago aprobado <Check size={16} style={{ verticalAlign: "-2px" }} /></span>);
                  onPay({ method: "mercadopago" as PaymentMethod });
                } else if (res.ok && res.status === "pending") {
                  // Espera el veredicto real (el webhook de MP actualiza la orden).
                  setReview("waiting");
                  setTimeout(() => document.getElementById("mp-pay-review")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
                  // ponytail: polling cada 4 s por 3 min; webhook típico tarda < 1 min.
                  for (let i = 0; i < 45; i++) {
                    await new Promise((r) => setTimeout(r, 4000));
                    const st = await getOrderPayStatus(orderId).catch(() => "");
                    if (st === "paid") {
                      setReview(null);
                      toast.success(<span>Pago aprobado <Check size={16} style={{ verticalAlign: "-2px" }} /></span>);
                      onPay({ method: "mercadopago" as PaymentMethod });
                      return;
                    }
                    if (st === "failed" || st === "canceled") {
                      setReview(null);
                      setFailure({ title: "Tu pago no fue aprobado", reason: "Mercado Pago revisó el pago y lo rechazó." });
                      setTimeout(() => document.getElementById("mp-pay-failure")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
                      return;
                    }
                  }
                  setReview("slow");
                  return;
                } else {
                  console.error("Pago no aprobado:", res);
                  setFailure({ title: "Tu pago no fue aprobado", reason: "Revisa los datos o intenta con otra tarjeta." });
                }
              } catch (err: any) {
                console.error("Error cobrando con Mercado Pago:", err);
                toast.dismiss(loadingId);
                // El backend explica el motivo: rechazo de la tarjeta (400), en
                // proceso / se vendió (409) o el error de Mercado Pago (500).
                const data = err?.response?.data;
                const reason =
                  data?.message ||
                  (data?.detail?.message ? `Mercado Pago: ${data.detail.message}` : "") ||
                  "Ocurrió un error procesando el pago.";
                setFailure({
                  title: data?.error === "sin_stock" ? "Esta obra ya se vendió" : "Tu pago no fue aprobado",
                  reason,
                });
              }
              // Que el comprador vea el recuadro (ya pintado), no el formulario.
              setTimeout(() => document.getElementById("mp-pay-failure")?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
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
        // ignore si ya está desmontado
      }
    };
  }, [method, total, orderId, onPay]);

  // ────────────────────────────────────────────────────────────────────────────
  // Click del botón principal (solo WhatsApp, MP se maneja dentro del Brick)
  // ────────────────────────────────────────────────────────────────────────────
  const handlePayClick = () => {
    if (isProcessing) return;

    // Mercado Pago: el submit lo dispara el Brick, no este botón
    if (method === "mercadopago") return;

    if (method === "whatsapp") {
      const url =
        "https://api.whatsapp.com/send/?phone=573007485406&text=Hola%2C+quiero+comprar+la+obra+-.+C%C3%B3digo+de+serie%3A+1107096db442e&type=phone_number&app_absent=0";

      toast.success("Abriendo WhatsApp para hablar con un asesor…");
      window.open(url, "_blank");
      onPay({ method: "whatsapp" });
      return;
    }
  };

  const mainButtonLabel =
    method === "whatsapp" ? "Hablar con un asesor" : "Pagar con Mercado Pago";

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20, padding: "clamp(18px,2.4vw,26px)", background: "var(--card)", border: "1px solid var(--line)", borderRadius: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span style={{ flex: "none", width: 28, height: 28, borderRadius: 999, display: "grid", placeItems: "center", background: "var(--inv)", color: "var(--invfg)", fontSize: 13, fontWeight: 600 }}>3</span>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: "clamp(18px,1.8vw,21px)", letterSpacing: "-0.015em" }}>Cómo pagas</h2>
        <span style={{ marginLeft: "auto", fontSize: 15, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ color: "var(--fg3)", marginRight: 8 }}>Total</span>
          <b style={{ fontWeight: 600 }}>{formatMoney(total)}</b>
        </span>
      </div>

      <PaymentMethodSelector method={method} onChange={(m) => { setFailure(null); setMethod(m); }} />

      {failure && method === "mercadopago" && (
        <div id="mp-pay-failure" role="alert" style={{ border: "2px solid #B42318", background: "#FEF3F2", color: "#0B0B0A", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          <b style={{ fontSize: 16 }}>{failure.title}</b>
          <span style={{ fontSize: 14.5, lineHeight: 1.55 }}>
            <b>La obra no quedó comprada y no se hizo ningún cobro.</b> {failure.reason}
          </span>
          {failure.title !== "Esta obra ya se vendió" && (
            <span style={{ fontSize: 14, lineHeight: 1.55 }}>
              Las compras de valor alto a veces las rechaza el banco o Mercado Pago por seguridad. Puedes intentar con otra
              tarjeta aquí abajo o terminar la compra con un asesor de la feria.
            </span>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              className="fdm-btn"
              style={{ flex: "1 1 200px" }}
              onClick={() => {
                const text = encodeURIComponent(`Hola, quiero comprar una obra en la Feria del Millón por ${formatMoney(total)}. Mercado Pago no aprobó mi pago. Pedido: ${orderId}`);
                window.open(`https://api.whatsapp.com/send/?phone=573007485406&text=${text}`, "_blank");
              }}
            >
              Comprar con un asesor (WhatsApp)
            </button>
            <button type="button" className="fdm-btn is-ghost" style={{ flex: "1 1 200px" }}
              onClick={() => { setFailure(null); document.getElementById("mp-card-form")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
              Intentar con otra tarjeta
            </button>
          </div>
        </div>
      )}

      {review && method === "mercadopago" && (
        <div id="mp-pay-review" role="status" style={{ border: "2px solid #B54708", background: "#FFFAEB", color: "#0B0B0A", borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          <b style={{ fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Hourglass size={18} /> {review === "waiting" ? "Estamos confirmando tu pago…" : "Tu pago sigue en revisión"}
          </b>
          <span style={{ fontSize: 14.5, lineHeight: 1.55 }}>
            {review === "waiting"
              ? <>Mercado Pago está revisando el pago. Puede tardar hasta un par de minutos: <b>no cierres esta página ni vuelvas a pagar</b>.</>
              : <>Mercado Pago todavía no responde. <b>No vuelvas a pagar.</b> Si lo aprueba, la obra queda tuya y te llega la confirmación al correo. Si lo rechaza, no se hace ningún cobro.</>}
          </span>
          {review === "slow" && (
            <button type="button" className="fdm-btn" style={{ alignSelf: "flex-start" }}
              onClick={() => {
                const text = encodeURIComponent(`Hola, mi pago de ${formatMoney(total)} en la Feria del Millón quedó en revisión. Pedido: ${orderId}`);
                window.open(`https://api.whatsapp.com/send/?phone=573007485406&text=${text}`, "_blank");
              }}>
              Preguntar a un asesor (WhatsApp)
            </button>
          )}
        </div>
      )}

      {method === "whatsapp" ? (
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: mix(75), maxWidth: "60ch" }}>
          Te llevamos a WhatsApp para coordinar el pago con un asesor de la Feria del Millón. La obra queda tuya cuando el asesor confirme el pago; hasta entonces alguien más podría comprarla.
        </p>
      ) : (
        // En revisión se oculta (no desmonta) el formulario: que no paguen dos veces.
        <div style={{ display: review ? "none" : "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--fg2)" }}>Datos de la tarjeta · Mercado Pago</span>
          {/* Contenedor donde se renderiza el Brick de Mercado Pago (min-height: no salta al cargar). */}
          <div id="mp-card-form" style={{ border: "1px solid var(--line2)", borderRadius: 14, padding: 12, background: "#fff", color: "#0B0B0A", minHeight: 320 }} />
          <span style={{ fontSize: 12.5, color: "var(--fg3)" }}>El botón de pagar está dentro del formulario de la tarjeta.</span>
        </div>
      )}

      <LegalDisclaimer />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {method === "whatsapp" && (
          <button type="button" className="fdm-btn" onClick={handlePayClick} disabled={isProcessing} style={{ flex: "1 1 220px" }}>
            {isProcessing ? "Procesando…" : mainButtonLabel}
          </button>
        )}
        <button type="button" className="fdm-btn is-ghost" onClick={onBack} style={{ flex: "1 1 220px" }}>
          ← Volver a mis datos
        </button>
      </div>

      <TrustBadges />
    </section>
  );
}
