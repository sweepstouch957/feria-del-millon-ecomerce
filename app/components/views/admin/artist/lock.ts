// En true el panel del artista descarga e imprime normal (QR, listas, entregas).
export const ARTIST_DOWNLOADS_ENABLED = true;

export const DOWNLOAD_ERROR = "Ocurrió un error al generar el archivo. Intenta de nuevo más tarde.";

/** true si se puede descargar/imprimir; si no, muestra el error y devuelve false. */
export function canDownload(): boolean {
  if (ARTIST_DOWNLOADS_ENABLED) return true;
  if (typeof window !== "undefined") window.alert(DOWNLOAD_ERROR);
  return false;
}

/** Sin efecto con el panel abierto; solo bloquea la impresión cuando está desactivado. */
export const NO_PRINT_CSS = "@media print { body { display: none !important; } }";
