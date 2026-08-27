"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  initiatePayment,
  getApplicationById,
  getMyApplications,
  mockPayment,
} from "@services/applications.service";
import { useAuth } from "@provider/authProvider";
import { clearAuth } from "@services/auth.service";
import Skeleton from "@components/ui/Skeleton";

/* ──────────────────────────────────────────────────────────────
   Pago de inscripción — sistema editorial v2.
   La lógica (carga de la postulación, redirecciones, MercadoPago
   y el pago simulado de desarrollo) quedó intacta.
   ────────────────────────────────────────────────────────────── */

const STEPS = ["Crear cuenta", "Pagar inscripción", "Subir obras", "Resolución"];

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const ROOT_VARS = {
  "--bg": "var(--fdm-bg,#F7F6F2)",
  "--fg": "var(--fdm-fg,#0B0B0A)",
  "--acc": "var(--fdm-green,#3FA46E)",
  "--panel": "var(--fdm-panel,#0B0B0A)",
  background: "var(--bg)",
  color: "var(--fg)",
  fontFamily: "Jost, system-ui, sans-serif",
  fontWeight: 400,
  minHeight: "calc(100vh - 81px)",
  width: "100%",
  overflowX: "hidden",
} as React.CSSProperties;

const PAGE_CSS = `
  .fdm-pay a { transition: color .3s ease, opacity .3s ease; }
  .fdm-pay-cta:hover:not(:disabled) { background: var(--acc); border-color: var(--acc); color: #0B0B0A; }
`;

