"use client";
import { type ArtworkImageEntry } from "@services/applications.service";

interface ApplicationStepReviewProps {
  bio: string;
  cvUrl: string;
  profilePhotoUrl: string;
  projectReview: string;
  artworkImages: ArtworkImageEntry[];
  detailImageUrl: string;
  montageImageUrl: string;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isSaving: boolean;
}

export function ApplicationStepReview({
  bio,
  cvUrl,
  profilePhotoUrl,
  projectReview,
  artworkImages,
  detailImageUrl,
  montageImageUrl,
  onBack,
  onSubmit,
  isSubmitting,
  isSaving
}: ApplicationStepReviewProps) {
  const canSubmit = !isSubmitting && !isSaving && artworkImages.length > 0 && projectReview;

  return (
    <div className="app-section">
      <h2 className="app-section__title">✅ Confirmar y enviar</h2>
      <p className="app-section__desc">
        Revisa tu postulación antes de enviarla. <strong>Una vez enviada no podrás editarla.</strong>
      </p>

      <div className="app-summary">
        <div className="app-summary__row"><span>Obras cargadas:</span> <strong>{artworkImages.length} / 15</strong></div>
        <div className="app-summary__row"><span>Biografía:</span> <strong>{bio ? `${bio.length} chars` : "⚠️ Pendiente"}</strong></div>
        <div className="app-summary__row"><span>CV:</span> <strong>{cvUrl ? "✅ Cargado" : "⚠️ Pendiente"}</strong></div>
        <div className="app-summary__row"><span>Foto de perfil:</span> <strong>{profilePhotoUrl ? "✅ Cargada" : "⚠️ Pendiente"}</strong></div>
        <div className="app-summary__row"><span>Reseña proyecto:</span> <strong>{projectReview ? `${projectReview.length} chars` : "⚠️ Pendiente"}</strong></div>
        <div className="app-summary__row"><span>Imagen de detalle:</span> <strong>{detailImageUrl ? "✅" : "No cargada"}</strong></div>
        <div className="app-summary__row"><span>Plano de montaje:</span> <strong>{montageImageUrl ? "✅" : "No cargado"}</strong></div>
      </div>

      <div className="app-notice">
        ⚠️ Una vez enviada tu postulación no podrás realizar ningún cambio o edición. Con la participación autorizas el tratamiento de tus datos personales.
      </div>

      <div className="app-actions">
        <button className="app-btn-secondary" onClick={onBack}>← Revisar</button>
        <button
          className="app-btn-submit"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {isSubmitting || isSaving ? "Enviando…" : "Enviar postulación definitivamente →"}
        </button>
      </div>
    </div>
  );
}
