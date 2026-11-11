import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addFavorite, removeFavorite, clearFavorites } from "@services/favorites.service";

/** Obra guardada: lo justo para pintar la tarjeta sin volver a pedirla. */
export type FavoriteItem = {
  id: string;
  title: string;
  artist: string;
  price: number;
  currency?: string;
  image?: string;
  technique?: string;
  kind?: string;
  pavilion?: string;
  stock?: number;
  savedAt: number;
};

type FavoritesState = {
  items: FavoriteItem[];
  /** true cuando ya se cruzó con el servidor en esta sesión. */
  synced: boolean;
  toggle: (item: Omit<FavoriteItem, "savedAt">) => void;
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  /** Lo que devolvió el servidor pasa a ser la lista (lo llama FavoritesSync). */
  replace: (items: FavoriteItem[]) => void;
};

// La UI responde al instante con la copia local; el servidor se entera después.
// Si la red falla, la copia local sigue y el próximo arranque vuelve a cruzar.
const quiet = (p: Promise<unknown>) => void p.catch(() => {});

const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      synced: false,
      toggle: (item) => {
        const id = String(item.id);
        const exists = get().items.some((i) => String(i.id) === id);
        set((s) => ({
          items: exists
            ? s.items.filter((i) => String(i.id) !== id)
            : [{ ...item, id, savedAt: Date.now() }, ...s.items],
        }));
        quiet(exists ? removeFavorite(id) : addFavorite(id));
      },
      remove: (id) => {
        set((s) => ({ items: s.items.filter((i) => String(i.id) !== String(id)) }));
        quiet(removeFavorite(String(id)));
      },
      clear: () => {
        set({ items: [] });
        quiet(clearFavorites());
      },
      has: (id) => get().items.some((i) => String(i.id) === String(id)),
      replace: (items) => set({ items, synced: true }),
    }),
    {
      name: "favorites",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (s) => ({ items: s.items }),
    }
  )
);

export default useFavorites;
