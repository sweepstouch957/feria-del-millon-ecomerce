"use client";

import { useMemo, useEffect, useRef } from "react";
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
import { useTechniques } from "@hooks/queries/useTechniques";
import { useCatalogState } from "@hooks/ui/catalog/useCatalogState";
import { useFacetCounts } from "@hooks/ui/catalog/useFacetCounts";
import { useEventArtists } from "@hooks/queries/useEventArtists";
import {
  DEFAULT_EVENT_ID,
  DEFAULT_EVENT_NAME,
  FIXED_PAVILION_ID,
  FIXED_PAVILION_NAME,
} from "@core/constants";
import { AutocompleteOption } from "@components/ui/autocomplete";

export default function CatalogPageClient() {
  const sp = useSearchParams();

  const {
    q,
    setQ,
    pavilion,
    setPavilion,
    artistId,
    setArtistId,
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
    initialPavilion: sp.get("pavilion") ?? FIXED_PAVILION_ID,
    initialArtistId: sp.get("artistId") ?? "",
    defaultMaxPrice: 10_000_000,
  });

  // ===== Técnicas
  const {
    data: techniquesData = [],
    isLoading: loadingTechs,
    isError: errTechs,
  } = useTechniques();

  // ===== Artistas (para el autocomplete)
  const {
    data: artistsResp,
    isFetching: loadingArtists,
    error: errArtists,
  } = useEventArtists(
    DEFAULT_EVENT_ID,
    {
      pavilionId: FIXED_PAVILION_ID,
      sort: "name",
      page: 1,
      limit: 500,
    },
    {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    }
  );

  const artistOptions: AutocompleteOption[] = useMemo(
    () =>
      (artistsResp?.rows ?? []).map((row: any) => {
        const a = row.artist ?? row;
        const fullName = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
        return {
          value: String(a.id ?? a._id),
          label: fullName || a.name || a.displayName || "Artista sin nombre",
        };
      }),
    [artistsResp]
  );

  const techniqueCsv = techniqueIds.length ? techniqueIds.join(",") : undefined;
  const effectivePavilion = pavilion || FIXED_PAVILION_ID;

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
    pavilion: effectivePavilion,
    technique: techniqueCsv,
    limit: 12,
    artist: artistId || undefined,
  } as ArtworksCursorFilters);

  const { techniques } = useFacetCounts(rawRows);

  const filteredRows = useMemo(() => {
    let arr = rawRows.slice();

    if (hasImage) {
      arr = arr.filter(
        (r) =>
          (r.image && r.image !== "") || (r.images?.length ?? 0) > 0
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

  // Pabellón fijo
  const pavilionOptions = [
    { id: FIXED_PAVILION_ID, name: FIXED_PAVILION_NAME },
  ];

  const addToCart = useCart((s) => s.add);
  const totalItems = useCart((s) => s.totalItems)();

  const handleAddToCart = (art: ArtworkRow, qty = 1) => {
    addToCart(
      {
        id: String(art._id),
        title: art.title,
        artist: art?.artist ?? "Desconocido",
        price: Number(art.price ?? 0),
        image: art.image ?? art.images?.[0] ?? "/placeholder.png",
      },
      qty
    );
  };

  // ===== Infinite scroll (IntersectionObserver)
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetching) {
          loadMore();
        }
      },
      {
        root: null,
        rootMargin: "300px", // empieza a cargar antes de llegar al final
        threshold: 0.1,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetching, loadMore]);

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
          <aside className="lg:col-span-3">
            <FiltersSidebar
              q={q}
              setQ={setQ}
              pavilion={pavilion}
              setPavilion={setPavilion}
              pavilionOptions={pavilionOptions}
              loadingPavilions={false}
              errorPavilions={false}
              techniquesData={techniquesData}
              loadingTechniques={loadingTechs}
              errorTechniques={!!errTechs}
              techniqueIds={techniqueIds}
              onToggleTechnique={toggleTechnique}
              onClearTechniques={clearTechniques}
              // artista
              artistId={artistId}
              setArtistId={setArtistId}
              artistOptions={artistOptions}
              loadingArtists={loadingArtists}
              errorArtists={!!errArtists}
              // filtros locales
              minPrice={minPrice}
              maxPrice={maxPrice}
              setMinPrice={setMinPrice}
              setMaxPrice={setMaxPrice}
              inStock={inStock}
              setInStock={setInStock}
              hasImage={hasImage}
              setHasImage={setHasImage}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDir={sortDir}
              toggleSortDir={toggleSortDir}
              onApply={() => {
                refetch();
                applyFilters();
              }}
              onClear={() => {
                clearAllAndRefetch(refetch);
              }}
              facetTechniques={techniques}
            />
          </aside>

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

            {/* Sentinel para infinite scroll */}
            <div ref={loadMoreRef} className="flex justify-center mt-8 mb-4">
              {isFetching && (
                <p className="text-sm text-gray-500">Cargando más obras…</p>
              )}
              {!hasNextPage && !isLoading && !isFetching && filteredRows.length > 0 && (
                <p className="text-sm text-gray-500">
                  No hay más resultados
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
