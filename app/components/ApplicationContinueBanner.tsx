"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@provider/authProvider";
import {
  getMyApplications,
  type ArtistApplication,
} from "@services/applications.service";

/* ── Step logic (mirrors useApplicationWizard auto-advance) ──────── */
type ActionableInfo = {
  app: ArtistApplication;
  convName: string;
  stepLabel: string;
  stepIndex: number; // 0-based, out of 4
  href: string;
  ctaText: string;
  variant: "payment" | "draft";
};

const STEP_LABELS = [
  "Pago inscripción",
  "Perfil artista",
  "Tu proyecto",
  "Imágenes / obras",
  "Confirmar y enviar",
];

function getActionable(app: ArtistApplication): ActionableInfo | null {
  if (["submitted", "under_review", "accepted", "rejected"].includes(app.status)) {
    return null;
  }

  // revision_requested — admin asked artist to fix and re-submit
  if (app.status === "revision_requested") {
    const conv = typeof app.convocatoria === "object" ? app.convocatoria : null;
    return {
      app,
      convName: conv?.name ?? "Convocatoria",
      stepLabel: "Correcciones solicitadas",
      stepIndex: 3,
      href: `/convocatoria/aplicar?appId=${app._id}`,
      ctaText: "Ver y corregir",
      variant: "revision" as any,
    };
  }

  const conv = typeof app.convocatoria === "object" ? app.convocatoria : null;
  const convName = conv?.name ?? "Convocatoria";

  if (app.status === "pending_payment" || !app.isPaid) {
    return {
      app,
      convName,
      stepLabel: STEP_LABELS[0],
      stepIndex: 0,
      href: `/convocatoria/pagar?appId=${app._id}`,
      ctaText: "Completar pago",
      variant: "payment",
    };
  }

  // isPaid + draft — mirror wizard auto-advance
  if (app.artworkImages?.length > 0) {
    return {
      app,
      convName,
      stepLabel: STEP_LABELS[4],
      stepIndex: 4,
      href: `/convocatoria/aplicar?appId=${app._id}`,
      ctaText: "Revisar y enviar",
      variant: "draft",
    };
  }
  if (app.projectReview) {
    return {
      app,
      convName,
      stepLabel: STEP_LABELS[3],
      stepIndex: 3,
      href: `/convocatoria/aplicar?appId=${app._id}`,
      ctaText: "Continuar postulación",
      variant: "draft",
    };
  }
  if (app.bio || app.cvUrl) {
    return {
      app,
      convName,
      stepLabel: STEP_LABELS[2],
      stepIndex: 2,
      href: `/convocatoria/aplicar?appId=${app._id}`,
      ctaText: "Continuar postulación",
      variant: "draft",
    };
  }
  return {
    app,
    convName,
    stepLabel: STEP_LABELS[1],
    stepIndex: 1,
    href: `/convocatoria/aplicar?appId=${app._id}`,
    ctaText: "Continuar postulación",
    variant: "draft",
  };
}

/* ── Component ───────────────────────────────────────────────────── */
const DISMISS_KEY = "fdm-app-banner-dismissed";

