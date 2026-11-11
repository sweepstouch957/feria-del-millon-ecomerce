"use client";

import { useEffect, useState } from "react";
import { pickSrc } from "@lib/utils";
import type { CartItem } from "@store/useCart";
import type { FavoriteItem } from "@store/useFavorites";

/* ──────────────────────────────────────────────────────────────
   Tienda — sistema compartido por catálogo, favoritos y carrito.
   Port de "Catálogo Feria del Millón — rediseño desktop y mobile".
   Un solo bloque de CSS con tokens claros/oscuros (data-theme global).
   ────────────────────────────────────────────────────────────── */

export const MAX_PRICE = 1_000_000;
export const MIN_PRICE = 100_000;

/** Precio al estilo del diseño: "$ 450.000". */
export const fmt = (n?: number | null) =>
  "$ " + String(Math.round(Number(n ?? 0))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Forma mínima de una obra para tarjetas, favoritos y carrito. */
export type CardArt = {
  id: string;
  title: string;
  artist: string;
  price: number;
  currency?: string;
  image?: string;
  technique?: string;
  kind: string;
  pavilion?: string;
  stock?: number;
};

export function toCardArt(a: any): CardArt {
  const f = a?.artistInfo?.firstName || "";
  const l = a?.artistInfo?.lastName || "";
  return {
    id: String(a?._id ?? a?.id ?? ""),
    title: a?.title || "Sin título",
    artist: `${f} ${l}`.trim() || (typeof a?.artist === "string" && !/^[a-f0-9]{24}$/i.test(a.artist) ? a.artist : "") || "Artista",
    price: Number(a?.price ?? 0),
    currency: a?.currency || "COP",
    image: pickSrc(a?.image) || pickSrc(a?.images?.[0]) || "",
    technique: a?.techniqueInfo?.name || "",
    kind: a?.reproducible ? "Reproducción" : "Obra única",
    pavilion: a?.pavilionInfo?.name || "",
    stock: a?.stock == null ? undefined : Number(a.stock),
  };
}

export const favToCard = (f: FavoriteItem): CardArt => ({
  id: f.id,
  title: f.title,
  artist: f.artist,
  price: f.price,
  currency: f.currency,
  image: f.image,
  technique: f.technique,
  kind: f.kind || "Obra única",
  pavilion: f.pavilion,
  stock: f.stock,
});

export const cardToCart = (c: CardArt): Omit<CartItem, "quantity"> => ({
  id: c.id,
  title: c.title,
  artist: c.artist,
  price: c.price,
  image: c.image || "/placeholder.png",
  technique: c.technique,
  kind: c.kind,
  pavilion: c.pavilion,
});

export const cardToFav = (c: CardArt): Omit<FavoriteItem, "savedAt"> => ({
  id: c.id,
  title: c.title,
  artist: c.artist,
  price: c.price,
  currency: c.currency,
  image: c.image,
  technique: c.technique,
  kind: c.kind,
  pavilion: c.pavilion,
  stock: c.stock,
});

/** Alto del navbar global (sticky), para colgar debajo la barra de filtros. */
export function useNavHeight(fallback = 80) {
  const [h, setH] = useState(fallback);
  useEffect(() => {
    const el = document.querySelector("body > header, header") as HTMLElement | null;
    if (!el) return;
    const update = () => setH(Math.round(el.getBoundingClientRect().height));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return h;
}

/** Contenedor de página: tokens + CSS + alto del navbar en --nav-h. */
export function ShopShell({ children }: { children: React.ReactNode }) {
  const navH = useNavHeight();
  return (
    <div className="fdm-shop" style={{ "--nav-h": `${navH}px` } as React.CSSProperties}>
      <style>{SHOP_CSS}</style>
      {children}
    </div>
  );
}

/* ── Iconos (trazo 1.5, 24 de caja) ────────────────────────── */
type IcoProps = { size?: number; fill?: string; sw?: number; style?: React.CSSProperties };
const Svg = ({ size = 20, fill = "none", sw = 1.5, style, children }: IcoProps & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
    {children}
  </svg>
);
export const I = {
  heart: (p: IcoProps = {}) => <Svg {...p}><path d="M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.6 12 20 12 20z" /></Svg>,
  cart: (p: IcoProps = {}) => <Svg {...p}><path d="M3 4h2l2.4 11h10.2L20 7H6.2" /><circle cx="9" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></Svg>,
  search: (p: IcoProps = {}) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>,
  chevron: (p: IcoProps = {}) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>,
  close: (p: IcoProps = {}) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>,
  back: (p: IcoProps = {}) => <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>,
  arrow: (p: IcoProps = {}) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>,
  plus: (p: IcoProps = {}) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>,
  check: (p: IcoProps = {}) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>,
  filter: (p: IcoProps = {}) => <Svg {...p}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Svg>,
  grid: (p: IcoProps = {}) => <Svg {...p}><rect x="4" y="4" width="6.5" height="6.5" /><rect x="13.5" y="4" width="6.5" height="6.5" /><rect x="4" y="13.5" width="6.5" height="6.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" /></Svg>,
  list: (p: IcoProps = {}) => <Svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Svg>,
  info: (p: IcoProps = {}) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16.5v.5" /></Svg>,
};

/* ── CSS ────────────────────────────────────────────────────── */
export const SHOP_CSS = `
.fdm-shop{
  --bg:var(--fdm-bg,#F7F6F2); --fg:var(--fdm-fg,#111111);
  --fg2:#55534D; --fg3:#6B6963; --fg4:#8A877F;
  --line:#DEDBD3; --line2:#C9C6BD; --line3:#E7E4DC;
  --card:#FFFFFF; --tile:#ECEAE3; --tile2:#D8D5CC; --soft:#F2F0EA;
  --green:#1F7A50; --green-deep:#17603F; --green-soft:#E4F1EA; --green-dot:#5FD39A;
  --heart:#C2410C; --inv:#111111; --invfg:#FFFFFF;
  --shadow:0 24px 48px rgba(17,17,17,.16); --img-shadow:0 10px 24px rgba(17,17,17,.12);
  font-family:Jost,system-ui,sans-serif; color:var(--fg); background:var(--bg); letter-spacing:0.005em;
}
:root[data-theme="dark"] .fdm-shop{
  --fg2:#B8B7AF; --fg3:#8E8D86; --fg4:#6E6D67;
  --line:rgba(255,255,255,.12); --line2:rgba(255,255,255,.22); --line3:rgba(255,255,255,.08);
  --card:#171716; --tile:#1B1B19; --tile2:#2A2A27; --soft:#202020;
  --green:#3FA46E; --green-deep:#7FDDAA; --green-soft:rgba(63,164,110,.18);
  --inv:#F0EFEA; --invfg:#0C0C0B;
  --shadow:0 24px 48px rgba(0,0,0,.55); --img-shadow:0 10px 24px rgba(0,0,0,.5);
}
.fdm-shop *{box-sizing:border-box}
:where(.fdm-shop) a{color:inherit;text-decoration:none}
:where(.fdm-shop) a:hover{color:var(--green)}
.fdm-shop button{font-family:inherit}
.fdm-shop button:focus-visible,.fdm-shop a:focus-visible,.fdm-shop input:focus-visible,.fdm-shop select:focus-visible{outline:2px solid var(--green);outline-offset:2px}
.fdm-shop input::placeholder{color:var(--fg3)}
.fdm-shop input[type="range"]{accent-color:var(--green)}
.fdm-shop input[type="checkbox"]{accent-color:var(--green)}
.fdm-shop select{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23777' stroke-width='1.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:34px !important}

.fdm-wrap{max-width:1440px;margin:0 auto;padding-left:48px;padding-right:48px}
@media (max-width:1280px){.fdm-wrap{padding-left:24px;padding-right:24px}}
@media (max-width:640px){.fdm-wrap{padding-left:16px;padding-right:16px}}

/* Cabecera editorial */
.fdm-hero{padding:32px 0 20px;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px 48px}
.fdm-eyebrow{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--green);font-weight:500}
.fdm-h1{margin:0;font-size:56px;line-height:1;font-weight:300;letter-spacing:.02em}
.fdm-lead{margin:0;max-width:520px;font-size:17px;line-height:1.5;color:var(--fg2)}
.fdm-back{align-self:flex-start;height:44px;padding:0;display:inline-flex;align-items:center;gap:8px;border:none;background:transparent;font-size:15px;color:var(--fg2);cursor:pointer}
.fdm-back:hover{color:var(--green)}
@media (max-width:767px){.fdm-hero{padding:20px 0 14px;flex-direction:column;align-items:flex-start;gap:6px}.fdm-eyebrow{font-size:11px}.fdm-h1{font-size:36px;line-height:1.05}.fdm-lead{font-size:15px;line-height:1.4}}

/* Botones */
.fdm-pill{height:44px;padding:0 14px 0 16px;display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line2);background:transparent;color:var(--fg);border-radius:999px;font-size:15px;white-space:nowrap;cursor:pointer;transition:border-color .2s,background .2s,color .2s}
.fdm-pill:hover{border-color:var(--fg)}
.fdm-pill.is-open{border-color:var(--fg);background:var(--card)}
.fdm-pill.is-active{border-color:var(--green);background:var(--green-soft);color:var(--green-deep)}
.fdm-pill .fdm-rot{transition:transform .2s}
.fdm-pill.is-open .fdm-rot{transform:rotate(180deg)}
.fdm-btn{height:48px;padding:0 24px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--inv);background:var(--inv);color:var(--invfg);border-radius:999px;font-size:15px;font-weight:500;cursor:pointer;transition:opacity .2s,background .2s,color .2s;white-space:nowrap}
.fdm-btn:hover{opacity:.88;color:var(--invfg)}
.fdm-btn:disabled{opacity:.45;cursor:not-allowed}
.fdm-btn.is-ghost{background:transparent;color:var(--fg);border-color:var(--line2)}
.fdm-btn.is-ghost:hover{border-color:var(--fg);color:var(--fg);opacity:1}
.fdm-btn.is-outline{background:transparent;color:var(--fg);border-color:var(--fg)}
.fdm-btn.is-outline:hover{background:var(--inv);color:var(--invfg);opacity:1}
.fdm-btn.is-caps{font-size:13px;letter-spacing:.16em;text-transform:uppercase;font-weight:400;padding:0 28px}
.fdm-btn.is-green{background:var(--green);border-color:var(--green);color:#fff}
.fdm-link-u{height:44px;padding:0;display:inline-flex;align-items:center;gap:8px;border:none;background:transparent;font-size:15px;color:var(--fg);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.fdm-link-u.is-mute{color:var(--fg2)}
.fdm-link-u:hover{color:var(--green)}
.fdm-icon-btn{width:44px;height:44px;border:none;background:transparent;color:var(--fg);border-radius:999px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s}
.fdm-icon-btn:hover{background:var(--soft)}

/* Barra de filtros (sticky bajo el navbar) */
.fdm-bar{position:sticky;top:var(--nav-h,80px);z-index:15;background:var(--bg);border-top:1px solid var(--fg);border-bottom:1px solid var(--line);padding:12px 0;display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.fdm-search{flex:1 1 220px;max-width:300px;height:44px;display:flex;align-items:center;gap:10px;padding:0 16px;background:var(--card);border:1px solid var(--line2);border-radius:999px;color:var(--fg2)}
.fdm-search input{flex:1;min-width:0;border:none;outline:none;background:transparent;font:inherit;font-size:15px;color:var(--fg)}
.fdm-search input::-webkit-search-cancel-button{-webkit-appearance:none}
.fdm-dd-wrap{position:relative}
.fdm-dd{position:absolute;top:52px;left:0;z-index:30;width:300px;background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:10px 16px 14px;display:flex;flex-direction:column}
.fdm-dd.is-right{left:auto;right:0}
.fdm-dd-scroll{max-height:300px;overflow-y:auto;display:flex;flex-direction:column;overscroll-behavior:contain}
.fdm-dd-cta{margin-top:10px;height:44px;border:none;background:var(--inv);color:var(--invfg);border-radius:999px;font-size:13px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.fdm-dd-cta:hover{opacity:.88}
.fdm-dd-mask{position:fixed;inset:0;z-index:25;border:none;padding:0;background:transparent;cursor:default}
.fdm-check{min-height:44px;display:flex;align-items:center;gap:12px;font-size:15px;color:var(--fg);cursor:pointer}
.fdm-check.is-dis{color:var(--fg4);cursor:default}
.fdm-check input{width:18px;height:18px;margin:0;flex:none}
.fdm-check .n{font-size:13px;color:var(--fg3)}
.fdm-dd-search{flex:none;height:44px;margin:6px 0 4px;padding:0 14px;border:1px solid var(--line2);border-radius:10px;background:var(--card);font:inherit;font-size:15px;color:var(--fg);width:100%}
.fdm-kind{height:44px;padding:0 16px;text-align:left;border:1px solid var(--line2);background:transparent;color:var(--fg);border-radius:10px;font-size:15px;cursor:pointer}
.fdm-kind.is-on{background:var(--inv);color:var(--invfg);border-color:var(--inv)}
.fdm-range-top{padding-top:6px;font-size:20px}
.fdm-range-ends{display:flex;justify-content:space-between;font-size:13px;color:var(--fg3)}
.fdm-bar-right{margin-left:auto;display:flex;align-items:center;gap:8px}
.fdm-sort{height:44px;padding:0 12px;border:1px solid var(--line2);border-radius:999px;background:var(--card);font:inherit;font-size:15px;color:var(--fg);cursor:pointer}
.fdm-view{display:flex;border:1px solid var(--line2);border-radius:999px;overflow:hidden}
.fdm-view button{width:44px;height:42px;border:none;background:transparent;color:var(--fg);display:flex;align-items:center;justify-content:center;cursor:pointer}
.fdm-view button.is-on{background:var(--inv);color:var(--invfg)}
.fdm-m-only{display:none}
.fdm-m-search{display:none}
@media (max-width:767px){
  .fdm-d-only{display:none !important}
  .fdm-m-only{display:flex}
  .fdm-m-search{display:block;padding:0 0 12px}
  .fdm-m-search .fdm-search{max-width:none;height:48px}
  .fdm-m-search .fdm-search input{font-size:16px}
  .fdm-bar{padding:8px 0;flex-wrap:nowrap}
  .fdm-bar-right{margin-left:0;flex:1;min-width:0}
  .fdm-sort{flex:1;min-width:0;padding:0 10px}
  .fdm-pill.is-filter{flex:none;border-color:var(--fg);font-weight:500}
}

/* Chips */
.fdm-chips{min-height:44px;padding:12px 0 16px;display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.fdm-count{margin-right:8px;font-size:15px;color:var(--fg2)}
.fdm-count strong{color:var(--fg);font-weight:500}
.fdm-chip-n{margin-right:4px;height:28px;padding:0 10px;display:inline-flex;align-items:center;gap:6px;background:var(--green);color:#fff;border-radius:999px;font-size:13px;font-weight:500}
.fdm-chip-n i{width:6px;height:6px;border-radius:999px;background:#fff}
.fdm-chip{height:44px;padding:0 14px;display:inline-flex;align-items:center;gap:8px;background:var(--green-soft);border:1px solid var(--green);border-radius:999px;font-size:14px;font-weight:500;color:var(--green-deep);cursor:pointer}
.fdm-chip:hover{background:var(--green);color:#fff}
.fdm-chips .fdm-clear{height:44px;padding:0 8px;border:none;background:transparent;font-size:14px;color:var(--fg2);text-decoration:underline;text-underline-offset:3px;cursor:pointer}
.fdm-badge{min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:var(--green);color:#fff;font-size:12px;font-weight:600;display:inline-flex;align-items:center;justify-content:center}
@media (max-width:767px){.fdm-chips{padding:12px 0 0}.fdm-count{font-size:14px;margin-right:4px}.fdm-chip{padding:0 12px}}

/* Vacío */
.fdm-empty{padding:72px 24px;background:var(--tile);display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.fdm-empty .t{font-size:24px}
.fdm-empty .s{max-width:420px;font-size:16px;line-height:1.5;color:var(--fg2)}
.fdm-empty .fdm-btn{margin-top:8px}
@media (max-width:767px){.fdm-empty{margin-top:16px;padding:48px 20px;gap:10px}.fdm-empty .t{font-size:20px}.fdm-empty .s{font-size:15px}}

/* Grilla y tarjeta */
.fdm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:40px 24px}
.fdm-card{display:flex;flex-direction:column;gap:12px;min-width:0}
.fdm-card-img{position:relative;display:block;aspect-ratio:4/5;background:var(--tile);padding:16px;overflow:hidden}
.fdm-card-cover{position:absolute;inset:0;z-index:0}
.fdm-card-img .ph{position:absolute;inset:16px;display:block;pointer-events:none;filter:drop-shadow(var(--img-shadow));transition:transform .5s cubic-bezier(.22,1,.36,1)}
.fdm-card:hover .fdm-card-img .ph{transform:scale(1.025)}
.fdm-card-img .empty{position:absolute;inset:16px;pointer-events:none;background:var(--tile2);display:flex;align-items:center;justify-content:center;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--fg2)}
.fdm-heart{position:absolute;top:8px;right:8px;width:44px;height:44px;border:none;background:var(--card);color:var(--fg);border-radius:999px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s,color .2s;z-index:1}
.fdm-heart:hover{transform:scale(1.06)}
.fdm-heart:active{transform:scale(.92)}
.fdm-heart.is-on{color:var(--heart)}
.fdm-heart.is-plain{position:static;border:1px solid var(--line2);background:transparent;flex:none}
.fdm-sold{position:absolute;left:8px;top:8px;height:28px;padding:0 10px;display:inline-flex;align-items:center;background:var(--inv);color:var(--invfg);border-radius:999px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;z-index:1}
.fdm-card-txt{display:flex;flex-direction:column;gap:2px;min-width:0}
.fdm-card-title{font-size:18px;line-height:1.25;overflow-wrap:anywhere}
.fdm-card-artist{font-size:15px;color:var(--fg2)}
.fdm-card-meta{font-size:13px;color:var(--fg3)}
.fdm-card-foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:8px}
.fdm-price{font-size:18px;font-weight:500;white-space:nowrap}
.fdm-add{height:44px;padding:0 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--fg);background:transparent;color:var(--fg);border-radius:999px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;white-space:nowrap;transition:background .2s,color .2s}
.fdm-add:hover{background:var(--inv);color:var(--invfg)}
.fdm-add.is-in{background:var(--inv);color:var(--invfg)}
.fdm-add:disabled{opacity:.45;cursor:not-allowed;background:transparent;color:var(--fg)}
.fdm-add .ico{display:none}
@media (max-width:767px){
  .fdm-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:28px 12px}
  .fdm-card{gap:8px}
  .fdm-card-img{padding:10px}.fdm-card-img .ph,.fdm-card-img .empty{inset:10px}
  .fdm-heart{top:0;right:0;background:transparent}
  .fdm-card-txt{gap:1px}.fdm-card-title{font-size:16px}.fdm-card-artist{font-size:14px}.fdm-card-meta{font-size:12px}
  .fdm-price{font-size:16px}
  .fdm-add{width:44px;padding:0}.fdm-add .txt{display:none}.fdm-add .ico{display:flex}
}

/* Lista */
.fdm-rows{display:flex;flex-direction:column;border-top:1px solid var(--line)}
.fdm-row{padding:16px 0;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px}
.fdm-row-img{flex:none;width:96px;height:96px;background:var(--tile);position:relative;padding:10px;display:block}
.fdm-row-img .ph{position:absolute;inset:10px;display:block}
.fdm-row-main{flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:2px}
.fdm-row-meta{flex:1 1 180px;font-size:14px;color:var(--fg2)}
.fdm-row-price{flex:none;width:110px;text-align:right;font-size:18px;font-weight:500}
.fdm-row .fdm-add{flex:none;width:132px}
@media (max-width:767px){.fdm-row-meta{display:none}.fdm-row-price{width:auto}.fdm-row .fdm-add{width:44px}}

/* Progreso / cargar más */
.fdm-more{padding:48px 0 64px;display:flex;flex-direction:column;align-items:center;gap:14px}
.fdm-more .l{font-size:15px;color:var(--fg2)}
.fdm-more .bar{width:240px;height:2px;background:var(--line)}
.fdm-more .bar i{display:block;height:2px;background:var(--fg);transition:width .4s}
.fdm-more .fdm-btn{margin-top:8px;height:52px;padding:0 36px}
@media (max-width:767px){.fdm-more{padding:36px 0 32px;gap:12px}.fdm-more .bar{width:200px}.fdm-more .fdm-btn{width:100%;margin-top:6px}}

/* Franja "¿Eres artista?" */
.fdm-strip{border-top:1px solid var(--line)}
.fdm-strip-in{padding:36px 0;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px 32px}
.fdm-strip .t{font-size:24px}
.fdm-strip .s{font-size:16px;color:var(--fg2)}
.fdm-strip a.fdm-btn{height:48px}
@media (max-width:767px){.fdm-strip-in{padding:24px 0;flex-direction:column;align-items:stretch;gap:12px}.fdm-strip .t{font-size:20px}.fdm-strip .s{font-size:15px}}

/* Hoja de filtros (celular) */
.fdm-sheet-mask{position:fixed;inset:0;z-index:80;border:none;padding:0;background:rgba(17,17,17,.55);cursor:default;animation:fdm-fade .2s ease}
.fdm-sheet{position:fixed;left:0;right:0;bottom:0;z-index:81;height:calc(100dvh - 56px);max-height:calc(100dvh - 56px);background:var(--bg);color:var(--fg);border-radius:20px 20px 0 0;display:flex;flex-direction:column;animation:fdm-up .28s cubic-bezier(.22,1,.36,1)}
.fdm-sheet-handle{display:flex;justify-content:center;padding-top:8px}
.fdm-sheet-handle i{width:40px;height:4px;border-radius:999px;background:var(--line2)}
.fdm-sheet-head{flex:none;height:52px;padding:0 8px 0 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}
.fdm-sheet-head h2{margin:0;font-size:20px;font-weight:500}
.fdm-sheet-body{flex:1;min-height:0;overflow-y:auto;padding:0 20px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.fdm-sheet fieldset{margin:0;padding:18px 0 8px;border:none;border-bottom:1px solid var(--line);min-width:0}
.fdm-sheet fieldset:last-child{border-bottom:none}
.fdm-sheet legend,.fdm-sheet .lg{padding:0;font-size:12px;font-weight:500;letter-spacing:.18em;text-transform:uppercase}
.fdm-sheet .fdm-check{min-height:46px;font-size:16px}
.fdm-sheet .fdm-check input{width:20px;height:20px}
.fdm-sheet .fdm-check .n{font-size:14px}
.fdm-sheet .fdm-dd-search{height:46px;border-radius:8px;font-size:16px;margin:10px 0 4px}
.fdm-sheet .fdm-kind{height:44px;border-radius:999px;font-size:14px}
.fdm-sheet .fdm-kind.is-on{background:var(--inv)}
.fdm-sheet-foot{flex:none;padding:12px 20px calc(20px + env(safe-area-inset-bottom));border-top:1px solid var(--line);background:var(--bg)}
.fdm-sheet-foot .fdm-dd-cta{margin:0;width:100%;height:52px;font-size:13px;letter-spacing:.16em}
@keyframes fdm-up{from{transform:translateY(40px);opacity:.6}to{transform:none;opacity:1}}
@keyframes fdm-fade{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.fdm-sheet,.fdm-sheet-mask{animation:none}.fdm-card-img .ph{transition:none}}

/* Favoritos / carrito: cabecera con línea */
.fdm-page-head{padding:20px 0 24px;border-bottom:1px solid var(--fg);display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px 32px}
.fdm-page-head .col{display:flex;flex-direction:column;gap:4px;min-width:0}
.fdm-page-head .sub{padding-top:8px;font-size:17px;color:var(--fg2)}
.fdm-page-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.fdm-crumb{min-height:44px;display:flex;align-items:center;gap:8px;font-size:15px;color:var(--fg2)}
.fdm-crumb a{text-decoration:underline;text-underline-offset:3px}
.fdm-crumb .cur{color:var(--fg)}
.fdm-fav-grid{padding-top:32px}
.fdm-fav-bar{display:none}
@media (max-width:767px){
  .fdm-page-head{padding:0 0 14px;border-bottom:none;flex-direction:column;align-items:stretch;gap:6px}
  .fdm-page-head .sub{padding-top:0;font-size:15px;line-height:1.4}
  .fdm-page-head .fdm-page-actions{display:none}
  .fdm-fav-grid{padding-top:16px}
  .fdm-fav-bar{display:flex;flex-direction:column;gap:10px;padding:28px 0 32px}
  .fdm-fav-bar .fdm-btn{width:100%;height:52px}
}

/* Carrito */
.fdm-cart-shell{display:flex;flex-wrap:wrap;align-items:flex-start;gap:32px 64px}
.fdm-cart-list{flex:999 1 520px;min-width:0;display:flex;flex-direction:column}
.fdm-cart-row{padding:24px 0;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;align-items:flex-start;gap:16px 24px}
.fdm-cart-img{flex:none;width:120px;height:150px;background:var(--tile);position:relative;padding:12px;display:block}
.fdm-cart-img .ph{position:absolute;inset:12px;display:block;filter:drop-shadow(0 6px 14px rgba(17,17,17,.12))}
.fdm-cart-main{flex:1 1 240px;min-width:0;display:flex;flex-direction:column;gap:3px}
.fdm-cart-title{font-size:22px;line-height:1.2}
.fdm-cart-artist{font-size:16px;color:var(--fg2)}
.fdm-cart-meta{font-size:14px;color:var(--fg3)}
.fdm-cart-acts{margin-top:8px;display:flex;flex-wrap:wrap;align-items:center;gap:4px 20px}
.fdm-cart-price{flex:none;font-size:22px;font-weight:500;white-space:nowrap}
.fdm-qty{display:inline-flex;align-items:center;gap:8px;margin-left:auto}
.fdm-qty button{width:32px;height:32px;border:1px solid var(--line2);background:transparent;color:inherit;border-radius:999px;cursor:pointer;font-size:15px;line-height:1;display:grid;place-items:center}
.fdm-qty button:disabled{opacity:.4;cursor:not-allowed}
.fdm-qty span{min-width:20px;text-align:center;font-size:15px;font-weight:500}
.fdm-cart-aside{flex:1 1 320px;position:sticky;top:calc(var(--nav-h,80px) + 24px);margin-top:24px;padding:28px;background:var(--card);border:1px solid var(--line);border-radius:16px;display:flex;flex-direction:column;gap:16px}
.fdm-cart-aside h2{margin:0;font-size:12px;font-weight:500;letter-spacing:.18em;text-transform:uppercase}
.fdm-cart-sub{display:flex;justify-content:space-between;gap:16px;font-size:16px;color:var(--fg2)}
.fdm-cart-total{padding-top:16px;border-top:1px solid var(--line);display:flex;align-items:baseline;justify-content:space-between;gap:16px}
.fdm-cart-total .t{font-size:18px}
.fdm-cart-total .v{font-size:32px;font-weight:500}
.fdm-cart-cta{height:56px;display:flex;align-items:center;justify-content:center;gap:10px;background:var(--inv);color:var(--invfg);border-radius:999px;font-size:14px;font-weight:500;letter-spacing:.14em;text-transform:uppercase}
.fdm-cart-cta:hover{opacity:.88;color:var(--invfg)}
.fdm-cart-note{margin:0;padding:14px 16px;background:var(--bg);border-radius:10px;display:flex;gap:10px;font-size:14px;line-height:1.45;color:var(--fg2)}
.fdm-cart-note svg{flex:none;margin-top:1px;color:var(--green)}
.fdm-suggest{margin-top:64px;padding-top:28px;border-top:1px solid var(--line)}
.fdm-suggest-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 24px;padding-bottom:24px}
.fdm-suggest-head h2{margin:0;font-size:28px;font-weight:300}
@media (max-width:767px){
  .fdm-cart-shell{gap:24px}
  .fdm-cart-row{padding:16px 0;flex-wrap:nowrap;gap:14px}
  .fdm-cart-img{width:84px;height:105px;padding:8px}.fdm-cart-img .ph{inset:8px}
  .fdm-cart-main{gap:1px}
  .fdm-cart-title{font-size:16px}.fdm-cart-artist{font-size:14px}.fdm-cart-meta{font-size:12px}
  .fdm-cart-price{font-size:16px}
  .fdm-cart-acts{margin-top:auto;gap:4px 16px}
  .fdm-cart-acts .fdm-link-u{font-size:14px}
  .fdm-cart-aside{position:static;margin-top:0;padding:20px;flex-basis:100%;gap:14px}
  .fdm-cart-sub{font-size:15px}.fdm-cart-total{padding-top:14px}.fdm-cart-total .t{font-size:17px}.fdm-cart-total .v{font-size:26px}
  .fdm-cart-cta{height:52px;font-size:13px}
  .fdm-cart-note{padding:0;background:transparent;font-size:13px}
  .fdm-suggest{margin-top:40px;padding-top:20px}.fdm-suggest-head h2{font-size:22px}
}
`;
