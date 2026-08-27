"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { checkPaymentStatusPublic, checkPaymentStatus } from "@services/applications.service";
import PaymentResultShell, { ResultAction } from "@components/views/convocatoria/PaymentResultShell";

export default function PagoExitosoClient() {
  const searchParams = useSearchParams();
  const appId = searchParams.get("appId") || searchParams.get("external_reference");
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

  if (checking) {
    return (
      <PaymentResultShell
        tone="ok"
        eyebrow="Verificando"
        title="Confirmando tu pago"
        description="Estamos comprobando el pago con MercadoPago. Puede tardar unos segundos."
      />
    );
  }

  if (confirmed) {
    return (
      <PaymentResultShell
        tone="ok"
        eyebrow="Pago confirmado"
        title="Listo, ya estás dentro"
        description="Tu inscripción quedó registrada. El siguiente paso es completar el formulario y subir tus obras."
        details={[
          ...(paymentId ? [{ label: "Referencia", value: paymentId }] : []),
          { label: "Estado", value: "Aprobado" },
        ]}
        actions={
          <>
            <ResultAction href={`/convocatoria/aplicar${appId ? `?appId=${appId}` : ""}`}>
              Continuar postulación →
            </ResultAction>
            <ResultAction href="/convocatoria/mi-solicitud" variant="ghost">
              Ver mi solicitud
            </ResultAction>
          </>
        }
      />
    );
  }

  return (
    <PaymentResultShell
      tone="warn"
      eyebrow="Sin confirmar todavía"
      title="Tu pago está en camino"
      description={
        error ||
        "MercadoPago todavía no nos confirmó el pago. Si ya lo hiciste, suele acreditarse en unos minutos."
      }
      details={paymentId ? [{ label: "Referencia", value: paymentId }] : undefined}
      actions={
        <>
          <ResultAction href="/convocatoria/mi-solicitud">Ver mi solicitud</ResultAction>
          <ResultAction href={`/convocatoria/pagar${appId ? `?appId=${appId}` : ""}`} variant="ghost">
            Reintentar pago
          </ResultAction>
        </>
      }
    />
  );
}
