import type { FormikErrors } from "formik";
import type { ZodTypeAny } from "zod";

/* Puente entre zod y Formik.

   Formik se casa con Yup en la documentación, pero el proyecto ya valida con
   zod en todos lados; meter una segunda librería de esquemas significaría dos
   formas de decir "esto es obligatorio" que tarde o temprano no coinciden.
   Son veinte líneas: zod devuelve una lista de problemas con su ruta y Formik
   espera un objeto con la misma forma que los valores. */

/** Convierte un esquema de zod en la función `validate` de Formik. */
export function zodValidator<T extends Record<string, unknown>>(schema: ZodTypeAny) {
  return (values: T): FormikErrors<T> => {
    const result = schema.safeParse(values);
    if (result.success) return {};

    const errors: Record<string, unknown> = {};
    for (const issue of result.error.issues) {
      // El primer problema de cada campo manda: el artista arregla uno por vez.
      const path = issue.path.join(".");
      if (path && errors[path] === undefined) errors[path] = issue.message;
    }
    return errors as FormikErrors<T>;
  };
}

/** El error de un campo, solo cuando ya lo tocaron (no mientras escribe). */
export const fieldError = (
  touched: unknown,
  error: unknown
): string | undefined => (touched && typeof error === "string" ? error : undefined);
