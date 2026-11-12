"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";
import Skeleton from "@components/ui/Skeleton";
import { useInFairPavilion } from "@hooks/queries/usePavilionsByUser";
import { Dot } from "./ui";

/* Estado de la postulación del artista: en qué paso va, qué falta y qué
   puede hacer ahora. Los estados salen del modelo ArtistApplication. */

type Step = { key: string; label: string };

const STEPS: Step[] = [
  { key: "pago", label: "Pago de inscripción" },
  { key: "formulario", label: "Formulario y obras" },
  { key: "revision", label: "Revisión de curaduría" },
  { key: "resolucion", label: "Resolución" },
];

/** Traduce el estado del backend a: paso actual, tono y qué hacer ahora. */
function readStatus(app: ArtistApplication | null, inPavilion = false) {
  // Ya tiene pabellón: está dentro, quede como quede la postulación (a varios
  // los metieron a mano con la postulación en borrador).
  if (inPavilion && app?.status !== "accepted" && !app?.invited) {
    return {
      current: 3,
      title: "¡Estás dentro!",
      detail: "Ya tienes pabellón en la feria. Tus obras y entregas están en tu estudio.",
      tone: "ok" as const,
      cta: { href: "/admin/artist", label: "Ir a mi estudio" },
      done: true,
    };
  }
  // El invitado no pasó por convocatoria: no hay pago pendiente ni curaduría
  // esperándolo, y ofrecerle "pagar inscripción" es pedirle plata de más.
  if (app?.invited) {
    return {
      current: 3,
      title: "Entraste por invitación",
      detail:
        "La feria te invitó directamente, así que no tienes que postularte ni pagar inscripción. Ya puedes cargar tu obra.",
      tone: "ok" as const,
      cta: { href: "/admin/artist", label: "Ir a mi estudio" },
      done: true,
    };
  }

  if (!app) {
    return {
      current: 0,
      title: "Todavía no te has postulado",
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
        cta: { href: `/convocatoria/pagar?appId=${app._id}`, label: "Pagar inscripción" },
        done: false,
      };
    case "draft":
      return {
        current: 1,
        title: "Postulación en borrador",
        detail: "Ya pagaste, pero todavía falta completar el formulario y cargar tus obras.",
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
          "Curaduría solicitó ajustes en tu postulación. Puedes editarla y volver a enviarla.",
        tone: "warn" as const,
        cta: { href: "/convocatoria/aplicar", label: "Corregir postulación" },
        done: false,
      };
    case "accepted":
      return {
        current: 3,
        title: "¡Estás dentro!",
        detail: "Tu postulación fue aceptada. Ya puedes cargar tu catálogo y gestionar entregas.",
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
          "Esta vez tu propuesta no fue seleccionada. Puedes volver a presentarte en la próxima edición.",
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

export default function ApplicationStatusCard() {
  const { data, isLoading, isError } = useQuery<ArtistApplication[]>({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
    staleTime: 60_000,
    retry: false,
  });
  const inPavilion = useInFairPavilion();

  if (isLoading) {
    return (
      <div className="fdm-st-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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

  const s = readStatus(app, inPavilion);
  const pill = s.tone === "ok" ? "is-ok" : s.tone === "warn" ? "is-warn" : s.tone === "off" ? "is-bad" : "is-mute";

  return (
    <section className="fdm-st-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="fdm-st-label">Tu postulación</span>
        {app?.isPaid && <span className="fdm-st-pill is-ok">Inscripción pagada</span>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <h2 className="fdm-st-h2">{s.title}</h2>
        {s.detail && <p className="fdm-st-note" style={{ maxWidth: 560 }}>{s.detail}</p>}
      </div>

      {/* Pasos: el invitado no recorrió ninguno, así que marcarlos todos como
          hechos —incluido el pago— sería mentirle. */}
      {!app?.invited && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {STEPS.map((st, i) => {
            const isDone = i < s.current || (s.done && s.tone === "ok");
            const isCurrent = i === s.current && !s.done;
            return (
              <div
                key={st.key}
                style={{
                  minHeight: 52,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  borderTop: "1px solid var(--line3)",
                  fontSize: 16,
                  color: isDone || isCurrent ? "var(--fg)" : "var(--fg3)",
                  fontWeight: isCurrent ? 500 : 400,
                }}
              >
                <Dot on={isDone} size="xs" />
                <span style={{ flex: 1 }}>{st.label}</span>
                {isCurrent && <span className={`fdm-st-pill ${pill}`}>Aquí vas</span>}
              </div>
            );
          })}
        </div>
      )}

      <Link href={s.cta.href} className={`fdm-st-btn is-lg ${s.tone === "off" ? "" : "is-green"}`} style={{ alignSelf: "flex-start" }}>
        {s.cta.label}
      </Link>
    </section>
  );
}
