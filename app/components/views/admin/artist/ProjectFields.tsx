"use client";

import { BODY, EYEBROW, fieldHint, fieldInput, fieldLabel, mix } from "./studioTheme";

/* Paso 2: el proyecto con el que el artista expone.
   Campos controlados desde el estudio, porque el botón de guardar vive en la
   barra de abajo junto al resto de las acciones del paso. */

export const MAX_PROJECT_WORDS = 250;
export const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function ProjectFields({
  title,
  review,
  onTitle,
  onReview,
  readOnly,
  loading,
}: {
  title: string;
  review: string;
  onTitle: (v: string) => void;
  onReview: (v: string) => void;
  readOnly?: boolean;
  loading?: boolean;
}) {
  const words = countWords(review);
  const tooLong = words > MAX_PROJECT_WORDS;

  if (loading) {
    return (
      <div style={{ display: "grid", gap: 16, maxWidth: 760 }}>
        <div className="fdm-skel" style={{ width: 120, height: 10 }} />
        <div className="fdm-skel" style={{ width: "min(360px,70%)", height: 26 }} />
        <div className="fdm-skel" style={{ width: "100%", height: 150 }} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "clamp(22px,2.8vw,32px)", maxWidth: 760 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <span style={{ ...EYEBROW, color: "var(--acc)" }}>Paso 2 de 3</span>
        <h2
          style={{
            margin: 0,
            fontWeight: 300,
            fontSize: "clamp(23px,2.8vw,34px)",
            lineHeight: 1.05,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          Tu proyecto
        </h2>
        <p style={{ ...BODY, maxWidth: "54ch" }}>
          Con qué participas en la feria. Las obras que cargaste son las piezas de
          este proyecto, y esto es lo que lee quien se para enfrente.
        </p>
      </div>

      <div>
        <label htmlFor="project-title" style={fieldLabel}>
          Título del proyecto
        </label>
        <input
          id="project-title"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Nombre del proyecto o serie"
          maxLength={160}
          disabled={readOnly}
          style={{ ...fieldInput, opacity: readOnly ? 0.55 : 1 }}
        />
      </div>

      <div>
        <label htmlFor="project-review" style={fieldLabel}>
          Descripción del proyecto
        </label>
        <textarea
          id="project-review"
          value={review}
          onChange={(e) => onReview(e.target.value)}
          placeholder="De qué trata, qué lo une, qué quieres que vea quien se pare enfrente…"
          rows={8}
          disabled={readOnly}
          aria-describedby="project-words"
          style={{ ...fieldInput, opacity: readOnly ? 0.55 : 1 }}
        />
        <p
          id="project-words"
          aria-live="polite"
          style={{ ...fieldHint, color: tooLong ? "#B4472A" : mix(50) }}
        >
          {words} de {MAX_PROJECT_WORDS} palabras
          {tooLong ? " · te pasaste, recorta antes de guardar" : ""}
        </p>
      </div>
    </div>
  );
}
