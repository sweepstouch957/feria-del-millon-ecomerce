"use client";
import Link from "next/link";
import { ApplyShell, Ico, Journey } from "../applyUi";

interface ApplicationStatusGateProps {
  appId: string;
  status?: string;
}

/**
 * Pantalla cuando la postulación no se puede editar:
 * - pending_payment → llevar al pago
 * - submitted / under_review / accepted / rejected → ya fue enviada
 * Devuelve `null` si está editable y debe mostrarse el formulario.
 */
export function ApplicationStatusGate({ appId, status }: ApplicationStatusGateProps) {
  if (status === "pending_payment") {
    return (
      <ApplyShell narrow>
        <Journey current={1} />
        <div className="fdm-ap-head">
          <span className="fdm-st-eyebrow">Paso 2 de 4</span>
          <h1 className="fdm-st-h1">Falta el pago de inscripción</h1>
          <p className="fdm-st-lead">Tu cuenta ya está creada. Cuando pagues la inscripción se abre el formulario para subir tu proyecto y tus obras.</p>
        </div>
        <Link href={`/convocatoria/pagar?appId=${appId}`} className="fdm-st-btn is-green is-lg">
          Ir a pagar la inscripción
          <Ico name="arrow" />
        </Link>
      </ApplyShell>
    );
  }

  if (status === "submitted" || status === "under_review" || status === "accepted" || status === "rejected") {
    return (
      <ApplyShell narrow>
        <Journey current={3} />
        <div className="fdm-ap-head">
          <span className="fdm-st-eyebrow">Postulación enviada</span>
          <h1 className="fdm-st-h1">Ya recibimos tu postulación</h1>
          <p className="fdm-st-lead">Quedó en manos del jurado y ya no se puede cambiar. Puedes seguir en qué va desde «Mi postulación».</p>
        </div>
        <Link href="/convocatoria/mi-solicitud" className="fdm-st-btn is-solid is-lg">Ver mi postulación</Link>
      </ApplyShell>
    );
  }

  return null;
}
