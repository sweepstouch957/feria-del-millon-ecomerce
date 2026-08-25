// src/lib/getSiteConfig.ts — fetch server-side de la config del sitio.
// Si algo falla, devuelve los defaults (el landing nunca se rompe).
import { SITE_DEFAULTS, mergeSiteConfig, type SiteConfig } from "./siteDefaults";

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
    if (!base) return SITE_DEFAULTS;

    // Timeout defensivo: si event-svc está lento/caído, no colgamos el render.
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 3000);
    const res = await fetch(`${base}/event/site-config`, {
      // ISR: se cachea y revalida cada 60s → los cambios del admin salen solos.
      next: { revalidate: 60 },
      signal: ac.signal,
    }).finally(() => clearTimeout(t));
    if (!res.ok) return SITE_DEFAULTS;

    const raw = await res.json();
    return mergeSiteConfig(raw);
  } catch {
    return SITE_DEFAULTS;
  }
}
