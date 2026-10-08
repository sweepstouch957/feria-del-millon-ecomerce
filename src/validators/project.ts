import { z } from "zod";

import { MAX_PROJECT_WORDS, countWords } from "@lib/artwork";

/* El proyecto con el que el artista expone.

   El límite real no son caracteres sino palabras: es un texto de catálogo y la
   feria lo maqueta. Por eso la regla se escribe acá, donde se puede contar
   bien, y no como un maxLength en el textarea que cortaría a mitad de frase. */

export const projectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Ponle un título a tu proyecto")
    .max(160, "El título se pasa de 160 caracteres"),

  review: z
    .string()
    .max(6000)
    .refine((v) => countWords(v) <= MAX_PROJECT_WORDS, {
      message: `Te pasaste de ${MAX_PROJECT_WORDS} palabras: recorta antes de guardar`,
    }),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const EMPTY_PROJECT: ProjectFormValues = { title: "", review: "" };
