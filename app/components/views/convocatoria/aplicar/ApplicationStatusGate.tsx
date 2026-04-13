"use client";
import Link from "next/link";
import styles from "./aplicar.module.css";

interface ApplicationStatusGateProps {
  appId: string;
  status?: string;
}

/**
 * Renders a gate screen when the application is not in an editable state.
 * - pending_payment → redirect to payment page
 * - submitted / under_review / accepted / rejected → "already submitted" card
 *
 * Returns `null` when the app is in an editable state and the form should render.
 */
export function ApplicationStatusGate({ appId, status }: ApplicationStatusGateProps) {
  // Pending payment
  if (status === "pending_payment") {
    return (
      <div className={styles.wrapper}>
        <div className={styles.gateCenter}>
          <div className={styles.gateCard}>
            <span className={styles.gateIcon}>💳</span>
            <h2>Pago pendiente</h2>
            <p>
              Para acceder al formulario de postulación debes completar el pago de
              inscripción ($40,000 COP).
            </p>
            <Link
              href={`/convocatoria/pagar?appId=${appId}`}
              className="app-btn-primary"
              style={{ display: "inline-block", marginTop: 16 }}
            >
              Ir al pago &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Already submitted
  if (
    status === "submitted" ||
    status === "under_review" ||
    status === "accepted" ||
    status === "rejected"
  ) {
    const icon =
      status === "accepted" ? "🎉" : status === "rejected" ? "📋" : "✅";

    return (
      <div className={styles.wrapper}>
        <div className={styles.gateCenter}>
          <div className={styles.gateCard}>
            <span className={styles.gateIcon}>{icon}</span>
            <h2>Postulación enviada</h2>
            <p>
              Tu postulación ya fue enviada y no puede modificarse. Puedes ver su
              estado en tu panel de artista.
            </p>
            <Link href="/convocatoria/mi-solicitud" className="app-btn-primary">
              Ver mi solicitud
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Editable — return null so the caller knows to render the wizard
  return null;
}
