"use client";
import Link from "next/link";
import { type ArtistApplication } from "@services/applications.service";

/* ──────────────────────────────────────────────────────────────
   Tarjeta de postulación — sistema editorial v2.
   La lógica de pasos no cambió; lo que sí cambia es que al quedar
   aceptada la tarjeta ofrece la acción siguiente (subir el catálogo)
   en vez de un texto de felicitación sin salida.
   ────────────────────────────────────────────────────────────── */

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const ACC = "var(--fdm-green,#3FA46E)";
const AMBER = "#C9902B";
const TERRA = "#B4472A";

const S: Record<string, { label: string; color: string; desc: string }> = {
  pending_payment: { label: "Pago pendiente", color: AMBER, desc: "Completá el pago de inscripción para continuar." },
  draft: { label: "En progreso", color: AMBER, desc: "Completá tu perfil y subí tus obras." },
  submitted: { label: "Enviada", color: ACC, desc: "Tu postulación fue enviada. Está en espera de revisión." },
  under_review: { label: "En revisión", color: ACC, desc: "Un curador está evaluando tu postulación." },
  revision_requested: { label: "Correcciones solicitadas", color: AMBER, desc: "Curaduría pidió ajustes antes de continuar." },
  accepted: { label: "Aceptada", color: ACC, desc: "Tu proyecto fue seleccionado para la feria." },
  rejected: { label: "No seleccionada", color: TERRA, desc: "Tu proyecto no fue seleccionado en esta edición." },
};

const STEPS = [
  { key: "account", label: "Crear cuenta" },
  { key: "payment", label: "Pagar inscripción" },
  { key: "artwork", label: "Subir obras" },
  { key: "review", label: "En revisión" },
  { key: "result", label: "Resolución" },
];

function getCompletedStepIndex(app: ArtistApplication): number {
  if (["accepted", "rejected"].includes(app.status)) return 4;
  if (app.status === "under_review") return 3;
  if (app.status === "submitted") return 3;
  if (app.status === "draft" && app.isPaid) return 2;
  if (app.isPaid) return 1;
  return 0;
}

function getActiveStepIndex(app: ArtistApplication): number {
  return getCompletedStepIndex(app);
}

const CTA: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: 46,
  padding: "0 26px",
  borderRadius: 999,
  ...EYEBROW,
  fontSize: 10.5,
  letterSpacing: "0.12em",
};

