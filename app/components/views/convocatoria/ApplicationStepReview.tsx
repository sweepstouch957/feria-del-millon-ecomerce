"use client";
import { type ArtworkImageEntry } from "@services/applications.service";
import { Alert, Dot } from "./applyUi";

interface ApplicationStepReviewProps {
  bio: string;
  cvUrl: string;
  profilePhotoUrl: string;
  projectReview: string;
  artworkImages: ArtworkImageEntry[];
  detailImageUrl: string;
  montageImageUrl: string;
  onBack: () => void;
  /** Vuelve al paso que tiene ese dato (1 perfil · 2 proyecto · 3 obras). */
  onFix?: (step: 1 | 2 | 3) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isSaving: boolean;
}

/** Paso 4: una lista con chulos de lo que va en la postulación, y enviar. */
export function ApplicationStepReview({ bio, cvUrl, profilePhotoUrl, projectReview, artworkImages, detailImageUrl, montageImageUrl, onBack, onFix, onSubmit, isSubmitting, isSaving }: ApplicationStepReviewProps) {
  const rows: { label: string; note: string; ok: boolean; step: 1 | 2 | 3; optional?: boolean }[] = [
    { label: "Foto de perfil", note: profilePhotoUrl ? "Cargada" : "Falta subirla", ok: !!profilePhotoUrl, step: 1 },
    { label: "Presentación", note: bio.trim() ? "Escrita" : "Falta escribirla", ok: !!bio.trim(), step: 1 },
    { label: "Hoja de vida", note: cvUrl ? "PDF cargado" : "Falta subir el PDF", ok: !!cvUrl, step: 1 },
    { label: "Reseña del proyecto", note: projectReview.trim() ? "Escrita" : "Falta escribirla", ok: !!projectReview.trim(), step: 2 },
    { label: "Obras", note: artworkImages.length ? `${artworkImages.length} ${artworkImages.length === 1 ? "obra" : "obras"}` : "Agrega al menos una", ok: artworkImages.length > 0, step: 3 },
    { label: "Detalle de técnica", note: detailImageUrl ? "Cargado" : "Opcional, sin cargar", ok: !!detailImageUrl, step: 2, optional: true },
    { label: "Plano de montaje", note: montageImageUrl ? "Cargado" : "Opcional, sin cargar", ok: !!montageImageUrl, step: 2, optional: true },
  ];
  const pending = rows.filter((r) => !r.ok && !r.optional);
  const busy = isSubmitting || isSaving;
  const canSubmit = !busy && artworkImages.length > 0 && !!projectReview;

  return (
    <>
      <section className="fdm-st-card fdm-ap-sec">
        <div className="hd">
          <h2 className="fdm-st-h3">Revisa antes de enviar</h2>
          <span className="fdm-ap-help">Esto es lo que va a recibir el jurado.</span>
        </div>
        <div className="fdm-ap-list">
          {rows.map((r) => (
            <div key={r.label}>
              <Dot on={r.ok} size="xs" />
              <span className="k">
                {r.label}
                <small style={!r.ok && !r.optional ? { color: "var(--bad)" } : undefined}>{r.note}</small>
              </span>
              {onFix && <button type="button" className="fdm-st-link is-mute fdm-studio-plain" onClick={() => onFix(r.step)}>{r.ok ? "Cambiar" : r.optional ? "Agregar" : "Completar"}</button>}
            </div>
          ))}
        </div>
        {artworkImages.some((a) => a.url) && (
          <div className="fdm-ap-thumbs">
            {artworkImages.filter((a) => a.url).map((a, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <span key={i} title={a.title}><img src={a.url} alt={a.title || ""} /></span>
            ))}
          </div>
        )}
      </section>

      <Alert tone="warn" title="Después de enviar ya no podrás cambiarla">
        Revisa con calma: una vez enviada, tu postulación queda en manos del jurado. Al participar autorizas el tratamiento de tus datos personales.
      </Alert>

      <div className="fdm-st-bar">
        <span className="st">{pending.length ? <>Te falta <b>{pending.map((p) => p.label.toLowerCase()).join(", ")}</b></> : <b>Todo listo para enviar</b>}</span>
        <div className="acts">
          <button type="button" className="fdm-st-btn fdm-studio-plain" onClick={onBack}>Atrás</button>
          <button type="button" className="fdm-st-btn is-green is-main fdm-studio-plain" disabled={!canSubmit} onClick={onSubmit}>
            {busy ? "Enviando…" : "Enviar mi postulación"}
          </button>
        </div>
      </div>
    </>
  );
}
