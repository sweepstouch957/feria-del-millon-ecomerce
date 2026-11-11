"use client";

import { useMemo } from "react";
import Link from "next/link";
import useCart from "@store/useCart";
import useFavorites from "@store/useFavorites";
import { useMounted } from "@hooks/useMounted";
import { ArtworkCard } from "@components/views/catalog/ArtworkCard";
import { I, ShopShell, cardToCart, favToCard, fmt, plural } from "@components/views/catalog/shared";

/* Favoritos — port de "Favoritos — Desktop" (+ variante celular del mismo diseño).
   Vive en localStorage (store useFavorites); nada que pedir al servidor. */

export default function FavoritesPageClient() {
  const mounted = useMounted();
  const stored = useFavorites((s) => s.items);
  const clearFavs = useFavorites((s) => s.clear);
  const cartItems = useCart((s) => s.items);
  const addToCart = useCart((s) => s.add);

  const favs = mounted ? stored : [];
  const works = useMemo(() => favs.map(favToCard), [favs]);
  const total = works.reduce((a, w) => a + w.price, 0);
  const pending = works.filter((w) => !cartItems.some((c) => String(c.id) === w.id) && !(w.stock != null && w.stock <= 0));
  const n = works.length;

  const addAll = () => pending.forEach((w) => addToCart(cardToCart(w), 1));
  const cartLabel = pending.length === 0 ? "Todas están en el carrito" : `Agregar ${pending.length} al carrito`;

  return (
    <ShopShell>
      <main className="fdm-wrap" style={{ paddingBottom: 72 }}>
        <section className="fdm-page-head">
          <div className="col">
            <Link href="/catalogo" className="fdm-back">{I.back({ size: 18 })}Volver al catálogo</Link>
            <h1 className="fdm-h1">Favoritos</h1>
            <span className="sub">
              {!mounted
                ? " "
                : n === 0
                ? "Guarda obras para compararlas y decidir después."
                : `${n} ${plural(n, "obra guardada", "obras guardadas")} · ${fmt(total)} en total`}
            </span>
          </div>
          {n > 0 && (
            <div className="fdm-page-actions">
              <button type="button" className="fdm-btn is-ghost" onClick={clearFavs}>Vaciar favoritos</button>
              <button type="button" className="fdm-btn" onClick={addAll} disabled={pending.length === 0}>{cartLabel}</button>
            </div>
          )}
        </section>

        {mounted && n === 0 && (
          <div className="fdm-empty" style={{ marginTop: 32, padding: "80px 24px" }}>
            {I.heart({ size: 36, sw: 1.2 })}
            <span className="t">Aún no tienes favoritos</span>
            <span className="s">Toca el corazón de cualquier obra para guardarla aquí y decidir con calma.</span>
            <Link href="/catalogo" className="fdm-btn is-caps">Explorar el catálogo</Link>
          </div>
        )}

        {n > 0 && (
          <>
            <section className="fdm-grid fdm-fav-grid" aria-label="Obras favoritas">
              {works.map((w) => <ArtworkCard key={w.id} art={w} />)}
            </section>
            <div className="fdm-fav-bar">
              <button type="button" className="fdm-btn" onClick={addAll} disabled={pending.length === 0}>{cartLabel}</button>
              <button type="button" className="fdm-btn is-ghost" onClick={clearFavs}>Vaciar favoritos</button>
            </div>
          </>
        )}
      </main>
    </ShopShell>
  );
}
