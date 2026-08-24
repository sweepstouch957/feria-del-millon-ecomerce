"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initiatePayment, getApplicationById, getMyApplications, mockPayment } from "@services/applications.service";
import { useAuth } from "@provider/authProvider";
import { clearAuth } from "@services/auth.service";
import { AlertTriangle, Check, CreditCard, CheckCircle2, Wrench, Zap, ArrowRight, Lock } from "lucide-react";

const STEPS = ["Crear cuenta", "Pagar inscripción", "Subir obras", "Resolución del curador"];

export default function PagarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get("appId");
  const [app, setApp] = useState<{ isPaid?: boolean; status?: string; _id?: string } | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const { user, isAuthenticated, isAuthLoading } = useAuth();
  const [isNotArtist, setIsNotArtist] = useState(false);

  // Detect localhost / dev mode
  const isMock = typeof window !== "undefined" && (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    process.env.NEXT_PUBLIC_MOCK_PAYMENT === "true"
  );

  const loadApp = useCallback(async () => {
    setLoadingApp(true);
    try {
      if (appId) {
        const doc = await getApplicationById(appId);
        setApp(doc);
        if (doc.isPaid) {
          router.replace(`/convocatoria/aplicar?appId=${appId}`);
          return;
        }
      } else {
        // No appId: try to find user's existing pending app
        const apps = await getMyApplications();
        const pending = apps.find((a: any) => !a.isPaid && a.status === "pending_payment");
        if (pending) {
          router.replace(`/convocatoria/pagar?appId=${pending._id}`);
          return;
        }
        // No app at all → redirect to picker
        router.replace("/convocatoria/aplicar");
        return;
      }
    } catch (e: unknown) {
      const err = e as { response?: { status?: number }; message?: string };
      if (err?.response?.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent(`/convocatoria/pagar?appId=${appId || ""}`)}`);
        return;
      }
      setError(err?.message || "No se pudo cargar la postulación");
    } finally {
      setLoadingApp(false);
    }
  }, [appId, router]);

  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated) {
        router.replace(`/login?redirect=${encodeURIComponent(`/convocatoria/pagar?appId=${appId || ""}`)}`);
      } else if (user && user.roles?.artista !== true) {
        setIsNotArtist(true);
        setLoadingApp(false);
      } else {
        loadApp();
      }
    }
  }, [isAuthLoading, isAuthenticated, user, loadApp, appId, router]);

  const handleSwitchToArtist = () => {
    localStorage.removeItem("auth_user");
    clearAuth();
    window.location.href = `/login?redirect=${encodeURIComponent(`/convocatoria/pagar?appId=${appId || ""}`)}`;
  };

  const handlePay = async () => {
    if (!appId) { setError("appId requerido"); return; }
    setPaying(true);
    setError("");
    try {
      const { initPoint, sandboxInitPoint } = await initiatePayment(appId);
      const url = process.env.NEXT_PUBLIC_MP_SANDBOX === "true" ? sandboxInitPoint : initPoint;
      window.location.href = url;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error || err?.message || "Error al iniciar el pago");
      setPaying(false);
    }
  };

  const handleMockPay = async () => {
    if (!appId) return;
    setPaying(true);
    setError("");
    try {
      await mockPayment(appId);
      router.push(`/convocatoria/aplicar?appId=${appId}`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }; message?: string };
      setError(err?.response?.data?.error || err?.message || "Error en mock pay");
      setPaying(false);
    }
  };

  if (isAuthLoading || (loadingApp && !isNotArtist)) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center">
        <div style={{ textAlign: "center", color: "#888" }}>
          <div className="pay-spinner" />
          <p>Cargando tu postulación…</p>
        </div>
        <style jsx>{`.pay-spinner { width:40px;height:40px;border:3px solid #222;border-top-color:#22c55e;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 16px; } @keyframes spin{to{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  if (isNotArtist) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="pay-container">
          <div className="pay-card">
            <div className="pay-card__icon"><AlertTriangle size={48} /></div>
            <h1 className="pay-card__title">Cuenta no autorizada</h1>
            <p className="pay-card__subtitle">
              El pago de inscripción y la postulación a convocatorias están reservados únicamente para cuentas de tipo <strong>Artista</strong>.
            </p>
            
            <div className="pay-user-badge">
              <div className="pay-user-badge__label">Sesión iniciada como:</div>
              <div className="pay-user-badge__email">{user?.email || "Usuario"}</div>
              <div className="pay-user-badge__role">Rol: Comprador</div>
            </div>

            <button className="pay-btn" onClick={handleSwitchToArtist}>
              Cerrar sesión e iniciar como Artista
            </button>
            
            <button className="pay-btn pay-btn--secondary" onClick={() => router.push("/")}>
              Volver al inicio
            </button>
          </div>
        </div>
        <style jsx>{`
          .pay-container { max-width: 480px; margin: auto; padding: 20px; width: 100%; }
          .pay-card {
            background: #0a0a0a; border-radius: 24px; padding: 48px 40px; border: 1px solid #222;
            box-shadow: 0 8px 32px rgba(255,255,255,0.02); text-align: center; color: #fff;
          }
          .pay-card__icon { font-size: 48px; margin-bottom: 16px; display: block; }
          .pay-card__title { font-size: 28px; font-weight: 800; color: #fff; margin: 0 0 8px; letter-spacing: -1px; }
          .pay-card__subtitle { color: #888; font-size: 15px; margin: 0 0 28px; line-height: 1.5; }
          
          .pay-user-badge {
            background: rgba(255,255,255,0.03); border: 1px solid #222; border-radius: 16px;
            padding: 20px; margin-bottom: 28px; text-align: left;
          }
          .pay-user-badge__label { font-size: 11px; text-transform: uppercase; color: #555; font-weight: 700; margin-bottom: 4px; }
          .pay-user-badge__email { font-size: 15px; font-weight: 600; color: #fff; margin-bottom: 2px; }
          .pay-user-badge__role { font-size: 13px; color: #fbbf24; font-weight: 600; }

          .pay-btn {
            width: 100%; background: #fff;
            color: #000; border: none; border-radius: 12px; padding: 16px;
            font-size: 16px; font-weight: 700; cursor: pointer; transition: all .2s;
            margin-bottom: 12px;
          }
          .pay-btn:hover { transform: translateY(-1px); background: #eee; }
          
          .pay-btn--secondary {
            background: transparent; color: #aaa; border: 1px solid #222;
          }
          .pay-btn--secondary:hover { background: rgba(255,255,255,0.02); color: #fff; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white" style={{overflowX: "hidden"}}>
      <main className="pay-page max-w-4xl mx-auto">
        {/* Progress stepper — step 2 of 4 */}
      <div className="pay-progress">
        {STEPS.map((label, i) => {
          const isDone = i < 1;
          const isActive = i === 1;
          return (
            <div key={i} className={`pay-step ${isActive ? "active" : isDone ? "done" : ""}`}>
              <div className="pay-step__dot">{isDone ? <Check size={16} /> : i + 1}</div>
              <span className="pay-step__label">{label}</span>
              {i < STEPS.length - 1 && <div className="pay-step__line" />}
            </div>
          );
        })}
      </div>

      <div className="pay-container">
        <div className="pay-card">
          <div className="pay-card__icon"><CreditCard size={48} /></div>
          <h1 className="pay-card__title">Pago de inscripción</h1>
          <p className="pay-card__subtitle">
            Tu cuenta fue creada con éxito. El siguiente paso es completar el pago de inscripción
            para desbloquear el formulario donde podrás subir tu proyecto y obras.
          </p>

          <div className="pay-amount">
            <span className="pay-amount__label">Valor de inscripción</span>
            <span className="pay-amount__value">$40.000 COP</span>
          </div>

          <div className="pay-info">
            <div className="pay-info__item"><CheckCircle2 size={16} /> Pago seguro con MercadoPago</div>
            <div className="pay-info__item"><CheckCircle2 size={16} /> Acepta tarjetas, PSE y efectivo</div>
            <div className="pay-info__item"><CheckCircle2 size={16} /> Desbloquea el formulario de postulación</div>
            <div className="pay-info__item"><CheckCircle2 size={16} /> Una sola inscripción por convocatoria</div>
          </div>

          {error && <div className="pay-error">{error}</div>}

          {/* DEV MODE MOCK PAYMENT BANNER */}
          {isMock && !app?.isPaid && (
            <div className="pay-mock-banner">
              <span className="pay-mock-banner__badge"><Wrench size={12} style={{ verticalAlign: "-2px" }} /> Entorno LOCAL</span>
              <p>MercadoPago no funciona en localhost. Usa el pago simulado para continuar el flujo.</p>
              <button className="pay-btn pay-btn--mock" onClick={handleMockPay} disabled={paying}>
                {paying ? "Procesando…" : <><Zap size={16} style={{ verticalAlign: "-2px" }} /> Simular pago exitoso (solo dev)</>}
              </button>
            </div>
          )}

          {app?.isPaid ? (
            <div className="pay-success">
              <span><CheckCircle2 size={16} style={{ verticalAlign: "-2px" }} /> ¡Pago confirmado! Tu cuenta está activa.</span>
              <button className="pay-btn" onClick={() => router.push(`/convocatoria/aplicar?appId=${appId}`)}>
                Ir al formulario <ArrowRight size={16} style={{ verticalAlign: "-2px" }} />
              </button>
            </div>
          ) : !isMock ? (
            <button className="pay-btn" onClick={handlePay} disabled={paying}>
              {paying ? "Redirigiendo a MercadoPago…" : <>Pagar con MercadoPago <ArrowRight size={16} style={{ verticalAlign: "-2px" }} /></>}
            </button>
          ) : (
            <button className="pay-btn" onClick={handlePay} disabled={paying} style={{ background: "#333", color: "#aaa", cursor: "not-allowed" }}>
              Pagar con MercadoPago (no disponible en localhost)
            </button>
          )}

          <p className="pay-legal">
            Al proceder con el pago aceptas los términos y condiciones de la Feria del Millón.
            El pago no es reembolsable.
          </p>
        </div>

        <div className="pay-mp-badge">
          <span>Procesado con</span>
          <strong>MercadoPago</strong>
          <span><Lock size={14} style={{ verticalAlign: "-2px" }} /> SSL seguro</span>
        </div>
      </div>

      <style jsx>{`
        .pay-page {
          padding: 40px 16px 60px;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
          width: 100%;
        }

        /* ── Progress stepper ── */
        .pay-progress {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          max-width: 560px;
          margin: 0 auto 48px;
          overflow: hidden;
        }
        .pay-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
          min-width: 0;
        }
        .pay-step__dot {
          width: 32px; height: 32px; border-radius: 50%;
          background: #111; border: 1px solid #333; color: #555;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; flex-shrink: 0;
          transition: all .25s; position: relative; z-index: 2;
        }
        .pay-step.active .pay-step__dot { background: #f5f5f5; border-color: #f5f5f5; color: #000; box-shadow: 0 0 0 4px rgba(245,245,245,0.1); }
        .pay-step.done .pay-step__dot { background: #1a1a1a; border-color: #555; color: #ccc; }
        .pay-step__label {
          font-size: 10px; font-weight: 600; color: #888;
          margin-top: 8px; text-align: center;
          word-break: break-word; hyphens: auto;
          max-width: 72px; line-height: 1.3;
        }
        .pay-step.active .pay-step__label { color: #f5f5f5; font-weight: 700; }
        .pay-step.done .pay-step__label { color: #999; }
        .pay-step__line {
          position: absolute;
          top: 15px;
          left: calc(50% + 18px);
          width: calc(100% - 36px);
          height: 1px;
          background: #2a2a2a;
          z-index: 1;
        }
        .pay-step.done .pay-step__line { background: #444; }

        /* ── Container & Card ── */
        .pay-container { max-width: 480px; margin: 0 auto; }
        .pay-card {
          background: linear-gradient(180deg, #111 0%, #0d0d0d 100%);
          border-radius: 24px; padding: 48px 40px;
          border: 1px solid rgba(255,255,255,0.07);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.02), 0 24px 64px rgba(0,0,0,0.6),
                      inset 0 1px 0 rgba(255,255,255,0.04);
          text-align: center; color: #f5f5f5;
          animation: pay-in .5s cubic-bezier(.16,1,.3,1);
        }
        @keyframes pay-in { from{opacity:0;transform:translateY(20px) scale(.97)} to{opacity:1;transform:none} }
        .pay-card__icon { font-size: 48px; margin-bottom: 16px; display: block; }
        .pay-card__title { font-size: 28px; font-weight: 800; color: #f5f5f5; margin: 0 0 8px; letter-spacing: -0.8px; }
        .pay-card__subtitle { color: #999; font-size: 15px; margin: 0 0 32px; line-height: 1.6; }

        /* ── Amount ── */
        .pay-amount {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px; padding: 24px; margin-bottom: 24px;
        }
        .pay-amount__label { display: block; font-size: 12px; color: #888; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
        .pay-amount__value { font-size: 40px; font-weight: 900; color: #f5f5f5; letter-spacing: -1px; }

        /* ── Info list ── */
        .pay-info { text-align: left; margin-bottom: 28px; display: flex; flex-direction: column; gap: 10px; }
        .pay-info__item { font-size: 14px; color: #aaa; display: flex; align-items: center; gap: 8px; }

        /* ── States ── */
        .pay-error {
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.2); color: #f87171;
          padding: 12px 14px; border-radius: 10px; font-size: 14px; margin-bottom: 16px; text-align: left;
        }
        .pay-success {
          background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.2); color: #4ade80;
          padding: 16px; border-radius: 12px; font-size: 14px; margin-bottom: 16px;
          display: flex; flex-direction: column; gap: 12px;
        }

        /* ── Buttons ── */
        .pay-btn {
          width: 100%; background: #f5f5f5;
          color: #0a0a0a; border: none; border-radius: 12px; padding: 16px;
          font-size: 16px; font-weight: 700; cursor: pointer; transition: all .2s;
          margin-bottom: 16px; box-sizing: border-box;
        }
        .pay-btn:hover:not(:disabled) { transform: translateY(-1px); background: #e5e5e5; box-shadow: 0 4px 20px rgba(255,255,255,0.1); }
        .pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pay-legal { font-size: 12px; color: #888; line-height: 1.6; }

        /* ── MercadoPago badge ── */
        .pay-mp-badge {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 16px; font-size: 13px; color: #888;
        }
        .pay-mp-badge strong { color: #009ee3; }

        /* ── DEV mock banner ── */
        .pay-mock-banner {
          background: rgba(234,179,8,0.06); border: 1px dashed rgba(234,179,8,0.3);
          border-radius: 14px; padding: 20px; margin-bottom: 20px; text-align: left;
        }
        .pay-mock-banner__badge {
          display: inline-block; background: rgba(234,179,8,0.12); color: #fbbf24;
          font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px;
          margin-bottom: 8px; letter-spacing: 0.5px;
        }
        .pay-mock-banner p { font-size: 13px; color: #888; margin: 0 0 14px; line-height: 1.5; }
        .pay-btn--mock {
          background: rgba(234,179,8,0.12) !important; color: #fbbf24 !important;
          border: 1px solid rgba(234,179,8,0.3) !important;
        }
        .pay-btn--mock:hover:not(:disabled) { background: rgba(234,179,8,0.2) !important; }

        /* ── Mobile ── */
        @media (max-width: 560px) {
          .pay-page { padding: 28px 12px 48px; }
          .pay-progress { margin-bottom: 36px; }
          .pay-step__label { display: none; }
          .pay-step.active .pay-step__label {
            display: block;
            position: absolute;
            top: 40px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            max-width: none;
            font-size: 11px;
            color: #f5f5f5;
          }
          .pay-progress { margin-bottom: 60px; }
          .pay-step__dot { width: 28px; height: 28px; font-size: 11px; }
          .pay-step__line { top: 13px; }
          .pay-card { padding: 32px 20px; border-radius: 20px; }
          .pay-card__title { font-size: 22px; }
          .pay-card__subtitle { font-size: 14px; }
          .pay-amount__value { font-size: 32px; }
          .pay-btn { font-size: 15px; }
        }
      `}</style>
      </main>
    </div>
  );
}
