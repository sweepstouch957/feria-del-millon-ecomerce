"use client";

import Link from "next/link";
import SmartImage from "@components/ui/SmartImage";
import useCart from "@store/useCart";
import useFavorites from "@store/useFavorites";
import { useMounted } from "@hooks/useMounted";
import { useCatalogSalesPaused } from "@provider/siteConfigProvider";
import { I, cardToCart, cardToFav, fmt, type CardArt } from "./shared";

/* Tarjeta de obra (grilla) y fila (lista). Corazón = favoritos, pill = carrito.
   Misma pieza en catálogo, favoritos y "De tus favoritos" del carrito. */

export function useArtActions(art: CardArt) {
  const mounted = useMounted();
  const inCart = useCart((s) => s.items.some((i) => String(i.id) === art.id));
  const addToCart = useCart((s) => s.add);
  const removeFromCart = useCart((s) => s.remove);
  const isFav = useFavorites((s) => s.items.some((i) => String(i.id) === art.id));
  const toggleFav = useFavorites((s) => s.toggle);
  const { paused } = useCatalogSalesPaused();

  const soldOut = art.stock != null && art.stock <= 0;
  const disabled = soldOut || paused;
  const btnLabel = soldOut ? "Vendida" : paused ? "Venta en feria" : inCart ? "En carrito" : "Agregar";

  return {
    // Antes de hidratar, el servidor no sabe qué hay en localStorage.
    inCart: mounted && inCart,
    isFav: mounted && isFav,
    soldOut,
    disabled,
    btnLabel,
    toggleCart: () => (inCart ? removeFromCart(art.id) : addToCart(cardToCart(art), 1)),
    toggleFav: () => toggleFav(cardToFav(art)),
  };
}

function Img({ art, sizes, cls = "ph" }: { art: CardArt; sizes: string; cls?: string }) {
  if (!art.image) return <span className="empty">Imagen</span>;
  return (
    <span className={cls}>
      <SmartImage src={art.image} alt={art.title} sizes={sizes} />
    </span>
  );
}

export function HeartButton({ art, plain = false }: { art: CardArt; plain?: boolean }) {
  const { isFav, toggleFav } = useArtActions(art);
  return (
    <button
      type="button"
      className={`fdm-heart${isFav ? " is-on" : ""}${plain ? " is-plain" : ""}`}
      aria-label={isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
      aria-pressed={isFav}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFav();
      }}
    >
      {I.heart({ fill: isFav ? "currentColor" : "none" })}
    </button>
  );
}

export function AddButton({ art }: { art: CardArt }) {
  const { inCart, disabled, btnLabel, toggleCart } = useArtActions(art);
  return (
    <button
      type="button"
      className={`fdm-add${inCart ? " is-in" : ""}`}
      aria-pressed={inCart}
      aria-label={inCart ? "Quitar del carrito" : "Agregar al carrito"}
      disabled={disabled}
      onClick={toggleCart}
    >
      <span className="txt">{btnLabel}</span>
      <span className="ico">{inCart ? I.check({ size: 18, sw: 1.6 }) : I.plus({ size: 18, sw: 1.6 })}</span>
    </button>
  );
}

export function ArtworkCard({ art }: { art: CardArt }) {
  const href = `/obra/${encodeURIComponent(art.id)}`;
  const { soldOut } = useArtActions(art);
  const meta = [art.technique, art.kind].filter(Boolean).join(" · ");
  return (
    <article className="fdm-card">
      {/* El enlace cubre la imagen; el corazón es hermano (nada de botón dentro de <a>). */}
      <div className="fdm-card-img">
        <Link href={href} className="fdm-card-cover" aria-label={art.title} />
        <Img art={art} sizes="(max-width: 767px) 50vw, (max-width: 1280px) 33vw, 300px" />
        {soldOut && <span className="fdm-sold">Vendida</span>}
        <HeartButton art={art} />
      </div>
      <div className="fdm-card-txt">
        <Link href={href} className="fdm-card-title">{art.title}</Link>
        <span className="fdm-card-artist">{art.artist}</span>
        {meta && <span className="fdm-card-meta">{meta}</span>}
      </div>
      <div className="fdm-card-foot">
        <span className="fdm-price">{fmt(art.price)}</span>
        <AddButton art={art} />
      </div>
    </article>
  );
}

export function ArtworkRow({ art }: { art: CardArt }) {
  const href = `/obra/${encodeURIComponent(art.id)}`;
  const meta = [art.technique, art.kind].filter(Boolean).join(" · ");
  return (
    <article className="fdm-row">
      <Link href={href} className="fdm-row-img" aria-label={art.title}>
        <Img art={art} sizes="96px" />
      </Link>
      <div className="fdm-row-main">
        <Link href={href} className="fdm-card-title">{art.title}</Link>
        <span className="fdm-card-artist">{art.artist}</span>
      </div>
      <span className="fdm-row-meta">{meta}</span>
      <span className="fdm-row-meta">{art.pavilion}</span>
      <span className="fdm-row-price">{fmt(art.price)}</span>
      <HeartButton art={art} plain />
      <AddButton art={art} />
    </article>
  );
}
