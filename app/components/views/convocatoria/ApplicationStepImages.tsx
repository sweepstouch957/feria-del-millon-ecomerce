"use client";
import { ImageUpload } from "@components/ui/FileUpload";
import { type ArtworkImageEntry } from "@services/applications.service";

interface ApplicationStepImagesProps {
  artworkImages: ArtworkImageEntry[];
  techniques: any[];
  onAddImage: () => void;
  onUpdateImage: (i: number, field: keyof ArtworkImageEntry, value: string | number) => void;
  onRemoveImage: (i: number) => void;
  onBack: () => void;
  onNext: () => void;
  isSaving: boolean;
}

export function ApplicationStepImages({
  artworkImages,
  techniques,
  onAddImage,
  onUpdateImage,
  onRemoveImage,
  onBack,
  onNext,
  isSaving
}: ApplicationStepImagesProps) {
  return (
    <div className="app-section">
      <h2 className="app-section__title">🖼️ Imágenes del proyecto</h2>
      <p className="app-section__desc">
        Agrega hasta <strong>15 imágenes</strong> de tus obras. Cada imagen debe incluir su ficha técnica.
      </p>

      <div className="app-images-list">
        {artworkImages.map((img, i) => (
          <div key={i} className="app-image-entry">
            <div className="app-image-entry__header">
              <span>Obra #{i + 1}</span>
              <button className="app-image-remove" onClick={() => onRemoveImage(i)}>✕ Quitar</button>
            </div>
            
            <div className="app-field" style={{ marginBottom: 16 }}>
              <ImageUpload
                label="Imagen de la obra *"
                value={img.url}
                onChange={(url) => onUpdateImage(i, "url", url)}
                folder="convocatoria/artworks"
                hint="JPG o PNG · Máx. 5MB. La imagen debe mostrar la obra completa con buena iluminación."
              />
            </div>

            <div className="app-image-grid">
              <div className="app-field">
                <label>Título de la obra *</label>
                <input 
                  value={img.title} 
                  onChange={(e) => onUpdateImage(i, "title", e.target.value)} 
                  placeholder="Nombre de la obra" 
                />
              </div>
              <div className="app-field">
                <label>Técnica utilizada</label>
                <select
                  value={img.technique || ""}
                  onChange={(e) => onUpdateImage(i, "technique", e.target.value)}
                >
                  <option value="">Selecciona una técnica…</option>
                  {techniques.map((t) => (
                    <option key={t.id || t._id} value={t.name}>{t.name}</option>
                  ))}
                  <option value="Otra">Otra</option>
                </select>
              </div>
              <div className="app-field">
                <label>Dimensiones (cm)</label>
                <input 
                  value={img.dimensions || ""} 
                  onChange={(e) => onUpdateImage(i, "dimensions", e.target.value)} 
                  placeholder="100 x 80 x 5 cm" 
                />
              </div>
              <div className="app-field">
                <label>Año de ejecución</label>
                <input 
                  type="number" 
                  value={img.year || ""} 
                  onChange={(e) => onUpdateImage(i, "year", Number(e.target.value))} 
                  placeholder="2024" 
                />
              </div>
              <div className="app-field">
                <label>Precio (COP)</label>
                <input 
                  type="number" 
                  value={img.price || ""} 
                  onChange={(e) => onUpdateImage(i, "price", Number(e.target.value))} 
                  placeholder="1000000" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {artworkImages.length < 15 && (
        <button className="app-btn-add" onClick={onAddImage}>
          + Agregar imagen de obra
        </button>
      )}

      <div className="app-actions">
        <button className="app-btn-secondary" onClick={onBack}>← Atrás</button>
        <button 
          className="app-btn-primary" 
          disabled={isSaving || artworkImages.length === 0} 
          onClick={onNext}
        >
          {isSaving ? "Guardando…" : "Guardar y revisar →"}
        </button>
      </div>
    </div>
  );
}
