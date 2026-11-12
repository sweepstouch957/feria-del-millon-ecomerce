"use client";

import Link from "next/link";
import { useSiteLanding } from "@provider/siteConfigProvider";
import { ApplyShell } from "./applyUi";

/**
 * "Convocatoria cerrada": se muestra cuando la convocatoria vigente NO está
 * abierta. Bloquea la postulación nueva. Textos desde el CMS.
 */
export default function ConvocatoriaClosed({ statusLabel }: { statusLabel?: string }) {
  const cp = useSiteLanding().convocatoriaPage;
  return (
    <ApplyShell narrow center>
      <div className="fdm-ap-head">
        <span className="fdm-st-eyebrow" style={{ color: "var(--fg2)" }}>{statusLabel || cp.closed.title}</span>
        <h1 className="fdm-st-h1">La convocatoria está cerrada</h1>
        <p className="fdm-st-lead">{cp.closed.message}</p>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <Link href="/#boletin" className="fdm-st-btn is-green is-lg" style={{ flex: "1 1 220px" }}>Avísame de la próxima</Link>
        <Link href="/convocatoria" className="fdm-st-btn is-lg" style={{ flex: "1 1 160px" }}>Ver las bases</Link>
      </div>
      <p className="fdm-st-note">¿Ya te postulaste? <Link href="/convocatoria/mi-solicitud" style={{ color: "var(--fg)", textDecoration: "underline" }}>Mira en qué va tu postulación</Link></p>
    </ApplyShell>
  );
}
