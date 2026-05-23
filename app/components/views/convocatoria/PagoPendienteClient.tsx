"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { checkPaymentStatusPublic, checkPaymentStatus } from "@services/applications.service";

export default function PagoPendienteClient() {
  const searchParams = useSearchParams();
  const appId = searchParams.get("appId") || searchParams.get("external_reference");
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<"pending" | "approved" | "unknown">("pending");

  const reconcile = useCallback(async () => {
    if (!appId) { setChecking(false); return; }
    try {
      // Use public endpoint first (no auth required — safer after MP redirect)
      let result: { ok: boolean; paymentStatus: string; isPaid: boolean };
      try {
        result = await checkPaymentStatusPublic(appId);
      } catch {
        // Fallback to authenticated endpoint
        result = await checkPaymentStatus(appId);
      }

      if (result.isPaid) {
        setStatus("approved");
      } else {
        setStatus("pending");
      }
    } catch {
      setStatus("unknown");
    } finally {
      setChecking(false);
    }
  }, [appId]);

  useEffect(() => { reconcile(); }, [reconcile]);

  // Auto re-check every 15 seconds
  useEffect(() => {
    if (status === "approved") return;
    const t = setInterval(reconcile, 15000);
    return () => clearInterval(t);
  }, [status, reconcile]);

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center" style={{overflowX: "hidden"}}>
      <main className="pp-page w-full">
        <div className="pp-bg-glow pp-bg-glow--1" />
        <div className="pp-bg-glow pp-bg-glow--2" />

        <div className="pp-card mx-auto">
          {/* Icon */}
          <div className="pp-icon-wrap">
            <div className="pp-icon-ring" />
            <div className="pp-icon">
              {status === "approved" ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              )}
            </div>
          </div>

          {/* Badge */}
          <div className={`pp-badge ${status === "approved" ? "pp-badge--success" : ""}`}>
            <span className="pp-badge__dot" />
            {status === "approved" ? "Pago confirmado" : "Pago pendiente"}
          </div>

          {status === "approved" ? (
            <>
              <h1 className="pp-title">¡Pago confirmado!</h1>
              <p className="pp-subtitle">Tu pago fue acreditado. Ya puedes continuar con tu postulación.</p>
              <Link
                href={`/convocatoria/aplicar${appId ? `?appId=${appId}` : ""}`}
                className="pp-btn pp-btn--primary"
              >
                Completar mi postulación →
              </Link>
            </>
          ) : (
            <>
              <h1 className="pp-title">Pago en proceso</h1>
              <p className="pp-subtitle">
                Tu pago está siendo procesado. Esto puede tomar unos minutos dependiendo
                del medio de pago seleccionado (PSE, efectivo, etc).
              </p>

              {checking && (
                <div className="pp-checking">
                  <div className="pp-spinner" />
                  <span>Verificando estado del pago…</span>
                </div>
              )}

              <div className="pp-info">
                <div className="pp-info__item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  Verificamos automáticamente cada 15 segundos
                </div>
                <div className="pp-info__item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                  </svg>
                  Recibirás un email cuando se confirme
                </div>
                <div className="pp-info__item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Pagos en efectivo pueden tardar 1–2 horas
                </div>
              </div>

              <div className="pp-actions">
                <button className="pp-btn pp-btn--outline" onClick={reconcile} disabled={checking}>
                  {checking ? "Verificando…" : "Verificar ahora"}
                </button>
                <Link href="/convocatoria/mi-solicitud" className="pp-btn pp-btn--ghost">
                  Ver mi solicitud
                </Link>
              </div>
            </>
          )}
        </div>

        <style jsx>{`
          .pp-page {
            display: flex; align-items: center; justify-content: center;
            padding: 32px 16px; font-family: 'Inter', sans-serif;
            position: relative; overflow: hidden;
          }
          .pp-bg-glow {
            position: absolute; border-radius: 50%;
            filter: blur(120px); opacity: 0.1; pointer-events: none;
          }
          .pp-bg-glow--1 {
            width: 500px; height: 500px; top: -150px; right: -100px;
            background: radial-gradient(circle, #fbbf24, transparent);
            animation: pp-fl 8s ease-in-out infinite alternate;
          }
          .pp-bg-glow--2 {
            width: 400px; height: 400px; bottom: -150px; left: -100px;
            background: radial-gradient(circle, #f97316, transparent);
            animation: pp-fl 10s ease-in-out infinite alternate-reverse;
          }
          @keyframes pp-fl { 0%{transform:translate(0,0)} 100%{transform:translate(30px,-20px)} }

          .pp-card {
            position: relative; z-index: 1;
            background: linear-gradient(180deg, #111 0%, #0a0a0a 100%);
            border: 1px solid #1a1a1a; border-radius: 28px;
            padding: 56px 44px; max-width: 520px; width: 100%; text-align: center;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.03), 0 24px 80px rgba(0,0,0,0.6),
                        inset 0 1px 0 rgba(255,255,255,0.04);
            animation: pp-in 0.6s cubic-bezier(0.16,1,0.3,1);
          }
          @keyframes pp-in { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:none} }

          .pp-icon-wrap { position:relative;width:96px;height:96px;margin:0 auto 24px;display:flex;align-items:center;justify-content:center; }
          .pp-icon-ring { position:absolute;inset:0;border-radius:50%;border:1px solid rgba(251,191,36,0.2);animation:pp-rp 3s ease-in-out infinite; }
          @keyframes pp-rp { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.06);opacity:0.5} }
          .pp-icon {
            width:72px;height:72px;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.15);
            border-radius:50%;display:flex;align-items:center;justify-content:center;
          }

          .pp-badge {
            display:inline-flex;align-items:center;gap:8px;
            background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.15);
            color:#fbbf24;font-size:12px;font-weight:700;
            padding:6px 16px;border-radius:100px;margin-bottom:20px;
            letter-spacing:0.5px;text-transform:uppercase;
          }
          .pp-badge--success { background:rgba(74,222,128,0.08);border-color:rgba(74,222,128,0.15);color:#4ade80; }
          .pp-badge--success .pp-badge__dot { background:#4ade80; }
          .pp-badge__dot { width:6px;height:6px;border-radius:50%;background:#fbbf24;animation:pp-blink 2s ease-in-out infinite; }
          @keyframes pp-blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

          .pp-title { font-size:32px;font-weight:900;color:#fff;margin:0 0 12px;letter-spacing:-1px; }
          .pp-subtitle { color:#999;font-size:15px;line-height:1.65;margin:0 0 28px;max-width:400px;margin-left:auto;margin-right:auto; }

          .pp-checking {
            display:flex;align-items:center;justify-content:center;gap:10px;
            background:rgba(255,255,255,0.03);border:1px solid #1a1a1a;
            border-radius:12px;padding:14px 20px;font-size:13px;color:#888;margin-bottom:20px;
          }
          .pp-spinner { width:16px;height:16px;border:2px solid #333;border-top-color:#fbbf24;border-radius:50%;animation:pp-spin .6s linear infinite; }
          @keyframes pp-spin { to{transform:rotate(360deg)} }

          .pp-info {
            background:rgba(255,255,255,0.02);border:1px solid #1a1a1a;
            border-radius:16px;padding:20px;margin-bottom:28px;
            display:flex;flex-direction:column;gap:14px;text-align:left;
          }
          .pp-info__item { display:flex;align-items:center;gap:10px;font-size:13px;color:#888; }
          .pp-info__item svg { flex-shrink:0;color:#555; }

          .pp-actions { display:flex;flex-direction:column;gap:10px; }
          .pp-btn {
            display:flex;align-items:center;justify-content:center;gap:10px;
            padding:16px;border-radius:14px;font-size:15px;font-weight:700;
            text-decoration:none;transition:all .25s cubic-bezier(0.16,1,0.3,1);cursor:pointer;border:none;
          }
          .pp-btn--primary { background:#fff;color:#000;box-shadow:0 2px 12px rgba(255,255,255,0.08); }
          .pp-btn--primary:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(255,255,255,0.12);background:#f3f4f6; }
          .pp-btn--outline { background:transparent;color:#fbbf24;border:1px solid rgba(251,191,36,0.3); }
          .pp-btn--outline:hover { background:rgba(251,191,36,0.08);border-color:rgba(251,191,36,0.5); }
          .pp-btn--outline:disabled { opacity:0.5;cursor:not-allowed; }
          .pp-btn--ghost { background:rgba(255,255,255,0.04);color:#aaa;border:1px solid #222; }
          .pp-btn--ghost:hover { background:rgba(255,255,255,0.08);color:#fff;border-color:#444; }

          .pp-page { box-sizing: border-box; }
          @media (max-width:540px) {
            .pp-card { padding: 36px 20px; border-radius: 20px; }
            .pp-title { font-size: 24px; }
            .pp-subtitle { font-size: 14px; }
          }
        `}</style>
      </main>
    </div>
  );
}
