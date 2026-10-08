"use client";

import { MAX_PROJECT_WORDS, countWords } from "@lib/artwork";
import { BODY, fieldInput, mix } from "./studioTheme";
import { Bone, Field } from "./ui";

/* Paso 2: el proyecto con el que el artista expone.
   Campos controlados desde el estudio, porque el botón de guardar vive en la
   barra de abajo junto al resto de las acciones del paso. */

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
        <Bone w={120} h={10} />
        <Bone w="min(360px,70%)" h={26} />
        <Bone h={150} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "clamp(22px,2.8vw,32px)", maxWidth: 760 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <h2
          style={{
            margin: 0,
            fontWeight: 300,
            fontSize: "clamp(26px,3.2vw,40px)",
            lineHeight: 1.03,
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

      <Field id="project-title" label="Título del proyecto">
        <input
          id="project-title"
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="Nombre del proyecto o serie"
          maxLength={160}
          disabled={readOnly}
          style={{ ...fieldInput, opacity: readOnly ? 0.55 : 1 }}
        />
      </Field>

      <Field
        id="project-review"
        label="Descripción del proyecto"
        hint={
          <span aria-live="polite" style={{ color: tooLong ? "#B4472A" : mix(50) }}>
            {words} de {MAX_PROJECT_WORDS} palabras
            {tooLong ? " · te pasaste, recorta antes de guardar" : ""}
          </span>
        }
      >
        <textarea
          id="project-review"
          value={review}
          onChange={(e) => onReview(e.target.value)}
          placeholder="De qué trata, qué lo une, qué quieres que vea quien se pare enfrente…"
          rows={8}
          disabled={readOnly}
          style={{ ...fieldInput, opacity: readOnly ? 0.55 : 1 }}
        />
      </Field>
    </div>
  );
}
