// components/Payment/PaymentInfoBlocks.tsx — sistema editorial v2.
"use client";

import React from "react";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

export function TrustBadges() {
  const items: [React.ReactNode, string][] = [
    [<Lock key="l" size={14} />, "Pago cifrado"],
    [<ShieldCheck key="s" size={14} />, "Prevención de fraude"],
    [<CheckCircle2 key="c" size={14} />, "Certificado de autenticidad"],
  ];
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: "14px 0 0", display: "flex", flexWrap: "wrap", gap: "8px 22px", borderTop: `1px solid ${mix(12)}` }}>
      {items.map(([icon, text]) => (
        <li key={text} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12.5, color: mix(60) }}>
          <span style={{ color: "var(--acc)", display: "inline-flex" }}>{icon}</span>
          {text}
        </li>
      ))}
    </ul>
  );
}
