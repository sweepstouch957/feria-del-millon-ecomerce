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
import { Bone } from "@components/views/admin/artist/ui";
import { Alert, ApplyShell, Ico, Journey } from "./applyUi";
import LegalDisclaimer from "@components/LegalDisclaimer";

/* Pago de inscripción (paso 2 del camino de la postulación).
   La lógica —carga de la postulación, redirecciones, Mercado Pago y el pago
   simulado de desarrollo— no cambió; la vista usa el sistema de applyUi. */

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

  return (
    <PagarView
      loading={isAuthLoading || (loadingApp && !isNotArtist)}
      isNotArtist={isNotArtist}
      email={user?.email}
      isPaid={!!app?.isPaid}
      isMock={isMock}
      paying={paying}
      error={error}
      onSwitch={handleSwitchToArtist}
      onHome={() => router.push("/")}
      onPay={handlePay}
      onMockPay={handleMockPay}
      onForm={() => router.push(`/convocatoria/aplicar?appId=${appId}`)}
    />
  );
}

/* Solo presentación: el sistema de la postulación (applyUi). */
function PagarView({
  loading,
  isNotArtist,
  email,
  isPaid,
  isMock,
  paying,
  error,
  onSwitch,
  onHome,
  onPay,
  onMockPay,
  onForm,
}: {
  loading: boolean;
  isNotArtist: boolean;
  email?: string;
  isPaid: boolean;
  isMock: boolean;
  paying: boolean;
  error: string;
  onSwitch: () => void;
  onHome: () => void;
  onPay: () => void;
  onMockPay: () => void;
  onForm: () => void;
}) {
  if (loading) {
    return (
      <ApplyShell narrow>
        <Bone h={56} style={{ borderRadius: 12 }} />
        <Bone w="70%" h={40} />
        <Bone h={260} style={{ borderRadius: 16 }} />
      </ApplyShell>
    );
  }

  if (isNotArtist) {
    return (
      <ApplyShell narrow center>
        <div className="fdm-ap-head">
          <span className="fdm-st-eyebrow" style={{ color: "var(--warn)" }}>Esta cuenta no es de artista</span>
          <h1 className="fdm-st-h1">Necesitas una cuenta de artista</h1>
          <p className="fdm-st-lead">La inscripción y la postulación son solo para cuentas de artista.</p>
        </div>
        <div className="fdm-st-card" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="fdm-st-label">Entraste como</span>
          <span style={{ fontSize: 16, overflowWrap: "anywhere" }}>{email || "Usuario"}</span>
        </div>
        <button type="button" className="fdm-st-btn is-green is-lg fdm-studio-plain" onClick={onSwitch}>Entrar con mi cuenta de artista</button>
        <button type="button" className="fdm-st-btn fdm-studio-plain" onClick={onHome}>Volver al inicio</button>
      </ApplyShell>
    );
  }

  return (
    <ApplyShell narrow>
      <Journey current={1} />

      <div className="fdm-ap-head">
        <span className="fdm-st-eyebrow">Paso 2 de 4</span>
        <h1 className="fdm-st-h1">Paga tu inscripción</h1>
        <p className="fdm-st-lead">Tu cuenta ya está creada. Con el pago se abre el formulario donde subes tu proyecto y tus obras.</p>
      </div>

      <section className="fdm-st-card" style={{ display: "flex", flexDirection: "column", gap: 20, padding: 24 }}>
        <div className="fdm-ap-price">
          <span className="fdm-st-label">Valor de la inscripción</span>
          <b>$ 40.000</b>
        </div>
        <div className="fdm-ap-checks">
          {[
            "Pago seguro con Mercado Pago.",
            "Puedes pagar con tarjeta, PSE o efectivo.",
            "Al pagar se abre el formulario de postulación.",
            "Es una sola inscripción por convocatoria.",
          ].map((t) => (
            <span key={t}><Ico name="check" sw={1.8} />{t}</span>
          ))}
        </div>

        {error && <Alert tone="bad" title="No se pudo iniciar el pago">{error}</Alert>}

        {isPaid ? (
          <button type="button" className="fdm-st-btn is-green is-lg fdm-studio-plain" onClick={onForm}>Ir al formulario<Ico name="arrow" /></button>
        ) : !isMock ? (
          <button type="button" className="fdm-st-btn is-green is-lg fdm-studio-plain" style={{ height: 56 }} onClick={onPay} disabled={paying}>
            {paying ? "Abriendo Mercado Pago…" : <>Pagar con Mercado Pago<Ico name="arrow" /></>}
          </button>
        ) : (
          /* Pago simulado, solo en local: Mercado Pago no funciona en localhost. */
          <>
            <Alert tone="warn" title="Entorno local">Mercado Pago no funciona en localhost. Usa el pago simulado para seguir el flujo.</Alert>
            <button type="button" className="fdm-st-btn is-lg fdm-studio-plain" onClick={onMockPay} disabled={paying}>
              {paying ? "Procesando…" : "Simular pago exitoso"}
            </button>
          </>
        )}

        <LegalDisclaimer style={{ margin: 0, fontSize: 13 }}>El pago no es reembolsable.</LegalDisclaimer>
      </section>

      <p className="fdm-st-note" style={{ textAlign: "center" }}>
        ¿Problemas con el pago? Escríbenos a <a href="mailto:coordinaciongeneral@feriadelmillon.com" style={{ color: "var(--fg)", textDecoration: "underline" }}>coordinaciongeneral@feriadelmillon.com</a>
      </p>
    </ApplyShell>
  );
}
