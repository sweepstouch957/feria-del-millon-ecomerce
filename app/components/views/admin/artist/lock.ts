// Bloqueo hasta nuevo aviso: el panel de artista no descarga ni imprime nada
// (QR, listas, entregas). Al intentarlo se muestra un error del sistema. Para reabrir: true.
export const ARTIST_DOWNLOADS_ENABLED = false;

export const DOWNLOAD_ERROR = "Ocurrió un error al generar el archivo. Intenta de nuevo más tarde.";

/** true si se puede descargar/imprimir; si no, muestra el error y devuelve false. */
export function canDownload(): boolean {
  if (ARTIST_DOWNLOADS_ENABLED) return true;
  if (typeof window !== "undefined") window.alert(DOWNLOAD_ERROR);
  return false;
}

/** Con el bloqueo, Ctrl+P sale en blanco en todo el panel del artista. */
export const NO_PRINT_CSS = "@media print { body { display: none !important; } }";
