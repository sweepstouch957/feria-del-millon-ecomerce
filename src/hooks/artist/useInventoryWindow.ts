import { useEdition } from "@provider/editionProvider";

/* ¿Se puede cargar inventario ahora?

   La ventana la pone la feria en el panel (Event.inventoryOpenAt → CloseAt) y
   el servidor la vuelve a validar al guardar: esto es para decirlo ANTES, no
   para hacer de candado. Llenar una obra entera y que el guardado conteste 403
   es la peor forma de enterarse.

   Las dos puntas son opcionales: sin apertura se puede desde siempre, sin
   cierre hasta siempre. */

const when = (iso: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    timeZone: "America/Bogota",
  }).format(new Date(iso));

export type InventoryWindow = {
  /** Si no, no vale la pena abrir el formulario. */
  canUpload: boolean;
  /** Por qué no se puede, con la fecha. `null` cuando sí se puede. */
  reason: string | null;
  /** Aviso cuando queda poco: una semana o menos. */
  closingSoon: string | null;
};

export function useInventoryWindow(): InventoryWindow {
  const { openAt, closeAt } = useEdition().inventory;
  const now = Date.now();

  if (openAt && new Date(openAt).getTime() > now) {
    return {
      canUpload: false,
      reason: `La carga de inventario abre el ${when(openAt)}.`,
      closingSoon: null,
    };
  }

  if (closeAt && new Date(closeAt).getTime() < now) {
    return {
      canUpload: false,
      reason: `La carga de inventario cerró el ${when(closeAt)}. Escríbele a la feria si necesitas cambiar algo.`,
      closingSoon: null,
    };
  }

  const days = closeAt ? Math.ceil((new Date(closeAt).getTime() - now) / 86_400_000) : null;

  return {
    canUpload: true,
    reason: null,
    closingSoon:
      days !== null && days <= 7
        ? days <= 1
          ? "Hoy es el último día para cargar tus obras."
          : `Quedan ${days} días para cargar tus obras: cierra el ${when(closeAt!)}.`
        : null,
  };
}
