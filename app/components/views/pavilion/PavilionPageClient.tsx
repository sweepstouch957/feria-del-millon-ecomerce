// @components/views/pavilion/PavilionPageClient.tsx
"use client";

import { useMemo } from "react";
import { Button } from "@components/ui/button";
import ResultsToolbar from "@components/views/catalog/ResultsToolbar";
import FiltersSidebar from "@components/views/catalog/FiltersSidebar";
import CatalogCard from "@components/views/catalog/CatalogCard";
import EmptyState from "@components/views/catalog/EmptyState";

import { usePavilionBySlug } from "@hooks/queries/usePavillionBySlug";
import { useTechniques } from "@hooks/queries/useTechniques";
import {
  useArtworksCursor,
  type ArtworksCursorFilters,
  type ArtworkRow,
} from "@hooks/queries/useArtworksCursor";

import { useCatalogState } from "@hooks/ui/catalog/useCatalogState";
import useCart from "@store/useCart";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Landmark } from "lucide-react";

type Props = { eventId: string; slug: string };

export default function PavilionPageClient({ eventId, slug }: Props) {
  // ===== Pavilion detail
  const { data: pavilion, isLoading: loadingPavilion, isError } = usePavilionBySlug(eventId, slug);

  // ===== UI state (reutilizamos el mismo estado de catálogo)
  const {
    q, setQ,
    techniqueIds, toggleTechnique, clearTechniques,
    minPrice, setMinPrice,
    maxPrice, setMaxPrice,
    inStock, setInStock,
    hasImage, setHasImage,
    sortBy, setSortBy,
    sortDir, toggleSortDir,
    viewMode, setViewMode,
    applyFilters, clearAllAndRefetch,
  } = useCatalogState({
    initialQ: "",
    initialPavilion: "", // en esta page no se cambia el pabellón
    defaultMaxPrice: pavilion?.maxArtworkPrice ?? 10_000_000,
  });

  // ===== Técnicas para chips
  const { data: techniquesData = [], isLoading: loadingTechs, isError: errTechs } = useTechniques();
  const techniqueCsv = techniqueIds.length ? techniqueIds.join(",") : undefined;

  // ===== Artworks del pabellón (usamos EL _id del pavilion resuelto)
  const {
    rows: rawRows,
    totalLabel,
    isFetching,
    isLoading,
    hasNextPage,
    loadMore,
    refetch,
  } = useArtworksCursor({
    q,
    event: eventId,
    pavilion: pavilion?._id, // clave: filtrar por el ID del pabellón
    technique: techniqueCsv,
    limit: 24,
  } as ArtworksCursorFilters);

  // ===== Post-filtro local (imagen, stock, precio, orden)
  const filteredRows = useMemo(() => {
    let arr = rawRows.slice();
    if (hasImage) {
      arr = arr.filter((r) => (r.image && r.image !== "") || (r.images?.length ?? 0) > 0);
    }
    if (inStock) {
      arr = arr.filter((r) => Number(r.stock ?? 0) > 0);
    }
    arr = arr.filter((r) => {
      const p = Number(r.price ?? 0);
      return p >= (minPrice ?? 0) && p <= (maxPrice ?? Number.MAX_SAFE_INTEGER);
    });

    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "price") return (Number(a.price ?? 0) - Number(b.price ?? 0)) * dir;
      if (sortBy === "_id") return (String(a._id) > String(b._id) ? 1 : -1) * dir;
      const ad = new Date(a.createdAt as unknown as string).getTime();
      const bd = new Date(b.createdAt as unknown as string).getTime();
      return (ad - bd) * dir;
    });
    return arr;
  }, [rawRows, hasImage, inStock, minPrice, maxPrice, sortBy, sortDir]);

  // ===== Carrito
  const addToCart = useCart((s) => s.add);
  const totalItems = useCart((s) => s.totalItems)();
  const handleAddToCart = (art: ArtworkRow, qty = 1) => {
    addToCart(
      {
        id: String(art._id),
        title: art.title,
        price: Number(art.price ?? 0),
        image: art.image ?? art.images?.[0] ?? "/placeholder.png",
      },
      qty
    );
  };

  // ===== Header Pavilion
  const Header = () => {
    if (loadingPavilion) {
      return (
        <div className="mb-8 animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-3" />
          <div className="h-4 w-80 bg-gray-200 rounded" />
        </div>
      );
    }
    if (!pavilion) return null;

    return (
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-gray-600 mb-1">
              <Landmark className="h-4 w-4" />
              <span className="text-sm">Pabellón</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{pavilion.name}</h1>
            <p className="text-gray-600 mt-2 max-w-3xl">
              {pavilion.description?.slice(0, 280) || ""}{pavilion.description && pavilion.description.length > 280 ? "…" : ""}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              {pavilion.validFrom && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                  Inicio: {format(new Date(pavilion.validFrom), "PPPp", { locale: es })}
                </span>
              )}
              {pavilion.validTo && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                  Fin: {format(new Date(pavilion.validTo), "PPPp", { locale: es })}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                Obras: {totalLabel}
              </span>
              {(pavilion.minArtworkPrice || pavilion.maxArtworkPrice) && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                  Precio: {Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })
                    .format(pavilion.minArtworkPrice ?? 0)} — {Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 })
                    .format(pavilion.maxArtworkPrice ?? 0)}
                </span>
              )}
            </div>
          </div>

          {/* Carrito en header */}
          <Button variant="outline" className="relative" title="Carrito">
            Carrito
            <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-black/90 px-2 text-white text-xs">
              {totalItems}
            </span>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <Header />

        {/* Top toolbar (vista/orden rápidas) */}
        <ResultsToolbar
          title="Obras del pabellón"
          subtitle={pavilion ? `Explora las obras de ${pavilion.name}` : "Cargando…"}
          viewMode={viewMode}
          onViewMode={setViewMode}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar de filtros */}
          <aside className="lg:col-span-3">
            <FiltersSidebar
              // búsqueda
              q={q}
              setQ={setQ}
              // pabellón NO editable en esta vista
              pavilion={pavilion?._id || ""}
              setPavilion={() => {}}
              pavilionOptions={[]}
              loadingPavilions={false}
              errorPavilions={false}
              // técnicas
              techniquesData={techniquesData}
              loadingTechniques={loadingTechs}
              errorTechniques={!!errTechs}
              techniqueIds={techniqueIds}
              onToggleTechnique={toggleTechnique}
              onClearTechniques={clearTechniques}
              // filtros visuales
              minPrice={minPrice}
              maxPrice={maxPrice}
              setMinPrice={setMinPrice}
              setMaxPrice={setMaxPrice}
              inStock={inStock}
              setInStock={setInStock}
              hasImage={hasImage}
              setHasImage={setHasImage}
              // orden
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDir={sortDir}
              toggleSortDir={toggleSortDir}
              // acciones
              onApply={() => {
                refetch();
                applyFilters();
              }}
              onClear={() => clearAllAndRefetch(refetch)}
            />
          </aside>

          {/* Resultados */}
          <section className="lg:col-span-9">
            {viewMode === "grid" ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {filteredRows.map((art) => (
                  <CatalogCard
                    key={String(art._id)}
                    artwork={art}
                    onAddToCart={() => handleAddToCart(art)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRows.map((art) => (
                  <CatalogCard
                    key={String(art._id)}
                    artwork={art}
                    onAddToCart={() => handleAddToCart(art)}
                    variant="list"
                  />
                ))}
              </div>
            )}

            {/* Cargar más */}
            <div className="flex justify-center">
              {hasNextPage ? (
                <Button
                  className="mt-8"
                  variant="outline"
                  onClick={() => loadMore()}
                  disabled={isFetching}
                >
                  {isFetching ? "Cargando..." : "Cargar más"}
                </Button>
              ) : (
                <p className="mt-8 text-sm text-gray-500">
                  {isLoading || isFetching ? "Cargando..." : "No hay más resultados"}
                </p>
              )}
            </div>

            {/* Vacío */}
            {!isLoading && filteredRows.length === 0 && (
              <EmptyState
                title="Sin obras"
                description="No hay obras que coincidan con los filtros seleccionados en este pabellón."
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