const CTA: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: 54,
  borderRadius: 999,
  border: "1px solid var(--fg)",
  background: "var(--fg)",
  color: "var(--bg)",
  cursor: "pointer",
  transition: "all .3s ease",
  ...EYEBROW,
  fontSize: 11,
  letterSpacing: "0.16em",
};

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={ROOT_VARS}>
      <style>{PAGE_CSS}</style>
      <div
        className="fdm-pay"
        style={{
          maxWidth: 620,
          margin: "0 auto",
          padding: "clamp(28px,4vw,60px) clamp(20px,4vw,40px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

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
  const isMock =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      process.env.NEXT_PUBLIC_MOCK_PAYMENT === "true");

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
        const apps = await getMyApplications();
        const pending = apps.find((a: any) => !a.isPaid && a.status === "pending_payment");
        if (pending) {
          router.replace(`/convocatoria/pagar?appId=${pending._id}`);
          return;
        }
        router.replace("/convocatoria/aplicar");
        return;
      }
    } catch (e: unknown) {
      const err = e as { response?: { status?: number }; message?: string };
      if (err?.response?.status === 401) {
        router.replace(
          `/login?role=artist&redirect=${encodeURIComponent(
            `/convocatoria/pagar?appId=${appId || ""}`
          )}`
        );
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
        router.replace(
          `/login?role=artist&redirect=${encodeURIComponent(
            `/convocatoria/pagar?appId=${appId || ""}`
          )}`
        );
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
    window.location.href = `/login?role=artist&redirect=${encodeURIComponent(
      `/convocatoria/pagar?appId=${appId || ""}`
    )}`;
  };

  const handlePay = async () => {
    if (!appId) {
      setError("appId requerido");
      return;
    }
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

  /* ── Carga ─────────────────────────────────────────────── */
  if (isAuthLoading || (loadingApp && !isNotArtist)) {
    return (
      <Shell>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Skeleton w="35%" h={11} />
          <Skeleton w="70%" h={34} />
          <Skeleton w="100%" h={90} />
          <Skeleton w="100%" h={54} radius={999} />
        </div>
      </Shell>
    );
  }

  /* ── Cuenta que no es de artista ───────────────────────── */
  if (isNotArtist) {
    return (
      <Shell>
        <span style={{ ...EYEBROW, color: "#C9902B" }}>Cuenta no autorizada</span>
        <h1
          style={{
            margin: "10px 0 8px",
            fontWeight: 300,
            fontSize: "clamp(28px,3.4vw,44px)",
            lineHeight: 1.05,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          Necesitás una cuenta de artista
        </h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: mix(72) }}>
          El pago de inscripción y la postulación están reservados a cuentas de tipo artista.
        </p>

        <div
          style={{
            margin: "22px 0",
            padding: "16px 18px",
            border: `1px solid ${mix(16)}`,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <span style={{ ...EYEBROW, fontSize: 9, color: mix(50) }}>Sesión iniciada como</span>
          <span style={{ fontSize: 15, fontWeight: 500 }}>{user?.email || "Usuario"}</span>
          <span style={{ fontSize: 13.5, color: "#C9902B" }}>Rol: comprador</span>
        </div>

        <button type="button" className="fdm-pay-cta" style={CTA} onClick={handleSwitchToArtist}>
          Entrar como artista
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            ...CTA,
            marginTop: 12,
            background: "transparent",
            color: "inherit",
            border: `1px solid ${mix(26)}`,
          }}
        >
          Volver al inicio
        </button>
      </Shell>
    );
  }

  /* ── Pago ──────────────────────────────────────────────── */
  return (
    <Shell>
      {/* Pasos */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "clamp(24px,3vw,38px)" }}>
        <div style={{ height: 2, background: mix(14) }}>
          <div style={{ height: "100%", width: "25%", background: "var(--acc)" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STEPS.length}, 1fr)`, gap: 6 }}>
          {STEPS.map((label, i) => (
            <span
              key={label}
              style={{
                ...EYEBROW,
                fontSize: 8.5,
                letterSpacing: "0.1em",
                textAlign: "center",
                lineHeight: 1.3,
                color: i === 1 ? "var(--acc)" : i < 1 ? mix(65) : mix(38),
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <span style={{ ...EYEBROW, color: "var(--acc)" }}>Paso 2</span>
      <h1
        style={{
          margin: "10px 0 8px",
          fontWeight: 300,
          fontSize: "clamp(28px,3.4vw,44px)",
          lineHeight: 1.05,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        Pago de inscripción
      </h1>
      <p style={{ margin: 0, maxWidth: "52ch", fontSize: 15, lineHeight: 1.6, color: mix(72) }}>
        Tu cuenta ya está creada. Con el pago se desbloquea el formulario donde subís tu proyecto y
        tus obras.
      </p>

      {/* Importe */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 16,
          margin: "clamp(20px,2.4vw,30px) 0",
          padding: "18px 0",
          borderTop: `1px solid ${mix(20)}`,
          borderBottom: `1px solid ${mix(20)}`,
        }}
      >
        <span style={{ ...EYEBROW, fontSize: 10, color: mix(55) }}>Valor de inscripción</span>
        <span style={{ fontWeight: 500, fontSize: "clamp(26px,3vw,38px)", lineHeight: 1 }}>
          $40.000
        </span>
      </div>

      <ul
        style={{
          margin: "0 0 clamp(20px,2.4vw,28px)",
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {[
          "Pago seguro con MercadoPago",
          "Acepta tarjetas, PSE y efectivo",
          "Desbloquea el formulario de postulación",
          "Una sola inscripción por convocatoria",
        ].map((t) => (
          <li key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5, color: mix(75) }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: "var(--acc)", flex: "0 0 auto" }} />
            {t}
          </li>
        ))}
      </ul>

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: 18,
            padding: "12px 14px",
            borderLeft: "2px solid #B4472A",
            background: mix(4),
            fontSize: 14,
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      {/* Pago simulado, solo en local */}
      {isMock && !app?.isPaid && (
        <div
          style={{
            marginBottom: 18,
            padding: "16px 18px",
            border: `1px solid ${mix(16)}`,
            background: mix(3),
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <span style={{ ...EYEBROW, fontSize: 9, color: "#C9902B" }}>Entorno local</span>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: mix(72) }}>
            MercadoPago no funciona en localhost. Usá el pago simulado para seguir el flujo.
          </p>
          <button
            type="button"
            onClick={handleMockPay}
            disabled={paying}
            style={{
              ...CTA,
              height: 46,
              background: "transparent",
              color: "inherit",
              border: `1px solid ${mix(26)}`,
              opacity: paying ? 0.6 : 1,
            }}
          >
            {paying ? "Procesando…" : "Simular pago exitoso"}
          </button>
        </div>
      )}

      {app?.isPaid ? (
        <button
          type="button"
          className="fdm-pay-cta"
          style={CTA}
          onClick={() => router.push(`/convocatoria/aplicar?appId=${appId}`)}
        >
          Ir al formulario →
        </button>
      ) : !isMock ? (
        <button
          type="button"
          className="fdm-pay-cta"
          style={{ ...CTA, opacity: paying ? 0.6 : 1, cursor: paying ? "wait" : "pointer" }}
          onClick={handlePay}
          disabled={paying}
        >
          {paying ? "Redirigiendo…" : "Pagar con MercadoPago →"}
        </button>
      ) : (
        <button
          type="button"
          disabled
          style={{
            ...CTA,
            background: "transparent",
            color: mix(45),
            border: `1px solid ${mix(18)}`,
            cursor: "not-allowed",
          }}
        >
          MercadoPago no disponible en localhost
        </button>
      )}

      <p style={{ margin: "16px 0 0", fontSize: 12.5, lineHeight: 1.6, color: mix(55) }}>
        Al pagar aceptás los términos y condiciones de la Feria del Millón. El pago no es
        reembolsable.
      </p>
    </Shell>
  );
}
