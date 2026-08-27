"use client";

import Link from "next/link";

/* Armazón compartido por las tres pantallas de resultado de pago
   (exitoso, fallido, pendiente). Solo presentación: cada cliente
   conserva su propia lógica de reconciliación con MercadoPago. */

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

export const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

export const TONE = {
  ok: "var(--fdm-green,#3FA46E)",
  warn: "#C9902B",
  error: "#B4472A",
} as const;

const ROOT_VARS = {
  "--bg": "var(--fdm-bg,#F7F6F2)",
  "--fg": "var(--fdm-fg,#0B0B0A)",
  "--acc": "var(--fdm-green,#3FA46E)",
  background: "var(--bg)",
  color: "var(--fg)",
  fontFamily: "Jost, system-ui, sans-serif",
  fontWeight: 400,
  minHeight: "calc(100vh - 81px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  overflowX: "hidden",
} as React.CSSProperties;

export function ResultAction({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: 50,
        padding: "0 28px",
        borderRadius: 999,
        ...EYEBROW,
        fontSize: 10.5,
        letterSpacing: "0.14em",
        ...(variant === "primary"
          ? { background: "var(--fg)", color: "var(--bg)", border: "1px solid var(--fg)" }
          : { background: "transparent", color: "inherit", border: `1px solid ${mix(26)}` }),
      }}
    >
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
  const color = TONE[tone];

  return (
    <div style={ROOT_VARS}>
      <main
        style={{
          width: "100%",
          maxWidth: 560,
          padding: "clamp(28px,4vw,60px) clamp(20px,4vw,40px)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span style={{ ...EYEBROW, color }}>{eyebrow}</span>

        <h1
          style={{
            margin: "10px 0 0",
            fontWeight: 300,
            fontSize: "clamp(28px,3.6vw,48px)",
            lineHeight: 1.05,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </h1>

        {description && (
          <p style={{ margin: "12px 0 0", maxWidth: "52ch", fontSize: 15, lineHeight: 1.6, color: mix(72) }}>
            {description}
          </p>
        )}

        {!!details?.length && (
          <div style={{ marginTop: "clamp(20px,2.4vw,30px)", borderTop: `1px solid ${mix(20)}` }}>
            {details.map((d) => (
              <div
                key={d.label}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "11px 0",
                  borderBottom: `1px solid ${mix(12)}`,
                }}
              >
                <span style={{ ...EYEBROW, fontSize: 9, color: mix(52) }}>{d.label}</span>
                <span style={{ fontSize: 14.5, textAlign: "right", wordBreak: "break-word" }}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {actions && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: "clamp(22px,2.6vw,32px)",
            }}
          >
            {actions}
          </div>
        )}
      </main>
    </div>
  );
}