export function ApplicationCard({ app }: { app: ArtistApplication }) {
  const conv = typeof app.convocatoria === "object" ? app.convocatoria : null;
  const st = S[app.status] || { label: app.status, color: mix(50), desc: "" };
  const completedIdx = getCompletedStepIndex(app);
  const activeIdx = getActiveStepIndex(app);

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }) : "—";

  const stats = [
    { label: "Pago", value: app.isPaid ? "Confirmado" : "Pendiente", tone: app.isPaid ? ACC : AMBER },
    { label: "Enviada", value: fmtDate(app.submittedAt) },
    { label: "Obras", value: `${app.artworkImages?.length || 0} / 15` },
    conv?.endDate ? { label: "Cierre", value: fmtDate(conv.endDate) } : null,
  ].filter(Boolean) as { label: string; value: string; tone?: string }[];

  return (
    <article style={{ border: `1px solid ${mix(16)}`, background: mix(2) }}>
      {/* Estado */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "clamp(16px,2vw,22px) clamp(18px,2.2vw,26px)",
          borderBottom: `1px solid ${mix(14)}`,
          borderLeft: `2px solid ${st.color}`,
        }}
      >
        <span style={{ ...EYEBROW, color: st.color }}>{st.label}</span>
        <span style={{ fontSize: 14.5, lineHeight: 1.5, color: mix(72) }}>{st.desc}</span>
      </div>

      <div style={{ padding: "clamp(18px,2.2vw,26px)", display: "flex", flexDirection: "column", gap: "clamp(18px,2vw,24px)" }}>
        <h3
          style={{
            margin: 0,
            fontWeight: 300,
            fontSize: "clamp(22px,2.4vw,32px)",
            lineHeight: 1.1,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {conv?.name || "Convocatoria"}
        </h3>

        {/* Cifras */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,140px), 1fr))",
            gap: 1,
            background: mix(14),
            border: `1px solid ${mix(14)}`,
          }}
        >
          {stats.map((s) => (
            <div key={s.label} style={{ background: "var(--fdm-bg,#F7F6F2)", padding: "12px 14px" }}>
              <div style={{ ...EYEBROW, fontSize: 9, color: mix(50) }}>{s.label}</div>
              <div style={{ marginTop: 5, fontSize: 15, fontWeight: 500, color: s.tone || "inherit" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Progreso */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ height: 2, background: mix(14) }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (completedIdx / (STEPS.length - 1)) * 100)}%`,
                background: st.color,
                transition: "width .4s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`,
              gap: 6,
            }}
          >
            {STEPS.map((s, i) => {
              const done = i < completedIdx;
              const active = i === activeIdx;
              return (
                <div key={s.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 999,
                      fontSize: 10,
                      fontWeight: 500,
                      border: `1px solid ${done || active ? st.color : mix(22)}`,
                      background: done ? st.color : "transparent",
                      color: done ? "#F5F4EF" : active ? st.color : mix(45),
                    }}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  <span
                    style={{
                      ...EYEBROW,
                      fontSize: 8.5,
                      letterSpacing: "0.1em",
                      color: done || active ? mix(72) : mix(40),
                      lineHeight: 1.3,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notas de curaduría, cuando pidieron correcciones */}
        {app.status === "revision_requested" && app.revisionNotes && (
          <p style={{ margin: 0, padding: "12px 14px", borderLeft: `2px solid ${AMBER}`, background: mix(4), fontSize: 14.5, lineHeight: 1.55 }}>
            {app.revisionNotes}
          </p>
        )}
        {app.status === "rejected" && app.rejectionReason && (
          <p style={{ margin: 0, padding: "12px 14px", borderLeft: `2px solid ${TERRA}`, background: mix(4), fontSize: 14.5, lineHeight: 1.55 }}>
            {app.rejectionReason}
          </p>
        )}

        {/* Qué sigue */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          {app.status === "pending_payment" && (
            <Link href={`/convocatoria/pagar?appId=${app._id}`} style={{ ...CTA, background: "var(--fg)", color: "var(--fdm-bg,#F7F6F2)" }}>
              Completar pago
            </Link>
          )}

          {(app.status === "draft" || app.status === "revision_requested") && (
            <Link href={`/convocatoria/aplicar?appId=${app._id}`} style={{ ...CTA, background: "var(--fg)", color: "var(--fdm-bg,#F7F6F2)" }}>
              {app.status === "draft" ? "Completar formulario" : "Corregir postulación"}
            </Link>
          )}

          {["submitted", "under_review"].includes(app.status) && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 9, ...EYEBROW, fontSize: 10, color: mix(58) }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: ACC }} />
              Esperando resolución del curador
            </span>
          )}

          {/* Aceptada: la acción es cargar el catálogo, no un mensaje sin salida. */}
          {app.status === "accepted" && (
            <>
              <Link href="/admin/artist" style={{ ...CTA, background: ACC, color: "#0B0B0A" }}>
                Subir mi catálogo →
              </Link>
              <span style={{ fontSize: 14, color: mix(65) }}>
                Cargá acá las obras finales que van al catálogo de la feria.
              </span>
            </>
          )}

          {app.status === "rejected" && (
            <Link href="/convocatoria" style={{ ...CTA, background: "transparent", color: "inherit", border: `1px solid ${mix(26)}` }}>
              Ver convocatoria
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default ApplicationCard;
