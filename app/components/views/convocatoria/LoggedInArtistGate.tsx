"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@provider/authProvider";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";

/**
 * Determines the best next URL for an artist based on their application state.
 *
 * stepNum corresponds to which step the user currently NEEDS to complete:
 *   1 = Cuenta creada  (always done if they have an app)
 *   2 = Pagar inscripción
 *   3 = Perfil artista
 *   4 = Subir obras
 *   5 = Enviar postulación
 *
 * Steps < stepNum render as ✅ done, stepNum renders as active (white).
 */
function getSmartRedirect(app: ArtistApplication): { url: string; stepLabel: string; stepNum: number } {
  // Step 2: needs to pay
  if (!app.isPaid || app.status === "pending_payment") {
    return { url: `/convocatoria/pagar?appId=${app._id}`, stepLabel: "Pagar inscripción", stepNum: 2 };
  }
  // Paid + draft → steps 3–5 depending on progress
  if (app.status === "draft") {
    const hasImages = app.artworkImages && app.artworkImages.length > 0;
    const hasProject = !!app.projectReview;
    const hasBio = !!app.bio || !!app.cvUrl;
    // Has images → step 5: review & submit
    if (hasImages) return { url: `/convocatoria/aplicar?appId=${app._id}`, stepLabel: "Revisar y enviar", stepNum: 5 };
    // Has project review → step 4: upload artwork
    if (hasProject) return { url: `/convocatoria/aplicar?appId=${app._id}`, stepLabel: "Subir obras", stepNum: 4 };
    // Has bio/cv → step 4: project info (mapped to wizard step 2→3)
    if (hasBio) return { url: `/convocatoria/aplicar?appId=${app._id}`, stepLabel: "Tu proyecto", stepNum: 4 };
    // Fresh paid app → step 3: fill profile
    return { url: `/convocatoria/aplicar?appId=${app._id}`, stepLabel: "Perfil artista", stepNum: 3 };
  }
  // Already submitted or beyond
  if (["submitted", "under_review", "accepted", "rejected"].includes(app.status)) {
    return { url: `/convocatoria/mi-solicitud`, stepLabel: "Ver estado", stepNum: 6 };
  }
  return { url: `/convocatoria/aplicar`, stepLabel: "Continuar", stepNum: 1 };
}

const FLOW_STEPS = [
  { icon: "✅", label: "Cuenta creada" },
  { icon: "💳", label: "Pagar inscripción" },
  { icon: "👤", label: "Perfil artista" },
  { icon: "🎨", label: "Subir obras" },
  { icon: "📬", label: "Enviar postulación" },
];

/**
 * If the user is already authenticated, shows a smart "continue your flow" card
 * instead of the registration form. Returns null if user is NOT logged in.
 */
