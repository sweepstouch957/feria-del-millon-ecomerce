"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Opts = {
  initialQ?: string;
  initialPavilion?: string;
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

  // URL sync q/pavilion (sin forzar /catalogo)
  useEffect(() => {
    const sp = new URLSearchParams(Array.from(searchParams.entries()));
    const currentQ = sp.get("q") ?? "";
    const currentPavilion = sp.get("pavilion") ?? "";

    if (q) sp.set("q", q);
    else sp.delete("q");
    if (pavilion) sp.set("pavilion", pavilion);
    else sp.delete("pavilion");

    // Evita replace inútil si no cambió nada
    const nextUrl = `${basePath}?${sp.toString()}`;
    const currentUrl = `${pathname}?${searchParams.toString()}`;
    if (
      nextUrl !== currentUrl ||
      q !== currentQ ||
      pavilion !== currentPavilion
    ) {
      router.replace(nextUrl, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, pavilion, basePath]);

  const toggleTechnique = (id: string) =>
    setTechniqueIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const clearTechniques = () => setTechniqueIds([]);

  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  const applyFilters = () => {
    /* noop */
  };

  const clearAllAndRefetch = (refetch: () => void) => {
    setQ("");
    setPavilion("");
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
    router.replace(`${basePath}?${sp.toString()}`, { scroll: false });

    refetch();
  };

  return {
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
  };
}