const BANNER_CSS = `
  .acb {
    position: fixed;
    right: clamp(14px, 2vw, 24px);
    bottom: clamp(14px, 2vw, 24px);
    z-index: 49;
    width: min(310px, calc(100vw - 28px));
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px 18px 18px;
    background: var(--fdm-panel, #0B0B0A);
    color: #F5F4EF;
    border: 1px solid rgba(245, 244, 239, 0.14);
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.42);
    font-family: Jost, system-ui, sans-serif;
    font-weight: 400;
  }

  .acb-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .acb-eyebrow {
    font-weight: 500;
    font-size: 9.5px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--acb-accent);
  }

  .acb-x {
    flex: 0 0 auto;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    background: transparent;
    color: rgba(245, 244, 239, 0.55);
    border: 1px solid rgba(245, 244, 239, 0.2);
    border-radius: 999px;
    cursor: pointer;
    font-size: 11px;
    line-height: 1;
    transition: color .3s ease, border-color .3s ease;
  }
  .acb-x:hover { color: #F5F4EF; border-color: rgba(245, 244, 239, 0.45); }

  .acb-conv {
    font-weight: 500;
    font-size: 17px;
    line-height: 1.2;
  }

  .acb-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 2px;
  }

  .acb-bars { display: flex; gap: 4px; flex: 1; }

  .acb-bar {
    flex: 1;
    height: 2px;
    background: rgba(245, 244, 239, 0.18);
    transition: background .3s ease;
  }
  .acb-bar--done { background: rgba(245, 244, 239, 0.5); }
  .acb-bar--active { background: var(--acb-accent); }

  .acb-step {
    font-weight: 500;
    font-size: 9.5px;
    letter-spacing: 0.14em;
    color: rgba(245, 244, 239, 0.55);
    white-space: nowrap;
  }

  .acb-label {
    font-size: 14px;
    color: rgba(245, 244, 239, 0.8);
  }

  .acb-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 46px;
    margin-top: 4px;
    border-radius: 999px;
    background: var(--acb-accent);
    color: #0B0B0A;
    font-weight: 500;
    font-size: 10.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    transition: opacity .3s ease;
  }
  .acb-cta:hover { opacity: 0.82; }

  /* En móvil ocupa el ancho pero sin tapar la barra inferior del navegador. */
  @media (max-width: 520px) {
    .acb { left: 14px; right: 14px; width: auto; bottom: max(14px, env(safe-area-inset-bottom)); }
  }

  @media (prefers-reduced-motion: reduce) {
    .acb, .acb-bar, .acb-cta { transition: none; }
  }
`;

export function ApplicationContinueBanner() {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  // Si el artista lo cierra, que siga cerrado el resto de la sesión. Antes
  // volvía a aparecer con cada recarga.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(DISMISS_KEY) === "1") setDismissed(true);
    } catch {}
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  const { data: apps } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
    enabled: isAuthenticated && !isAuthLoading,
    staleTime: 30_000,
    retry: (count, err: any) =>
      err?.response?.status === 401 ? false : count < 2,
  });

  const hiddenPaths = ["/convocatoria/aplicar", "/convocatoria/pagar"];
  const onHiddenPath = hiddenPaths.some((p) => pathname?.startsWith(p));

  let info: ActionableInfo | null = null;
  if (!onHiddenPath && !dismissed && isAuthenticated && !isAuthLoading && apps) {
    const activeInfo = apps.map(getActionable).find(Boolean);
    if (activeInfo) {
      info = activeInfo;
    } else if (apps.length === 0) {
      info = {
        app: null as any,
        convName: "Feria del Millón 2026",
        stepLabel: "Pago inscripción",
        stepIndex: 0,
        href: "/convocatoria/aplicar",
        ctaText: "Iniciar postulación",
        variant: "payment",
      };
    }
  }

  const variant = info?.variant as string | undefined;
  // Ámbar cuando hay algo trabado (pago o correcciones), verde de marca
  // cuando el camino sigue normal.
  const accent =
    variant === "payment" || variant === "revision"
      ? "#C9902B"
      : "var(--fdm-green,#3FA46E)";

  return (
    <>
      <style>{BANNER_CSS}</style>
      <AnimatePresence>
        {info && (
          <motion.aside
            key="app-banner"
            className="acb"
            aria-label="Estado de tu postulación"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={{ "--acb-accent": accent } as React.CSSProperties}
          >
            <div className="acb-head">
              <span className="acb-eyebrow">
                {variant === "revision"
                  ? "Correcciones solicitadas"
                  : "Postulación en progreso"}
              </span>
              <button type="button" className="acb-x" onClick={dismiss} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <span className="acb-conv">{info.convName}</span>

            <div className="acb-progress">
              <div className="acb-bars" role="img" aria-label={`Paso ${info.stepIndex + 1} de ${STEP_LABELS.length}`}>
                {STEP_LABELS.map((label, i) => (
                  <span
                    key={label}
                    title={label}
                    className={
                      i < info!.stepIndex
                        ? "acb-bar acb-bar--done"
                        : i === info!.stepIndex
                        ? "acb-bar acb-bar--active"
                        : "acb-bar"
                    }
                  />
                ))}
              </div>
              <span className="acb-step">
                {info.stepIndex + 1}/{STEP_LABELS.length}
              </span>
            </div>

            <span className="acb-label">{info.stepLabel}</span>

            <Link href={info.href} className="acb-cta">
              {info.ctaText} →
            </Link>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
