/* Optimización de imágenes remotas.

   Los artistas suben originales pesados (varios MB). Si dejamos que el
   navegador baje ese archivo, ya perdimos: da igual a qué tamaño lo pintemos.
   Con Cloudinary podemos pedir la variante servida por el CDN — reescalada,
   recomprimida y en AVIF/WebP según el navegador — así lo que viaja por la red
   es el tamaño que realmente se muestra. */

const CLOUDINARY = /^https?:\/\/res\.cloudinary\.com\//;
/** Hosts declarados en next.config: fuera de esta lista next/image falla. */
const ALLOWED_REMOTE = /^https:\/\/(res\.cloudinary\.com|images\.unsplash\.com)\//;

export function isCloudinary(src: string) {
  return CLOUDINARY.test(src);
}

/** true si next/image puede tomarla (ruta local o host declarado). */
export function isNextOptimizable(src: string) {
  return src.startsWith("/") || ALLOWED_REMOTE.test(src);
}

/**
 * Loader de next/image para Cloudinary. Next lo llama una vez por ancho del
 * srcset, así que cada entrada apunta a una derivación distinta del CDN.
 *
 * - `f_auto` → AVIF/WebP según el navegador
 * - `q_auto` → calidad por contenido
 * - `c_limit` → nunca agranda por encima del original
 */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  const marker = "/upload/";
  const i = src.indexOf(marker);
  if (i < 0) return src;

  const head = src.slice(0, i + marker.length);
  let tail = src.slice(i + marker.length);

  // Si la URL ya trae una capa de transformaciones (el modelo del backend
  // inyecta f_auto,q_auto,w_1600), la descartamos: encadenarla aplicaría un
  // reescalado sobre otro. El segmento de versión (v1712…) no se toca.
  const first = tail.split("/")[0];
  if (/(^|,)(f_|q_|w_|h_|c_|dpr_|e_|g_)/.test(first)) {
    tail = tail.slice(first.length + 1);
  }

  return `${head}f_auto,q_${quality ?? "auto"},w_${width},c_limit/${tail}`;
}
