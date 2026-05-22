"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { checkPaymentStatusPublic, checkPaymentStatus } from "@services/applications.service";

type PaymentInfo = {
  collectionStatus: string | null;
  paymentId: string | null;
  status: string | null;
  preferenceId: string | null;
  externalReference: string | null;
};

export default function PagoFallidoClient() {
  const searchParams = useSearchParams();
  const appId = searchParams.get("appId") || searchParams.get("external_reference");
  const [checking, setChecking] = useState(true);
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string>("");

  const paymentInfo: PaymentInfo = {
    collectionStatus: searchParams.get("collection_status"),
    paymentId: searchParams.get("payment_id"),
    status: searchParams.get("status"),
    preferenceId: searchParams.get("preference_id"),
    externalReference: searchParams.get("external_reference"),
  };

  const hasNullPayment =
    paymentInfo.collectionStatus === "null" || paymentInfo.collectionStatus === null;

  const reconcile = useCallback(async () => {
    if (!appId) {
      setChecking(false);
      return;
    }
    try {
      // Use public endpoint first (no auth required — safer after MP redirect)
      let result: { ok: boolean; paymentStatus: string; isPaid: boolean };
      try {
        result = await checkPaymentStatusPublic(appId);
      } catch {
        result = await checkPaymentStatus(appId);
      }
      setAppStatus(result.paymentStatus);
    } catch {
      setErrorDetail("No se pudo verificar el estado del pago.");
    } finally {
      setChecking(false);
    }
  }, [appId]);

  useEffect(() => {
    reconcile();
  }, [reconcile]);

  // Determine the display message
  const getMessage = () => {
    if (hasNullPayment) {
      return {
        title: "Pago no completado",
        subtitle:
          "Parece que saliste de MercadoPago sin finalizar el pago. No te preocupes, tu solicitud sigue activa.",
        icon: "exit",
      };
    }
    if (paymentInfo.status === "rejected") {
      return {
        title: "Pago rechazado",
        subtitle:
          "El pago fue rechazado por el procesador. Verifica los datos de tu medio de pago e intenta de nuevo.",
        icon: "rejected",
      };
    }
    return {
      title: "Pago no completado",
      subtitle:
        "El pago no pudo procesarse. Puedes intentarlo nuevamente o contactarnos si el problema persiste.",
      icon: "error",
    };
  };

  const msg = getMessage();

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center" style={{overflowX: "hidden"}}>
      <main className="pf-page w-full">
        {/* Background glow effects */}
        <div className="pf-bg-glow pf-bg-glow--1" />
        <div className="pf-bg-glow pf-bg-glow--2" />

        <div className="pf-card mx-auto">
          {/* Animated icon */}
          <div className="pf-icon-wrap">
            <div className="pf-icon-ring" />
            <div className="pf-icon-ring pf-icon-ring--2" />
            <div className="pf-icon">
              {msg.icon === "exit" ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              ) : msg.icon === "rejected" ? (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="pf-badge">
            <span className="pf-badge__dot" />
            {hasNullPayment ? "Sesión abandonada" : "Error de pago"}
          </div>

          <h1 className="pf-title">{msg.title}</h1>
          <p className="pf-subtitle">{msg.subtitle}</p>

          {/* Checking spinner */}
          {checking && (
            <div className="pf-checking">
              <div className="pf-spinner" />
              <span>Verificando estado del pago…</span>
            </div>
          )}

          {/* Error detail */}
          {errorDetail && (
            <div className="pf-error-detail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {errorDetail}
            </div>
          )}

          {/* Payment details card */}
          {(paymentInfo.preferenceId || paymentInfo.paymentId) && (
            <div className="pf-details">
              <div className="pf-details__header">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Detalles de la transacción
              </div>
              <div className="pf-details__grid">
                {paymentInfo.preferenceId && paymentInfo.preferenceId !== "null" && (
                  <div className="pf-details__item">
                    <span className="pf-details__label">Preferencia</span>
                    <span className="pf-details__value">{paymentInfo.preferenceId.slice(0, 20)}…</span>
                  </div>
                )}
                {paymentInfo.paymentId && paymentInfo.paymentId !== "null" && (
                  <div className="pf-details__item">
                    <span className="pf-details__label">ID de pago</span>
                    <span className="pf-details__value">{paymentInfo.paymentId}</span>
                  </div>
                )}
                <div className="pf-details__item">
                  <span className="pf-details__label">Estado</span>
                  <span className="pf-details__value pf-details__value--status">
                    {hasNullPayment ? "No iniciado" : paymentInfo.status || "Desconocido"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pf-actions">
            <Link
              href={`/convocatoria/pagar${appId ? `?appId=${appId}` : ""}`}
              className="pf-btn pf-btn--primary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Reintentar pago
            </Link>

            <Link
              href="/convocatoria/mi-solicitud"
              className="pf-btn pf-btn--ghost"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Ver mi solicitud
            </Link>
          </div>

          {/* Help note */}
          <div className="pf-help">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>¿Problemas con el pago? Escríbenos a <strong>soporte@feriadelmillon.com</strong> con el ID de tu solicitud.</span>
          </div>
        </div>

        <style jsx>{`
          .pf-page {
            display: flex; align-items: center; justify-content: center;
            padding: 32px 16px; font-family: 'Inter', sans-serif;
            position: relative; overflow: hidden;
            box-sizing: border-box;
          }

          /* Background glows */
          .pf-bg-glow {
            position: absolute; border-radius: 50%;
            filter: blur(120px); opacity: 0.15; pointer-events: none;
          }
          .pf-bg-glow--1 {
            width: 500px; height: 500px; top: -150px; right: -100px;
            background: radial-gradient(circle, #ef4444, transparent);
            animation: pf-float 8s ease-in-out infinite alternate;
          }
          .pf-bg-glow--2 {
            width: 400px; height: 400px; bottom: -150px; left: -100px;
            background: radial-gradient(circle, #f97316, transparent);
            animation: pf-float 10s ease-in-out infinite alternate-reverse;
          }

          @keyframes pf-float {
            0% { transform: translate(0, 0); }
            100% { transform: translate(30px, -20px); }
          }

          /* Card */
          .pf-card {
            position: relative; z-index: 1;
            background: linear-gradient(180deg, #111111 0%, #0a0a0a 100%);
            border: 1px solid #1a1a1a; border-radius: 28px;
            padding: 56px 44px; max-width: 520px; width: 100%;
            text-align: center;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.03),
                        0 24px 80px rgba(0,0,0,0.6),
                        inset 0 1px 0 rgba(255,255,255,0.04);
            animation: pf-card-in 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes pf-card-in {
            from { opacity: 0; transform: translateY(24px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          /* Icon */
          .pf-icon-wrap {
            position: relative; width: 96px; height: 96px;
            margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;
          }
          .pf-icon-ring {
            position: absolute; inset: 0; border-radius: 50%;
            border: 1px solid rgba(239,68,68,0.2);
            animation: pf-ring-pulse 3s ease-in-out infinite;
          }
          .pf-icon-ring--2 {
            inset: -8px; border-color: rgba(239,68,68,0.1);
            animation-delay: 1s;
          }
          @keyframes pf-ring-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.06); opacity: 0.5; }
          }
          .pf-icon {
            position: relative; width: 72px; height: 72px;
            background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            animation: pf-icon-shake 0.5s ease-in-out 0.3s;
          }
          @keyframes pf-icon-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-4px); }
            40% { transform: translateX(4px); }
            60% { transform: translateX(-2px); }
            80% { transform: translateX(2px); }
          }

          /* Badge */
          .pf-badge {
            display: inline-flex; align-items: center; gap: 8px;
            background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
            color: #f87171; font-size: 12px; font-weight: 700;
            padding: 6px 16px; border-radius: 100px;
            margin-bottom: 20px; letter-spacing: 0.5px; text-transform: uppercase;
          }
          .pf-badge__dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: #ef4444;
            animation: pf-dot-blink 2s ease-in-out infinite;
          }
          @keyframes pf-dot-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }

          /* Typography */
          .pf-title {
            font-size: 32px; font-weight: 900; color: #fff;
            margin: 0 0 12px; letter-spacing: -1px; line-height: 1.1;
          }
          .pf-subtitle {
            color: #777; font-size: 15px; line-height: 1.65;
            margin: 0 0 28px; max-width: 400px; margin-left: auto; margin-right: auto;
          }

          /* Checking */
          .pf-checking {
            display: flex; align-items: center; justify-content: center; gap: 10px;
            background: rgba(255,255,255,0.03); border: 1px solid #1a1a1a;
            border-radius: 12px; padding: 14px 20px;
            font-size: 13px; color: #888; margin-bottom: 20px;
          }
          .pf-spinner {
            width: 16px; height: 16px; border: 2px solid #333;
            border-top-color: #ef4444; border-radius: 50%;
            animation: pf-spin 0.6s linear infinite;
          }
          @keyframes pf-spin { to { transform: rotate(360deg); } }

          /* Error */
          .pf-error-detail {
            display: flex; align-items: center; justify-content: center; gap: 8px;
            background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15);
            color: #f87171; padding: 12px 16px; border-radius: 12px;
            font-size: 13px; margin-bottom: 20px;
          }

          /* Details card */
          .pf-details {
            background: rgba(255,255,255,0.02); border: 1px solid #1a1a1a;
            border-radius: 16px; overflow: hidden; margin-bottom: 28px;
            text-align: left;
          }
          .pf-details__header {
            display: flex; align-items: center; gap: 8px;
            padding: 14px 20px; border-bottom: 1px solid #1a1a1a;
            font-size: 12px; font-weight: 700; color: #555;
            text-transform: uppercase; letter-spacing: 0.5px;
          }
          .pf-details__grid {
            padding: 16px 20px; display: flex; flex-direction: column; gap: 12px;
          }
          .pf-details__item {
            display: flex; justify-content: space-between; align-items: center;
          }
          .pf-details__label { font-size: 13px; color: #555; }
          .pf-details__value { font-size: 13px; color: #aaa; font-family: 'JetBrains Mono', monospace; }
          .pf-details__value--status {
            color: #f87171; font-weight: 700; font-family: 'Inter', sans-serif;
          }

          /* Actions */
          .pf-actions {
            display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;
          }
          .pf-btn {
            display: flex; align-items: center; justify-content: center; gap: 10px;
            padding: 16px; border-radius: 14px; font-size: 15px; font-weight: 700;
            text-decoration: none; transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
          }
          .pf-btn--primary {
            background: #fff; color: #000;
            box-shadow: 0 2px 12px rgba(255,255,255,0.08);
          }
          .pf-btn--primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(255,255,255,0.12);
            background: #f3f4f6;
          }
          .pf-btn--ghost {
            background: rgba(255,255,255,0.04); color: #aaa;
            border: 1px solid #222;
          }
          .pf-btn--ghost:hover {
            background: rgba(255,255,255,0.08); color: #fff;
            border-color: #444;
          }

          /* Help */
          .pf-help {
            display: flex; align-items: flex-start; gap: 8px;
            background: rgba(255,255,255,0.02); border: 1px solid #1a1a1a;
            border-radius: 12px; padding: 14px 16px;
            font-size: 12px; color: #555; line-height: 1.6; text-align: left;
          }
          .pf-help svg { flex-shrink: 0; margin-top: 2px; }
          .pf-help strong { color: #888; }

          @media (max-width: 540px) {
            .pf-card { padding: 36px 20px; border-radius: 20px; }
            .pf-title { font-size: 24px; }
            .pf-subtitle { font-size: 14px; }
          }
        `}</style>
      </main>
    </div>
  );
}
