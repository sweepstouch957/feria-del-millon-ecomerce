"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPublicArtistProfile,
  type PublicArtistProfile,
} from "@services/applications.service";

export function useArtistProfile(artistId?: string) {
  return useQuery<PublicArtistProfile | null>({
    queryKey: ["artist-profile", artistId],
    queryFn: () => getPublicArtistProfile(artistId as string),
    enabled: Boolean(artistId),
    staleTime: 5 * 60_000,
    retry: false, // un artista sin solicitud aceptada no es un error a reintentar
  });
}
