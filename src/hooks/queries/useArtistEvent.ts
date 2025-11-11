// src/hooks/queries/useArtistEvent.ts
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { EventDoc, EventStatus } from "@services/events.service";
import { getEventByArtistId } from "@services/events.service";

/**
 * Hook para obtener el evento asignado a un artista.
 * - Si el backend responde 404 => retorna `undefined` (no lanza error).
 * - Memoiza por (artistId, status) en la queryKey.
 */
type Options = {
  /** Filtra por estado específico. Si no se pasa, el backend retorna el más “reciente/activo”. */
  status?: EventStatus;
  /** ms que el dato se considera fresco (default 60s). */
  staleTime?: number;
  /** ms de garbage-collection en caché (default 5 min). */
  gcTime?: number;
  /** Evita refetch al volver a la ventana (default false). */
  refetchOnWindowFocus?: boolean;
};

export function useArtistEvent(
  artistId?: string,
  {
    status,
    staleTime = 60_000,
    gcTime = 5 * 60_000,
    refetchOnWindowFocus = false,
  }: Options = {}
) {
  const enabled = Boolean(artistId);

  const queryKey = useMemo(
    () => ["events", "by-artist", artistId ?? null, status ?? null],
    [artistId, status]
  );

  return useQuery<EventDoc | undefined>({
    queryKey,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    retry: (failureCount, err: any) => {
      const statusCode = err?.response?.status ?? err?.status;
      // No reintentar si es 404 (no tiene evento asignado)
      if (statusCode === 404) return false;
      // Reintentos mínimos para errores transitorios
      return failureCount < 2;
    },
    queryFn: async () => {
      try {
        // artistId garantizado por `enabled`
        return await getEventByArtistId(artistId as string, status);
      } catch (e: any) {
        const statusCode = e?.response?.status ?? e?.status;
        if (statusCode === 404) return undefined;
        throw e;
      }
    },
  });
}
