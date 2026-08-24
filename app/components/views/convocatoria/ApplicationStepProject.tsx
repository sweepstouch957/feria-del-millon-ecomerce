"use client";
import { ImageUpload } from "@components/ui/FileUpload";
import { Palette } from "lucide-react";

interface ApplicationStepProjectProps {
  projectReview: string;
  setProjectReview: (val: string) => void;
  detailImageUrl: string;
  setDetailImageUrl: (val: string) => void;
  montageImageUrl: string;
  setMontageImageUrl: (val: string) => void;
  onBack: () => void;
  onNext: () => void;
  isSaving: boolean;
}

export function ApplicationStepProject({
  projectReview,
  setProjectReview,
  detailImageUrl,
  setDetailImageUrl,
  montageImageUrl,
  setMontageImageUrl,
  onBack,
  onNext,
  isSaving
}: ApplicationStepProjectProps) {
  return (
    <div className="app-section">
      <h2 className="app-section__title"><Palette size={18} style={{ verticalAlign: "-3px" }} /> Información del proyecto</h2>
      <p className="app-section__desc">Describe el proyecto artístico que presentarás en la feria.</p>

      <div className="app-field">
        <label>Reseña del proyecto * <span className="app-chars">{projectReview.length}/750</span></label>
        <textarea
          value={projectReview}
          onChange={(e) => setProjectReview(e.target.value)}
          maxLength={750}
          rows={7}
          placeholder="Descripción clara de la serie o grupo de obras que planea presentar. Incluya ejes temáticos, conceptuales y técnicos."
        />
        <span className="app-hint">Evite descripciones vagas. La reseña debe demostrar cómo las piezas se integran en un concepto único y coherente.</span>
      </div>

      <div className="app-field">
        <ImageUpload
          label="Imagen de detalle de proceso / técnica"
          value={detailImageUrl}
          onChange={setDetailImageUrl}
          folder="convocatoria/detail"
          hint="Muestra un aspecto relevante de la técnica o proceso de creación. Solo 1 imagen."
        />
      </div>

      <div className="app-field">
        <ImageUpload
          label="Plano de montaje"
          value={montageImageUrl}
          onChange={setMontageImageUrl}
          folder="convocatoria/montage"
          hint="Disposición de obras en espacio de 3.60m ancho × 2.44m alto. Dibujado a escala."
        />
      </div>

      <div className="app-actions">
        <button className="app-btn-secondary" onClick={onBack}>← Atrás</button>
        <button className="app-btn-primary" disabled={isSaving} onClick={onNext}>
          {isSaving ? "Guardando…" : "Guardar y continuar →"}
        </button>
      </div>
    </div>
  );
}
