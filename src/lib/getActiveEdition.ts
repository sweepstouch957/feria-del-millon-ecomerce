// src/lib/getActiveEdition.ts
// Resuelve la EDICIÓN VIGENTE dinámicamente desde el backend (GET /event/events/current):
// evento activo + pabellones + convocatoria. Sin ids hardcodeados.
// Si el backend no responde, cae a los constants (deuda técnica de transición) → nunca rompe.
import {
  DEFAULT_EVENT_ID,
  DEFAULT_EVENT_NAME,
  FIXED_PAVILION_ID,
  FIXED_PAVILION_NAME,
} from "@core/constants";

export interface EditionPavilion {
  id: string;
  name: string;
  slug: string;
  minArtworkPrice?: number;
  maxArtworkPrice?: number;
}

export interface ConvocatoriaRequirements {
  maxImages?: number;
  priceMin?: number;
  priceMax?: number;
  documents?: { cv?: boolean; profilePhoto?: boolean; bio?: boolean; projectReview?: boolean; montage?: boolean; detail?: boolean };
}

export interface EditionConvocatoria {
  id: string;
  status: string; // draft | open | closed | selection | finalized | archived
  startDate?: string;
  endDate?: string;
  fee?: number;
  maxArtworksPerArtist?: number;
  allowedTechniqueIds?: string[];
  requirements?: ConvocatoriaRequirements;
}

export interface Edition {
  eventId: string;
  eventName: string;
  pavilions: EditionPavilion[];
  convocatoria: EditionConvocatoria | null;
}

export const FALLBACK_EDITION: Edition = {
  eventId: DEFAULT_EVENT_ID,
  eventName: DEFAULT_EVENT_NAME,
  pavilions: [{ id: FIXED_PAVILION_ID, name: FIXED_PAVILION_NAME, slug: "" }],
  convocatoria: null,
};

export async function getActiveEdition(): Promise<Edition> {
  try {
    const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    if (!base) return FALLBACK_EDITION;
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 3000);
    const res = await fetch(`${base}/event/events/current`, {
      next: { revalidate: 60 }, // ISR: cambios de edición salen solos en ~1 min
      signal: ac.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) return FALLBACK_EDITION;

    const raw = await res.json();
    const ev = raw?.event;
    if (!ev?._id) return FALLBACK_EDITION;

    const pavilions: EditionPavilion[] = Array.isArray(raw.pavilions)
      ? raw.pavilions
          .filter((p: any) => p?._id)
          .map((p: any) => ({
            id: String(p._id),
            name: p.name || "",
            slug: p.slug || "",
            minArtworkPrice: p.minArtworkPrice,
            maxArtworkPrice: p.maxArtworkPrice,
          }))
      : [];

    const c = raw.convocatoria;
    return {
      eventId: String(ev._id),
      eventName: ev.name || DEFAULT_EVENT_NAME,
      pavilions: pavilions.length ? pavilions : FALLBACK_EDITION.pavilions,
      convocatoria: c?._id
        ? {
            id: String(c._id),
            status: c.status,
            startDate: c.startDate,
            endDate: c.endDate,
            fee: c.fee,
            maxArtworksPerArtist: c.maxArtworksPerArtist,
            allowedTechniqueIds: Array.isArray(c.allowedTechniqueIds) ? c.allowedTechniqueIds.map(String) : [],
            requirements: c.requirements && typeof c.requirements === "object" ? c.requirements : {},
          }
        : null,
    };
  } catch {
    return FALLBACK_EDITION;
  }
}
