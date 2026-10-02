/**
 * Portada de un PDF subido a Cloudinary.
 *
 * Cloudinary trata los PDF como imagen, así que su primera página se puede
 * pedir como JPG con la transformación `pg_1`. Eso evita incrustar un visor
 * (lento, bloqueado en varios navegadores móviles) para mostrar de qué
 * documento se trata: se ve la portada y el botón abre el PDF real.
 *
 * Si el archivo no está en Cloudinary devuelve "" y quien llama decide el
 * respaldo (normalmente un iframe o sólo el botón).
 */
export function pdfFirstPage(url: string, width = 1200): string {
  if (!url) return "";
  const m = url.match(/^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i);
  if (!m) return "";
  const [, base, rest] = m;
  // Sin la extensión: el formato lo fija `f_jpg`.
  const path = rest.replace(/\.(pdf|jpe?g|png)(?=$|\?)/i, "");
  return `${base}pg_1,w_${width},c_limit,f_jpg,q_auto/${path}.jpg`;
}

/** true si la URL apunta a un PDF (para decidir portada vs. enlace simple). */
export const isPdf = (url: string) => /\.pdf(?=$|\?)/i.test(url || "");
