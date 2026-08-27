"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type CatalogMode = "general" | "pabellon";

type Opts = {
  initialQ?: string;
  initialPavilion?: string;
  initialArtistId?: string;
  /** Ids de tecnica preseleccionados (llegan como csv en ?tecnica=). */
  initialTechniqueIds?: string[];
  /** Agrupación del catálogo: "general" (plano) o "pabellon" (agrupado). */
  initialMode?: CatalogMode;
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
  const [techniqueIds, setTechniqueIds] = useState<string[]>(
    opts.initialTechniqueIds ?? []
  );
  const [mode, setMode] = useState<CatalogMode>(opts.initialMode ?? "general");

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
    const currentMode = sp.get("modo") ?? "";
    const currentTech = sp.get("tecnica") ?? "";

    if (q) sp.set("q", q);
    else sp.delete("q");

    if (pavilion) sp.set("pavilion", pavilion);
    else sp.delete("pavilion");

    if (artistId) sp.set("artistId", artistId);
    else sp.delete("artistId");

    if (mode === "pabellon") sp.set("modo", "pabellon");
    else sp.delete("modo");

    const techCsv = techniqueIds.join(",");
    if (techCsv) sp.set("tecnica", techCsv);
    else sp.delete("tecnica");

    const nextQuery = sp.toString();
    const nextUrl = `${basePath}${nextQuery ? `?${nextQuery}` : ""}`;
    const currentQuery = searchParams.toString();
    const currentUrl = `${pathname}${currentQuery ? `?${currentQuery}` : ""}`;

    // Evita replace inútil si no cambió nada
    if (
      nextUrl !== currentUrl ||
      q !== currentQ ||
      pavilion !== currentPavilion ||
      artistId !== currentArtistId ||
      (mode === "pabellon" ? "pabellon" : "") !== currentMode ||
      techniqueIds.join(",") !== currentTech
    ) {
      router.replace(nextUrl, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pavilion, artistId, mode, techniqueIds, basePath]);

  const toggleTechnique = (id: string) =>
    setTechniqueIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const clearTechniques = () => setTechniqueIds([]);

  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  const applyFilters = () => {
    /* noop por ahora */
  };

  const clearAll = () => {
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
    sp.delete("modo");
    sp.delete("tecnica");
    router.replace(`${basePath}?${sp.toString()}`, { scroll: false });
  };

  const clearAllAndRefetch = (refetch: () => void) => {
    clearAll();
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
    mode,
    setMode,
    applyFilters,
    clearAll,
    clearAllAndRefetch,
  };
}
