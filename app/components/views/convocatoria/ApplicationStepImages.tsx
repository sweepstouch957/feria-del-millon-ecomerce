"use client";
import { ImageUpload } from "@components/ui/FileUpload";
import { type ArtworkImageEntry } from "@services/applications.service";
import { Check } from "lucide-react";

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

const CURRENT_YEAR = new Date().getFullYear();

function priceValid(p?: number) {
  return p !== undefined && p >= 800_000 && p <= 2_350_000;
}

function artworkComplete(img: ArtworkImageEntry) {
  return !!img.url && !!img.title && priceValid(img.price);
}

function formatCOP(n: number) {
  return `$${n.toLocaleString("es-CO")} COP`;
}

export function ApplicationStepImages({
  artworkImages,
  techniques,
  onAddImage,
  onUpdateImage,
  onRemoveImage,
  onBack,
  onNext,
  isSaving,
}: ApplicationStepImagesProps) {
  const validCount = artworkImages.filter(artworkComplete).length;
  const canAdvance =
    !isSaving &&
    artworkImages.length > 0 &&
    artworkImages.every(artworkComplete);

  return (
    <div className="app-section">
      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 className="app-section__title" style={{ marginBottom: 6 }}>
          Obras del proyecto
        </h2>
        <p className="app-section__desc" style={{ marginBottom: 12 }}>
          Agrega hasta <strong>15 obras</strong>. Cada una requiere imagen, título y precio.
          Los campos de técnica, dimensiones y año son opcionales pero recomendados.
        </p>

        {/* Progress pill */}
        {artworkImages.length > 0 && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: validCount === artworkImages.length
              ? "rgba(34,197,94,.1)" : "rgba(251,191,36,.08)",
            border: `1px solid ${validCount === artworkImages.length ? "rgba(34,197,94,.25)" : "rgba(251,191,36,.2)"}`,
            borderRadius: 100, padding: "5px 14px", fontSize: 12, fontWeight: 700,
            color: validCount === artworkImages.length ? "#4ade80" : "#fbbf24",
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: validCount === artworkImages.length ? "#4ade80" : "#fbbf24",
              display: "inline-block",
            }} />
            {validCount} de {artworkImages.length} {artworkImages.length === 1 ? "obra completa" : "obras completas"}
          </div>
        )}
      </div>

      {/* ── Artwork list ── */}
      <div className="app-images-list">
        {artworkImages.map((img, i) => {
          const ok = artworkComplete(img);
          return (
            <div key={i} className="app-image-entry" style={{
              borderColor: ok
                ? "rgba(34,197,94,.2)"
                : img.url || img.title ? "rgba(251,191,36,.2)" : undefined,
            }}>
              {/* Card header */}
              <div className="app-image-entry__header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: ok ? "rgba(34,197,94,.15)" : "rgba(255,255,255,.06)",
                    border: `1.5px solid ${ok ? "rgba(34,197,94,.4)" : "rgba(255,255,255,.12)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                    color: ok ? "#4ade80" : "rgba(255,255,255,.4)",
                    flexShrink: 0,
                  }}>
                    {ok ? <Check size={14} /> : i + 1}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {img.title || `Obra #${i + 1}`}
                  </span>
                </div>
                <button className="app-image-remove" onClick={() => onRemoveImage(i)}>
                  Quitar
                </button>
              </div>

              {/* Image upload */}
              <div className="app-field" style={{ marginBottom: 16 }}>
                <ImageUpload
                  label="Fotografía de la obra *"
                  value={img.url}
                  onChange={(url) => onUpdateImage(i, "url", url)}
                  folder="convocatoria/artworks"
                  hint="JPG o PNG · Máx. 5 MB · Fondo neutro, buena iluminación, obra completa"
                />
              </div>

              {/* Fields grid */}
              <div className="app-image-grid">

                {/* Title */}
                <div className="app-field">
                  <label>Título de la obra *</label>
                  <input
                    value={img.title}
                    onChange={(e) => onUpdateImage(i, "title", e.target.value)}
                    placeholder="Ej: Sin título #3"
                  />
                </div>

                {/* Technique */}
                <div className="app-field">
                  <label>Técnica</label>
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

                {/* Dimensions */}
                <div className="app-field">
                  <label>Dimensiones</label>
                  <input
                    value={img.dimensions || ""}
                    onChange={(e) => onUpdateImage(i, "dimensions", e.target.value)}
                    placeholder="Ej: 120 × 80 × 5"
                  />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4, display: "block" }}>
                    Alto × Ancho × Profundidad en cm
                  </span>
                </div>

                {/* Year */}
                <div className="app-field">
                  <label>Año de creación</label>
                  <input
                    type="number"
                    min={1900}
                    max={CURRENT_YEAR}
                    value={img.year || ""}
                    onChange={(e) => onUpdateImage(i, "year", Number(e.target.value))}
                    placeholder={String(CURRENT_YEAR)}
                  />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.3)", marginTop: 4, display: "block" }}>
                    Entre 1900 y {CURRENT_YEAR}
                  </span>
                </div>

                {/* Price — full width */}
                <div className="app-field" style={{ gridColumn: "1 / -1" }}>
                  <label>
                    Precio de venta *
                    <span style={{
                      marginLeft: 8, fontSize: 11, fontWeight: 600,
                      color: "rgba(255,255,255,.35)", fontFamily: "monospace",
                    }}>
                      $800.000 – $2.350.000 COP
                    </span>
                  </label>
                  <input
                    type="number"
                    min={800_000}
                    max={2_350_000}
                    step={10_000}
                    value={img.price || ""}
                    onChange={(e) => onUpdateImage(i, "price", Number(e.target.value))}
                    placeholder="Ej: 1500000"
                    style={img.price && !priceValid(img.price)
                      ? { borderColor: "rgba(239,68,68,.6)" } : {}}
                  />
                  {img.price ? (
                    priceValid(img.price)
                      ? (
                        <span style={{ fontSize: 12, color: "#4ade80", marginTop: 5, display: "block", fontWeight: 600 }}>
                          <Check size={14} style={{ verticalAlign: "-2px" }} /> {formatCOP(img.price)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#f87171", marginTop: 5, display: "block" }}>
                          Precio fuera del rango permitido ($800.000 – $2.350.000 COP)
                        </span>
                      )
                  ) : null}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add artwork button ── */}
      {artworkImages.length < 15 && (
        <button className="app-btn-add" onClick={onAddImage}>
          {artworkImages.length === 0 ? "+ Agregar primera obra" : "+ Agregar otra obra"}
        </button>
      )}

      {artworkImages.length === 15 && (
        <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.3)", marginTop: 8 }}>
          Límite alcanzado · 15 obras máximo
        </p>
      )}

      {/* ── Navigation ── */}
      <div className="app-actions">
        <button className="app-btn-secondary" onClick={onBack}>← Atrás</button>
        <button
          className="app-btn-primary"
          disabled={!canAdvance}
          onClick={onNext}
        >
          {isSaving ? "Guardando…" : "Guardar y revisar →"}
        </button>
      </div>
    </div>
  );
}
