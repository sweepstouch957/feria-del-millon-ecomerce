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

// Evita el flash de tema: aplica data-theme desde localStorage antes de pintar.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem('fdm-theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, content, sections, landing, nav } = await getSiteConfig();

  // Variables CSS del tema (paleta editorial v2 + legacy). Inyectadas server-side.
  const themeVars = `:root{
    --brand-accent:${theme.accent};
    --brand-accent-dark:${theme.accentDark};
    --brand-hero-from:${theme.heroFrom};
    --brand-hero-via:${theme.heroVia};
    --brand-hero-to:${theme.heroTo};
    --fdm-green:${theme.accent};
    --fdm-green-deep:${theme.greenDeep || "#14513C"};
    --fdm-bg:${theme.bg || "#F7F6F2"};
    --fdm-fg:${theme.fg || "#0B0B0A"};
    --fdm-panel:${theme.panel || "#0B0B0A"};
    --fdm-on-dark:${theme.onDark || "#F5F4EF"};
  }
  :root[data-theme="dark"]{
    --fdm-bg:#0C0C0B;
    --fdm-fg:#F0EFEA;
    --fdm-panel:#161614;
    --fdm-green-deep:#0F3C2C;
  }`;

  return (
    <html lang="es">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <style id="brand-theme-vars" dangerouslySetInnerHTML={{ __html: themeVars }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500&family=Instrument+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* SDK de Mercado Pago disponible en todo el front */}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <SiteConfigProvider value={{ theme, content, sections, landing, nav }}>
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
