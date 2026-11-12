"use client";

import Image from "next/image";
import { Form, Formik, useField, useFormikContext, type FormikProps } from "formik";

import type { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { MAX_PROJECT_WORDS } from "@lib/artwork";
import { formatCOP } from "@lib/money";
import { EMPTY_PROJECT, projectSchema, type ProjectFormValues } from "@validators/project";
import { zodValidator } from "@validators/formikZod";

import { Bone, Ico } from "./ui";
import { FormStateBridge, TextArea, TextInput, type FormState } from "./ui/fields";

/* Paso 2: el proyecto con el que el artista expone (port de "Mi estudio ·
   Tu proyecto", Claude Design).

   A la izquierda se escribe; a la derecha se ve, en vivo, como lo lee quien
   se para enfrente del stand, con las obras que ya cargó. El botón de guardar
   vive en la barra fija de abajo (MiEstudioClient): por eso el formulario
   expone su `innerRef` y avisa si hay cambios sin guardar. */

const validate = zodValidator<ProjectFormValues>(projectSchema);
const TITLE_MAX = 160;

const wordsOf = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);

function Journey() {
  return (
    <div className="fdm-st-journey" aria-label="Pasos para entregar tu inventario">
      <span className="s is-done"><span className="n"><Ico name="check" size={16} /></span>Tus obras</span>
      <i aria-hidden="true" />
      <span className="s is-on" aria-current="step"><span className="n">2</span>Tu proyecto</span>
      <i aria-hidden="true" />
      <span className="s"><span className="n">3</span>Revisar y enviar</span>
    </div>
  );
}

function TitleCount() {
  const [field] = useField<string>("title");
  return <span>{String(field.value ?? "").length} / {TITLE_MAX}</span>;
}

/** Cuántas palabras van, con una barrita que se llena hacia el tope. */
function WordMeter() {
  const [field] = useField<string>("review");
  const words = wordsOf(String(field.value ?? ""));
  const over = words > MAX_PROJECT_WORDS;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span className="fdm-st-meter" aria-hidden="true">
        <i style={{ width: `${Math.min(100, Math.round((words / MAX_PROJECT_WORDS) * 100))}%`, background: over ? "var(--bad)" : undefined }} />
      </span>
      <span aria-live="polite" style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", color: over ? "var(--bad)" : "var(--fg2)" }}>
        {words} de {MAX_PROJECT_WORDS} palabras
      </span>
    </span>
  );
}

function Preview({ artistName, rows }: { artistName: string; rows: ArtworkRow[] }) {
  const { values } = useFormikContext<ProjectFormValues>();
  const title = values.title?.trim();
  const text = values.review?.trim();

  return (
    <aside>
      <section className="fdm-st-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 className="fdm-st-label" style={{ margin: 0 }}>Así lo lee quien se para enfrente</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 26, lineHeight: 1.15, fontWeight: 300, overflowWrap: "anywhere", color: title ? "var(--fg)" : "var(--fg3)" }}>
            {title || "Título del proyecto"}
          </span>
          <span style={{ fontSize: 15, color: "var(--fg2)" }}>{artistName}</span>
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-line", overflowWrap: "anywhere", color: text ? "var(--fg)" : "var(--fg3)" }}>
          {text || "Aquí aparecerá la descripción de tu proyecto."}
        </p>
        <div style={{ paddingTop: 14, borderTop: "1px solid var(--line3)", display: "flex", flexDirection: "column", gap: 10 }}>
          <span className="fdm-st-label">Piezas de este proyecto · {rows.length}</span>
          {rows.length === 0 && <span style={{ fontSize: 15, color: "var(--fg3)" }}>Todavía no has cargado obras.</span>}
          {rows.slice(0, 8).map((r) => (
            <span key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <span className="fdm-st-thumb" style={{ width: 44, height: 44 }}>
                {r.image && <Image src={r.image} alt="" fill sizes="44px" style={{ objectFit: "cover" }} />}
              </span>
              <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</span>
                <span style={{ fontSize: 13, color: "var(--fg2)" }}>
                  {[r.techniqueInfo?.name, typeof r.price === "number" && r.price > 0 ? formatCOP(r.price, { currency: "COP" }) : null].filter(Boolean).join(" · ")}
                </span>
              </span>
            </span>
          ))}
          {rows.length > 8 && <span style={{ fontSize: 14, color: "var(--fg2)" }}>y {rows.length - 8} más</span>}
        </div>
      </section>
    </aside>
  );
}

export default function ProjectFields({
  initial,
  readOnly,
  loading,
  formRef,
  onStateChange,
  onSave,
  onBack,
  onAccount,
  artistName,
  rows,
}: {
  initial: ProjectFormValues;
  readOnly?: boolean;
  loading?: boolean;
  formRef: React.Ref<FormikProps<ProjectFormValues>>;
  onStateChange: (s: FormState) => void;
  onSave: (values: ProjectFormValues) => Promise<unknown>;
  onBack: () => void;
  onAccount: () => void;
  artistName: string;
  rows: ArtworkRow[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <button type="button" className="fdm-st-back fdm-studio-plain" onClick={onBack}><Ico name="back" />Volver a mis obras</button>
        <h1 className="fdm-st-h1">Tu proyecto</h1>
        <p className="fdm-st-lead" style={{ marginTop: 6 }}>
          Con qué participas en la feria. Las obras que cargaste son las piezas de
          este proyecto, y esto es lo que lee quien se para enfrente.
        </p>
      </div>

      <Journey />

      {loading ? (
        <div className="fdm-st-editor" aria-busy="true">
          <div className="main"><Bone h={360} style={{ borderRadius: 16 }} /></div>
          <aside><Bone h={320} style={{ borderRadius: 16 }} /></aside>
        </div>
      ) : (
        <Formik<ProjectFormValues>
          innerRef={formRef}
          initialValues={initial.title || initial.review ? initial : EMPTY_PROJECT}
          // Lo guardado manda: si llega del servidor mientras no hay cambios, se
          // reescribe solo.
          enableReinitialize
          validate={validate}
          onSubmit={async (values) => {
            await onSave(values);
          }}
        >
          <div className="fdm-st-editor">
            <Form className="main" noValidate>
              <FormStateBridge onChange={onStateChange} />
              <section className="fdm-st-card fdm-st-sec" style={{ gap: 20 }}>
                <TextInput
                  name="title"
                  label="Título del proyecto"
                  placeholder="Nombre del proyecto o serie"
                  maxLength={TITLE_MAX}
                  disabled={readOnly}
                  hint={<TitleCount />}
                />
                <TextArea
                  name="review"
                  label="Descripción del proyecto"
                  rows={8}
                  disabled={readOnly}
                  placeholder="De qué trata, qué lo une, qué quieres que vea quien se pare enfrente…"
                  hint={<WordMeter />}
                />
              </section>

              <section className="fdm-st-tips">
                <h2 className="fdm-st-label" style={{ margin: 0 }}>Qué contar</h2>
                <span><b>1</b>De qué trata el proyecto.</span>
                <span><b>2</b>Qué une a las obras entre sí.</span>
                <span><b>3</b>Qué quieres que vea quien se pare enfrente.</span>
              </section>

              <p className="fdm-st-note">
                Tu foto y tu presentación como artista se editan en{" "}
                <button type="button" className="fdm-st-link fdm-studio-plain" style={{ height: "auto", display: "inline" }} onClick={onAccount}>Cuenta</button>.
              </p>
            </Form>
            <Preview artistName={artistName} rows={rows} />
          </div>
        </Formik>
      )}
    </div>
  );
}
