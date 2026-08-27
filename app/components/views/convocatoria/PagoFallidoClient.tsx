"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { checkPaymentStatusPublic, checkPaymentStatus } from "@services/applications.service";
import PaymentResultShell, { ResultAction } from "@components/views/convocatoria/PaymentResultShell";

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

  if (checking) {
    return (
      <PaymentResultShell
        tone="warn"
        eyebrow="Verificando"
        title="Revisando el pago"
        description="Estamos comprobando qué pasó con tu pago."
      />
    );
  }

  // El backend puede haber acreditado el pago aunque MercadoPago haya
  // devuelto al usuario por la ruta de fallo.
  if (appStatus === "approved") {
    return (
      <PaymentResultShell
        tone="ok"
        eyebrow="Pago acreditado"
        title="Tu pago sí entró"
        description="MercadoPago te trajo por acá, pero el pago figura aprobado. Podés continuar."
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
      tone="error"
      eyebrow="Pago rechazado"
      title="No pudimos cobrar"
      description={
        errorDetail ||
        "El pago no se completó. No se hizo ningún cargo: podés intentarlo de nuevo con otro medio."
      }
      actions={
        <>
          <ResultAction href={`/convocatoria/pagar${appId ? `?appId=${appId}` : ""}`}>
            Reintentar pago
          </ResultAction>
          <ResultAction href="/convocatoria/mi-solicitud" variant="ghost">
            Ver mi solicitud
          </ResultAction>
        </>
      }
    />
  );
}
