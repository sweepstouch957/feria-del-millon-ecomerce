// components/Payment/PaymentForm.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Check, Hourglass } from "lucide-react";
import { EYEBROW, mix } from "@components/views/checkout/checkoutTheme";
import type { PaymentMethod } from "@services/order.service";
import { formatMoney } from "@lib/utils";

import { TrustBadges } from "./PaymentInfoBlocks";
import {
  PaymentMethodSelector,
} from "./PaymentMethodSelector";
import { chargeMercadoPagoCard, getMpPublicKey } from "@services/order.service";
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
              toast.error(
                "Hubo un error cargando el formulario de Mercado Pago."
              );
            },
            onSubmit: async (cardFormData: any) => {
              const {
                token,
                installments,
                paymentMethodId,
                issuerId,
                payer,
              } = cardFormData;

              const loadingId = toast.loading("Procesando pago...");

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
                  toast("Tu pago está en revisión…", { icon: <Hourglass size={16} /> });
                  onPay({ method: "mercadopago" as PaymentMethod });
                } else {
                  console.error("Pago no aprobado:", res);
                  toast.error(
                    "No se pudo aprobar el pago. Revisa los datos o intenta con otra tarjeta."
                  );
                }
              } catch (err: any) {
                console.error("Error cobrando con Mercado Pago:", err);
                toast.dismiss(loadingId);
                // El backend explica el motivo: rechazo de la tarjeta (400), en
                // proceso / se vendió (409) o el error de Mercado Pago (500).
                const data = err?.response?.data;
                toast.error(
                  data?.message ||
                    (data?.detail?.message ? `Mercado Pago: ${data.detail.message}` : "") ||
                    "Ocurrió un error procesando el pago. Intenta de nuevo.",
                  { duration: 8000 }
                );
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

  const pill = (solid: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", justifyContent: "center", height: 50, padding: "0 28px",
    borderRadius: 999, border: "1px solid var(--fg)", background: solid ? "var(--fg)" : "transparent",
    color: solid ? "var(--bg)" : "var(--fg)", fontFamily: "inherit", fontWeight: 500, fontSize: 11,
    letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer", transition: "all .3s ease", flex: "1 1 200px",
  });

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, paddingBottom: 10, borderBottom: `1px solid ${mix(12)}` }}>
        <h2 style={{ margin: 0, fontWeight: 300, fontSize: "clamp(20px,2.2vw,26px)", letterSpacing: "-0.01em" }}>Cómo pagas</h2>
        <span style={{ marginLeft: "auto", fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ opacity: 0.6, marginRight: 8 }}>Total</span>
          <b style={{ fontWeight: 500 }}>{formatMoney(total)}</b>
        </span>
      </div>

      <PaymentMethodSelector method={method} onChange={setMethod} />

      {method === "whatsapp" ? (
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: mix(75), maxWidth: "60ch" }}>
          Te llevamos a WhatsApp para coordinar el pago con un asesor de la Feria del Millón. La obra queda reservada mientras se confirma.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ ...EYEBROW, fontSize: 9.5, opacity: 0.65 }}>Datos de la tarjeta · Mercado Pago</span>
          {/* Contenedor donde se renderiza el Brick de Mercado Pago */}
          <div id="mp-card-form" style={{ border: `1px solid ${mix(12)}`, padding: 12, background: mix(3) }} />
          <span style={{ fontSize: 12.5, opacity: 0.6 }}>El botón de pagar está dentro del formulario de la tarjeta.</span>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {method === "whatsapp" && (
          <button type="button" onClick={handlePayClick} disabled={isProcessing} style={pill(true)}>
            {isProcessing ? "Procesando…" : mainButtonLabel}
          </button>
        )}
        <button type="button" onClick={onBack} style={pill(false)}>
          Volver a mis datos
        </button>
      </div>

      <TrustBadges />
    </section>
  );
}
