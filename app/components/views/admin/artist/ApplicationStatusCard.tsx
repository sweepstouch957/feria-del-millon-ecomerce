"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";
import Skeleton from "@components/ui/Skeleton";

/* Estado de la postulación del artista: en qué paso va, qué falta y qué
   puede hacer ahora. Los estados salen del modelo ArtistApplication. */

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

type Step = { key: string; label: string };

const STEPS: Step[] = [
  { key: "pago", label: "Pago de inscripción" },
  { key: "formulario", label: "Formulario y obras" },
  { key: "revision", label: "Revisión de curaduría" },
  { key: "resolucion", label: "Resolución" },
];

/** Traduce el estado del backend a: paso actual, tono y qué hacer ahora. */
function readStatus(app: ArtistApplication | null) {
  if (!app) {
    return {
      current: 0,
      title: "Todavía no postulaste",
      detail: "Cuando abra la convocatoria vas a poder presentar tu obra.",
      tone: "neutral" as const,
      cta: { href: "/convocatoria", label: "Ver convocatoria" },
      done: false,
    };
  }

  switch (app.status) {
    case "pending_payment":
      return {
        current: 0,
        title: "Falta el pago de inscripción",
        detail: "Tu postulación queda reservada, pero no avanza hasta que se acredite el pago.",
        tone: "warn" as const,
        cta: { href: `/convocatoria/pagar?app=${app._id}`, label: "Pagar inscripción" },
        done: false,
      };
    case "draft":
      return {
        current: 1,
        title: "Postulación en borrador",
        detail: "Pagaste, pero todavía falta completar el formulario y cargar tus obras.",
        tone: "warn" as const,
        cta: { href: "/convocatoria/aplicar", label: "Completar postulación" },
        done: false,
      };
    case "submitted":
      return {
        current: 2,
        title: "Postulación enviada",
        detail: "Ya está en manos del equipo. Te avisamos por correo cuando haya novedades.",
        tone: "neutral" as const,
        cta: { href: "/convocatoria/mi-solicitud", label: "Ver mi solicitud" },
        done: false,
      };
    case "under_review":
      return {
        current: 2,
        title: "En revisión de curaduría",
        detail: "El equipo está evaluando tu propuesta.",
        tone: "neutral" as const,
        cta: { href: "/convocatoria/mi-solicitud", label: "Ver mi solicitud" },
        done: false,
      };
    case "revision_requested":
      return {
        current: 1,
        title: "Te pidieron correcciones",
        detail:
          app.revisionNotes ||
          "Curaduría solicitó ajustes en tu postulación. Podés editarla y volver a enviarla.",
        tone: "warn" as const,
        cta: { href: "/convocatoria/aplicar", label: "Corregir postulación" },
        done: false,
      };
    case "accepted":
      return {
        current: 3,
        title: "¡Estás dentro!",
        detail: "Tu postulación fue aceptada. Ya podés cargar tu catálogo y gestionar entregas.",
        tone: "ok" as const,
        cta: { href: "/admin/artist", label: "Ir a mi estudio" },
        done: true,
      };
    case "rejected":
      return {
        current: 3,
        title: "No quedó seleccionada",
        detail:
          app.rejectionReason ||
          "Esta vez tu propuesta no fue seleccionada. Podés volver a presentarte en la próxima edición.",
        tone: "off" as const,
        cta: { href: "/convocatoria", label: "Ver convocatoria" },
        done: true,
      };
    default:
      return {
        current: 0,
        title: "Postulación en curso",
        detail: "",
        tone: "neutral" as const,
        cta: { href: "/convocatoria/mi-solicitud", label: "Ver mi solicitud" },
        done: false,
      };
  }
}

const TONE: Record<string, string> = {
  ok: "var(--acc)",
  warn: "#C9902B",
  off: "#B4472A",
  neutral: "var(--acc)",
};

export default function ApplicationStatusCard() {
  const { data, isLoading, isError } = useQuery<ArtistApplication[]>({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Skeleton w="40%" h={11} />
        <Skeleton w="70%" h={30} />
        <Skeleton w="90%" h={14} />
      </div>
    );
  }

  // Sin solicitudes (o el endpoint falló) no es un error a mostrarle al
  // artista: puede simplemente no haberse presentado nunca.
  const app = isError ? null : [...(data ?? [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )[0] ?? null;

  const s = readStatus(app);
  const accent = TONE[s.tone];

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 12 }}>
        <span style={{ ...EYEBROW, color: accent }}>Tu postulación</span>
        {app?.isPaid && (
          <span style={{ ...EYEBROW, fontSize: 9.5, color: mix(48) }}>Inscripción pagada</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2
          style={{
            margin: 0,
            fontWeight: 300,
            fontSize: "clamp(24px,2.6vw,34px)",
            lineHeight: 1.1,
            letterSpacing: "0.02em",
          }}
        >
          {s.title}
        </h2>
        {s.detail && (
          <p style={{ margin: 0, maxWidth: "60ch", fontSize: 15, lineHeight: 1.6, color: mix(72) }}>
            {s.detail}
          </p>
        )}
      </div>

      {/* Pasos */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {STEPS.map((st, i) => {
          const isDone = i < s.current || (s.done && s.tone === "ok");
          const isCurrent = i === s.current && !s.done;
          return (
            <div
              key={st.key}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 14,
                padding: "10px 0",
                borderTop: `1px solid ${mix(12)}`,
                borderBottom: i === STEPS.length - 1 ? `1px solid ${mix(12)}` : undefined,
                color: isDone || isCurrent ? "inherit" : mix(45),
              }}
            >
              <span
                style={{
                  ...EYEBROW,
                  fontSize: 9.5,
                  letterSpacing: "0.16em",
                  color: isDone ? accent : isCurrent ? accent : mix(38),
                  minWidth: 18,
                }}
              >
                {isDone ? "✓" : `0${i + 1}`}
              </span>
              <span style={{ flex: 1, fontSize: 14.5 }}>{st.label}</span>
              {isCurrent && (
                <span style={{ ...EYEBROW, fontSize: 9, color: accent }}>Acá vas</span>
              )}
            </div>
          );
        })}
      </div>

      <Link
        href={s.cta.href}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          height: 46,
          padding: "0 26px",
          borderRadius: 999,
          background: "var(--fg)",
          color: "var(--bg)",
          ...EYEBROW,
          fontSize: 10.5,
          letterSpacing: "0.12em",
        }}
      >
        {s.cta.label}
      </Link>
    </section>
  );
}
