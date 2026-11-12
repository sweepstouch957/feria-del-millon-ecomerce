"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCatalogSalesPaused, useClaimLink, useFairMode } from "@provider/siteConfigProvider";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";
import { useArtistProfile } from "@hooks/queries/useArtistProfile";
import { useArtworksCursor } from "@hooks/queries/useArtworksCursor";
import { mergeImages, pickSrc } from "@lib/utils";
import Skeleton from "@components/ui/Skeleton";
import SmartImage from "@components/ui/SmartImage";
import { ArtworkCard, useArtActions } from "@components/views/catalog/ArtworkCard";
import { I, ShopShell, fmt, plural, toCardArt, type CardArt } from "@components/views/catalog/shared";
import ArtworkViewer, { type ViewerChip } from "./ArtworkViewer";
import CajaQrButton from "./CajaQrButton";

/* ──────────────────────────────────────────────────────────────
   Detalle de obra — port de "Obra — Desktop" y "Obra — Mobile"
   (Claude Design, nov-2026). Mismo sistema que catálogo/favoritos/
   carrito (ShopShell: tokens claro/oscuro). Escritorio: galería a la
   izquierda y columna de compra fija a la derecha; debajo ficha +
   tarjeta del artista y dos filas de obras. Celular: galería a todo
   el ancho, carruseles y barra fija "En caja / En línea".
   ────────────────────────────────────────────────────────────── */

