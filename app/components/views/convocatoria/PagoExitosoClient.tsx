"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { checkPaymentStatusPublic, checkPaymentStatus, getApplicationById } from "@services/applications.service";

export default function PagoExitosoClient() {
  const searchParams = useSearchParams();
  const appId = searchParams.get("appId") || searchParams.get("external_reference");
  const collectionStatus = searchParams.get("collection_status");
  const paymentId = searchParams.get("payment_id");
  const [checking, setChecking] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const retryCount = useRef(0);
  const maxRetries = 5;

  const reconcile = useCallback(async () => {
    if (!appId) { setChecking(false); return; }
    try {
      // Use public endpoint first (no auth required — safer after MP redirect)
      let result: { ok: boolean; paymentStatus: string; isPaid: boolean };
      try {
        result = await checkPaymentStatusPublic(appId);
      } catch {
        // Fallback to authenticated endpoint
        try {
          result = await checkPaymentStatus(appId);
        } catch {
          // If both fail and we haven't retried too many times, schedule a retry
          if (retryCount.current < maxRetries) {
            retryCount.current++;
            setError("");
            setTimeout(reconcile, 3000); // retry in 3 seconds
            return;
          }
          throw new Error("No se pudo verificar el pago después de varios intentos.");
        }
      }

      if (result.isPaid) {
        setConfirmed(true);
        setError("");
      } else if (result.paymentStatus === "not_found" && retryCount.current < maxRetries) {
        // Payment might not be indexed yet in MP — retry
        retryCount.current++;
        setTimeout(reconcile, 3000);
        return;
      }
    } catch (e: any) {
      setError(e?.message || "No se pudo verificar. Revisa tu solicitud en unos minutos.");
    } finally {
      setChecking(false);
    }
  }, [appId]);

  useEffect(() => { reconcile(); }, [reconcile]);

  // Auto-retry every 10 seconds if not confirmed yet (up to maxRetries)
  useEffect(() => {
    if (confirmed || retryCount.current >= maxRetries) return;
    const t = setInterval(() => {
      if (retryCount.current < maxRetries) reconcile();
    }, 10000);
    return () => clearInterval(t);
  }, [confirmed, reconcile]);

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center" style={{overflowX: "hidden"}}>
      <main className="ps-page w-full">
        {/* Background glows */}
        <div className="ps-bg-glow ps-bg-glow--1" />
        <div className="ps-bg-glow ps-bg-glow--2" />

        <div className="ps-card mx-auto">
          {/* Animated icon */}
          <div className="ps-icon-wrap">
            <div className="ps-icon-ring" />
            <div className="ps-icon-ring ps-icon-ring--2" />
            <div className="ps-icon">
              <svg className="ps-check" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline className="ps-check__mark" points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>

          {/* Badge */}
          <div className="ps-badge">
            <span className="ps-badge__dot" />
            Pago confirmado
          </div>

          <h1 className="ps-title">¡Pago exitoso!</h1>
          <p className="ps-subtitle">
            Tu inscripción ha sido confirmada. Ya puedes completar el formulario de
            postulación con tu proyecto y obras.
          </p>

          {/* Checking state */}
          {checking && (
            <div className="ps-checking">
              <div className="ps-spinner" />
              <span>Verificando con MercadoPago…</span>
            </div>
          )}

          {/* Confirmed state */}
          {!checking && confirmed && (
            <div className="ps-confirmed">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Pago verificado exitosamente
              {paymentId && paymentId !== "null" && (
                <span className="ps-confirmed__id">Ref: {paymentId}</span>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="ps-error">{error}</div>
          )}

          {/* What's next */}
          <div className="ps-next">
            <div className="ps-next__header">¿Qué sigue?</div>
            <div className="ps-next__steps">
              <div className="ps-next__step">
                <div className="ps-next__num">1</div>
                <div>
                  <strong>Sube tu CV</strong>
                  <span>Archivo PDF con tu trayectoria</span>
                </div>
              </div>
              <div className="ps-next__step">
                <div className="ps-next__num">2</div>
                <div>
                  <strong>Agrega tus obras</strong>
                  <span>Imágenes con ficha técnica</span>
                </div>
              </div>
              <div className="ps-next__step">
                <div className="ps-next__num">3</div>
                <div>
                  <strong>Envía tu postulación</strong>
                  <span>Nuestro curador la revisará</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="ps-actions">
            <Link
              href={`/convocatoria/aplicar${appId ? `?appId=${appId}` : ""}`}
              className="ps-btn ps-btn--primary"
            >
              Completar mi postulación
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            <Link
              href="/convocatoria/mi-solicitud"
              className="ps-btn ps-btn--ghost"
            >
              Ver mi solicitud
            </Link>
          </div>
        </div>

        <style jsx>{`
          .ps-page {
            display: flex; align-items: center; justify-content: center;
            padding: 32px 16px; font-family: 'Inter', sans-serif;
            position: relative; overflow: hidden;
            box-sizing: border-box;
          }

          /* Background glows */
          .ps-bg-glow {
            position: absolute; border-radius: 50%;
            filter: blur(120px); opacity: 0.12; pointer-events: none;
          }
          .ps-bg-glow--1 {
            width: 500px; height: 500px; top: -150px; left: -100px;
            background: radial-gradient(circle, #22c55e, transparent);
            animation: ps-float 8s ease-in-out infinite alternate;
          }
          .ps-bg-glow--2 {
            width: 400px; height: 400px; bottom: -150px; right: -100px;
            background: radial-gradient(circle, #4ade80, transparent);
            animation: ps-float 10s ease-in-out infinite alternate-reverse;
          }
          @keyframes ps-float {
            0% { transform: translate(0, 0); }
            100% { transform: translate(30px, -20px); }
          }

          /* Card */
          .ps-card {
            position: relative; z-index: 1;
            background: linear-gradient(180deg, #111111 0%, #0a0a0a 100%);
            border: 1px solid #1a1a1a; border-radius: 28px;
            padding: 56px 44px; max-width: 520px; width: 100%;
            text-align: center;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.03),
                        0 24px 80px rgba(0,0,0,0.6),
                        inset 0 1px 0 rgba(255,255,255,0.04);
            animation: ps-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes ps-card-in {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          /* Icon */
          .ps-icon-wrap {
            position: relative; width: 96px; height: 96px;
            margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;
          }
          .ps-icon-ring {
            position: absolute; inset: 0; border-radius: 50%;
            border: 1px solid rgba(74,222,128,0.2);
            animation: ps-ring 3s ease-in-out infinite;
          }
          .ps-icon-ring--2 {
            inset: -8px; border-color: rgba(74,222,128,0.1);
            animation-delay: 1s;
          }
          @keyframes ps-ring {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.06); opacity: 0.5; }
          }
          .ps-icon {
            position: relative; width: 72px; height: 72px;
            background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.15);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
          }
          .ps-check__mark {
            stroke-dasharray: 20;
            stroke-dashoffset: 20;
            animation: ps-draw 0.5s ease-out 0.4s forwards;
          }
          @keyframes ps-draw { to { stroke-dashoffset: 0; } }

          /* Badge */
          .ps-badge {
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.15);
            color: #4ade80; font-size: 12px; font-weight: 700;
            padding: 6px 16px; border-radius: 100px;
            margin-bottom: 20px; letter-spacing: 0.5px; text-transform: uppercase;
          }
          .ps-badge__dot {
            width: 6px; height: 6px; border-radius: 50%; background: #4ade80;
          }

          /* Typography */
          .ps-title {
            font-size: 32px; font-weight: 900; color: #fff;
            margin: 0 0 12px; letter-spacing: -1px; line-height: 1.1;
          }
          .ps-subtitle {
            color: #777; font-size: 15px; line-height: 1.65;
            margin: 0 0 28px; max-width: 400px; margin-left: auto; margin-right: auto;
          }

          /* Checking */
          .ps-checking {
            display: flex; align-items: center; justify-content: center; gap: 10px;
            background: rgba(255,255,255,0.03); border: 1px solid #1a1a1a;
            border-radius: 12px; padding: 14px 20px;
            font-size: 13px; color: #888; margin-bottom: 20px;
          }
          .ps-spinner {
            width: 16px; height: 16px; border: 2px solid #333;
            border-top-color: #4ade80; border-radius: 50%;
            animation: ps-spin 0.6s linear infinite;
          }
          @keyframes ps-spin { to { transform: rotate(360deg); } }

          /* Confirmed */
          .ps-confirmed {
            display: flex; align-items: center; justify-content: center; gap: 10px;
            flex-wrap: wrap;
            background: rgba(74,222,128,0.06); border: 1px solid rgba(74,222,128,0.15);
            color: #4ade80; padding: 14px 20px; border-radius: 12px;
            font-size: 14px; font-weight: 600; margin-bottom: 20px;
          }
          .ps-confirmed__id {
            display: block; width: 100%; font-size: 12px; color: #555;
            font-weight: 400; font-family: 'JetBrains Mono', monospace; margin-top: 4px;
          }

          /* Error */
          .ps-error {
            background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15);
            color: #f87171; padding: 12px 16px; border-radius: 12px;
            font-size: 13px; margin-bottom: 20px;
          }

          /* What's next */
          .ps-next {
            background: rgba(255,255,255,0.02); border: 1px solid #1a1a1a;
            border-radius: 16px; overflow: hidden; margin-bottom: 28px; text-align: left;
          }
          .ps-next__header {
            padding: 14px 20px; border-bottom: 1px solid #1a1a1a;
            font-size: 12px; font-weight: 700; color: #555;
            text-transform: uppercase; letter-spacing: 0.5px;
          }
          .ps-next__steps { padding: 16px 20px; display: flex; flex-direction: column; gap: 14px; }
          .ps-next__step {
            display: flex; align-items: center; gap: 14px;
          }
          .ps-next__num {
            width: 28px; height: 28px; border-radius: 50%;
            background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.15);
            color: #4ade80; font-size: 12px; font-weight: 800;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .ps-next__step strong { display: block; font-size: 14px; color: #ccc; font-weight: 700; }
          .ps-next__step span { font-size: 12px; color: #555; }

          /* Actions */
          .ps-actions {
            display: flex; flex-direction: column; gap: 10px;
          }
          .ps-btn {
            display: flex; align-items: center; justify-content: center; gap: 10px;
            padding: 16px; border-radius: 14px; font-size: 15px; font-weight: 700;
            text-decoration: none; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .ps-btn--primary {
            background: #fff; color: #000;
            box-shadow: 0 2px 12px rgba(255,255,255,0.08);
          }
          .ps-btn--primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(255,255,255,0.12);
            background: #f3f4f6;
          }
          .ps-btn--ghost {
            background: rgba(255,255,255,0.04); color: #aaa;
            border: 1px solid #222;
          }
          .ps-btn--ghost:hover {
            background: rgba(255,255,255,0.08); color: #fff;
            border-color: #444;
          }

          @media (max-width: 540px) {
            .ps-card { padding: 36px 20px; border-radius: 20px; }
            .ps-title { font-size: 24px; }
            .ps-subtitle { font-size: 14px; }
          }
        `}</style>
      </main>
    </div>
  );
}
