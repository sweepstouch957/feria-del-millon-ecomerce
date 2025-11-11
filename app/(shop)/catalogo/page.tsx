"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@components/ui/button";
import CatalogCard from "@components/views/catalog/CatalogCard";
import FiltersSidebar from "@components/views/catalog/FiltersSidebar";
import ResultsToolbar from "@components/views/catalog/ResultsToolbar";
import EmptyState from "@components/views/catalog/EmptyState";

import useCart from "@store/useCart";
import {
  useArtworksCursor,
  type ArtworksCursorFilters,
  type ArtworkRow,
} from "@hooks/queries/useArtworksCursor";
import { usePavilions } from "@hooks/queries/usePavilions";
import { useTechniques } from "@hooks/queries/useTechniques";

import { useCatalogState } from "@hooks/ui/catalog/useCatalogState";
import { useFacetCounts } from "@hooks/ui/catalog/useFacetCounts";

const DEFAULT_EVENT_NAME = "Feria del Millón";
const DEFAULT_EVENT_ID = "6909aef219f26eec22af4220";

export default function CatalogPage() {
  const sp = useSearchParams();

  // Estado y sincronía con URL (q, pavilion, techniques, orden, etc.)
  const {
    q,
    setQ,
    pavilion,
    setPavilion,
    techniqueIds,
    toggleTechnique,
    clearTechniques,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    inStock,
    setInStock,
    hasImage,
    setHasImage,
    sortBy,
    setSortBy,
    sortDir,
    toggleSortDir,
    viewMode,
    setViewMode,
    applyFilters,
    clearAllAndRefetch,
  } = useCatalogState({
    initialQ: sp.get("q") ?? "",
    initialPavilion: sp.get("pavilion") ?? "",
    defaultMaxPrice: 10_000_000,
  });

  // Remotos
  const {
    data: pavilionsData = [],
    isLoading: loadingPavs,
    isError: errPavs,
  } = usePavilions(DEFAULT_EVENT_ID);
  const {
    data: techniquesData = [],
    isLoading: loadingTechs,
    isError: errTechs,
  } = useTechniques();

  const techniqueCsv = techniqueIds.length ? techniqueIds.join(",") : undefined;

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
    event: DEFAULT_EVENT_ID,
    pavilion: pavilion || undefined,
    technique: techniqueCsv,
    limit: 24,
  } as ArtworksCursorFilters);

  const { techniques, pavilions: pavCounts } = useFacetCounts(rawRows);

  // Post-filtro local: imagen, stock, rango de precio, orden
  const filteredRows = useMemo(() => {
    let arr = rawRows.slice();

    if (hasImage) {
      arr = arr.filter(
        (r) => (r.image && r.image !== "") || (r.images?.length ?? 0) > 0
      );
    }
    if (inStock) {
      arr = arr.filter((r) => Number(r.stock ?? 0) > 0);
    }
    arr = arr.filter((r) => {
      const p = Number(r.price ?? 0);
      return p >= minPrice && p <= maxPrice;
    });

    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "price")
        return (Number(a.price ?? 0) - Number(b.price ?? 0)) * dir;
      if (sortBy === "_id")
        return (String(a._id) > String(b._id) ? 1 : -1) * dir;
      const ad = new Date(a.createdAt as unknown as string).getTime();
      const bd = new Date(b.createdAt as unknown as string).getTime();
      return (ad - bd) * dir;
    });

    return arr;
  }, [rawRows, hasImage, inStock, minPrice, maxPrice, sortBy, sortDir]);

  // Opciones de pabellón (si no llegan, uso facet de lote)
  const pavilionOptions =
    (pavilionsData.length
      ? pavilionsData.map((p) => ({ id: p._id, name: p.name }))
      : pavCounts
          .sort((a, b) => b.count - a.count)
          .map((p) => ({ id: p.id, name: p.name }))) || [];

  // Carrito
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ResultsToolbar
          title="Catálogo"
          subtitle={`Evento: ${DEFAULT_EVENT_NAME} — Total: ${totalLabel}`}
          viewMode={viewMode}
          onViewMode={setViewMode}
          rightSlot={
            <Button variant="outline" className="relative" title="Carrito">
              Carrito
              <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-black/90 px-2 text-white text-xs">
                {totalItems}
              </span>
            </Button>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar filtros */}
          <aside className="lg:col-span-3">
            <FiltersSidebar
              // búsqueda
              q={q}
              setQ={setQ}
              // pabellón
              pavilion={pavilion}
              setPavilion={setPavilion}
              pavilionOptions={pavilionOptions}
              loadingPavilions={loadingPavs}
              errorPavilions={!!errPavs}
              // técnicas
              techniquesData={techniquesData}
              loadingTechniques={loadingTechs}
              errorTechniques={!!errTechs}
              techniqueIds={techniqueIds}
              onToggleTechnique={toggleTechnique}
              onClearTechniques={clearTechniques}
              // otros filtros visuales
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
              onClear={() => {
                clearAllAndRefetch(refetch);
              }}
              // facets de lote (por si quieres mostrarlos)
              facetTechniques={techniques}
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
                  {isLoading || isFetching
                    ? "Cargando..."
                    : "No hay más resultados"}
                </p>
              )}
            </div>

            {!isLoading && filteredRows.length === 0 && (
              <EmptyState
                title="Sin resultados"
                description="No se encontraron obras que coincidan con los filtros seleccionados."
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
