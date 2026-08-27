// src/lib/getSiteConfig.ts — fetch server-side de la config del sitio.
// Si algo falla, devuelve los defaults (el landing nunca se rompe).
import { SITE_DEFAULTS, mergeSiteConfig, type SiteConfig } from "./siteDefaults";

// Circuit breaker de proceso: un fallo marca el API caído por 30s. Sin esto,
// un backend muerto multiplica intentos inútiles (una página prerenderizada =
// un intento) y el worker de export de Next se cuelga hasta su timeout de 60s.
let downUntil = 0;

export async function getSiteConfig(): Promise<SiteConfig> {
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  if (!base || Date.now() < downUntil) return SITE_DEFAULTS;

  try {
    const res = await fetch(`${base}/event/site-config`, {
      // ISR: se cachea y revalida cada 60s → los cambios del admin salen solos.
      next: { revalidate: 60 },
      // AbortSignal.timeout va unref'd: no mantiene vivo el event loop como
      // haría un setTimeout suelto.
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      downUntil = Date.now() + 30_000;
      return SITE_DEFAULTS;
    }
    return mergeSiteConfig(await res.json());
  } catch {
    downUntil = Date.now() + 30_000;
    return SITE_DEFAULTS;
  }
}
