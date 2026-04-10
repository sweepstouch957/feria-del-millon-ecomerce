"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Opts = {
  initialQ?: string;
  initialPavilion?: string;
  initialArtistId?: string;
  defaultMaxPrice?: number;
  /** Opcional: forzar un path base; si no se pasa, usa la ruta actual */
  basePath?: string;
};

export function useCatalogState(opts: Opts) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const basePath = opts.basePath ?? pathname;

  const [q, setQ] = useState(opts.initialQ ?? "");
  const [pavilion, setPavilion] = useState(opts.initialPavilion ?? "");
  const [artistId, setArtistId] = useState(opts.initialArtistId ?? "");
  const [techniqueIds, setTechniqueIds] = useState<string[]>([]);

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(opts.defaultMaxPrice ?? 10_000_000);
  const [inStock, setInStock] = useState(false);
  const [hasImage, setHasImage] = useState(true);

  const [sortBy, setSortBy] = useState<"createdAt" | "price" | "_id">(
    "createdAt"
  );
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // URL sync q/pavilion/artistId (sin forzar /catalogo)
  useEffect(() => {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    const currentQ = sp.get("q") ?? "";
    const currentPavilion = sp.get("pavilion") ?? "";
    const currentArtistId = sp.get("artistId") ?? "";

    if (q) sp.set("q", q);
    else sp.delete("q");

    if (pavilion) sp.set("pavilion", pavilion);
    else sp.delete("pavilion");

    if (artistId) sp.set("artistId", artistId);
    else sp.delete("artistId");

    const nextQuery = sp.toString();
    const nextUrl = `${basePath}${nextQuery ? `?${nextQuery}` : ""}`;
    const currentQuery = searchParams.toString();
    const currentUrl = `${pathname}${currentQuery ? `?${currentQuery}` : ""}`;

    // Evita replace inútil si no cambió nada
    if (
      nextUrl !== currentUrl ||
      q !== currentQ ||
      pavilion !== currentPavilion ||
      artistId !== currentArtistId
    ) {
      router.replace(nextUrl, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pavilion, artistId, basePath]);

  const toggleTechnique = (id: string) =>
    setTechniqueIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const clearTechniques = () => setTechniqueIds([]);

  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  const applyFilters = () => {
    /* noop por ahora */
  };

  const clearAllAndRefetch = (refetch: () => void) => {
    setQ("");
    setPavilion("");
    setArtistId("");
    setTechniqueIds([]);
    setMinPrice(0);
    setMaxPrice(opts.defaultMaxPrice ?? 10_000_000);
    setInStock(false);
    setHasImage(true);
    setSortBy("createdAt");
    setSortDir("desc");

    // Limpia también la URL en la ruta actual
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    sp.delete("q");
    sp.delete("pavilion");
    sp.delete("artistId");
    router.replace(`${basePath}?${sp.toString()}`, { scroll: false });

    refetch();
  };

  return {
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
  };
}
