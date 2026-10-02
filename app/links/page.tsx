import { notFound } from "next/navigation";
import { getSiteConfig } from "@lib/getSiteConfig";
import LinktreeView from "@components/views/links/LinktreeView";

/* /links — la página corta que va en el QR impreso.
   El contenido se edita en el panel (Personalización → "Página de enlaces"). */

export async function generateMetadata() {
  const { landing } = await getSiteConfig();
  const lt = landing.linktree;
  const title = [lt.title, lt.titleStrong].filter(Boolean).join(" ").trim();
  return {
    title: title ? `${title} · Feria del Millón` : "Enlaces · Feria del Millón",
    description: lt.paragraph,
    // Es una página de QR, no contenido para buscadores.
    robots: { index: false, follow: true },
  };
}

export default async function LinksPage() {
  const { landing } = await getSiteConfig();
  // Apagada en el panel = no existe: así no queda una página a medio publicar.
  if (!landing.linktree.enabled) notFound();
  return <LinktreeView />;
}
