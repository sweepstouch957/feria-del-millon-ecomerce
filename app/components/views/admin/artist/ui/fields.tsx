"use client";

import * as React from "react";
import { useField, useFormikContext } from "formik";

import { fieldError } from "@validators/formikZod";
import { Field } from "./index";
import { fieldInput, mix } from "../studioTheme";

/* Los campos atados a Formik.

   Cada uno trae su etiqueta, su ayuda y su error en el mismo orden siempre, y
   el error solo sale cuando el campo ya se tocó: avisarle a alguien que el
   título es muy corto mientras escribe la primera letra es pelear con quien
   está llenando el formulario. */

type Common = {
  name: string;
  label: string;
  hint?: React.ReactNode;
  disabled?: boolean;
};

/** Id estable y único por formulario, para que `htmlFor` apunte a algo real. */
const idOf = (name: string) => `fdm-${name.replace(/\./g, "-")}`;

export function TextInput({
  name,
  label,
  hint,
  disabled,
  type = "text",
  placeholder,
  maxLength,
  inputMode,
}: Common & {
  type?: "text" | "number";
  placeholder?: string;
  maxLength?: number;
  inputMode?: "numeric" | "text";
}) {
  const [field, meta] = useField(name);
  const error = fieldError(meta.touched, meta.error);
  const id = idOf(name);

  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        type={type}
        inputMode={inputMode ?? (type === "number" ? "numeric" : undefined)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={!!error}
        {...field}
        value={field.value ?? ""}
        style={{ ...fieldInput, opacity: disabled ? 0.55 : 1 }}
      />
    </Field>
  );
}

export function TextArea({
  name,
  label,
  hint,
  disabled,
  placeholder,
  rows = 5,
}: Common & { placeholder?: string; rows?: number }) {
  const [field, meta] = useField(name);
  const error = fieldError(meta.touched, meta.error);
  const id = idOf(name);

  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        {...field}
        value={field.value ?? ""}
        style={{ ...fieldInput, opacity: disabled ? 0.55 : 1 }}
      />
    </Field>
  );
}

export function SelectInput({
  name,
  label,
  hint,
  disabled,
  options,
  placeholder = "Elige una",
}: Common & {
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const [field, meta] = useField(name);
  const error = fieldError(meta.touched, meta.error);
  const id = idOf(name);

  return (
    <Field id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        disabled={disabled}
        aria-invalid={!!error}
        {...field}
        value={field.value ?? ""}
        style={{ ...fieldInput, opacity: disabled ? 0.55 : 1 }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/** Casilla con su frase al lado: se lee como texto, no como etiqueta. */
export function CheckboxInput({
  name,
  children,
  disabled,
}: {
  name: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [field] = useField({ name, type: "checkbox" });

  return (
    <label className="fdm-studio-check" style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
      <input
        type="checkbox"
        disabled={disabled}
        {...field}
        checked={!!field.value}
        style={{ marginTop: 3, width: 15, height: 15 }}
      />
      <span>{children}</span>
    </label>
  );
}

/** Cuenta de palabras del campo, viva mientras se escribe. */
export function WordCount({ name, max }: { name: string; max: number }) {
  const [field] = useField(name);
  const text = String(field.value ?? "");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const over = words > max;

  return (
    <span aria-live="polite" style={{ color: over ? "#B4472A" : mix(50) }}>
      {words} de {max} palabras
    </span>
  );
}

/* Un espía del estado del formulario.

   La barra de acciones del estudio vive fuera del <form> (está fija abajo), así
   que necesita saber si hay cambios sin guardar y si lo que hay es válido.
   En vez de duplicar ese estado, el formulario lo reporta hacia arriba. */
export type FormState = { dirty: boolean; valid: boolean; submitting: boolean };

export function FormStateBridge({ onChange }: { onChange: (s: FormState) => void }) {
  const { dirty, isValid, isSubmitting } = useFormikContext();

  React.useEffect(() => {
    onChange({ dirty, valid: isValid, submitting: isSubmitting });
  }, [dirty, isValid, isSubmitting, onChange]);

  return null;
}
