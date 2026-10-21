// components/Payment/PaymentMethodSelector.tsx — sistema editorial v2.
"use client";

import React from "react";
import { CreditCard, MessageCircle } from "lucide-react";
import { PaymentMethod } from "@services/order.service";

export type PaymentMethodSelectorProps = {
  method: PaymentMethod;
  onChange: (m: PaymentMethod) => void;
};

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const OPTIONS: { key: PaymentMethod; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: "mercadopago", label: "Tarjeta", desc: "Crédito o débito, con Mercado Pago. Aprobación al instante.", icon: <CreditCard size={16} /> },
  { key: "whatsapp", label: "Con un asesor", desc: "Coordinas el pago por WhatsApp con la feria.", icon: <MessageCircle size={16} /> },
];

export function PaymentMethodSelector({ method, onChange }: PaymentMethodSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Método de pago" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,220px), 1fr))", gap: 12 }}>
      {OPTIONS.map((o) => {
        const selected = method === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              textAlign: "left",
              padding: "16px 18px",
              border: `1px solid ${selected ? "var(--fg)" : mix(16)}`,
              background: selected ? "var(--panel)" : "transparent",
              color: selected ? "var(--fdm-on-dark,#F5F4EF)" : "inherit",
              font: "inherit",
              cursor: "pointer",
              transition: "all .3s ease",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 400 }}>
              <span style={{ color: selected ? "var(--acc)" : "inherit", display: "inline-flex" }}>{o.icon}</span>
              {o.label}
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.7 }}>{o.desc}</span>
          </button>
        );
      })}
    </div>
  );
}
