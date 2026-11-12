import { Suspense } from "react";
import CatalogPageClient from "@components/views/catalog/CatalogPageClient";
import SiteFooter from "@components/SiteFooter";
import FairModeGate from "@components/FairModeGate";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ artistId?: string }>;
}) {
  // El QR del panel del artista abre /catalogo?artistId=…; en modo feria va a su perfil.
  const { artistId } = await searchParams;
  return (
    <>
      <FairModeGate redirectTo={artistId ? `/artista/${encodeURIComponent(artistId)}` : undefined}>
        {/* min-height: mientras carga, el footer no sube hasta arriba. */}
        <Suspense fallback={<div style={{ minHeight: "100vh" }} aria-busy="true" />}>
          <CatalogPageClient />
        </Suspense>
      </FairModeGate>
      <SiteFooter />
    </>
  );
}
