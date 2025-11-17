// components/Payment/PaymentMethodSelector.tsx

"use client";

import React from "react";
import { CreditCard, MessageCircle } from "lucide-react";
import { PaymentMethod } from "@services/order.service";


export type PaymentMethodSelectorProps = {
  method: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
};

export function PaymentMethodSelector({
  method,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      {/* MÉTODO 1: MERCADO PAGO */}
      <button
        type="button"
        onClick={() => onChange("mercadopago")}
        className={`border rounded-lg px-4 py-3 text-sm flex flex-col items-start gap-1 transition ${method === "mercadopago"
            ? "border-blue-600 bg-blue-50"
            : "border-gray-200 bg-white"
          }`}
      >
        <span className="font-semibold flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-blue-600" />
          Mercado Pago
        </span>
        <span className="text-xs text-gray-600 leading-4">
          Tarjeta de crédito, débito o cuenta de Mercado Pago.
        </span>
      </button>

      {/* MÉTODO 2: WHATSAPP */}
      <button
        type="button"
        onClick={() => onChange("whatsapp")}
        className={`border rounded-lg px-4 py-3 text-sm flex flex-col items-start gap-1 transition ${method === "whatsapp"
            ? "border-green-600 bg-green-50"
            : "border-gray-200 bg-white"
          }`}
      >
        <span className="font-semibold flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-green-600" />
          WhatsApp
        </span>
        <span className="text-xs text-gray-600 leading-4">
          Habla con un asesor y completa el pago manualmente.
        </span>
      </button>
    </div>
  );
}
