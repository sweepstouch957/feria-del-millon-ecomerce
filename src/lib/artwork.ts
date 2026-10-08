/* Reglas de una obra, sin React de por medio.
   Están acá porque las usan la tabla, el modal y la revisión final: si "qué le
   falta a una obra" vive en tres componentes, tarde o temprano dicen tres
   cosas distintas. */

export const MAX_IMAGE_MB = 5;
export const MAX_PROJECT_WORDS = 250;
export const MAX_COPIES = 10;

export const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

/** Lo mínimo que la feria necesita de cada obra para la etiqueta y el catálogo. */
export type ArtworkLike = {
  image?: string;
  price?: number;
  dimensionsText?: string;
  technique?: string;
  techniqueInfo?: { name?: string } | null;
};

export function missingFields(a: ArtworkLike): string[] {
  const missing: string[] = [];
  if (!a.image) missing.push("imagen");
  if (typeof a.price !== "number") missing.push("precio");
  if (!a.dimensionsText) missing.push("dimensiones");
  if (!(a.techniqueInfo?.name || a.technique)) missing.push("técnica");
  return missing;
}

export const isComplete = (a: ArtworkLike) => missingFields(a).length === 0;

/** Mensaje de un archivo que no sirve como imagen de obra, o null si sirve. */
export function imageFileProblem(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Eso no es una imagen. Sube un JPG o un PNG.";
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
    return `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB: el máximo son ${MAX_IMAGE_MB} MB.`;
  }
  return null;
}
