"use client";
import Link from "next/link";
import { type ArtistApplication } from "@services/applications.service";
import { Alert, Ico, Journey } from "./applyUi";

/* Tarjeta de una postulación en «Mi postulación»: en qué va, las cifras y
   —lo más importante— un solo botón con lo que le toca hacer ahora. */

type Tone = "ok" | "warn" | "bad" | "mute";

const S: Record<string, { label: string; tone: Tone; title: string; desc: string }> = {
  pending_payment: { label: "Falta el pago", tone: "warn", title: "Paga la inscripción para continuar", desc: "Tu postulación está guardada. Cuando pagues se abre el formulario para subir tu proyecto." },
  draft: { label: "Sin enviar", tone: "warn", title: "Termina de subir tu proyecto", desc: "Ya pagaste. Falta completar el formulario con tu perfil y tus obras, y enviarlo." },
  submitted: { label: "Enviada", tone: "ok", title: "Recibimos tu postulación", desc: "Está en espera de revisión. Te avisamos por correo cuando haya novedades." },
  under_review: { label: "En revisión", tone: "ok", title: "El jurado está revisando tu proyecto", desc: "No tienes que hacer nada por ahora. Te avisamos por correo." },
  revision_requested: { label: "Te pidieron cambios", tone: "warn", title: "El jurado te pide corregir algo", desc: "Haz los cambios y vuelve a enviar tu postulación." },
  accepted: { label: "Aceptada", tone: "ok", title: "¡Estás dentro!", desc: "Tu proyecto fue seleccionado para la feria. Ya puedes cargar tus obras en tu estudio." },
  rejected: { label: "No seleccionada", tone: "bad", title: "Esta vez no quedó seleccionada", desc: "Gracias por postularte. Puedes volver a presentarte en la próxima edición." },
};

/** Paso del camino en el que va (0 cuenta · 1 pago · 2 proyecto · 3 respuesta). */
function journeyOf(app: ArtistApplication): 0 | 1 | 2 | 3 {
  if (["submitted", "under_review", "accepted", "rejected"].includes(app.status)) return 3;
  if (app.isPaid) return 2;
  return 1;
}

export function ApplicationCard({ app }: { app: ArtistApplication }) {
  const conv = typeof app.convocatoria === "object" ? app.convocatoria : null;
  const st = S[app.status] || { label: app.status, tone: "mute" as Tone, title: "Postulación en curso", desc: "" };

  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) : "—");

  const stats = [
    { label: "Inscripción", value: app.isPaid ? "Pagada" : "Sin pagar" },
    { label: "Obras", value: `${app.artworkImages?.length || 0}` },
    { label: "Enviada", value: fmtDate(app.submittedAt) },
    conv?.endDate ? { label: "Cierre", value: fmtDate(conv.endDate) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="fdm-st-order">
      <div className="top">
        <span style={{ fontSize: 18, color: "var(--fg)", overflowWrap: "anywhere" }}>{conv?.name || "Convocatoria"}</span>
        <span className={`fdm-st-pill is-${st.tone}`}>{st.label}</span>
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 20 }}>
        <Journey current={journeyOf(app)} />

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <h3 className="fdm-st-h2">{st.title}</h3>
          <p className="fdm-st-note" style={{ maxWidth: 560 }}>{st.desc}</p>
        </div>

        {app.status === "revision_requested" && app.revisionNotes && <Alert tone="warn" title="Lo que te pide el jurado">{app.revisionNotes}</Alert>}
        {app.status === "rejected" && app.rejectionReason && <Alert tone="bad" title="Comentario del jurado">{app.rejectionReason}</Alert>}

        <div className="fdm-st-stats">
          {stats.map((s) => (
            <div key={s.label}>
              <span className="fdm-st-label">{s.label}</span>
              <span style={{ fontSize: 17, fontWeight: 500 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Qué sigue: una sola acción */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {app.status === "pending_payment" && (
            <Link href={`/convocatoria/pagar?appId=${app._id}`} className="fdm-st-btn is-green is-lg" style={{ flex: "1 1 240px", maxWidth: 360 }}>Pagar la inscripción<Ico name="arrow" /></Link>
          )}
          {(app.status === "draft" || app.status === "revision_requested") && (
            <Link href={`/convocatoria/aplicar?appId=${app._id}`} className="fdm-st-btn is-green is-lg" style={{ flex: "1 1 240px", maxWidth: 360 }}>
              {app.status === "draft" ? "Continuar mi postulación" : "Corregir mi postulación"}
              <Ico name="arrow" />
            </Link>
          )}
          {app.status === "accepted" && (
            <Link href="/admin/artist" className="fdm-st-btn is-green is-lg" style={{ flex: "1 1 240px", maxWidth: 360 }}>Ir a mi estudio<Ico name="arrow" /></Link>
          )}
          {app.status === "rejected" && <Link href="/convocatoria" className="fdm-st-btn">Ver la convocatoria</Link>}
        </div>
      </div>
    </article>
  );
}

export default ApplicationCard;
