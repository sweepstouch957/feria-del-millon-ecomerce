import Navigation from "@components/Navigation";
import { ApplicationContinueBanner } from "@components/ApplicationContinueBanner";
import "./globals.css";
import { AuthProvider } from "@provider/authProvider";
import ReactQueryProvider from "@provider/reactQueryProvider";
import { SiteConfigProvider } from "@provider/siteConfigProvider";
import { getSiteConfig } from "@lib/getSiteConfig";
import Script from "next/script";
import { Toaster } from "react-hot-toast";

export async function generateMetadata() {
  const { content } = await getSiteConfig();
  return {
    title: content.seo.title,
    description: content.seo.description,
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, content, sections } = await getSiteConfig();

  // Variables CSS del tema, inyectadas server-side (sin parpadeo). El landing
  // las usa para el gradiente del hero y el color de acento de marca.
  const themeVars = `:root{--brand-accent:${theme.accent};--brand-accent-dark:${theme.accentDark};--brand-hero-from:${theme.heroFrom};--brand-hero-via:${theme.heroVia};--brand-hero-to:${theme.heroTo};}`;

  return (
    <html lang="es">
      <head>
        {/* Tema editable del sitio */}
        <style id="brand-theme-vars" dangerouslySetInnerHTML={{ __html: themeVars }} />
        {/* SDK de Mercado Pago disponible en todo el front */}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <SiteConfigProvider value={{ theme, content, sections }}>
          <ReactQueryProvider>
            <AuthProvider>
              <Navigation />
              {children}
              <ApplicationContinueBanner />
              <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
            </AuthProvider>
          </ReactQueryProvider>
        </SiteConfigProvider>
      </body>
    </html>
  );
}
