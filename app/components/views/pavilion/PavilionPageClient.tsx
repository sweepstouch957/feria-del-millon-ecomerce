// @components/views/pavilion/PavilionPageClient.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import {
  Landmark,
  SlidersHorizontal,
  ArrowUpDown,
  FileText,
} from "lucide-react";

type Props = { eventId: string; slug: string };

const TERMS_URL =
  "https://issuu.com/feriadelmillon/docs/bases_convocatoria_arte_fresco_-_coste_ita";

export default function PavilionPageClient({ eventId, slug }: Props) {
  // ===== Pavilion detail
  const { data: pavilion, isLoading: loadingPavilion } = usePavilionBySlug(
    eventId,
    slug
  );

  // ===== UI state catálogo
  const {
    q,
    setQ,
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
    initialQ: "",
    initialPavilion: "",
    defaultMaxPrice: pavilion?.maxArtworkPrice ?? 10_000_000,
  });

  // ===== Mobile UI helpers
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ===== Técnicas
  const {
    data: techniquesData = [],
    isLoading: loadingTechs,
    isError: errTechs,
  } = useTechniques();
  const techniqueCsv = techniqueIds.length ? techniqueIds.join(",") : undefined;

  // ===== Artworks
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
    pavilion: pavilion?._id,
    technique: techniqueCsv,
    limit: 12,
  } as ArtworksCursorFilters);

  // ===== Post-filtro local
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
      return p >= (minPrice ?? 0) && p <= (maxPrice ?? Number.MAX_SAFE_INTEGER);
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
        <div className="mb-6 md:mb-8 animate-pulse">
          <div className="h-7 w-56 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-72 bg-gray-200 rounded" />
        </div>
      );
    }
    if (!pavilion) return null;

    return (
      <div className="mb-6 md:mb-8">
        <div className="flex items-start justify-between gap-3 md:gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-gray-600 mb-1">
              <Landmark className="h-4 w-4 shrink-0" />
              <span className="text-sm">Pabellón</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 truncate">
              {pavilion.name}
            </h1>
            {pavilion.description && (
              <p className="text-gray-600 mt-2 md:max-w-3xl text-sm md:text-base">
                {pavilion.description.slice(0, 220)}
                {pavilion.description.length > 220 ? "…" : ""}
              </p>
            )}

            <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
              {pavilion.validFrom && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                  Inicio:{" "}
                  {format(new Date(pavilion.validFrom), "PPPp", { locale: es })}
                </span>
              )}
              {pavilion.validTo && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                  Fin:{" "}
                  {format(new Date(pavilion.validTo), "PPPp", { locale: es })}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                Obras: {totalLabel}
              </span>
              {(pavilion.minArtworkPrice || pavilion.maxArtworkPrice) && (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                  Precio:{" "}
                  {Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  }).format(pavilion.minArtworkPrice ?? 0)}{" "}
                  —{" "}
                  {Intl.NumberFormat("es-CO", {
                    style: "currency",
                    currency: "COP",
                    minimumFractionDigits: 0,
                  }).format(pavilion.maxArtworkPrice ?? 0)}
                </span>
              )}
            </div>
          </div>

          {/* Carrito header (oculto en xs para ahorrar espacio) */}
          <Button
            variant="outline"
            className="relative hidden sm:inline-flex"
            title="Carrito"
          >
            Carrito
            <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-black/90 px-2 text-white text-xs">
              {totalItems}
            </span>
          </Button>
        </div>

        {/* Términos y condiciones (visible también en desktop) */}
        <div className="mt-3">
          <Link
            href={TERMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 underline underline-offset-4"
          >
            <FileText className="h-4 w-4" />
            Términos y condiciones
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <Header />

        {/* Toolbar superior */}
        <ResultsToolbar
          title="Obras del pabellón"
          subtitle={
            pavilion ? `Explora las obras de ${pavilion.name}` : "Cargando…"
          }
          viewMode={viewMode}
          onViewMode={setViewMode}
          // en móvil dejamos limpia la barra, las acciones principales van abajo
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Sidebar de filtros (solo desktop) */}
          <aside className="hidden lg:block lg:col-span-3">
            <FiltersSidebar
              q={q}
              setQ={setQ}
              pavilion={pavilion?._id || ""}
              setPavilion={() => {}}
              pavilionOptions={[]}
              loadingPavilions={false}
              errorPavilions={false}
              techniquesData={techniquesData}
              loadingTechniques={loadingTechs}
              errorTechniques={!!errTechs}
              techniqueIds={techniqueIds}
              onToggleTechnique={toggleTechnique}
              onClearTechniques={clearTechniques}
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
              onClear={() => clearAllAndRefetch(refetch)}
            />
          </aside>

          {/* Resultados */}
          <section className="lg:col-span-9">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {filteredRows.map((art) => (
                  <CatalogCard
                    key={String(art._id)}
                    artwork={art}
                    onAddToCart={() => handleAddToCart(art)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
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

            {/* Cargar más / Estado */}
            <div className="flex justify-center">
              {hasNextPage ? (
                <Button
                  className="mt-6 md:mt-8 w-full sm:w-auto"
                  variant="outline"
                  onClick={() => loadMore()}
                  disabled={isFetching}
                >
                  {isFetching ? "Cargando..." : "Cargar más"}
                </Button>
              ) : (
                <p className="mt-6 md:mt-8 text-sm text-gray-500">
                  {isLoading || isFetching
                    ? "Cargando..."
                    : "No hay más resultados"}
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

      {/* ====== Barra inferior (solo móvil) ====== */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 p-3 flex gap-2 sm:hidden">
        <Button
          className="flex-1"
          variant="outline"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtros
        </Button>

        <Button
          className="flex-1"
          variant="outline"
          onClick={() => {
            toggleSortDir();
            refetch();
          }}
          title={`Orden: ${sortBy === "price" ? "precio" : "reciente"} ${
            sortDir === "asc" ? "↑" : "↓"
          }`}
        >
          <ArrowUpDown className="h-4 w-4 mr-2" />
          Orden
        </Button>

        <Link
          href={TERMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition"
        >
          <FileText className="h-4 w-4 mr-2" />
          Términos
        </Link>
      </div>

      {/* ====== Sheet de filtros en móvil ====== */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85%] rounded-t-2xl bg-white shadow-2xl border-t border-gray-200">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold">Filtros</h3>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cerrar
              </button>
            </div>
            <div className="px-4 pb-24 overflow-y-auto">
              <FiltersSidebar
                q={q}
                setQ={setQ}
                pavilion={pavilion?._id || ""}
                setPavilion={() => {}}
                pavilionOptions={[]}
                loadingPavilions={false}
                errorPavilions={false}
                techniquesData={techniquesData}
                loadingTechniques={loadingTechs}
                errorTechniques={!!errTechs}
                techniqueIds={techniqueIds}
                onToggleTechnique={toggleTechnique}
                onClearTechniques={clearTechniques}
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
                  setMobileFiltersOpen(false);
                }}
                onClear={() => {
                  clearAllAndRefetch(refetch);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
