"use client";
import { ConvocatoriaPicker } from "@components/views/convocatoria/ConvocatoriaPicker";
import { ApplicationStepProfile } from "@components/views/convocatoria/ApplicationStepProfile";
import { ApplicationStepProject } from "@components/views/convocatoria/ApplicationStepProject";
import { ApplicationStepImages } from "@components/views/convocatoria/ApplicationStepImages";
import { ApplicationStepReview } from "@components/views/convocatoria/ApplicationStepReview";
import { ApplicationStepper } from "./ApplicationStepper";
import { ApplicationStatusGate } from "./ApplicationStatusGate";
import { useApplicationWizard } from "./useApplicationWizard";
import styles from "./aplicar.module.css";

const STEP_LABELS = [
  "Convocatoria",
  "Perfil artista",
  "Tu proyecto",
  "Imágenes / obras",
  "Confirmar y enviar",
];

/**
 * Main client-side wizard for the convocatoria application flow.
 * This component is purely presentational — all logic lives in useApplicationWizard.
 */
export default function AplicarPageClient() {
  const wiz = useApplicationWizard();

  // ── Loading ──────────────────────────────────────────────────────────
  if (wiz.isLoading) {
    return (
      <div className={styles.wrapper} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Cargando tu postulación…</p>
        </div>
      </div>
    );
  }

  // ── No application yet → picker ──────────────────────────────────────
  if (!wiz.appDoc) {
    return (
      <ConvocatoriaPicker
        onCreated={(doc: any) => {
          wiz.router.push(`/convocatoria/pagar?appId=${doc._id}`);
        }}
      />
    );
  }

  // ── Status gate (pending payment / already submitted) ────────────────
  const docStatus = (wiz.appDoc as { status?: string }).status;

  if (!wiz.appDoc.isPaid || docStatus === "pending_payment") {
    return (
      <ApplicationStatusGate appId={wiz.appDoc._id} status="pending_payment" />
    );
  }

  if (docStatus && ["submitted", "under_review", "accepted", "rejected"].includes(docStatus)) {
    return <ApplicationStatusGate appId={wiz.appDoc._id} status={docStatus} />;
  }

  // ── Wizard form ──────────────────────────────────────────────────────
  return (
    <div className={styles.wrapper}>
      <main className={styles.page}>
        <ApplicationStepper labels={STEP_LABELS} current={wiz.step} />

        <div className={styles.container}>
          {wiz.error && <div className={styles.error}>⚠️ {wiz.error}</div>}
          {wiz.success && <div className={styles.success}>✅ {wiz.success}</div>}

          {/* Step 0 should never show in the wizard once paid — auto-advances.
              If we land here briefly, show a transition state. */}
          {wiz.step === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#888" }}>
              <p>Preparando formulario…</p>
            </div>
          )}

          {wiz.step === 1 && (
            <ApplicationStepProfile
              bio={wiz.bio}
              setBio={wiz.setBio}
              cvUrl={wiz.cvUrl}
              setCvUrl={wiz.setCvUrl}
              profilePhotoUrl={wiz.profilePhotoUrl}
              setProfilePhotoUrl={wiz.setProfilePhotoUrl}
              onBack={undefined}
              onNext={() => wiz.handleSave(2)}
              isSaving={wiz.isSaving}
            />
          )}

          {wiz.step === 2 && (
            <ApplicationStepProject
              projectReview={wiz.projectReview}
              setProjectReview={wiz.setProjectReview}
              detailImageUrl={wiz.detailImageUrl}
              setDetailImageUrl={wiz.setDetailImageUrl}
              montageImageUrl={wiz.montageImageUrl}
              setMontageImageUrl={wiz.setMontageImageUrl}
              onBack={() => wiz.setStep(1)}
              onNext={() => wiz.handleSave(3)}
              isSaving={wiz.isSaving}
            />
          )}

          {wiz.step === 3 && (
            <ApplicationStepImages
              artworkImages={wiz.artworkImages}
              techniques={wiz.techniques}
              onAddImage={wiz.addArtworkImage}
              onUpdateImage={wiz.updateImage}
              onRemoveImage={wiz.removeImage}
              onBack={() => wiz.setStep(2)}
              onNext={() => wiz.handleSave(4)}
              isSaving={wiz.isSaving}
            />
          )}

          {wiz.step === 4 && (
            <ApplicationStepReview
              bio={wiz.bio}
              cvUrl={wiz.cvUrl}
              profilePhotoUrl={wiz.profilePhotoUrl}
              projectReview={wiz.projectReview}
              artworkImages={wiz.artworkImages}
              detailImageUrl={wiz.detailImageUrl}
              montageImageUrl={wiz.montageImageUrl}
              onBack={() => wiz.setStep(3)}
              onSubmit={wiz.handleSubmit}
              isSubmitting={wiz.isSubmitting}
              isSaving={wiz.isSaving}
            />
          )}
        </div>
      </main>
    </div>
  );
}
