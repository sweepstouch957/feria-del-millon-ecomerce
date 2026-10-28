"use client";
import { createContext, useContext } from "react";
import {
  SITE_DEFAULTS,
  isCatalogSalesPaused,
  type SiteContent,
  type SiteTheme,
  type SiteSections,
  type LandingConfig,
  type NavItem,
} from "@lib/siteDefaults";

type Value = {
  content: SiteContent;
  theme: SiteTheme;
  sections: SiteSections;
  landing: LandingConfig;
  nav: { items: NavItem[] };
};

const SiteConfigCtx = createContext<Value>({
  content: SITE_DEFAULTS.content,
  theme: SITE_DEFAULTS.theme,
  sections: SITE_DEFAULTS.sections,
  landing: SITE_DEFAULTS.landing,
  nav: SITE_DEFAULTS.nav,
});

export function SiteConfigProvider({
  value,
  children,
}: {
  value: Value;
  children: React.ReactNode;
}) {
  return <SiteConfigCtx.Provider value={value}>{children}</SiteConfigCtx.Provider>;
}

export const useSiteContent = () => useContext(SiteConfigCtx).content;
export const useSiteSections = () => useContext(SiteConfigCtx).sections;
export const useSiteLanding = () => useContext(SiteConfigCtx).landing;
export const useSiteNav = () => useContext(SiteConfigCtx).nav;
/** Venta en línea congelada (días de feria): se ve el catálogo, no se compra. */
export const useCatalogSalesPaused = () => {
  const c = useContext(SiteConfigCtx).landing.catalogSales;
  return { paused: isCatalogSalesPaused(c), message: c?.message || "" };
};
/** Modo feria (switch del panel): sin catálogo ni carrito; se compra una obra a la vez desde su QR. */
export const useFairMode = () => !!useContext(SiteConfigCtx).landing.catalogSales?.fairMode;