const OBRA_CSS = `
.fdm-ob{padding-bottom:72px}
/* Mientras carga, la página ocupa la pantalla: el footer no sube a mitad de pantalla. */
.fdm-ob[aria-busy="true"]{min-height:100vh}
.fdm-ob-top{padding:12px 0;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 24px}
.fdm-ob-crumb{display:flex;flex-wrap:wrap;align-items:center;gap:0 10px;font-size:14px;color:var(--fg2);min-width:0}
.fdm-ob-crumb a{min-height:44px;display:inline-flex;align-items:center;text-decoration:underline;text-underline-offset:3px;color:var(--fg2)}
.fdm-ob-crumb a:hover{color:var(--green)}
.fdm-ob-crumb .cur{color:var(--fg);overflow-wrap:anywhere}
.fdm-ob-back{height:44px;padding:0 18px;display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line2);background:transparent;color:var(--fg);border-radius:999px;font-size:15px;cursor:pointer;transition:border-color .2s}
.fdm-ob-back:hover{border-color:var(--fg)}

.fdm-ob-hero{display:flex;flex-wrap:wrap;align-items:flex-start;gap:32px 64px}
.fdm-ob-media{flex:999 1 520px;min-width:0;display:flex;flex-direction:column;gap:12px}
.fdm-ob-buy{flex:1 1 400px;min-width:0;position:sticky;top:calc(var(--nav-h,73px) + 24px);display:flex;flex-direction:column;gap:24px}

/* Galería */
.fdm-ob-stage{position:relative;aspect-ratio:1/1;background:var(--tile);overflow:hidden;touch-action:pan-y}
.fdm-ob-stage-img{position:absolute;inset:8%;display:block;filter:drop-shadow(var(--img-shadow));animation:fdmObIn .45s cubic-bezier(.22,1,.36,1)}
@keyframes fdmObIn{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.fdm-ob-stage-img{animation:none}}
.fdm-ob-noimg{position:absolute;inset:8%;display:flex;align-items:center;justify-content:center;background:var(--tile2);font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--fg2)}
.fdm-ob-stage-hit{position:absolute;inset:0;border:none;padding:0;background:transparent;cursor:zoom-in}
.fdm-ob-zoom{position:absolute;left:16px;bottom:16px;height:44px;padding:0 16px;display:flex;align-items:center;gap:8px;border:none;background:var(--card);color:var(--fg);border-radius:999px;font-size:14px;font-weight:500;cursor:pointer;box-shadow:0 4px 14px rgba(17,17,17,.08)}
.fdm-ob-chips{position:absolute;left:16px;top:16px;display:flex;flex-wrap:wrap;gap:8px;pointer-events:none}
.fdm-ob-chip{padding:6px 12px;border-radius:999px;font-size:12px;font-weight:500;white-space:nowrap}
.fdm-ob-chip.is-green{background:var(--green);color:#fff}
.fdm-ob-chip.is-inv{background:var(--inv);color:var(--invfg)}
.fdm-ob-count{position:absolute;right:16px;bottom:16px;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:500;background:var(--card);color:var(--fg);pointer-events:none}
.fdm-ob-thumbs{display:flex;flex-wrap:wrap;gap:10px}
.fdm-ob-thumb{position:relative;width:76px;height:76px;padding:0;border:2px solid transparent;background:var(--tile);cursor:pointer;transition:border-color .2s}
.fdm-ob-thumb:hover{border-color:var(--line2)}
.fdm-ob-thumb.is-on{border-color:var(--fg)}
.fdm-ob-thumb .ph{position:absolute;inset:6px;display:block}

/* Visor (pantalla oscura) */
.fdm-ob-viewer{position:fixed;inset:0;z-index:100;background:#111111;color:#FFFFFF;display:flex;flex-direction:column}
.fdm-ob-v-head{flex:none;padding:12px 24px;display:flex;align-items:center;gap:16px}
.fdm-ob-v-title{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:2px}
.fdm-ob-v-title .t,.fdm-ob-v-caption .t{font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fdm-ob-v-title .s,.fdm-ob-v-caption .s{font-size:13px;color:#C9C6BD}
.fdm-ob-v-count{font-size:15px;color:#C9C6BD;padding-left:8px}
.fdm-ob-v-tools{flex:1 1 0;display:flex;align-items:center;justify-content:flex-end;gap:8px}
.fdm-ob-v-btn{flex:none;width:44px;height:44px;border:1px solid rgba(255,255,255,.28);background:transparent;color:#FFFFFF;border-radius:999px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s}
.fdm-ob-v-btn:hover{background:rgba(255,255,255,.1)}
.fdm-ob-v-btn.is-close{margin-left:8px;background:#FFFFFF;color:#111111;border-color:#FFFFFF}
.fdm-ob-v-pct{min-width:48px;text-align:center;font-size:14px;font-variant-numeric:tabular-nums}
.fdm-ob-v-stage{position:relative;flex:1;min-height:0}
.fdm-ob-v-img{display:block;max-width:92vw;max-height:calc(100vh - 210px);object-fit:contain;user-select:none}
.fdm-ob-v-nav{position:absolute;z-index:2;top:50%;margin-top:-26px;width:52px;height:52px;border:none;background:rgba(255,255,255,.14);color:#FFFFFF;border-radius:999px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .2s}
.fdm-ob-v-nav:hover{background:rgba(255,255,255,.24)}
.fdm-ob-v-nav.is-prev{left:24px}.fdm-ob-v-nav.is-next{right:24px}
.fdm-ob-v-caption{display:none}
.fdm-ob-v-thumbs{flex:none;padding:12px 16px 16px;display:flex;justify-content:center;gap:10px;overflow-x:auto}
.fdm-ob-v-thumb{flex:none;width:72px;height:72px;padding:6px;border:2px solid transparent;background:#2A2927;opacity:.6;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity .2s,border-color .2s}
.fdm-ob-v-thumb:hover{opacity:.85}
.fdm-ob-v-thumb.is-on{border-color:#FFFFFF;opacity:1}
.fdm-ob-v-thumb img{display:block;max-width:100%;max-height:100%}
@media (max-width:767px){
  .fdm-ob-v-head{padding:8px;padding-top:calc(8px + env(safe-area-inset-top))}
  .fdm-ob-v-title{display:none}
  .fdm-ob-v-count{flex:1}
  .fdm-ob-v-tools{flex:none;margin-left:auto}
  .fdm-ob-v-img{max-height:calc(100vh - 260px)}
  .fdm-ob-v-nav.is-prev{left:8px}.fdm-ob-v-nav.is-next{right:8px}
  .fdm-ob-v-caption{display:flex;flex-direction:column;gap:2px;padding:0 16px 8px;text-align:center}
  .fdm-ob-v-thumbs{justify-content:flex-start;padding-bottom:calc(16px + env(safe-area-inset-bottom))}
  .fdm-ob-v-thumb{width:56px;height:56px}
}

/* Columna de compra */
.fdm-ob-head{display:flex;flex-direction:column;gap:10px}
.fdm-ob-h1{margin:0;font-size:44px;line-height:1.05;font-weight:300;overflow-wrap:anywhere;text-wrap:balance}
.fdm-ob-by{align-self:flex-start;min-height:44px;display:inline-flex;align-items:center;gap:10px;color:var(--fg)}
.fdm-ob-by .n{font-size:17px;text-decoration:underline;text-underline-offset:3px}
.fdm-ob-by:hover .n{color:var(--green)}
.fdm-ob-by .c{font-size:14px;color:var(--fg2)}
.fdm-ob-av{position:relative;overflow:hidden;flex:none;width:32px;height:32px;border-radius:999px;background:var(--tile);color:var(--fg);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600}
.fdm-ob-price{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 14px}
.fdm-ob-price b{font-size:44px;line-height:1;font-weight:500;white-space:nowrap}
.fdm-ob-price span{font-size:15px;color:var(--fg2)}
.fdm-ob-cta{display:flex;flex-direction:column;gap:10px}
.fdm-ob-main{height:56px;border:none;background:var(--green);color:#fff;border-radius:999px;font-size:16px;font-weight:500;cursor:pointer;transition:filter .2s,opacity .2s}
.fdm-ob-main:hover:not(:disabled){filter:brightness(.9)}
.fdm-ob-main:disabled{opacity:.45;cursor:not-allowed}
.fdm-ob-row{display:flex;flex-wrap:wrap;gap:10px}
.fdm-ob-sec{flex:1 1 160px;height:52px;padding:0 18px;display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--fg);background:transparent;color:var(--fg);border-radius:999px;font-size:15px;font-weight:500;cursor:pointer;transition:background .2s,color .2s}
.fdm-ob-sec:hover:not(:disabled){background:var(--soft)}
.fdm-ob-sec.is-on{background:var(--inv);color:var(--invfg);border-color:var(--inv)}
.fdm-ob-sec:disabled{opacity:.45;cursor:not-allowed}
.fdm-ob-fav{align-self:center;height:44px;padding:0 8px;display:inline-flex;align-items:center;gap:10px;border:none;background:transparent;color:var(--fg);font-size:15px;cursor:pointer}
.fdm-ob-fav span{text-decoration:underline;text-underline-offset:3px}
.fdm-ob-fav.is-on svg{color:var(--heart)}
.fdm-ob-note{margin:0;padding:12px 14px;border-radius:12px;background:var(--soft);font-size:14px;line-height:1.5;color:var(--fg2)}
.fdm-ob-claim{align-self:center;font-size:13px;color:var(--fg3);text-decoration:underline;text-underline-offset:3px}
.fdm-ob-specs{margin:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.fdm-ob-specs>div{padding:14px 16px;background:var(--bg);display:flex;flex-direction:column;gap:4px;min-width:0}
.fdm-ob-specs>div:last-child:nth-child(odd){grid-column:1/-1}
.fdm-ob-specs dt{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--fg2)}
.fdm-ob-specs dd{margin:0;font-size:17px;overflow-wrap:anywhere}
.fdm-ob-trust{display:flex;flex-direction:column;gap:10px;font-size:14px;line-height:1.45;color:var(--fg2)}
.fdm-ob-trust span{display:flex;gap:10px}
.fdm-ob-trust svg{flex:none;margin-top:2px;color:var(--green)}
.fdm-ob-cta-m{display:none}

/* Ficha + artista */
.fdm-ob-ficha{margin-top:64px;padding-top:28px;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:32px 64px}
.fdm-ob-ficha-main{flex:2 1 420px;min-width:0;display:flex;flex-direction:column;gap:12px}
.fdm-ob-h2{margin:0;font-size:28px;font-weight:300}
.fdm-ob-ficha-body{max-width:720px;display:flex;flex-direction:column;gap:24px}
.fdm-ob-dl{margin:0;display:flex;flex-direction:column;border-top:1px solid var(--fg)}
.fdm-ob-dl>div{padding:12px 0;border-bottom:1px solid var(--line3);display:flex;flex-wrap:wrap;gap:4px 24px;font-size:16px}
.fdm-ob-dl dt{flex:0 0 160px;color:var(--fg2)}
.fdm-ob-dl dd{flex:1 1 240px;margin:0;overflow-wrap:anywhere}
.fdm-ob-desc{display:flex;flex-direction:column;gap:14px}
.fdm-ob-desc h3{margin:0;font-size:12px;font-weight:500;letter-spacing:.18em;text-transform:uppercase}
.fdm-ob-desc p{margin:0;font-size:16px;line-height:1.65;color:color-mix(in srgb,var(--fg) 78%,transparent);white-space:pre-line;text-wrap:pretty}
.fdm-ob-artist{flex:1 1 320px;min-width:0;align-self:flex-start;padding:24px;border:1px solid var(--line);border-radius:12px;display:flex;flex-direction:column;gap:12px}
.fdm-ob-artist .who{display:flex;align-items:center;gap:12px}
.fdm-ob-artist .fdm-ob-av{width:48px;height:48px;font-size:15px}
.fdm-ob-artist .k{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--fg2)}
.fdm-ob-artist .v{display:block;font-size:20px}
.fdm-ob-artist p{margin:0;font-size:15px;line-height:1.55;color:var(--fg2)}
.fdm-ob-artist .fdm-ob-sec{flex:none;align-self:flex-start;height:44px;padding:0 20px;font-size:14px}

/* Más obras */
.fdm-ob-more{margin-top:64px;padding-top:28px;border-top:1px solid var(--line)}
.fdm-ob-more-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 24px;padding-bottom:24px}
.fdm-ob-more-head a{min-height:44px;display:inline-flex;align-items:center;font-size:15px;text-decoration:underline;text-underline-offset:3px}
.fdm-ob-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
.fdm-ob-rail{display:none}
.fdm-ob-bar{display:none}
@media (max-width:1100px){.fdm-ob-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.fdm-ob-grid>:nth-child(4){display:none}}

@media (max-width:767px){
  .fdm-ob{padding-bottom:104px}
  .fdm-ob-top{justify-content:flex-end;padding:8px 0}
  .fdm-ob-crumb{display:none}
  .fdm-ob-hero{gap:0}
  .fdm-ob-media{flex-basis:100%;margin:0 -16px;gap:10px}
  .fdm-ob-stage-img{inset:28px}
  .fdm-ob-noimg{inset:28px}
  .fdm-ob-thumbs{padding:0 16px;gap:8px;flex-wrap:nowrap;overflow-x:auto}
  .fdm-ob-thumb{flex:none;width:60px;height:60px}
  .fdm-ob-buy{position:static;flex-basis:100%;padding-top:20px;gap:20px}
  .fdm-ob-head{gap:8px}
  .fdm-ob-h1{font-size:30px;line-height:1.1}
  .fdm-ob-by{min-height:0}
  .fdm-ob-by .n{font-size:16px;text-decoration:none}
  .fdm-ob-by .c{display:none}
  .fdm-ob-av{width:28px;height:28px;font-size:11px}
  .fdm-ob-price{padding-top:8px;gap:4px 12px}
  .fdm-ob-price b{font-size:34px}
  .fdm-ob-price span{font-size:14px}
  .fdm-ob-cta{display:none}
  .fdm-ob-cta-m{display:flex;gap:10px}
  .fdm-ob-cta-m .fdm-ob-sec{flex:1}
  .fdm-ob-cta-m .fdm-ob-heart{flex:none;width:52px;height:52px;border:1px solid var(--line2);background:transparent;color:var(--fg);border-radius:999px;display:flex;align-items:center;justify-content:center;cursor:pointer}
  .fdm-ob-cta-m .fdm-ob-heart.is-on{color:var(--heart)}
  .fdm-ob-specs>div{padding:12px 14px}
  .fdm-ob-ficha{margin-top:28px;padding-top:24px;gap:28px}
  .fdm-ob-ficha-main{gap:8px}
  .fdm-ob-h2{font-size:22px}
  .fdm-ob-dl>div{font-size:15px}
  .fdm-ob-dl dt{flex:0 0 100%}
  .fdm-ob-desc p{font-size:15px;line-height:1.6}
  .fdm-ob-artist{flex-basis:100%;padding:20px}
  .fdm-ob-more{margin-top:28px;padding-top:24px}
  .fdm-ob-more-head{padding-bottom:12px}
  .fdm-ob-more-head .fdm-ob-h2{font-size:22px}
  .fdm-ob-grid{display:none}
  .fdm-ob-rail{display:flex;gap:12px;overflow-x:auto;margin:0 -16px;padding:0 16px 4px;scroll-padding-left:16px;scroll-snap-type:x mandatory;scrollbar-width:none}
  .fdm-ob-rail::-webkit-scrollbar{display:none}
  .fdm-ob-mini{flex:none;width:150px;display:flex;flex-direction:column;gap:6px;color:var(--fg);scroll-snap-align:start}
  .fdm-ob-mini .img{position:relative;width:150px;height:188px;background:var(--tile)}
  .fdm-ob-mini .img .ph{position:absolute;inset:10px;display:block}
  .fdm-ob-mini .t{font-size:15px;line-height:1.25;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fdm-ob-mini .p{font-size:15px;font-weight:500}
  .fdm-ob-bar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;align-items:center;gap:8px;padding:10px 16px calc(14px + env(safe-area-inset-bottom));background:var(--bg);border-top:1px solid var(--line)}
  .fdm-ob-bar .pr{flex:1;min-width:0;display:flex;flex-direction:column}
  .fdm-ob-bar .pr b{font-size:17px;font-weight:500;white-space:nowrap}
  .fdm-ob-bar .pr span{font-size:12px;color:var(--green)}
  .fdm-ob-bar .pr span.is-off{color:var(--fg3)}
  .fdm-ob-bar .caja{flex:none;height:48px;padding:0 16px;border:1px solid var(--line2);background:transparent;color:var(--fg);border-radius:999px;font-size:14px;font-weight:500;cursor:pointer}
  .fdm-ob-bar .fdm-ob-main{flex:none;height:48px;padding:0 24px;font-size:15px}
}
`;