export function LoggedInArtistGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const router = useRouter();
  const [app, setApp] = useState<ArtistApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) { setLoading(false); setChecked(true); return; }
    // Fetch applications
    getMyApplications()
      .then((apps) => {
        if (apps && apps.length > 0) setApp(apps[0]);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setChecked(true); });
  }, [isAuthenticated, isAuthLoading]);

  // Still loading auth or apps
  if (!checked || isAuthLoading || (isAuthenticated && loading)) {
    return (
      <div className="gate-root">
        <div className="gate-loading">
          <div className="gate-spinner" />
          <p>Verificando tu sesión…</p>
        </div>
        <GateStyles />
      </div>
    );
  }

  // Not logged in → show normal register form
  if (!isAuthenticated) return <>{children}</>;

  // Logged in but no application yet → redirect to aplicar (picker)
  if (!app) {
    return (
      <div className="gate-root">
        <div className="gate-card">
          <div className="gate-avatar">
            <span className="gate-avatar__letter">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="gate-badge gate-badge--green">
            <span className="gate-badge__dot" />
            Sesión activa
          </div>
          <h1 className="gate-title">¡Hola, {user?.firstName}!</h1>
          <p className="gate-subtitle">
            Ya tienes cuenta. Puedes iniciar tu postulación directamente sin necesidad de registrarte de nuevo.
          </p>
          <Link href="/convocatoria/aplicar" className="gate-btn gate-btn--primary">
            Iniciar postulación
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
          <Link href="/" className="gate-btn gate-btn--ghost">Volver al inicio</Link>
        </div>
        <GateStyles />
      </div>
    );
  }

  // Logged in WITH application → show smart flow card
  const redirect = getSmartRedirect(app);
  const conv = typeof app.convocatoria === "object" ? app.convocatoria : null;

  return (
    <div className="gate-root">
      <div className="gate-glow gate-glow--1" />
      <div className="gate-glow gate-glow--2" />

      <div className="gate-card">
        {/* Avatar */}
        <div className="gate-avatar">
          {app.profilePhotoUrl ? (
            <img src={app.profilePhotoUrl} alt="" className="gate-avatar__img" />
          ) : (
            <span className="gate-avatar__letter">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          )}
          <span className="gate-avatar__ring" />
        </div>

        {/* Badge */}
        <div className="gate-badge gate-badge--green">
          <span className="gate-badge__dot" />
          Sesión activa
        </div>

        <h1 className="gate-title">¡Bienvenido de vuelta, {user?.firstName}!</h1>
        <p className="gate-subtitle">
          Ya estás registrado. Tu postulación a <strong>{conv?.name || "la convocatoria"}</strong> está en progreso. Continúa donde te quedaste.
        </p>

        {/* Progress steps */}
        <div className="gate-steps">
          {FLOW_STEPS.map((s, i) => {
            const done = i < redirect.stepNum - 1;
            const active = i === redirect.stepNum - 1;
            return (
              <div key={i} className={`gate-step ${done ? "gate-step--done" : ""} ${active ? "gate-step--active" : ""}`}>
                <div className="gate-step__circle">
                  {done ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </div>
                <span className="gate-step__label">{s.label}</span>
                {i < FLOW_STEPS.length - 1 && <div className={`gate-step__line ${done ? "gate-step__line--done" : ""}`} />}
              </div>
            );
          })}
        </div>

        {/* Quick stats */}
        <div className="gate-stats">
          <div className="gate-stat">
            <span className="gate-stat__label">Pago</span>
            <span className={`gate-stat__value ${app.isPaid ? "gate-stat__value--green" : "gate-stat__value--amber"}`}>
              {app.isPaid ? "✅ Confirmado" : "⏳ Pendiente"}
            </span>
          </div>
          <div className="gate-stat">
            <span className="gate-stat__label">Obras</span>
            <span className="gate-stat__value">{app.artworkImages?.length || 0} / 15</span>
          </div>
          <div className="gate-stat">
            <span className="gate-stat__label">Estado</span>
            <span className="gate-stat__value">{app.status === "draft" ? "En progreso" : app.status === "pending_payment" ? "Pago pendiente" : app.status}</span>
          </div>
        </div>

        {/* CTA */}
        <Link href={redirect.url} className="gate-btn gate-btn--primary">
          {app.isPaid ? `Continuar: ${redirect.stepLabel}` : "Completar pago"}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </Link>
        <Link href="/convocatoria/mi-solicitud" className="gate-btn gate-btn--ghost">
          Ver mi solicitud completa
        </Link>
      </div>
      <GateStyles />
    </div>
  );
}

