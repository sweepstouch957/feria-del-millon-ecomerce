"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
/** true solo en el cliente, después de hidratar. Para estado que vive en
 *  localStorage (carrito): el servidor pinta el estado "vacío" sin mentir. */
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
