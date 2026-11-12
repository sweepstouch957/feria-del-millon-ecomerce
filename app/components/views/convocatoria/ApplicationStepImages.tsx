"use client";
import { ImageUpload } from "@components/ui/FileUpload";
import { type ArtworkImageEntry } from "@services/applications.service";
import { useEdition } from "@provider/editionProvider";
import { Dot, Ico } from "./applyUi";

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
const cop = (n: number) => "$ " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Paso 3 de la postulación: las obras del proyecto, una tarjeta por obra. */
export function ApplicationStepImages({ artworkImages, techniques, onAddImage, onUpdateImage, onRemoveImage, onBack, onNext, isSaving }: ApplicationStepImagesProps) {
  // Requisitos configurables por convocatoria, con valores por defecto.
  const { convocatoria } = useEdition();
  const req = convocatoria?.requirements || {};
  const PRICE_MIN = req.priceMin ?? 800_000;
  const PRICE_MAX = req.priceMax ?? 2_350_000;
  const MAX_IMAGES = req.maxImages ?? 15;
  const allowedIds = convocatoria?.allowedTechniqueIds || [];
  const allowedTechniques = allowedIds.length ? techniques.filter((t: any) => allowedIds.includes(String(t.id || t._id))) : techniques;
  const priceLabel = `entre ${cop(PRICE_MIN)} y ${cop(PRICE_MAX)}`;
  const priceValid = (p?: number) => p !== undefined && p >= PRICE_MIN && p <= PRICE_MAX;
  const artworkComplete = (img: ArtworkImageEntry) => !!img.url && !!img.title && priceValid(img.price);

  const validCount = artworkImages.filter(artworkComplete).length;
  const allValid = artworkImages.length > 0 && validCount === artworkImages.length;
  const canAdvance = !isSaving && allValid;

  return (
    <>
      <section className="fdm-ap-sec">
        <div className="hd">
          <h2 className="fdm-st-h3">Las obras de tu proyecto</h2>
          <span className="fdm-ap-help">
            Agrega hasta {MAX_IMAGES} obras. Cada una necesita <b style={{ fontWeight: 500, color: "var(--fg)" }}>foto, título y precio</b> ({priceLabel}). Técnica, medidas y año son opcionales, pero ayudan al jurado.
          </span>
        </div>

        {artworkImages.map((img, i) => {
          const ok = artworkComplete(img);
          const lacks = [!img.url && "la foto", !img.title && "el título", !priceValid(img.price) && "el precio"].filter(Boolean) as string[];
          return (
            <article key={i} className="fdm-ap-work">
              <div className="top">
                <span className="t">
                  <Dot on={ok} size="xs" />
                  {img.title || `Obra ${i + 1}`}
                </span>
                <button type="button" className="fdm-st-link is-mute fdm-studio-plain" onClick={() => onRemoveImage(i)}>Quitar</button>
              </div>
              <div className="bd">
                <ImageUpload
                  label="Foto de la obra"
                  value={img.url}
                  onChange={(url) => onUpdateImage(i, "url", url)}
                  folder="convocatoria/artworks"
                  hint="De frente, con luz pareja, la obra completa y sin reflejos."
                />

                <div className="fdm-ap-grid">
                  <div className="fdm-ap-field">
                    <label htmlFor={`ap-t-${i}`}>Título</label>
                    <input id={`ap-t-${i}`} value={img.title} onChange={(e) => onUpdateImage(i, "title", e.target.value)} placeholder="Como quieres que aparezca" />
                  </div>
                  <div className="fdm-ap-field">
                    <label htmlFor={`ap-p-${i}`}>Precio (COP)</label>
                    <input
                      id={`ap-p-${i}`}
                      type="number"
                      inputMode="numeric"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={10_000}
                      value={img.price || ""}
                      onChange={(e) => onUpdateImage(i, "price", Number(e.target.value))}
                      placeholder="0"
                      aria-invalid={(!!img.price && !priceValid(img.price)) || undefined}
                    />
                    {img.price ? (
                      priceValid(img.price) ? (
                        <span className="fdm-ap-help is-ok">{cop(img.price)}</span>
                      ) : (
                        <span className="fdm-ap-help is-bad">Debe estar {priceLabel}.</span>
                      )
                    ) : (
                      <span className="fdm-ap-help">Debe estar {priceLabel}.</span>
                    )}
                  </div>
                </div>

                <div className="fdm-ap-grid">
                  <div className="fdm-ap-field">
                    <label htmlFor={`ap-k-${i}`}>Técnica <small>opcional</small></label>
                    <select id={`ap-k-${i}`} value={img.technique || ""} onChange={(e) => onUpdateImage(i, "technique", e.target.value)}>
                      <option value="">Elige una opción</option>
                      {allowedTechniques.map((t: any) => <option key={t.id || t._id} value={t.name}>{t.name}</option>)}
                      <option value="Otra">Otra</option>
                    </select>
                  </div>
                  <div className="fdm-ap-field">
                    <label htmlFor={`ap-d-${i}`}>Medidas en cm <small>opcional</small></label>
                    <input id={`ap-d-${i}`} value={img.dimensions || ""} onChange={(e) => onUpdateImage(i, "dimensions", e.target.value)} placeholder="Alto × ancho, por ejemplo 120 × 80" />
                  </div>
                  <div className="fdm-ap-field">
                    <label htmlFor={`ap-y-${i}`}>Año <small>opcional</small></label>
                    <input id={`ap-y-${i}`} type="number" inputMode="numeric" min={1900} max={CURRENT_YEAR} value={img.year || ""} onChange={(e) => onUpdateImage(i, "year", Number(e.target.value))} placeholder={String(CURRENT_YEAR)} />
                  </div>
                </div>

                {!ok && (img.url || img.title || img.price) ? <span className="fdm-ap-help is-bad">A esta obra le falta {lacks.join(", ")}.</span> : null}
              </div>
            </article>
          );
        })}

        {artworkImages.length < MAX_IMAGES ? (
          <button type="button" className="fdm-st-add fdm-studio-plain" style={artworkImages.length === 0 ? { minHeight: 140, flexDirection: "column" } : undefined} onClick={onAddImage}>
            <Ico name="plus" size={artworkImages.length === 0 ? 24 : 18} />
            {artworkImages.length === 0 ? <span style={{ fontSize: 18, fontWeight: 500 }}>Agregar mi primera obra</span> : "Agregar otra obra"}
          </button>
        ) : (
          <span className="fdm-ap-help" style={{ textAlign: "center" }}>Llegaste al máximo de {MAX_IMAGES} obras.</span>
        )}
      </section>

      <div className="fdm-st-bar">
        <span className="st">
          {artworkImages.length === 0 ? <>Agrega <b>al menos una obra</b></> : allValid ? <b>{validCount} {validCount === 1 ? "obra lista" : "obras listas"}</b> : <><b>{validCount} de {artworkImages.length}</b> obras completas</>}
        </span>
        <div className="acts">
          <button type="button" className="fdm-st-btn fdm-studio-plain" onClick={onBack}>Atrás</button>
          <button type="button" className="fdm-st-btn is-green is-main fdm-studio-plain" disabled={!canAdvance} onClick={onNext}>
            {isSaving ? "Guardando…" : "Guardar y revisar"}
          </button>
        </div>
      </div>
    </>
  );
}
