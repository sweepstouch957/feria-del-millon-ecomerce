"use client";
import { type ArtworkImageEntry } from "@services/applications.service";
import { CheckCircle2, AlertTriangle } from "lucide-react";

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
      <h2 className="app-section__title"><CheckCircle2 size={18} style={{ verticalAlign: "-3px" }} /> Confirmar y enviar</h2>
      <p className="app-section__desc">
        Revisa tu postulación antes de enviarla. <strong>Una vez enviada no podrás editarla.</strong>
      </p>

      <div className="app-summary">
        <div className="app-summary__row"><span>Obras cargadas:</span> <strong>{artworkImages.length} / 15</strong></div>
        <div className="app-summary__row"><span>Biografía:</span> <strong>{bio ? `${bio.length} chars` : <><AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Pendiente</>}</strong></div>
        <div className="app-summary__row"><span>CV:</span> <strong>{cvUrl ? <><CheckCircle2 size={14} style={{ verticalAlign: "-2px" }} /> Cargado</> : <><AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Pendiente</>}</strong></div>
        <div className="app-summary__row"><span>Foto de perfil:</span> <strong>{profilePhotoUrl ? <><CheckCircle2 size={14} style={{ verticalAlign: "-2px" }} /> Cargada</> : <><AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Pendiente</>}</strong></div>
        <div className="app-summary__row"><span>Reseña proyecto:</span> <strong>{projectReview ? `${projectReview.length} chars` : <><AlertTriangle size={14} style={{ verticalAlign: "-2px" }} /> Pendiente</>}</strong></div>
        <div className="app-summary__row"><span>Imagen de detalle:</span> <strong>{detailImageUrl ? <CheckCircle2 size={14} style={{ verticalAlign: "-2px" }} /> : "No cargada"}</strong></div>
        <div className="app-summary__row"><span>Plano de montaje:</span> <strong>{montageImageUrl ? <CheckCircle2 size={14} style={{ verticalAlign: "-2px" }} /> : "No cargado"}</strong></div>
      </div>

      <div className="app-notice">
        <AlertTriangle size={16} style={{ verticalAlign: "-3px" }} /> Una vez enviada tu postulación no podrás realizar ningún cambio o edición. Con la participación autorizas el tratamiento de tus datos personales.
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
