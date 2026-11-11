  "use client";

  import { useMemo } from "react";
  import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
  import {
    listArtworks,
    type CursorListResponse,
    type ArtworkDoc,
  } from "@services/artworks.service";

  type ArtistInfo = {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  type TechniqueInfo = { _id: string; name: string; slug?: string };
  type PavilionInfo = { _id: string; name: string; slug?: string };

  export type ArtworkRow = ArtworkDoc & {
    artistInfo?: ArtistInfo | null;
    techniqueInfo?: TechniqueInfo | null;
    pavilionInfo?: PavilionInfo | null;
  };

  export type ArtworksCursorFilters = {
    q?: string;
    event?: string;
    pavilion?: string | "null";
    technique?: string;
    limit?: number;
    artist?: string;
    reproducible?: boolean;
    /** Tope de precio: filtra en el servidor para que el total sea el real. */
    maxPrice?: number;
    sortBy?: "createdAt" | "price";
    sortDir?: "asc" | "desc";
    /** Trae también las obras que esperan a que se publique el catálogo.
     *  Lo usa el artista en su estudio: son sus propias obras. */
    includeHidden?: boolean | number | string;
    /** Solo campos de tarjeta (sin descripción, galería ni etiquetas): la
     *  página pesa la mitad. Lo usa el catálogo; el resto pide el doc completo. */
    lite?: boolean;
  };

  export function useArtworksCursor(filters: ArtworksCursorFilters = {}) {
    const params = useMemo(
      () => ({
        q: filters.q || undefined,
        event: filters.event || undefined,
        pavilion: filters.pavilion || undefined,
        technique: filters.technique || undefined,
        limit: filters.limit ?? 24,
        artist: filters.artist || undefined,
        reproducible: filters.reproducible,
        maxPrice: filters.maxPrice || undefined,
        sortBy: filters.sortBy || undefined,
        sortDir: filters.sortDir || undefined,
        includeHidden: filters.includeHidden || undefined,
        lite: filters.lite ? 1 : undefined,
      }),
      [
        filters.q,
        filters.event,
        filters.pavilion,
        filters.technique,
        filters.limit,
        filters.artist,
        filters.reproducible,
        filters.maxPrice,
        filters.sortBy,
        filters.sortDir,
        filters.includeHidden,
        filters.lite,
      ]
    );

    const query = useInfiniteQuery<
      CursorListResponse<ArtworkRow>,
      Error,
      CursorListResponse<ArtworkRow>,
      readonly ["artworks", typeof params],
      string | undefined
    >({
      queryKey: ["artworks", params] as const,
      queryFn: ({ pageParam }) => listArtworks({ ...params, cursor: pageParam }),
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      initialPageParam: undefined,
      // Volver de la obra al catálogo no vuelve a pedir nada durante 5 min.
      staleTime: 5 * 60_000,
      // Al cambiar un filtro se queda la grilla anterior (atenuada) en vez del
      // esqueleto: la nueva llega en ~150 ms y no parpadea.
      placeholderData: keepPreviousData,
    });

    const pages = useMemo(
      () => ((query.data as any)?.pages ?? []) as any[],
      [query.data]
    );

    // Memoizado a propósito: sin esto es un arreglo nuevo por render y
    // cualquier efecto que dependa de él entra en bucle.
    const rows: ArtworkRow[] = useMemo(
      () => pages.flatMap((p: any) => p.docs) ?? [],
      [pages]
    );
    const totalFromApi = pages[0]?.pageInfo?.total as number | undefined;
    const totalLabel =
      typeof totalFromApi === "number"
        ? `${totalFromApi}`
        : pages.length > 0
        ? `${rows.length}${query.hasNextPage ? "+" : ""}`
        : query.isLoading
        ? "—"
        : `${rows.length}`;

    // Total numérico: el real del servidor si lo manda; si no, lo cargado.
    const total = typeof totalFromApi === "number" ? totalFromApi : rows.length;

    return { ...query, rows, total, totalLabel, loadMore: () => query.fetchNextPage() };
  }
