"use client";
import { ConvocatoriaPicker } from "@components/views/convocatoria/ConvocatoriaPicker";
import { ApplicationStepProfile } from "@components/views/convocatoria/ApplicationStepProfile";
import { ApplicationStepProject } from "@components/views/convocatoria/ApplicationStepProject";
import { ApplicationStepImages } from "@components/views/convocatoria/ApplicationStepImages";
import { ApplicationStepReview } from "@components/views/convocatoria/ApplicationStepReview";
import { Bone } from "@components/views/admin/artist/ui";
import { ApplicationStatusGate } from "./ApplicationStatusGate";
import { useApplicationWizard } from "./useApplicationWizard";
import { Alert, ApplyShell, Journey } from "../applyUi";

/* Formulario de la postulación (paso 3 del camino: "Sube tu proyecto").
   Cuatro pantallas cortas —Tu perfil, Tu proyecto, Tus obras, Revisar y
   enviar— con la acción siempre en la barra de abajo. Cada "Guardar y seguir"
   guarda en el servidor, así que se puede salir y volver sin perder nada.
   Toda la lógica vive en useApplicationWizard. */

const STEPS = [
  { n: 1, label: "Tu perfil", title: "Cuéntanos quién eres" },
  { n: 2, label: "Tu proyecto", title: "Tu proyecto" },
  { n: 3, label: "Tus obras", title: "Tus obras" },
  { n: 4, label: "Revisar y enviar", title: "Revisa y envía" },
] as const;

export default function AplicarPageClient() {
  const wiz = useApplicationWizard();

  if (wiz.isLoading) {
    return (
      <ApplyShell>
        <Bone h={56} style={{ borderRadius: 12 }} />
        <Bone w="60%" h={40} />
        <Bone h={220} style={{ borderRadius: 16 }} />
        <Bone h={220} style={{ borderRadius: 16 }} />
      </ApplyShell>
    );
  }

  if (wiz.loadError) {
    const status = (wiz.loadError as any)?.response?.status;
    if (status === 401) {
      // Sin sesión: al login, conservando la intención de postular.
      if (typeof window !== "undefined") {
        const currentUrl = window.location.pathname + window.location.search;
        window.location.href = `/login?role=artist&redirect=${encodeURIComponent(currentUrl)}`;
      }
      return null;
    }
    return (
      <ApplyShell narrow center>
        <Alert tone="bad" title="No pudimos cargar tu postulación">
          Revisa tu conexión y vuelve a intentar. Lo que ya guardaste sigue a salvo.
        </Alert>
        <button type="button" className="fdm-st-btn is-solid fdm-studio-plain" onClick={() => window.location.reload()}>Volver a intentar</button>
      </ApplyShell>
    );
  }

  // Sin postulación todavía → elegir convocatoria.
  if (!wiz.appDoc) {
    return <ConvocatoriaPicker onCreated={(doc: any) => wiz.router.push(`/convocatoria/pagar?appId=${doc._id}`)} />;
  }

  const docStatus = (wiz.appDoc as { status?: string }).status;

  if (!wiz.appDoc.isPaid || docStatus === "pending_payment") {
    return <ApplicationStatusGate appId={wiz.appDoc._id} status="pending_payment" />;
  }
  if (docStatus && ["submitted", "under_review", "accepted", "rejected"].includes(docStatus)) {
    return <ApplicationStatusGate appId={wiz.appDoc._id} status={docStatus} />;
  }

  const isRevision = docStatus === "revision_requested";
  const revisionNotes = (wiz.appDoc as any).revisionNotes as string | undefined;
  const step = Math.min(4, Math.max(1, wiz.step || 1));
  const meta = STEPS[step - 1];
  const goTo = (n: number) => {
    wiz.setStep(n as any);
    window.scrollTo(0, 0);
  };
  // Cambiar de pantalla sube al inicio: en celular se quedaba a media página.
  const next = (n: 2 | 3 | 4) => async () => {
    await wiz.handleSave(n);
    window.scrollTo(0, 0);
  };

  return (
    <ApplyShell>
      <Journey current={2} />

      <div className="fdm-ap-head">
        <span className="fdm-st-eyebrow">Sube tu proyecto · parte {step} de 4</span>
        <h1 className="fdm-st-h1">{meta.title}</h1>
        <p className="fdm-st-lead">Ve a tu ritmo: cada vez que tocas «Guardar y seguir» queda guardado, y puedes volver después.</p>
      </div>

      {/* Las partes ya pasadas se pueden volver a abrir tocándolas. */}
      <div className="fdm-ap-steps" role="group" aria-label="Partes del formulario">
        {STEPS.map((s) => (
          <button
            key={s.n}
            type="button"
            className={`fdm-studio-plain ${s.n < step ? "is-done" : s.n === step ? "is-on" : ""}`}
            disabled={s.n >= step}
            aria-current={s.n === step ? "step" : undefined}
            onClick={() => goTo(s.n)}
          >
            <i />
            <span>{s.n}. {s.label}</span>
          </button>
        ))}
      </div>

      {isRevision && (
        <Alert tone="warn" title="El jurado te pide corregir tu postulación">
          {revisionNotes || "Haz los cambios que te indicaron y vuelve a enviarla para revisión."}
        </Alert>
      )}
      {wiz.error && <Alert tone="bad" title="No se pudo guardar">{wiz.error}</Alert>}
      {wiz.success && <Alert tone="ok">{wiz.success}</Alert>}

      {step === 1 && (
        <ApplicationStepProfile
          bio={wiz.bio}
          setBio={wiz.setBio}
          cvUrl={wiz.cvUrl}
          setCvUrl={wiz.setCvUrl}
          profilePhotoUrl={wiz.profilePhotoUrl}
          setProfilePhotoUrl={wiz.setProfilePhotoUrl}
          onNext={next(2)}
          isSaving={wiz.isSaving}
        />
      )}

      {step === 2 && (
        <ApplicationStepProject
          projectReview={wiz.projectReview}
          setProjectReview={wiz.setProjectReview}
          detailImageUrl={wiz.detailImageUrl}
          setDetailImageUrl={wiz.setDetailImageUrl}
          montageImageUrl={wiz.montageImageUrl}
          setMontageImageUrl={wiz.setMontageImageUrl}
          onBack={() => goTo(1)}
          onNext={next(3)}
          isSaving={wiz.isSaving}
        />
      )}

      {step === 3 && (
        <ApplicationStepImages
          artworkImages={wiz.artworkImages}
          techniques={wiz.techniques}
          onAddImage={wiz.addArtworkImage}
          onUpdateImage={wiz.updateImage}
          onRemoveImage={wiz.removeImage}
          onBack={() => goTo(2)}
          onNext={next(4)}
          isSaving={wiz.isSaving}
        />
      )}

      {step === 4 && (
        <ApplicationStepReview
          bio={wiz.bio}
          cvUrl={wiz.cvUrl}
          profilePhotoUrl={wiz.profilePhotoUrl}
          projectReview={wiz.projectReview}
          artworkImages={wiz.artworkImages}
          detailImageUrl={wiz.detailImageUrl}
          montageImageUrl={wiz.montageImageUrl}
          onBack={() => goTo(3)}
          onFix={goTo}
          onSubmit={wiz.handleSubmit}
          isSubmitting={wiz.isSubmitting}
          isSaving={wiz.isSaving}
        />
      )}
    </ApplyShell>
  );
}
