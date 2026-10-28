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
        <Suspense fallback={<div className="p-8">Cargando catálogo…</div>}>
          <CatalogPageClient />
        </Suspense>
      </FairModeGate>
      <SiteFooter />
    </>
  );
}
