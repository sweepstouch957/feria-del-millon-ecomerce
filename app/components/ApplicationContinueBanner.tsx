"use client";

import Link from "next/link";
import { useState } from "react";
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
export function ApplicationContinueBanner() {
  const { isAuthenticated, isAuthLoading } = useAuth();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

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

  const info =
    !onHiddenPath && !dismissed && isAuthenticated && !isAuthLoading && apps
      ? (apps.map(getActionable).find(Boolean) ?? null)
      : null;

  const isPaying = info?.variant === "payment";
  const accent = isPaying ? "oklch(0.82 0.17 80)" : "oklch(0.72 0.2 145)";
  const accentDim = isPaying
    ? "rgba(251,191,36,.08)"
    : "rgba(34,197,94,.08)";
  const accentRing = isPaying
    ? "rgba(251,191,36,.22)"
    : "rgba(34,197,94,.22)";

  return (
    <>
      <AnimatePresence>
        {info && (
          <motion.div
            key="app-banner"
            className="acb-root"
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            style={
              {
                "--accent": accent,
                "--accent-dim": accentDim,
                "--accent-ring": accentRing,
              } as React.CSSProperties
            }
          >
            {/* Header row */}
            <div className="acb-header">
              <div className="acb-pulse-wrap">
                <span className="acb-pulse" />
                <span className="acb-icon">{isPaying ? "💳" : "✏️"}</span>
              </div>
              <div className="acb-title-block">
                <p className="acb-eyebrow">Postulación en progreso</p>
                <p className="acb-conv">{info.convName}</p>
              </div>
              <button
                className="acb-dismiss"
                onClick={() => setDismissed(true)}
                aria-label="Cerrar"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* Step progress */}
            <div className="acb-progress">
              <div className="acb-dots">
                {STEP_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className={`acb-dot ${
                      i < info.stepIndex
                        ? "acb-dot--done"
                        : i === info.stepIndex
                        ? "acb-dot--active"
                        : ""
                    }`}
                    title={label}
                  />
                ))}
              </div>
              <span className="acb-step-label">
                Paso {info.stepIndex + 1} de {STEP_LABELS.length}
              </span>
            </div>

            <p className="acb-current-step">{info.stepLabel}</p>

            {/* CTA */}
            <Link href={info.href} className="acb-cta">
              {info.ctaText}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .acb-root {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 49;
          width: 300px;
          background: oklch(0.09 0.006 250);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 18px 20px 20px;
          box-shadow:
            0 32px 64px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.04) inset;
          display: flex;
          flex-direction: column;
          gap: 12px;
          font-family: "Inter", system-ui, sans-serif;
        }

        /* Header */
        .acb-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .acb-pulse-wrap {
          position: relative;
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-dim);
          border: 1px solid var(--accent-ring);
          border-radius: 12px;
        }

        .acb-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 14px;
          border: 1px solid var(--accent-ring);
          animation: acb-ripple 2s ease-out infinite;
        }

        @keyframes acb-ripple {
          0% {
            opacity: 0.7;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.35);
          }
        }

        .acb-icon {
          font-size: 18px;
          line-height: 1;
          position: relative;
          z-index: 1;
        }

        .acb-title-block {
          flex: 1;
          min-width: 0;
        }

        .acb-eyebrow {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--accent);
          margin: 0 0 3px;
        }

        .acb-conv {
          font-size: 13px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .acb-dismiss {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.35);
          transition: all 0.18s;
          margin-top: -2px;
        }

        .acb-dismiss:hover {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
        }

        /* Progress dots */
        .acb-progress {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .acb-dots {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .acb-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          transition: all 0.3s;
        }

        .acb-dot--done {
          background: var(--accent);
          opacity: 0.5;
          width: 10px;
          border-radius: 4px;
        }

        .acb-dot--active {
          background: var(--accent);
          width: 18px;
          border-radius: 4px;
          box-shadow: 0 0 10px var(--accent);
        }

        .acb-step-label {
          font-size: 10px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.3);
          letter-spacing: 0.3px;
          white-space: nowrap;
        }

        /* Current step name */
        .acb-current-step {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
          letter-spacing: 0.2px;
        }

        /* CTA button */
        .acb-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 11px 18px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
          background: var(--accent);
          color: oklch(0.1 0.02 250);
          box-shadow: 0 4px 16px var(--accent-ring);
          letter-spacing: 0.1px;
        }

        .acb-cta:hover {
          filter: brightness(1.08);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px var(--accent-ring);
        }

        .acb-cta:active {
          transform: translateY(0);
        }

        /* Mobile: full-width bottom strip */
        @media (max-width: 480px) {
          .acb-root {
            bottom: 0;
            right: 0;
            left: 0;
            width: 100%;
            border-radius: 20px 20px 0 0;
            box-shadow:
              0 -16px 48px rgba(0, 0, 0, 0.7),
              0 0 0 1px rgba(255, 255, 255, 0.06) inset;
          }
        }
      `}</style>
    </>
  );
}
