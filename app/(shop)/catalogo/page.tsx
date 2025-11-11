import { Suspense } from "react";
import CatalogPageClient from "@components/views/catalog/CatalogPageClient";

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-8">Cargando catálogo…</div>}>
      <CatalogPageClient />
    </Suspense>
  );
}
