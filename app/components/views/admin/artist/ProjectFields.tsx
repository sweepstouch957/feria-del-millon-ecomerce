"use client";

import { Form, Formik, type FormikProps } from "formik";

import { MAX_PROJECT_WORDS } from "@lib/artwork";
import { EMPTY_PROJECT, projectSchema, type ProjectFormValues } from "@validators/project";
import { zodValidator } from "@validators/formikZod";

import { BODY } from "./studioTheme";
import { Bone } from "./ui";
import { FormStateBridge, TextArea, TextInput, WordCount, type FormState } from "./ui/fields";

/* Paso 2: el proyecto con el que el artista expone.

   El botón de guardar no está acá: vive en la barra fija de abajo, junto al
   resto de las acciones del paso. Por eso el formulario expone su `innerRef`
   —para que la barra pueda enviarlo— y avisa hacia arriba si hay cambios sin
   guardar, en vez de que ese estado exista dos veces. */

const validate = zodValidator<ProjectFormValues>(projectSchema);

export default function ProjectFields({
  initial,
  readOnly,
  loading,
  formRef,
  onStateChange,
  onSave,
}: {
  initial: ProjectFormValues;
  readOnly?: boolean;
  loading?: boolean;
  formRef: React.Ref<FormikProps<ProjectFormValues>>;
  onStateChange: (s: FormState) => void;
  onSave: (values: ProjectFormValues) => Promise<unknown>;
}) {
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
        <Form style={{ display: "grid", gap: "clamp(22px,2.8vw,32px)" }}>
          <FormStateBridge onChange={onStateChange} />

          <TextInput
            name="title"
            label="Título del proyecto"
            placeholder="Nombre del proyecto o serie"
            maxLength={160}
            disabled={readOnly}
          />

          <TextArea
            name="review"
            label="Descripción del proyecto"
            rows={8}
            disabled={readOnly}
            placeholder="De qué trata, qué lo une, qué quieres que vea quien se pare enfrente…"
            hint={<WordCount name="review" max={MAX_PROJECT_WORDS} />}
          />
        </Form>
      </Formik>
    </div>
  );
}
