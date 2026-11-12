"use client";
import { ImageUpload } from "@components/ui/FileUpload";

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

/** Paso 2 de la postulación: el proyecto que presenta. */
export function ApplicationStepProject({ projectReview, setProjectReview, detailImageUrl, setDetailImageUrl, montageImageUrl, setMontageImageUrl, onBack, onNext, isSaving }: ApplicationStepProjectProps) {
  return (
    <>
      <section className="fdm-st-card fdm-ap-sec">
        <div className="hd">
          <h2 className="fdm-st-h3">1. Cuéntanos tu proyecto</h2>
          <span className="fdm-ap-help">La serie o grupo de obras que quieres llevar a la feria: de qué trata, qué la une y cómo está hecha.</span>
        </div>
        <div className="fdm-ap-field">
          <label htmlFor="ap-review">Reseña del proyecto <small>{projectReview.length} de 750 letras</small></label>
          <textarea
            id="ap-review"
            value={projectReview}
            onChange={(e) => setProjectReview(e.target.value)}
            maxLength={750}
            rows={8}
            placeholder="Ejemplo: Una serie de seis pinturas al óleo sobre los mercados de mi barrio…"
          />
        </div>
        <span className="fdm-ap-tip">Sé concreto: el jurado quiere ver que tus piezas forman un solo conjunto con una idea clara.</span>
      </section>

      <section className="fdm-st-card fdm-ap-sec">
        <div className="hd">
          <h2 className="fdm-st-h3">2. Imágenes de apoyo <span style={{ fontWeight: 400, color: "var(--fg2)", fontSize: 15 }}>· opcional</span></h2>
          <span className="fdm-ap-help">Ayudan al jurado a entender cómo trabajas y cómo se vería tu espacio.</span>
        </div>
        <ImageUpload
          label="Detalle de tu técnica o proceso"
          value={detailImageUrl}
          onChange={setDetailImageUrl}
          folder="convocatoria/detail"
          hint="Una foto de cerca que muestre cómo está hecha la obra."
        />
        <ImageUpload
          label="Plano de montaje"
          value={montageImageUrl}
          onChange={setMontageImageUrl}
          folder="convocatoria/montage"
          hint="Un dibujo de cómo pondrías tus obras en una pared de 3,60 m de ancho por 2,44 m de alto."
        />
      </section>

      <div className="fdm-st-bar">
        <span className="st">{projectReview.trim() ? <b>Proyecto listo</b> : <>Te falta <b>la reseña del proyecto</b></>}</span>
        <div className="acts">
          <button type="button" className="fdm-st-btn fdm-studio-plain" onClick={onBack}>Atrás</button>
          <button type="button" className="fdm-st-btn is-green is-main fdm-studio-plain" disabled={isSaving} onClick={onNext}>
            {isSaving ? "Guardando…" : "Guardar y seguir"}
          </button>
        </div>
      </div>
    </>
  );
}
