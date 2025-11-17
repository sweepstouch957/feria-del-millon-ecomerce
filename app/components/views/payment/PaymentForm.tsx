// components/Payment/PaymentForm.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@components/ui/button";
import type { PaymentMethod } from "@services/order.service";
import { formatMoney } from "@lib/utils";

import { MercadoPagoInfo, TrustBadges } from "./PaymentInfoBlocks";
import {
  PaymentMethodSelector,
} from "./PaymentMethodSelector";
import { chargeMercadoPagoCard } from "@services/order.service";
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
  // 👉 solo usamos estos 2 métodos: mercado_pago | whatsapp
  const [method, setMethod] = useState<PaymentMethod>("mercadopago");

  // ────────────────────────────────────────────────────────────────────────────
  // Mercado Pago Brick (NO lo quitamos, solo le metemos toasts)
  // ────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (method !== "mercadopago") return;
    if (typeof window === "undefined") return;

    // @ts-expect-error: MercadoPago viene del script global
    const MP = window.MercadoPago as any;
    const mpPublicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

    if (!MP || !mpPublicKey) {
      console.error(
        "MercadoPago SDK o NEXT_PUBLIC_MP_PUBLIC_KEY no están configurados"
      );
      toast.error(
        "No se pudo cargar el formulario de Mercado Pago. Intenta más tarde."
      );
      return;
    }

    const mp = new MP(mpPublicKey, { locale: "es-CO" });
    const bricksBuilder = mp.bricks();

    const renderCardBrick = async () => {
      try {
        await bricksBuilder.create("cardPayment", "mp-card-form", {
          initialization: {
            amount: total, // 💯 toma el 100% del total
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
                  toast.success("Pago aprobado ✔️");
                  onPay({ method: "mercadopago" as PaymentMethod });
                } else if (res.ok && res.status === "pending") {
                  toast("Tu pago está en revisión…", { icon: "⏳" });
                  onPay({ method: "mercadopago" as PaymentMethod });
                } else {
                  console.error("Pago no aprobado:", res);
                  toast.error(
                    "No se pudo aprobar el pago. Revisa los datos o intenta con otra tarjeta."
                  );
                }
              } catch (err) {
                console.error("Error cobrando con Mercado Pago:", err);
                toast.dismiss(loadingId);
                toast.error(
                  "Ocurrió un error procesando el pago. Intenta de nuevo."
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
        bricksBuilder.unmount("mp-card-form");
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Método de Pago</h2>

      {/* Tabs de métodos de pago: Mercado Pago / WhatsApp */}
      <PaymentMethodSelector method={method} onChange={setMethod} />

      {/* Info de seguridad */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-2">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-semibold text-blue-900">Pago seguro</span>
        </div>
        <p className="text-sm text-blue-700">
          No almacenamos datos sensibles sin necesidad. El cobro se procesa a
          través de aliados como Mercado Pago o de forma directa por WhatsApp
          con un asesor.
        </p>
      </div>

      {/* Encabezado con total */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-500">Total a pagar</span>
        <span className="text-sm font-semibold text-gray-900">
          {formatMoney(total)}
        </span>
      </div>

      {/* Contenido según método */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lado izquierdo: info / Brick */}
        <div className="order-2 lg:order-1">
          {method === "whatsapp" ? (
            <p className="text-sm text-gray-700 mb-3">
              Serás redirigido a WhatsApp para coordinar el pago con un
              asesor de la Feria del Millón.
            </p>
          ) : (
            <div className="mb-3 w-full">
              {/* Contenedor donde se renderiza el Brick de Mercado Pago */}
              <div id="mp-card-form" className="w-full" />
            </div>
          )}
        </div>

        {/* Lado derecho: botón principal + volver */}
        <div className="order-1 lg:order-2 space-y-4">
          <div className="pt-2">
            <Button
              onClick={handlePayClick}
              disabled={
                isProcessing ||
                method === "mercadopago" // el pago se dispara desde el Brick
              }
              className="w-full bg-blue-600 hover:bg-blue-700 mb-2"
              size="lg"
              title={
                method === "mercadopago"
                  ? "Completa los datos en el formulario de Mercado Pago"
                  : undefined
              }
            >
              {isProcessing ? "Procesando..." : mainButtonLabel}
            </Button>
            <Button variant="outline" onClick={onBack} className="w-full mt-3">
              Volver a Información
            </Button>
          </div>
        </div>
      </div>

      <TrustBadges />
    </div>
  );
}
