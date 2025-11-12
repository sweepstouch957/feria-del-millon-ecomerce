// src/hooks/queries/useEventArtists.ts
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  listEventArtists,
  type ListEventArtistsQuery,
  type ListEventArtistsResponse,
  type ArtistSort,
} from "@services/events.service";

type Options = {
  /** ms que el dato se considera fresco (default 60s). */
  staleTime?: number;
  /** ms de garbage-collection en caché (default 5 min). */
  gcTime?: number;
  /** Evita refetch al volver a la ventana (default false). */
  refetchOnWindowFocus?: boolean;
  /** Reintentos ante errores transitorios (default 2, ignora 404). */
  retryCount?: number;
};

export type UseEventArtistsParams = {
  q?: string;
  pavilionId?: string;
  artistId?: string;
  sort?: ArtistSort; // 'artworks' | 'name'
  page?: number; // default 1
  limit?: number; // default 20, máx 100
};

/**
 * Hook para listar artistas de un evento con # de obras y conteo por pabellón.
 * - Memoiza por (eventId, filtros) en la queryKey.
 * - Maneja 404 sin reintentos.
 */
export function useEventArtists(
  eventId?: string,
  params: UseEventArtistsParams = {},
  {
    staleTime = 60_000,
    gcTime = 5 * 60_000,
    refetchOnWindowFocus = false,
    retryCount = 2,
  }: Options = {}
):any {
  const enabled = Boolean(eventId);

  // Sanitizamos params para la queryKey (evitar objetos no estables)
  const safeParams: ListEventArtistsQuery = useMemo(() => {
    const {
      q,
      pavilionId,
      artistId,
      sort = "artworks",
      page = 1,
      limit = 20,
    } = params || {};
    return {
      q: q?.trim() || undefined,
      pavilionId: pavilionId || undefined,
      artistId: artistId || undefined,
      sort,
      page,
      limit,
    };
  }, [params]);

  const queryKey = useMemo(
    () => ["events", eventId ?? null, "artists", safeParams],
    [eventId, safeParams]
  );

  return useQuery<ListEventArtistsResponse>({
    queryKey,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    retry: (failureCount, err: any) => {
      const statusCode = err?.response?.status ?? err?.status;
      if (statusCode === 404) return false; // no reintentar si no hay datos
      return failureCount < retryCount;
    },
    queryFn: async () => {
      // eventId garantizado por `enabled`
      return listEventArtists(eventId as string, safeParams);
    },
    select: (data) => {
      // Derivados útiles para UI (páginas, totales)
      const totalPages =
        data?.limit && data?.limit > 0
          ? Math.max(1, Math.ceil((data.total ?? 0) / data.limit))
          : 1;

      return {
        ...data,
        totalPages,
      };
    },
  });
}
