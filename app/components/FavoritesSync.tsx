"use client";

import { useEffect } from "react";
import useFavorites from "@store/useFavorites";
import { useAuth } from "@provider/authProvider";
import { addFavorite, anonOwner, getFavorites, mergeFavorites } from "@services/favorites.service";
import { cardToFav, toCardArt } from "@components/views/catalog/shared";

/* Cruza los favoritos del navegador con los del servidor al cargar la tienda
   y cada vez que cambia la sesión. Con sesión, lo guardado sin cuenta pasa a
   la cuenta (merge). Lo local que el servidor no tenga se sube; lo que el
   servidor ya no publique se cae. No pinta nada. */
export default function FavoritesSync() {
  const { isAuthenticated, isAuthLoading } = useAuth();

  useEffect(() => {
    if (isAuthLoading) return;
    let alive = true;
    (async () => {
      const anon = anonOwner();
      if (isAuthenticated && anon) await mergeFavorites(anon).catch(() => {});
      const r = await getFavorites();
      if (!alive) return;
      const local = useFavorites.getState().items;
      const server = r.docs.map((d, i) => ({ ...cardToFav(toCardArt(d)), savedAt: Date.now() - i }));
      const known = new Set(r.ids.map(String));
      const onlyLocal = local.filter((l) => !known.has(String(l.id)));
      onlyLocal.forEach((l) => void addFavorite(l.id).catch(() => {}));
      useFavorites.getState().replace([...server, ...onlyLocal]);
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, [isAuthenticated, isAuthLoading]);

  return null;
}
