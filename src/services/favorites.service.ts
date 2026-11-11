import apiClient from "src/http/axios";
import type { ArtworkDoc } from "./artworks.service";

/* Favoritos en el servidor (inventory-svc, /catalogs/favorites).
   Sin cuenta, el dueño es un id anónimo del navegador (header x-fav-owner);
   con sesión, el JWT manda y el id anónimo se fusiona al entrar. */

const OWNER_KEY = "fav-owner";

export function anonOwner(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(OWNER_KEY) || "";
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = (crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`).replace(/[^A-Za-z0-9_-]/g, "");
      localStorage.setItem(OWNER_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

const cfg = () => ({ withCredentials: true, headers: { "x-fav-owner": anonOwner() } });

export type FavoritesResponse = { owner: string | null; ids: string[]; docs: ArtworkDoc[] };

export const getFavorites = async (): Promise<FavoritesResponse> => {
  const { data } = await apiClient.get<FavoritesResponse>("/catalogs/favorites", cfg());
  return data;
};

export const addFavorite = (artworkId: string) =>
  apiClient.put(`/catalogs/favorites/${encodeURIComponent(artworkId)}`, null, cfg());

export const removeFavorite = (artworkId: string) =>
  apiClient.delete(`/catalogs/favorites/${encodeURIComponent(artworkId)}`, cfg());

export const clearFavorites = () => apiClient.delete("/catalogs/favorites", cfg());

export const mergeFavorites = (anon: string) =>
  apiClient.post("/catalogs/favorites/merge", { anon }, cfg());
