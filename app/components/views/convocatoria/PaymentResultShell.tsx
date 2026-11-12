"use client";

import Link from "next/link";
import { ApplyShell, Ico, Journey } from "./applyUi";

/* Armazón de las tres pantallas de resultado del pago (exitoso, fallido,
   pendiente). Solo presentación: cada cliente conserva su propia lógica de
   reconciliación con Mercado Pago. */

export const EYEBROW: React.CSSProperties = { fontWeight: 500, fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase" };

export const TONE = {
  ok: "var(--green,#1F7A50)",
  warn: "var(--warn,#6B4E00)",
  error: "var(--bad,#B4472A)",
} as const;

export function ResultAction({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  return (
    <Link href={href} className={`fdm-st-btn is-lg${variant === "primary" ? " is-green" : ""}`} style={{ flex: "1 1 200px" }}>
      {children}
    </Link>
  );
}

export default function PaymentResultShell({
  tone,
  eyebrow,
  title,
  description,
  details,
  actions,
}: {
  tone: keyof typeof TONE;
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  /** Filas de detalle (referencia de pago, estado, etc.). */
  details?: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
}) {
  return (
    <ApplyShell narrow>
      {/* Pagado: ya va en "Sube tu proyecto". Si no, sigue en el pago. */}
      <Journey current={tone === "ok" ? 2 : 1} />

      <span className={`fdm-ap-big${tone === "warn" ? " is-warn" : tone === "error" ? " is-bad" : ""}`}>
        <Ico name={tone === "ok" ? "check" : tone === "warn" ? "clock" : "alert"} size={28} sw={1.8} />
      </span>

      <div className="fdm-ap-head">
        <span className="fdm-st-eyebrow" style={{ color: TONE[tone] }}>{eyebrow}</span>
        <h1 className="fdm-st-h1">{title}</h1>
        {description && <p className="fdm-st-lead">{description}</p>}
      </div>

      {!!details?.length && (
        <div className="fdm-st-card fdm-ap-kv" style={{ paddingTop: 8, paddingBottom: 8 }}>
          {details.map((d, i) => (
            <div key={d.label} style={i === 0 ? { borderTop: "none" } : undefined}>
              <span className="fdm-st-label">{d.label}</span>
              <span>{d.value}</span>
            </div>
          ))}
        </div>
      )}

      {actions && <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{actions}</div>}
    </ApplyShell>
  );
}
