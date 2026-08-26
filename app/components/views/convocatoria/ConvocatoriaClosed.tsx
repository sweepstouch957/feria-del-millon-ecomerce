"use client";

import Link from "next/link";
import { useSiteLanding } from "@provider/siteConfigProvider";

const GREEN = "var(--fdm-green,#3FA46E)";
const PANEL = "var(--fdm-panel,#0B0B0A)";
const ON_DARK = "#F5F4EF";

/**
 * Panel de "convocatoria cerrada" — se muestra cuando la convocatoria vigente
 * NO está en estado "open" (revisión/finalizada/etc). Bloquea el flujo de
 * postulación nueva. Textos desde el CMS (landing.convocatoria*).
 */
export default function ConvocatoriaClosed({ statusLabel }: { statusLabel?: string }) {
  const landing = useSiteLanding();
  const cp = landing.convocatoriaPage;
  return (
    <div className="fdm-v2" style={{ background: "var(--fdm-bg,#F7F6F2)", minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(40px,8vw,96px) clamp(20px,4vw,56px)" }}>
      <div style={{ maxWidth: 640, width: "100%", background: PANEL, color: ON_DARK, padding: "clamp(14px,2vw,22px)" }}>
        <div style={{ border: "1px solid rgba(245,244,239,0.24)", padding: "clamp(28px,5vw,56px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 300, fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(245,244,239,0.6)", marginBottom: 22 }}>
            <span style={{ display: "block", width: 7, height: 7, borderRadius: 999, background: "rgba(245,244,239,0.5)" }} />
            {statusLabel || cp.closed.title}
          </div>
          <h1 style={{ margin: 0, fontWeight: 200, fontSize: "clamp(28px,5vw,52px)", lineHeight: 1.08, textTransform: "uppercase" }}>
            Convocatoria <strong style={{ fontWeight: 500, color: GREEN }}>cerrada</strong>
          </h1>
          <p style={{ margin: "20px 0 0", fontSize: "clamp(15px,1.3vw,18px)", lineHeight: 1.7, color: "rgba(245,244,239,0.76)" }}>
            {cp.closed.message}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 28 }}>
            <Link href="/#boletin" style={{ display: "inline-flex", alignItems: "center", height: 52, padding: "0 32px", background: GREEN, color: "#0B0B0A", fontWeight: 300, fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", borderRadius: 999 }}>
              Avísame de la próxima →
            </Link>
            <Link href="/convocatoria" style={{ display: "inline-flex", alignItems: "center", height: 52, padding: "0 32px", border: "1px solid rgba(245,244,239,0.42)", color: ON_DARK, fontWeight: 300, fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", borderRadius: 999 }}>
              Ver bases
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
