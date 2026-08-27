"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { checkPaymentStatusPublic, checkPaymentStatus } from "@services/applications.service";
import PaymentResultShell, { ResultAction } from "@components/views/convocatoria/PaymentResultShell";

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

  if (checking) {
    return (
      <PaymentResultShell
        tone="warn"
        eyebrow="Verificando"
        title="Consultando el pago"
        description="Estamos comprobando el estado con MercadoPago."
      />
    );
  }

  if (status === "approved") {
    return (
      <PaymentResultShell
        tone="ok"
        eyebrow="Pago acreditado"
        title="Listo, ya se acreditó"
        description="Tu inscripción quedó registrada. Podés continuar con tu postulación."
        actions={
          <ResultAction href={`/convocatoria/aplicar${appId ? `?appId=${appId}` : ""}`}>
            Continuar postulación →
          </ResultAction>
        }
      />
    );
  }

  return (
    <PaymentResultShell
      tone="warn"
      eyebrow="Pago pendiente"
      title="Falta que se acredite"
      description="Algunos medios (efectivo, PSE, transferencia) tardan en confirmarse. Revisamos solos cada 15 segundos; también te avisamos por correo cuando entre."
      actions={
        <ResultAction href="/convocatoria/mi-solicitud" variant="ghost">
          Ver mi solicitud
        </ResultAction>
      }
    />
  );
}