const CHECK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/** Tarjeta pequeña de los carruseles del celular. */
function MiniCard({ art }: { art: CardArt }) {
  return (
    <Link href={`/obra/${encodeURIComponent(art.id)}`} className="fdm-ob-mini">
      <span className="img">
        {art.image && (
          <span className="ph">
            <SmartImage src={art.image} alt={art.title} sizes="150px" />
          </span>
        )}
      </span>
      <span className="t">{art.title}</span>
      <span className="p">{fmt(art.price)}</span>
    </Link>
  );
}

function MoreSection({ title, linkLabel, href, works }: { title: string; linkLabel: string; href: string; works: CardArt[] }) {
  if (!works.length) return null;
  return (
    <section className="fdm-ob-more">
      <div className="fdm-ob-more-head">
        <h2 className="fdm-ob-h2">{title}</h2>
        <Link href={href}>{linkLabel}</Link>
      </div>
      <div className="fdm-grid fdm-ob-grid">
        {works.slice(0, 4).map((w) => <ArtworkCard key={w.id} art={w} />)}
      </div>
      <div className="fdm-ob-rail">
        {works.map((w) => <MiniCard key={w.id} art={w} />)}
      </div>
    </section>
  );
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const { data, isLoading, isError, error } = useArtworkDetail(id);
  const { paused: salesPaused, message: salesPausedMsg } = useCatalogSalesPaused();
  // Modo feria: se llega por el QR de la obra; se compra solo esta, sin carrito ni catálogo.
  const fairMode = useFairMode();
  const claimLink = useClaimLink();

  const doc: any = data?.doc;
  const copies = data?.copies ?? [];
  const images = useMemo(() => mergeImages(doc?.image, doc?.images), [doc?.image, doc?.images]);
  const { data: artistProfile } = useArtistProfile(doc?.artist ? String(doc.artist) : undefined);

  // Hooks antes de cualquier return: sin doc todavía, la tarjeta va vacía.
  const art = useMemo(() => toCardArt(doc ?? {}), [doc]);
  const actions = useArtActions(art);

  const eventId = doc?.event ? String(doc.event) : undefined;
  const artistId = doc?.artist ? String(doc.artist) : undefined;
  const pavilionId = doc?.pavilionInfo?._id ? String(doc.pavilionInfo._id) : undefined;
  const byArtist = useArtworksCursor({ event: eventId, artist: artistId, limit: 9, lite: true, enabled: !!artistId });
  const byPavilion = useArtworksCursor({ event: eventId, pavilion: pavilionId, limit: 12, lite: true, enabled: !!pavilionId && !fairMode });

  const moreArtist = useMemo(() => byArtist.rows.map(toCardArt).filter((w) => w.id !== art.id).slice(0, 8), [byArtist.rows, art.id]);
  const morePab = useMemo(
    () =>
      byPavilion.rows
        .filter((r: any) => String(r.artist) !== artistId)
        .map(toCardArt)
        .filter((w) => w.id !== art.id)
        .slice(0, 8),
    [byPavilion.rows, art.id, artistId]
  );

  const goBack = () => {
    // Volver respeta los filtros del catálogo si se llegó desde la tienda.
    if (typeof document !== "undefined" && document.referrer.startsWith(window.location.origin) && window.history.length > 1) router.back();
    else router.push(fairMode ? "/" : "/catalogo");
  };

  /* Carga: misma estructura que la vista real para que nada salte al llegar. */
  if (isLoading) {
    return (
      <ShopShell>
        <style>{OBRA_CSS}</style>
        <main className="fdm-wrap fdm-ob" aria-busy="true">
          <div className="fdm-ob-top">
            <Skeleton w={320} h={14} />
            <Skeleton w={110} h={44} radius={999} />
          </div>
          <div className="fdm-ob-hero">
            <section className="fdm-ob-media">
              <Skeleton aspect="1/1" radius={0} />
            </section>
            <aside className="fdm-ob-buy">
              <div className="fdm-ob-head">
                <Skeleton w="45%" h={12} />
                <Skeleton w="85%" h={46} />
                <Skeleton w="50%" h={32} radius={999} />
              </div>
              <Skeleton w="60%" h={44} />
              <Skeleton w="100%" h={56} radius={999} />
              <Skeleton w="100%" h={52} radius={999} />
              <Skeleton w="100%" h={150} radius={12} />
            </aside>
          </div>
        </main>
      </ShopShell>
    );
  }

  if (isError || !doc) {
    return (
      <ShopShell>
        <style>{OBRA_CSS}</style>
        <main className="fdm-wrap fdm-ob">
          <div className="fdm-empty" style={{ marginTop: 32 }}>
            <span className="t">{isError ? "No pudimos cargar la obra" : "Obra no encontrada"}</span>
            <span className="s">{error?.message || "Puede que la obra ya no esté publicada."}</span>
            <Link href={fairMode ? "/" : "/catalogo"} className="fdm-btn is-outline is-caps">
              {fairMode ? "Volver al inicio" : "Volver al catálogo"}
            </Link>
          </div>
        </main>
      </ShopShell>
    );
  }

  const currency = doc.currency || "COP";
  const stock = Number(doc.stock ?? (copies.length ? 1 : 0));
  const availableCopy = copies.find((c: any) => c.status === "available");
  const inStock = stock > 0 && !!availableCopy;
  // Edición = copias reales (sin anuladas). copy.total queda viejo cuando el artista sube el stock.
  const edition = Math.max(stock, copies.filter((c: any) => c.status !== "void").length);
  const isAvailable = inStock && !salesPaused;
  const statusText = inStock ? "Disponible" : fairMode ? "Vendida" : "Agotada";
  const buyLabel = salesPaused && inStock ? "Venta en feria" : !inStock ? statusText : fairMode ? "Comprar esta obra" : "Comprar ahora";
  const tipo = edition > 1 ? `Edición de ${edition}` : doc.reproducible ? "Reproducción" : "Obra única";
  const editionText = edition > 1 ? `${stock} de ${edition} disponibles` : "Pieza única";

  const artistName = [doc.artistInfo?.firstName, doc.artistInfo?.lastName].filter(Boolean).join(" ") || "Artista";
  const initials = artistName.split(" ").filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join("") || "A";
  const artistPhoto = pickSrc(artistProfile?.photoUrl) || pickSrc(doc.artistInfo?.image);
  const artistHref = artistId ? `/artista/${encodeURIComponent(artistId)}` : "/catalogo";
  const artistCount = byArtist.total;

  const techniqueId = doc.techniqueInfo?._id ? String(doc.techniqueInfo._id) : "";
  const pavilionHref = pavilionId ? `/catalogo?pavilion=${encodeURIComponent(pavilionId)}` : "/catalogo";
  const techniqueHref = techniqueId ? `/catalogo?tecnica=${encodeURIComponent(techniqueId)}` : "/catalogo";
  const eyebrow = [doc.techniqueInfo?.name, doc.pavilionInfo?.name].filter(Boolean).join(" · ") || "Obra original";
  const price = fmt(doc.price);

  // Sin carrito: ?artwork= vacía el carrito y deja solo esta obra.
  const handleBuyNow = () => router.push(`/checkout?artwork=${encodeURIComponent(String(doc._id))}`);

  const specs = [
    doc.techniqueInfo?.name && { k: "Técnica", v: doc.techniqueInfo.name },
    doc.dimensionsText && { k: "Medidas", v: String(doc.dimensionsText) },
    { k: "Edición", v: edition > 1 ? editionText : tipo },
    doc.pavilionInfo?.name && { k: "Pabellón", v: doc.pavilionInfo.name },
  ].filter(Boolean) as { k: string; v: string }[];

  const ficha = [
    doc.techniqueInfo?.name && { k: "Técnica artística", v: doc.techniqueInfo.name },
    doc.dimensionsText && { k: "Dimensiones", v: String(doc.dimensionsText) },
    doc.year && { k: "Año", v: String(doc.year) },
    { k: "Edición", v: edition > 1 ? `${tipo} · ${editionText}` : tipo },
    doc.shippingNotes && { k: "Entrega", v: String(doc.shippingNotes) },
  ].filter(Boolean) as { k: string; v: string }[];

  const paragraphs = String(doc.description || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chips: ViewerChip[] = [
    { label: statusText, tone: inStock ? "green" : "inv" },
    { label: tipo, tone: "inv" },
  ];

  const avatar = (
    <span className="fdm-ob-av">
      {artistPhoto ? <SmartImage src={artistPhoto} alt="" fit="cover" sizes="48px" /> : initials}
    </span>
  );

  const cartBtn = !fairMode && (
    <button
      type="button"
      className={`fdm-ob-sec${actions.inCart ? " is-on" : ""}`}
      aria-pressed={actions.inCart}
      disabled={!isAvailable && !actions.inCart}
      onClick={actions.toggleCart}
    >
      {actions.inCart ? <>{I.check({ size: 18, sw: 1.7 })} En el carrito</> : "Agregar al carrito"}
    </button>
  );

  return (
    <ShopShell>
      <style>{OBRA_CSS}</style>
      <main className="fdm-wrap fdm-ob">
        {/* ── Ruta + volver ─────────────────────────────────── */}
        <div className="fdm-ob-top">
          {fairMode ? (
            <span />
          ) : (
            <nav aria-label="Ruta" className="fdm-ob-crumb">
              <Link href="/catalogo">Catálogo</Link>
              {doc.pavilionInfo?.name && (
                <>
                  <span aria-hidden="true">/</span>
                  <Link href={pavilionHref}>{doc.pavilionInfo.name}</Link>
                </>
              )}
              {doc.techniqueInfo?.name && (
                <>
                  <span aria-hidden="true">/</span>
                  <Link href={techniqueHref}>{doc.techniqueInfo.name}</Link>
                </>
              )}
              <span aria-hidden="true">/</span>
              <span className="cur" aria-current="page">{doc.title}</span>
            </nav>
          )}
          {fairMode ? (
            <Link href={artistHref} className="fdm-ob-back">Más del artista {I.arrow({ size: 18 })}</Link>
          ) : (
            <button type="button" className="fdm-ob-back" onClick={goBack}>
              {I.back({ size: 18 })}
              Volver
            </button>
          )}
        </div>

        {/* ── Obra + compra ─────────────────────────────────── */}
        <div className="fdm-ob-hero">
          <section className="fdm-ob-media" aria-label="Imágenes de la obra">
            <ArtworkViewer images={images} title={doc.title} artist={artistName} chips={chips} />
          </section>

          <aside className="fdm-ob-buy" aria-label="Comprar">
            <div className="fdm-ob-head">
              <span className="fdm-eyebrow">{eyebrow}</span>
              <h1 className="fdm-ob-h1">{doc.title}</h1>
              <Link href={artistHref} className="fdm-ob-by">
                {avatar}
                <span className="n">{artistName}</span>
                {artistCount > 1 && <span className="c">· {artistCount} {plural(artistCount, "obra", "obras")}</span>}
              </Link>
            </div>

            <div className="fdm-ob-price">
              <b>{price}</b>
              <span>{currency} · {inStock ? tipo : statusText}</span>
            </div>

            {/* Escritorio */}
            <div className="fdm-ob-cta">
              <button type="button" className="fdm-ob-main" onClick={handleBuyNow} disabled={!isAvailable}>
                {buyLabel}
              </button>
              {(cartBtn || inStock) && (
                <div className="fdm-ob-row">
                  {cartBtn}
                  {inStock && <CajaQrButton id={String(doc._id)} title={doc.title} price={price} className="fdm-ob-sec" />}
                </div>
              )}
              {!fairMode && (
                <button type="button" className={`fdm-ob-fav${actions.isFav ? " is-on" : ""}`} aria-pressed={actions.isFav} onClick={actions.toggleFav}>
                  {I.heart({ fill: actions.isFav ? "currentColor" : "none" })}
                  <span>{actions.isFav ? "Guardada en favoritos" : "Guardar en favoritos"}</span>
                </button>
              )}
            </div>

            {/* Celular: carrito + corazón (comprar va en la barra fija) */}
            {!fairMode && (
              <div className="fdm-ob-cta-m">
                {cartBtn}
                <button
                  type="button"
                  className={`fdm-ob-heart${actions.isFav ? " is-on" : ""}`}
                  aria-label={actions.isFav ? "Quitar de favoritos" : "Guardar en favoritos"}
                  aria-pressed={actions.isFav}
                  onClick={actions.toggleFav}
                >
                  {I.heart({ fill: actions.isFav ? "currentColor" : "none" })}
                </button>
              </div>
            )}

            {salesPaused && inStock && <p className="fdm-ob-note">{salesPausedMsg}</p>}

            <dl className="fdm-ob-specs">
              {specs.map((s) => (
                <div key={s.k}>
                  <dt>{s.k}</dt>
                  <dd>{s.v}</dd>
                </div>
              ))}
            </dl>

            <div className="fdm-ob-trust">
              <span>{CHECK}<span>Venta directa del artista durante la edición.</span></span>
              <span>
                {CHECK}
                <span>
                  {edition > 1
                    ? `Edición limitada: quedan ${stock} ${plural(stock, "copia", "copias")}.`
                    : fairMode
                    ? "Pieza única: se vende una sola vez."
                    : "Cada pieza es única: si alguien la compra antes, se libera del carrito."}
                </span>
              </span>
            </div>

            {claimLink && (
              <Link href={`/reclamo?obra=${encodeURIComponent(String(doc._id))}`} className="fdm-ob-claim">
                ¿Ya compró esta obra y no tiene confirmación?
              </Link>
            )}
          </aside>
        </div>

        {/* ── Ficha + artista ───────────────────────────────── */}
        <section className="fdm-ob-ficha">
          <div className="fdm-ob-ficha-main">
            <h2 className="fdm-ob-h2">Ficha técnica y descriptiva de la obra</h2>
            <div className="fdm-ob-ficha-body">
              <dl className="fdm-ob-dl">
                {ficha.map((f) => (
                  <div key={f.k}>
                    <dt>{f.k}</dt>
                    <dd>{f.v}</dd>
                  </div>
                ))}
              </dl>
              {paragraphs.length > 0 && (
                <div className="fdm-ob-desc">
                  <h3>Descripción conceptual y artística</h3>
                  {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              )}
            </div>
          </div>

          <div className="fdm-ob-artist">
            <div className="who">
              {avatar}
              <span>
                <span className="k">Artista</span>
                <span className="v">{artistName}</span>
              </span>
            </div>
            <p>{doc.pavilionInfo?.name ? `Expone en ${doc.pavilionInfo.name}` : "Artista de la edición"}</p>
            <Link href={artistHref} className="fdm-ob-sec">Ver perfil</Link>
          </div>
        </section>

        {/* ── Más obras ─────────────────────────────────────── */}
        <MoreSection title="Más de este artista" linkLabel="Ver todas sus obras" href={artistHref} works={moreArtist} />
        {!fairMode && <MoreSection title="También en este pabellón" linkLabel="Ver el pabellón" href={pavilionHref} works={morePab} />}
      </main>

      {!fairMode && (
        <section className="fdm-strip">
          <div className="fdm-wrap fdm-strip-in">
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span className="t">¿Eres artista?</span>
              <span className="s">Postula tu obra al catálogo de la próxima edición.</span>
            </div>
            <Link href="/convocatoria" className="fdm-btn is-green is-caps">Postular</Link>
          </div>
        </section>
      )}

      {/* ── Barra fija de compra (celular) ────────────────── */}
      <div className="fdm-ob-bar">
        <span className="pr">
          <b>{price}</b>
          <span className={inStock ? "" : "is-off"}>{salesPaused && inStock ? "Venta en feria" : statusText}</span>
        </span>
        {inStock && <CajaQrButton compact id={String(doc._id)} title={doc.title} price={price} className="caja" />}
        <button type="button" className="fdm-ob-main" onClick={handleBuyNow} disabled={!isAvailable}>
          {isAvailable ? "En línea" : buyLabel}
        </button>
      </div>
    </ShopShell>
  );
}
