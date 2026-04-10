// src/hooks/queries/useUser.ts
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  UserDoc,
  UpdateUserPayload,
} from "@services/users.service";
import {
  getUserById,
  updateUserById,
} from "@services/users.service";

type Options = {
  /** ms que el dato se considera fresco (default 60s). */
  staleTime?: number;
  /** ms de garbage-collection en caché (default 5 min). */
  gcTime?: number;
  /** Evita refetch al volver a la ventana (default false). */
  refetchOnWindowFocus?: boolean;
};

/**
 * Hook para obtener un usuario por ID.
 * - Si el backend responde 404 => retorna `undefined` (no lanza error).
 * - Memoiza por userId en la queryKey.
 */
export function useUser(
  userId?: string,
  {
    staleTime = 60_000,
    gcTime = 5 * 60_000,
    refetchOnWindowFocus = false,
  }: Options = {}
) {
  const enabled = Boolean(userId);

  const queryKey = useMemo(
    () => ["users", "by-id", userId ?? null],
    [userId]
  );

  const query = useQuery<UserDoc | undefined>({
    queryKey,
    enabled,
    staleTime,
    gcTime,
    refetchOnWindowFocus,
    retry: (failureCount, err: any) => {
      const statusCode = err?.response?.status ?? err?.status;
      // No reintentar si es 404 (usuario no existe)
      if (statusCode === 404) return false;
      // Reintentos mínimos para errores transitorios
      return failureCount < 2;
    },
    queryFn: async () => {
      try {
        return await getUserById(userId as string);
      } catch (e: any) {
        const statusCode = e?.response?.status ?? e?.status;
        if (statusCode === 404) return undefined;
        throw e;
      }
    },
  });

  return query;
}

/**
 * Hook para mutar/actualizar un usuario específico.
 * - Usa PATCH /auth/users/:id
 * - Actualiza el cache de `useUser` al éxito.
 */
export function useUpdateUser(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["users", "by-id", userId ?? null],
    [userId]
  );

  const mutation = useMutation({
    mutationFn: (payload: UpdateUserPayload) =>
      updateUserById(userId, payload),
    onSuccess: (updatedUser) => {
      // Actualizar cache puntual de ese usuario
      queryClient.setQueryData<UserDoc | undefined>(queryKey, updatedUser);
      // O si quieres invalidar para refetch:
      // queryClient.invalidateQueries({ queryKey });
    },
  });

  return mutation;
}