function GateStyles() {
  return (
    <style jsx global>{`
      .gate-root {
        min-height: calc(100vh - 64px);
        background: #050505;
        display: flex; align-items: center; justify-content: center;
        padding: 40px 16px;
        font-family: 'Inter', system-ui, sans-serif;
        color: #f5f5f5;
        position: relative; overflow: hidden;
        box-sizing: border-box;
      }
      .gate-glow {
        position: absolute; border-radius: 50%;
        filter: blur(120px); opacity: 0.1; pointer-events: none;
      }
      .gate-glow--1 {
        width: 500px; height: 500px; top: -150px; left: -100px;
        background: radial-gradient(circle, #22c55e, transparent);
        animation: gate-float 8s ease-in-out infinite alternate;
      }
      .gate-glow--2 {
        width: 400px; height: 400px; bottom: -150px; right: -100px;
        background: radial-gradient(circle, #4ade80, transparent);
        animation: gate-float 10s ease-in-out infinite alternate-reverse;
      }
      @keyframes gate-float { 0%{transform:translate(0,0)} 100%{transform:translate(30px,-20px)} }

      .gate-card {
        position: relative; z-index: 1;
        background: linear-gradient(180deg, #111 0%, #0a0a0a 100%);
        border: 1px solid rgba(255,255,255,0.08); border-radius: 28px;
        padding: 48px 40px; max-width: 520px; width: 100%; text-align: center;
        box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 24px 80px rgba(0,0,0,0.6),
                    inset 0 1px 0 rgba(255,255,255,0.04);
        animation: gate-in 0.5s cubic-bezier(0.16,1,0.3,1);
      }
      @keyframes gate-in { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:none} }

      .gate-loading {
        display: flex; flex-direction: column; align-items: center; gap: 16px; color: #888;
      }
      .gate-spinner {
        width: 32px; height: 32px; border: 3px solid #222;
        border-top-color: #22c55e; border-radius: 50%;
        animation: gate-spin .6s linear infinite;
      }
      @keyframes gate-spin { to{transform:rotate(360deg)} }

      .gate-avatar {
        position: relative; width: 80px; height: 80px; margin: 0 auto 20px;
        display: flex; align-items: center; justify-content: center;
      }
      .gate-avatar__img {
        width: 80px; height: 80px; border-radius: 50%; object-fit: cover;
        border: 3px solid #22c55e;
      }
      .gate-avatar__letter {
        width: 80px; height: 80px; border-radius: 50%;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: #000; font-size: 24px; font-weight: 900;
        display: flex; align-items: center; justify-content: center;
      }
      .gate-avatar__ring {
        position: absolute; inset: -6px; border-radius: 50%;
        border: 2px solid rgba(34,197,94,0.2);
        animation: gate-ring 3s ease-in-out infinite;
      }
      @keyframes gate-ring { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.05);opacity:0.4} }

      .gate-badge {
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
        text-transform: uppercase; padding: 5px 14px; border-radius: 100px;
        margin-bottom: 16px;
      }
      .gate-badge--green {
        background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
        color: #4ade80;
      }
      .gate-badge__dot {
        width: 6px; height: 6px; border-radius: 50%; background: #4ade80;
        animation: gate-blink 2s ease-in-out infinite;
      }
      @keyframes gate-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

      .gate-title {
        font-size: 28px; font-weight: 900; color: #fff;
        margin: 0 0 10px; letter-spacing: -0.8px;
      }
      .gate-subtitle {
        color: #777; font-size: 14px; line-height: 1.65;
        margin: 0 0 24px; max-width: 400px; margin-left: auto; margin-right: auto;
      }
      .gate-subtitle strong { color: #ccc; }

      /* Steps */
      .gate-steps {
        display: flex; align-items: flex-start; justify-content: center;
        gap: 0; margin-bottom: 24px; padding: 0 4px;
        overflow: hidden;
      }
      .gate-step {
        display: flex; flex-direction: column; align-items: center;
        position: relative; flex: 1; min-width: 0;
      }
      .gate-step__circle {
        width: 30px; height: 30px; border-radius: 50%;
        background: #1a1a1a; border: 2px solid #2a2a2a;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 800; color: #444;
        transition: all 0.3s; flex-shrink: 0; position: relative; z-index: 2;
      }
      .gate-step--done .gate-step__circle {
        background: #22c55e; border-color: #22c55e; color: #000;
      }
      .gate-step--active .gate-step__circle {
        background: #f5f5f5; border-color: #f5f5f5; color: #000;
        box-shadow: 0 0 0 4px rgba(245,245,245,0.08);
        transform: scale(1.1);
      }
      .gate-step__label {
        font-size: 9px; font-weight: 600; color: #3a3a3a;
        margin-top: 7px; text-align: center;
        word-break: break-word; hyphens: auto;
        line-height: 1.3; max-width: 54px;
      }
      .gate-step--done .gate-step__label { color: #4ade80; }
      .gate-step--active .gate-step__label { color: #f5f5f5; font-weight: 700; }
      .gate-step__line {
        position: absolute; top: 14px; left: calc(50% + 17px);
        width: calc(100% - 34px); height: 2px;
        background: #1e1e1e; z-index: 1;
      }
      .gate-step__line--done { background: #22c55e; }

      /* Stats */
      .gate-stats {
        display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        margin-bottom: 24px;
      }
      .gate-stat {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px; padding: 12px 8px; text-align: center;
      }
      .gate-stat__label {
        display: block; font-size: 10px; font-weight: 700;
        text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 4px;
      }
      .gate-stat__value { font-size: 13px; font-weight: 700; color: #ccc; }
      .gate-stat__value--green { color: #4ade80; }
      .gate-stat__value--amber { color: #fbbf24; }

      /* Buttons */
      .gate-btn {
        display: flex; align-items: center; justify-content: center; gap: 10px;
        width: 100%; padding: 15px; border-radius: 14px; font-size: 15px; font-weight: 700;
        text-decoration: none; transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
        cursor: pointer; border: none; box-sizing: border-box;
      }
      .gate-btn--primary {
        background: #fff; color: #000;
        box-shadow: 0 2px 12px rgba(255,255,255,0.08);
        margin-bottom: 10px;
      }
      .gate-btn--primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(255,255,255,0.12); background: #f3f4f6;
      }
      .gate-btn--ghost {
        background: rgba(255,255,255,0.04); color: #aaa;
        border: 1px solid #222;
      }
      .gate-btn--ghost:hover {
        background: rgba(255,255,255,0.08); color: #fff; border-color: #444;
      }

      @media (max-width: 540px) {
        .gate-card { padding: 32px 16px; border-radius: 20px; }
        .gate-title { font-size: 22px; }
        .gate-stats { grid-template-columns: 1fr; }
      }
      @media (max-width: 400px) {
        .gate-step__label { display: none; }
        .gate-step--active .gate-step__label {
          display: block;
          position: absolute;
          top: 38px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          max-width: none;
          font-size: 10px;
          color: #f5f5f5;
        }
        .gate-steps { margin-bottom: 52px; }
        .gate-card { padding: 28px 14px; }
      }
    `}</style>
  );
}
