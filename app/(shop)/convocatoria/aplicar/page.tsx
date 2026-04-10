"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTechniques } from "@services/techniques.service";
import {
  getMyApplications,
  updateApplication,
  submitApplication,
  initiatePayment,
  createApplication,
  type ArtworkImageEntry,
  type ArtistApplication
} from "@services/applications.service";
import { ConvocatoriaPicker } from "@components/views/convocatoria/ConvocatoriaPicker";
import { ApplicationStepProfile } from "@components/views/convocatoria/ApplicationStepProfile";
import { ApplicationStepProject } from "@components/views/convocatoria/ApplicationStepProject";
import { ApplicationStepImages } from "@components/views/convocatoria/ApplicationStepImages";
import { ApplicationStepReview } from "@components/views/convocatoria/ApplicationStepReview";

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_LABELS = [
  "Convocatoria",
  "Perfil artista",
  "Tu proyecto",
  "Imágenes / obras",
  "Confirmar y enviar",
];

export default function ConvocatoriaAplicarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appId = searchParams.get("appId");
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>(0);
  const [appDoc, setAppDoc] = useState<ArtistApplication | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [bio, setBio] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [projectReview, setProjectReview] = useState("");
  const [artworkImages, setArtworkImages] = useState<ArtworkImageEntry[]>([]);
  const [detailImageUrl, setDetailImageUrl] = useState("");
  const [montageImageUrl, setMontageImageUrl] = useState("");

  const { data: apps, isLoading } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });

  const { data: techniques = [] } = useQuery({
    queryKey: ["techniques"],
    queryFn: listTechniques,
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (!apps) return;
    let current = appId ? apps.find((a) => a._id === appId) : apps[0];
    
    if (!current) return;

    setAppDoc(current as ArtistApplication);
    // Populate form
    setBio(current.bio || "");
    setCvUrl(current.cvUrl || "");
    setProfilePhotoUrl(current.profilePhotoUrl || "");
    setProjectReview(current.projectReview || "");
    setArtworkImages(current.artworkImages || []);
    setDetailImageUrl(current.detailImageUrl || "");
    setMontageImageUrl(current.montageImageUrl || "");

    // Only set step if paid (otherwise UI shows pagar gate)
    if (current.isPaid) {
      if (current.bio || current.cvUrl) setStep(2);
      else setStep(1);
    }
  }, [apps, appId, router]);

  const updateMutation = useMutation({
    mutationFn: (variables: { id: string, payload: Partial<ArtistApplication> }) => updateApplication(variables.id, variables.payload),
    onSuccess: (updated) => {
      setAppDoc(updated as unknown as ArtistApplication);
      queryClient.invalidateQueries({ queryKey: ["my-applications"]});
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error || e?.message || "Error al guardar");
    }
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => submitApplication(id),
    onSuccess: () => {
      setSuccess("¡Tu postulación fue enviada exitosamente! Recibirás un email de confirmación.");
      queryClient.invalidateQueries({ queryKey: ["my-applications"]});
      router.push("/convocatoria/mi-solicitud");
    },
    onError: (e: any) => {
      setError(e?.response?.data?.error || e?.message || "Error al enviar");
    }
  });

  const handleSave = async (nextStep: Step) => {
    if (!appDoc) return;
    setError("");
    await updateMutation.mutateAsync({
      id: appDoc._id,
      payload: { bio, cvUrl, profilePhotoUrl, projectReview, artworkImages, detailImageUrl, montageImageUrl }
    });
    setStep(nextStep);
  };

  const handleSubmit = async () => {
    if (!appDoc) return;
    setError("");
    await updateMutation.mutateAsync({
      id: appDoc._id,
      payload: { bio, cvUrl, profilePhotoUrl, projectReview, artworkImages, detailImageUrl, montageImageUrl }
    });
    await submitMutation.mutateAsync(appDoc._id);
  };

  const addArtworkImage = () => {
    setArtworkImages((prev) => [
      ...prev,
      { url: "", title: "", technique: "", dimensions: "", year: undefined, price: undefined, role: "project" },
    ]);
  };

  const updateImage = (i: number, field: keyof ArtworkImageEntry, value: string | number) => {
    setArtworkImages((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const removeImage = (i: number) => {
    setArtworkImages((prev) => prev.filter((_, idx) => idx !== i));
  };

  if (isLoading) return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center">
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <p>Cargando tu postulación…</p>
      </div>
    </div>
  );

  // Step 0: picker (no hay aplicación todavía)
  if (!appDoc) return <ConvocatoriaPicker onCreated={(doc: any) => {
    // After creating application, redirect to pagar (status: pending_payment)
    router.push(`/convocatoria/pagar?appId=${doc._id}`);
  }} />;

  const docStatus = (appDoc as { status?: string }).status;

  // Pago pendiente → redirige a pagar (no debe ver el formulario)
  if (!appDoc.isPaid || docStatus === "pending_payment") {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="app-submitted">
          <div className="app-submitted__card">
            <span className="app-submitted__icon">💳</span>
            <h2>Pago pendiente</h2>
            <p>Para acceder al formulario de postulación debes completar el pago de inscripción ($40,000 COP).</p>
            <Link href={`/convocatoria/pagar?appId=${appDoc._id}`} className="app-btn-primary" style={{ display: "inline-block", marginTop: 16 }}>
              Ir al pago &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (docStatus === "submitted" || docStatus === "under_review" || docStatus === "accepted" || docStatus === "rejected") {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="app-submitted">
          <div className="app-submitted__card">
            <span className="app-submitted__icon">{docStatus === "accepted" ? "🎉" : docStatus === "rejected" ? "📋" : "✅"}</span>
            <h2>Postulación enviada</h2>
            <p>Tu postulación ya fue enviada y no puede modificarse. Puedes ver su estado en tu panel de artista.</p>
            <Link href="/convocatoria/mi-solicitud" className="app-btn-primary">Ver mi solicitud</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-[#0a0a0a] text-white">
      <main className="app-page">
        {/* Progress stepper */}
      <div className="app-stepper">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className={`app-step ${i === step ? "active" : i < step ? "done" : ""}`}>
            <div className="app-step__dot">{i < step ? "✓" : i + 1}</div>
            <span className="app-step__label">{label}</span>
            {i < STEP_LABELS.length - 1 && <div className="app-step__connector" />}
          </div>
        ))}
      </div>

        <div className="app-container">
          {error && <div className="app-error">⚠️ {error}</div>}
          {success && <div className="app-success">✅ {success}</div>}

          {step === 1 && (
            <ApplicationStepProfile
              bio={bio} setBio={setBio}
              cvUrl={cvUrl} setCvUrl={setCvUrl}
              profilePhotoUrl={profilePhotoUrl} setProfilePhotoUrl={setProfilePhotoUrl}
              onBack={() => setStep(0)}
              onNext={() => handleSave(2)}
              isSaving={updateMutation.isPending}
            />
          )}

          {step === 2 && (
            <ApplicationStepProject
              projectReview={projectReview} setProjectReview={setProjectReview}
              detailImageUrl={detailImageUrl} setDetailImageUrl={setDetailImageUrl}
              montageImageUrl={montageImageUrl} setMontageImageUrl={setMontageImageUrl}
              onBack={() => setStep(1)}
              onNext={() => handleSave(3)}
              isSaving={updateMutation.isPending}
            />
          )}

          {step === 3 && (
            <ApplicationStepImages
              artworkImages={artworkImages}
              techniques={techniques}
              onAddImage={addArtworkImage}
              onUpdateImage={updateImage}
              onRemoveImage={removeImage}
              onBack={() => setStep(2)}
              onNext={() => handleSave(4)}
              isSaving={updateMutation.isPending}
            />
          )}

          {step === 4 && (
            <ApplicationStepReview
              bio={bio} cvUrl={cvUrl} profilePhotoUrl={profilePhotoUrl}
              projectReview={projectReview} artworkImages={artworkImages}
              detailImageUrl={detailImageUrl} montageImageUrl={montageImageUrl}
              onBack={() => setStep(3)}
              onSubmit={handleSubmit}
              isSubmitting={submitMutation.isPending}
              isSaving={updateMutation.isPending}
            />
          )}
        </div>

      <style jsx>{`
        .app-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px; color: #888; }
        .app-loading__spinner { width: 48px; height: 48px; border: 4px solid #222; border-top-color: #22c55e; border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .app-submitted { display: flex; align-items: center; justify-content: center; min-height: 70vh; }
        .app-submitted__card { background: #0a0a0a; border: 1px solid #222; border-radius: 20px; padding: 48px; text-align: center; max-width: 440px; box-shadow: 0 8px 32px rgba(255,255,255,0.02); }
        .app-submitted__icon { font-size: 56px; display: block; margin-bottom: 16px; }
        .app-submitted__card h2 { font-size: 24px; font-weight: 800; color: #fff; margin: 0 0 12px; }
        .app-submitted__card p { color: #888; font-size: 14px; margin: 0 0 24px; }

        .app-page { padding: 32px 16px 64px; font-family: 'Inter', sans-serif; color: #fff;}

        /* Stepper */
        .app-stepper { display: flex; align-items: center; justify-content: center; margin-bottom: 40px; flex-wrap: wrap; gap: 4px; }
        .app-step { display: flex; align-items: center; }
        .app-step__dot { width: 32px; height: 32px; border-radius: 50%; background: #111; border: 1px solid #333; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #555; flex-shrink: 0; }
        .app-step.active .app-step__dot { background: #fff; color: #000; border-color: #fff; }
        .app-step.done .app-step__dot { background: #222; color: #fff; border-color: #555; }
        .app-step__label { font-size: 12px; font-weight: 600; color: #666; margin-left: 6px; white-space: nowrap; }
        .app-step.active .app-step__label { color: #fff; }
        .app-step.done .app-step__label { color: #aaa; }
        .app-step__connector { width: 40px; height: 1px; background: #333; margin: 0 8px; }
        .app-step.done .app-step__connector { background: #666; }

        .app-container { max-width: 760px; margin: auto; }

        .app-error { background: rgba(220,38,38,0.1); border: 1px solid #ef4444; color: #ef4444; padding: 14px; border-radius: 12px; margin-bottom: 20px; font-size: 14px; }
        .app-success { background: rgba(22,163,74,0.1); border: 1px solid #22c55e; color: #4ade80; padding: 14px; border-radius: 12px; margin-bottom: 20px; font-size: 14px; }

        .app-section { background: #0a0a0a; border: 1px solid #222; border-radius: 20px; padding: 40px; box-shadow: 0 4px 20px rgba(255,255,255,0.02); }
        .app-section__title { font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 6px; }
        .app-section__desc { color: #888; font-size: 14px; margin: 0 0 28px; }

        .app-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
        .app-field label { font-size: 13px; font-weight: 700; color: #ccc; }
        .app-field input, .app-field select, .app-field textarea {
          border: 1.5px solid #333; border-radius: 10px; padding: 10px 14px;
          font-size: 14px; outline: none; transition: border-color .2s; font-family: inherit;
          background: #111; color: #fff;
        }
        .app-field input::placeholder, .app-field textarea::placeholder { color: #555; }
        .app-field input:focus, .app-field select:focus, .app-field textarea:focus { border-color: #fff; }
        .app-hint { font-size: 12px; color: #666; }
        .app-chars { font-size: 11px; color: #666; font-weight: 400; }

        /* Image entries */
        .app-images-list { display: flex; flex-direction: column; gap: 20px; margin-bottom: 20px; }
        .app-image-entry { border: 1.5px solid #222; border-radius: 14px; padding: 20px; background: #0d0d0d; }
        .app-image-entry__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-weight: 700; color: #fff; font-size: 14px; }
        .app-image-remove { background: rgba(220,38,38,0.1); border: 1px solid #ef4444; color: #ef4444; border-radius: 8px; padding: 4px 12px; cursor: pointer; font-size: 12px; }
        .app-image-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 560px) { .app-image-grid { grid-template-columns: 1fr; } }

        .app-btn-add {
          width: 100%; border: 2px dashed #444; background: transparent;
          color: #888; border-radius: 12px; padding: 14px; font-size: 14px;
          font-weight: 600; cursor: pointer; transition: all .2s; margin-bottom: 24px;
        }
        .app-btn-add:hover { border-color: #fff; color: #fff; background: rgba(255,255,255,0.05); }

        /* Summary */
        .app-summary { background: #111; border: 1px solid #222; border-radius: 14px; padding: 20px; margin-bottom: 20px; }
        .app-summary__row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #222; font-size: 14px; color: #ccc; }
        .app-summary__row:last-child { border-bottom: none; }
        .app-notice { background: rgba(255,255,255,0.05); border: 1px solid #444; color: #bbb; padding: 14px; border-radius: 12px; font-size: 13px; line-height: 1.6; margin-bottom: 24px; }

        .app-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
        .app-btn-primary {
          background: #fff; color: #000;
          border: none; border-radius: 10px; padding: 12px 24px; font-size: 15px;
          font-weight: 700; cursor: pointer; transition: all .2s;
        }
        .app-btn-primary:hover:not(:disabled) { transform: translateY(-1px); background: #eee; }
        .app-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .app-btn-secondary {
          background: #111; color: #ccc; border: 1px solid #333; border-radius: 10px;
          padding: 12px 24px; font-size: 15px; font-weight: 600; cursor: pointer;
        }
        .app-btn-secondary:hover { background: #222; color: #fff; }
        .app-btn-submit {
          background: #fff; color: #000;
          border: none; border-radius: 10px; padding: 12px 28px; font-size: 15px;
          font-weight: 700; cursor: pointer; transition: all .2s;
        }
        .app-btn-submit:hover:not(:disabled) { transform: translateY(-1px); background: #eee; }
        .app-btn-submit:disabled { opacity: 0.5; cursor: not-allowed; text-decoration: line-through; }
      `}</style>
      </main>
    </div>
  );
}


