"use client";

import Link from "next/link";
import { useFairMode } from "@provider/siteConfigProvider";
import { EYEBROW, mix } from "./checkoutTheme";

type Props = {
  orderNumber: string;
};

/* Confirmación, sistema editorial v2: número de pedido grande, qué sigue en
   tres líneas, dos botones píldora. */
export function CheckoutConfirmation({ orderNumber }: Props) {
  // Modo feria: no se invita a seguir comprando (la venta es obra por obra, desde el QR).
  const fairMode = useFairMode();
  const pill = (solid: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    padding: "0 30px",
    borderRadius: 999,
    border: "1px solid var(--fg)",
    background: solid ? "var(--fg)" : "transparent",
    color: solid ? "var(--bg)" : "var(--fg)",
    ...EYEBROW,
    fontSize: 11,
    textDecoration: "none",
  });
  const steps = [
    ["Correo", "Te llega la confirmación con la ficha de cada obra."],
    ["Entrega", "El artista te contacta para coordinar la entrega."],
    ["Autenticidad", "Cada obra va con su certificado."],
  ];
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 28, padding: "clamp(8px,1vw,12px) 0 24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={{ ...EYEBROW, color: "var(--acc)" }}>Pedido confirmado</span>
        <h2 style={{ margin: 0, fontWeight: 200, fontSize: "clamp(36px,5vw,64px)", lineHeight: 1, letterSpacing: "-0.02em" }}>
          Gracias por tu compra.
        </h2>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, maxWidth: "52ch", color: mix(75) }}>
          Tu pedido quedó registrado con el número <b style={{ fontWeight: 500, color: "var(--fg)", fontVariantNumeric: "tabular-nums" }}>{orderNumber}</b>. Guárdalo por si necesitas escribirnos.
        </p>
      </div>

      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,200px), 1fr))", gap: 18, borderTop: `1px solid ${mix(12)}` }}>
        {steps.map(([k, v], i) => (
          <li key={k} style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 16 }}>
            <span style={{ ...EYEBROW, color: mix(55) }}>
              <span style={{ color: "var(--acc)" }}>0{i + 1}</span> · {k}
            </span>
            <span style={{ fontSize: 14.5, lineHeight: 1.55, color: mix(80) }}>{v}</span>
          </li>
        ))}
      </ol>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {!fairMode && <Link href="/catalogo" style={pill(true)}>Seguir viendo obras</Link>}
        <Link href="/" style={pill(fairMode)}>Volver al inicio</Link>
      </div>
    </section>
  );
}
