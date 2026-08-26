"use client";
import { createContext, useContext } from "react";
import { FALLBACK_EDITION, type Edition } from "@lib/getActiveEdition";

const EditionCtx = createContext<Edition>(FALLBACK_EDITION);

export function EditionProvider({ value, children }: { value: Edition; children: React.ReactNode }) {
  return <EditionCtx.Provider value={value}>{children}</EditionCtx.Provider>;
}

/** Edición vigente (evento + pabellones + convocatoria), resuelta dinámicamente. */
export const useEdition = () => useContext(EditionCtx);

/** Helpers cómodos. */
export const useEventId = () => useContext(EditionCtx).eventId;
