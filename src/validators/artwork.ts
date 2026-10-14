import { z } from "zod";

import { MAX_COPIES, slugify } from "@lib/artwork";

/* Qué es una obra válida.

   Vive acá y no dentro del modal porque la pregunta "¿esto se puede guardar?"
   la hacen el formulario, la revisión antes de enviar y, el día que exista, el
   panel de la feria. Una sola respuesta para los tres.

   Los campos numéricos llegan como texto desde los inputs, así que se limpian
   antes de mirarlos: "" significa "no puso nada", no cero. */

const CURRENT_YEAR = new Date().getFullYear();

/** "" | null | undefined → undefined; el resto, número (o NaN si es basura). */
const optionalNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  });

export const artworkSchema = z.object({
  title: z.string().trim().min(2, "Ponle un título a la obra").max(160, "Título muy largo"),

  technique: z.string().min(1, "Elige la técnica"),

  pavilion: z.string().optional(),

  year: optionalNumber.pipe(
    z
      .number()
      .int("El año va sin decimales")
      .min(1800, "Año muy antiguo")
      .max(CURRENT_YEAR, `Como máximo ${CURRENT_YEAR}`)
      .optional()
  ),

  price: optionalNumber.pipe(
    z.number().int("El precio va sin decimales").min(0, "El precio no puede ser negativo").optional()
  ),

  // Obligatorio: vacío se guardaba como 1 y las series quedaban con una sola
  // copia a la venta. Obra única = 1, a propósito. Tope por obra: una serie de
  // 400 copias es un póster, y la feria cobra por obra.
  stock: optionalNumber.pipe(
    z
      .number({ required_error: "Pon cuántas hay a la venta (1 si es obra única)" })
      .int("La cantidad va sin decimales")
      .min(1, "Pon cuántas hay a la venta (1 si es obra única)")
      .max(MAX_COPIES, `Máximo ${MAX_COPIES} por obra`)
  ),

  dimensions: z.string().max(120, "Dimensiones muy largas").optional(),

  description: z.string().max(4000, "Descripción muy larga").optional(),

  reproducible: z.boolean().optional(),

  image: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), "Esa dirección de imagen no es válida"),
});

export type ArtworkFormValues = {
  title: string;
  technique: string;
  pavilion: string;
  year: string;
  price: string;
  stock: string;
  dimensions: string;
  description: string;
  reproducible: boolean;
  image: string;
};

export const EMPTY_ARTWORK: ArtworkFormValues = {
  title: "",
  technique: "",
  pavilion: "",
  year: "",
  price: "",
  stock: "",
  dimensions: "",
  description: "",
  reproducible: false,
  image: "",
};

/** Lo que el formulario manda al servidor, ya en sus tipos. */
export function artworkPayload(v: ArtworkFormValues) {
  const num = (s: string) => (s === "" ? undefined : Number(s));
  return {
    title: v.title.trim(),
    slug: slugify(v.title),
    technique: v.technique,
    pavilion: v.pavilion || null,
    year: num(v.year),
    price: num(v.price),
    stock: num(v.stock),
    dimensionsText: v.dimensions.trim(),
    description: v.description,
    reproducible: Boolean(v.reproducible),
    image: v.image.trim() || undefined,
  };
}
