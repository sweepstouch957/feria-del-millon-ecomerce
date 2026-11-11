"use client";

import { useMemo } from "react";
import Link from "next/link";
import useCart, { type CartItem } from "@store/useCart";
import useFavorites from "@store/useFavorites";
import { useMounted } from "@hooks/useMounted";
import SmartImage from "@components/ui/SmartImage";
import SiteFooter from "@components/SiteFooter";
import FairModeGate from "@components/FairModeGate";
import { ArtworkCard } from "@components/views/catalog/ArtworkCard";
import { I, ShopShell, favToCard, fmt, plural } from "@components/views/catalog/shared";

/* Carrito — port de "Carrito — Desktop" (+ variante celular del mismo diseño).
   Filas con "Guardar para después" / "Quitar", resumen pegajoso y
   "De tus favoritos" con lo guardado que aún no está en el carrito. */

export default function CartPage() {
  return (
    <>
      <FairModeGate>
        <CartView />
      </FairModeGate>
      <SiteFooter />
    </>
  );
}

const firstImage = (img: unknown): string => {
  if (Array.isArray(img)) return String(img[0] ?? "");
  if (typeof img === "string") return img.trim();
  return "";
};

function CartView() {
  const mounted = useMounted();
  const stored = useCart((s) => s.items);
  // Antes de hidratar, el carrito se pinta vacío igual que en el servidor.
  const items: CartItem[] = mounted ? stored : [];
  const updateQty = useCart((s) => s.updateQty);
  const remove = useCart((s) => s.remove);
  const favs = useFavorites((s) => s.items);
  const toggleFav = useFavorites((s) => s.toggle);
  const hasFav = (id: string) => favs.some((f) => String(f.id) === String(id));

  const count = items.reduce((a, i) => a + Number(i.quantity ?? 1), 0);
  const subtotal = items.reduce((a, i) => a + Number(i.price ?? 0) * Number(i.quantity ?? 1), 0);
  const piezas = `${count} ${plural(count, "pieza", "piezas")}`;

  const suggest = useMemo(
    () => (mounted ? favs.filter((f) => !stored.some((c) => String(c.id) === String(f.id))).slice(0, 5).map(favToCard) : []),
    [favs, stored, mounted]
  );

  const moveToFav = (it: CartItem) => {
    if (!hasFav(it.id)) {
      toggleFav({
        id: String(it.id),
        title: it.title,
        artist: it.artist,
        price: Number(it.price ?? 0),
        image: firstImage(it.image),
        technique: it.technique,
        kind: it.kind,
        pavilion: it.pavilion,
      });
    }
    remove(String(it.id));
  };

  return (
    <ShopShell>
      <main className="fdm-wrap" style={{ paddingBottom: 72 }}>
        <section className="fdm-page-head" style={{ flexDirection: "column", alignItems: "stretch", gap: 4 }}>
          <nav className="fdm-crumb" aria-label="Ruta">
            <Link href="/catalogo">Catálogo</Link>
            <span aria-hidden="true">/</span>
            <span className="cur">Carrito</span>
          </nav>
          <h1 className="fdm-h1">Carrito</h1>
          <span className="sub">{mounted ? piezas : " "}</span>
        </section>

        {mounted && items.length === 0 && (
          <div className="fdm-empty" style={{ marginTop: 32, padding: "80px 24px" }}>
            {I.cart({ size: 36, sw: 1.2 })}
            <span className="t">Tu carrito está vacío</span>
            <span className="s">Agrega las obras que quieras llevarte. Cada pieza es única.</span>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
              <Link href="/catalogo" className="fdm-btn is-caps">Seguir viendo obras</Link>
              {favs.length > 0 && <Link href="/favoritos" className="fdm-btn is-outline is-caps" style={{ padding: "0 24px" }}>Ver mis favoritos</Link>}
            </div>
          </div>
        )}

        {items.length > 0 && (
          <div className="fdm-cart-shell">
            <section className="fdm-cart-list" aria-label="Piezas en el carrito">
              {items.map((it) => {
                const href = `/obra/${encodeURIComponent(String(it.id))}`;
                const qty = Number(it.quantity ?? 1);
                const img = firstImage(it.image);
                const meta = [it.technique, it.kind].filter(Boolean).join(" · ");
                return (
                  <article key={it.id} className="fdm-cart-row">
                    <Link href={href} className="fdm-cart-img" aria-label={it.title}>
                      {img && img !== "/placeholder.png" ? (
                        <span className="ph"><SmartImage src={img} alt={it.title} sizes="120px" /></span>
                      ) : (
                        <span className="ph" style={{ background: "var(--tile2)" }} />
                      )}
                    </Link>
                    <div className="fdm-cart-main">
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <Link href={href} className="fdm-cart-title">{it.title}</Link>
                        <span className="fdm-cart-price fdm-m-only">{fmt(Number(it.price ?? 0) * qty)}</span>
                      </div>
                      {it.artist && <span className="fdm-cart-artist">{it.artist}</span>}
                      {meta && <span className="fdm-cart-meta">{meta}</span>}
                      {it.pavilion && <span className="fdm-cart-meta">{it.pavilion}</span>}
                      <div className="fdm-cart-acts">
                        <button type="button" className="fdm-link-u" onClick={() => moveToFav(it)}>
                          {I.heart({ size: 18 })}Guardar para después
                        </button>
                        <button type="button" className="fdm-link-u is-mute" onClick={() => remove(String(it.id))}>
                          {I.close({ size: 18 })}Quitar
                        </button>
                        {/* ponytail: cantidad solo cuando ya hay más de una (reproducciones); una pieza única no la necesita. */}
                        {(qty > 1 || it.kind === "Reproducción") && (
                          <span className="fdm-qty" aria-label="Cantidad">
                            <button type="button" aria-label="Quitar una" disabled={qty <= 1} onClick={() => updateQty(String(it.id), qty - 1)}>−</button>
                            <span>{qty}</span>
                            <button type="button" aria-label="Agregar una" onClick={() => updateQty(String(it.id), qty + 1)}>+</button>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="fdm-cart-price fdm-d-only">{fmt(Number(it.price ?? 0) * qty)}</span>
                  </article>
                );
              })}
              <Link href="/catalogo" className="fdm-back" style={{ marginTop: 12, color: "var(--fg)" }}>
                {I.back({ size: 18 })}Seguir viendo obras
              </Link>
            </section>

            <aside className="fdm-cart-aside" aria-label="Resumen">
              <h2>Resumen</h2>
              <div className="fdm-cart-sub">
                <span>Subtotal · {piezas}</span>
                <span>{fmt(subtotal)}</span>
              </div>
              <div className="fdm-cart-total">
                <span className="t">Total</span>
                <span className="v">{fmt(subtotal)}</span>
              </div>
              <Link href="/checkout" className="fdm-cart-cta">
                Finalizar compra
                {I.arrow({ size: 18, sw: 1.6 })}
              </Link>
              <p className="fdm-cart-note">
                {I.info({ size: 18, sw: 1.6 })}
                <span>Cada pieza es única: si alguien la compra antes, se libera del carrito.</span>
              </p>
            </aside>
          </div>
        )}

        {suggest.length > 0 && (
          <section className="fdm-suggest" aria-label="De tus favoritos">
            <div className="fdm-suggest-head">
              <h2>De tus favoritos</h2>
              <Link href="/favoritos" className="fdm-link-u">Ver todos los favoritos</Link>
            </div>
            <div className="fdm-grid">
              {suggest.map((w) => <ArtworkCard key={w.id} art={w} />)}
            </div>
          </section>
        )}
      </main>
    </ShopShell>
  );
}
