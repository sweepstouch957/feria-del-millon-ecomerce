"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEdition } from "@provider/editionProvider";
import { useCatalogSalesPaused, useFairMode } from "@provider/siteConfigProvider";
import { useEventArtists } from "@hooks/queries/useEventArtists";
import { useArtistProfile } from "@hooks/queries/useArtistProfile";
import { useArtworksCursor } from "@hooks/queries/useArtworksCursor";
import { useMounted } from "@hooks/useMounted";
import SmartImage from "@components/ui/SmartImage";
import Skeleton from "@components/ui/Skeleton";
import useCart from "@store/useCart";
import { pickSrc } from "@lib/utils";
import { photoPosition } from "@services/applications.service";
import { ArtworkCard } from "@components/views/catalog/ArtworkCard";
import { I, ShopShell, cardToCart, fmt, plural, toCardArt } from "@components/views/catalog/shared";

/* ──────────────────────────────────────────────────────────────
   Perfil de artista — port de "Desktop/Mobile · Artista" (Claude Design 4).
   Mismo sistema que el catálogo (ShopShell + ArtworkCard). Tres fuentes:
   stats del evento (nombre, pabellones), la solicitud (bio, proyecto, foto)
   y sus obras.
   ────────────────────────────────────────────────────────────── */

const ART_CSS = `
.fdm-ar-top{padding:12px 0;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 24px}
.fdm-ar-crumb{display:flex;flex-wrap:wrap;align-items:center;gap:0 10px;font-size:14px;color:var(--fg2)}
.fdm-ar-crumb a{min-height:44px;display:inline-flex;align-items:center;text-decoration:underline;text-underline-offset:3px}
.fdm-ar-hero{padding:24px 0 40px;border-bottom:1px solid var(--fg);display:flex;flex-wrap:wrap;align-items:center;gap:32px 64px}
.fdm-ar-txt{flex:1 1 420px;min-width:0;display:flex;flex-direction:column;gap:20px}
.fdm-ar-who{display:flex;align-items:center;gap:16px}
.fdm-ar-av{position:relative;flex:none;width:72px;height:72px;border-radius:999px;overflow:hidden;background:var(--inv);color:var(--invfg);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:500}
.fdm-ar-h1{margin:0;font-size:64px;line-height:1;font-weight:300;letter-spacing:.01em;overflow-wrap:anywhere;text-wrap:balance}
.fdm-ar-dl{margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.fdm-ar-dl>div{padding:14px 16px;background:var(--bg);display:flex;flex-direction:column;gap:4px;min-width:0}
.fdm-ar-dl dt{font-size:11px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--fg2)}
.fdm-ar-dl dd{margin:0;font-size:20px;overflow-wrap:anywhere}
.fdm-ar-acts{display:flex;flex-wrap:wrap;gap:10px}
.fdm-ar-acts .fdm-btn{height:52px}
.fdm-ar-acts .go{flex:0 1 220px}
.fdm-ar-acts .sh{flex:0 1 160px}
.fdm-ar-feat{flex:1 1 380px;min-width:0;aspect-ratio:4/3;background:var(--tile);display:flex;align-items:center;justify-content:center;padding:6%;position:relative}
.fdm-ar-feat>span{position:relative;display:block;width:100%;height:100%;filter:drop-shadow(var(--img-shadow))}
.fdm-ar-body{padding:48px 0;display:flex;flex-wrap:wrap;align-items:flex-start;gap:40px 64px}
.fdm-ar-proj{flex:2 1 460px;min-width:0;max-width:720px;display:flex;flex-direction:column;gap:14px}
.fdm-ar-h2{margin:0;font-size:32px;line-height:1.15;font-weight:300;overflow-wrap:anywhere}
.fdm-ar-p{margin:0;font-size:17px;line-height:1.65;color:var(--fg);opacity:.86;white-space:pre-line;overflow-wrap:anywhere}
.fdm-ar-side{flex:1 1 300px;min-width:0;display:flex;flex-direction:column;gap:12px}
.fdm-ar-label{font-size:11px;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--fg2)}
.fdm-ar-pab{padding:20px;background:var(--card);border:1px solid var(--line);border-radius:16px;display:flex;align-items:center;gap:14px;color:var(--fg);transition:border-color .2s}
a.fdm-ar-pab:hover{border-color:var(--fg);color:var(--fg)}
.fdm-ar-pin{flex:none;width:44px;height:44px;border-radius:999px;background:var(--green-soft);color:var(--green-deep);display:flex;align-items:center;justify-content:center}
.fdm-ar-works{padding-top:28px;border-top:1px solid var(--line);scroll-margin-top:calc(var(--nav-h,80px) + 16px)}
.fdm-ar-works-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px 24px;padding-bottom:24px}
@media (max-width:767px){
  .fdm-ar-top{justify-content:flex-end;padding:8px 0}
  .fdm-ar-crumb{display:none}
  .fdm-ar-hero{padding:0 0 28px;gap:20px}
  .fdm-ar-feat{order:-1;flex:1 1 100%;margin:0 -16px;padding:24px}
  .fdm-ar-txt{gap:14px}
  .fdm-ar-who{gap:12px}
  .fdm-ar-av{width:52px;height:52px;font-size:18px}
  .fdm-ar-h1{font-size:36px;line-height:1.05}
  .fdm-ar-dl{grid-template-columns:repeat(3,minmax(0,1fr))}
  .fdm-ar-dl>div{padding:12px}
  .fdm-ar-dl dd{font-size:16px}
  .fdm-ar-acts{flex-wrap:nowrap}
  .fdm-ar-acts .go{flex:1}
  .fdm-ar-acts .sh{flex:none;width:52px;padding:0}
  .fdm-ar-acts .sh .t{display:none}
  .fdm-ar-body{padding:28px 0;gap:28px}
  .fdm-ar-h2{font-size:26px}
  .fdm-ar-p{font-size:15px}
  .fdm-ar-pab{padding:16px;gap:12px}
}
`;

const Pin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);
const Share = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <path d="M12 15V4M8 8l4-4 4 4M5 13v6h14v-6" />
  </svg>
);

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ShopShell>
      <style>{ART_CSS}</style>
      <div className="fdm-wrap" style={{ paddingBottom: 72 }}>{children}</div>
    </ShopShell>
  );
}

export default function ArtistPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { eventId } = useEdition();
  const fairMode = useFairMode();
  const { paused } = useCatalogSalesPaused();
  const mounted = useMounted();
  const cartItems = useCart((s) => s.items);
  const addToCart = useCart((s) => s.add);
  const [copied, setCopied] = useState(false);

  const { data: artistsResp, isLoading: loadingArtist } = useEventArtists(
    eventId,
    { artistId: id, page: 1, limit: 1 },
    { staleTime: 60_000, refetchOnWindowFocus: false }
  );
  const { data: profile, isLoading: loadingProfile } = useArtistProfile(id);
  const { rows, isLoading: loadingArtworks, hasNextPage, loadMore, isFetching } =
    useArtworksCursor({ event: eventId, artist: id, limit: 24 });

  const row: any = (artistsResp?.rows ?? [])[0];
  const artist = row?.artist;
  const stats = row?.stats;
  const name = artist?.name?.trim() || "Artista";
  const portrait = pickSrc(profile?.photoUrl) || pickSrc(artist?.image);

  const cards = useMemo(() => rows.map((r) => ({ ...toCardArt(r), artist: name })), [rows, name]);
  const featured = cards.find((c) => c.image);
  const pavilions: any[] = stats?.byPavilion ?? [];
  const total = Number(stats?.totalArtworks ?? cards.length);

  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join("");
  const techniques = [...new Set(cards.map((c) => c.technique).filter(Boolean))].join(", ") || "—";
  const prices = cards.map((c) => c.price).filter((p) => p > 0);
  const lo = prices.length ? Math.min(...prices) : 0;
  const hi = prices.length ? Math.max(...prices) : 0;
  const priceLabel = !prices.length ? "—" : lo === hi ? fmt(lo) : `Desde ${fmt(lo)}`;

  // Lo que se puede llevar de una: no vendido y que no esté ya en el carrito.
  const pending = cards.filter((c) => !(c.stock != null && c.stock <= 0) && !cartItems.some((i) => String(i.id) === c.id));
  const canBuy = !fairMode && !paused;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${name} · Feria del Millón`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const back = () => (window.history.length > 1 ? router.back() : router.push(fairMode ? "/" : "/catalogo"));

  if (loadingArtist || loadingProfile) {
    return (
      <Shell>
        <div className="fdm-ar-top"><Skeleton w={260} h={13} /></div>
        <div className="fdm-ar-hero">
          <div className="fdm-ar-txt">
            <Skeleton w={72} h={72} radius={999} />
            <Skeleton w="70%" h={56} />
            <Skeleton h={70} radius={12} />
          </div>
          <div className="fdm-ar-feat" />
        </div>
      </Shell>
    );
  }

  if (!artist) {
    return (
      <Shell>
        <div style={{ padding: "clamp(40px,8vw,110px) 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <h1 className="fdm-ar-h2">Artista no encontrado</h1>
          <p style={{ margin: 0, maxWidth: "42ch", fontSize: 16, lineHeight: 1.6, color: "var(--fg2)" }}>
            Puede que no tenga obras publicadas en esta edición.
          </p>
          <Link href={fairMode ? "/" : "/catalogo"} className="fdm-btn is-ghost">
            {fairMode ? "Volver al inicio" : "Ver catálogo"}
          </Link>
        </div>
      </Shell>
    );
  }

  const hasProject = !!(profile?.projectTitle || profile?.projectReview);

  return (
    <Shell>
      <div className="fdm-ar-top">
        <nav aria-label="Ruta" className="fdm-ar-crumb">
          {!fairMode && (<><Link href="/catalogo">Catálogo</Link><span aria-hidden="true">/</span></>)}
          <Link href="/artistas">Artistas</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page" style={{ color: "var(--fg)" }}>{name}</span>
        </nav>
        <button type="button" className="fdm-btn is-ghost" style={{ height: 44, padding: "0 18px", fontWeight: 400 }} onClick={back}>
          {I.back({ size: 18 })}Volver
        </button>
      </div>

      {/* ── Encabezado ────────────────────────────────────── */}
      <section className="fdm-ar-hero">
        <div className="fdm-ar-txt">
          <div className="fdm-ar-who">
            <span className="fdm-ar-av">
              {portrait ? (
                <SmartImage src={portrait} alt={name} fit="cover" sizes="72px" priority style={{ objectPosition: photoPosition(profile?.photoY) }} />
              ) : (
                initials
              )}
            </span>
            <span className="fdm-eyebrow">Artista de la edición</span>
          </div>
          <h1 className="fdm-ar-h1">{name}</h1>
          <dl className="fdm-ar-dl">
            <div><dt>Obras</dt><dd>{total}</dd></div>
            <div><dt>Técnica</dt><dd>{techniques}</dd></div>
            <div><dt>Precios</dt><dd style={{ whiteSpace: "nowrap" }}>{priceLabel}</dd></div>
          </dl>
          <div className="fdm-ar-acts">
            <a href="#artista-obras" className="fdm-btn go">Ver sus obras{I.arrow({ size: 18 })}</a>
            <button type="button" className="fdm-btn is-outline sh" onClick={share} aria-label="Compartir">
              <Share /><span className="t">{copied ? "Enlace copiado" : "Compartir"}</span>
            </button>
          </div>
        </div>
        <div className="fdm-ar-feat">
          {featured?.image ? (
            <span><SmartImage src={featured.image} alt={`Obra de ${name}`} sizes="(max-width: 767px) 100vw, 640px" priority /></span>
          ) : (
            <span style={{ display: "grid", placeItems: "center", fontSize: 12, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--fg2)", filter: "none" }}>
              {loadingArtworks ? "" : "Obra destacada"}
            </span>
          )}
        </div>
      </section>

      {/* ── Proyecto y dónde encontrarlo ──────────────────── */}
      {(hasProject || profile?.bio || pavilions.length > 0) && (
        <section className="fdm-ar-body">
          <div className="fdm-ar-proj">
            {hasProject && (
              <>
                <span className="fdm-eyebrow">El proyecto</span>
                {profile?.projectTitle && <h2 className="fdm-ar-h2">{profile.projectTitle}</h2>}
                {profile?.projectReview && <MoreText text={profile.projectReview} />}
              </>
            )}
            {profile?.bio && (
              <>
                <span className="fdm-eyebrow" style={{ marginTop: hasProject ? 18 : 0 }}>Sobre el artista</span>
                <MoreText text={profile.bio} />
              </>
            )}
          </div>

          {pavilions.length > 0 && (
            <aside className="fdm-ar-side">
              <span className="fdm-ar-label">Dónde encontrarlo</span>
              {pavilions.map((p) => {
                const inner = (
                  <>
                    <span className="fdm-ar-pin"><Pin /></span>
                    <span style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 18 }}>{p.name || "Pabellón"}</span>
                      <span style={{ fontSize: 14, color: "var(--fg2)" }}>{p.artworksCount} {plural(Number(p.artworksCount), "obra", "obras")}</span>
                    </span>
                    {!fairMode && I.arrow({ size: 18 })}
                  </>
                );
                return fairMode ? (
                  <div key={String(p.pavilionId)} className="fdm-ar-pab">{inner}</div>
                ) : (
                  <Link key={String(p.pavilionId)} href={`/catalogo?pavilion=${encodeURIComponent(String(p.pavilionId))}`} className="fdm-ar-pab">{inner}</Link>
                );
              })}
              {!fairMode && <span style={{ fontSize: 14, lineHeight: 1.5, color: "var(--fg2)" }}>Toca el pabellón para ver todo lo que se expone ahí.</span>}
            </aside>
          )}
        </section>
      )}

      {/* ── Obras ─────────────────────────────────────────── */}
      <section id="artista-obras" className="fdm-ar-works" style={hasProject || pavilions.length ? undefined : { marginTop: 32 }}>
        <div className="fdm-ar-works-head">
          <h2 className="fdm-ar-h2">Obras <span style={{ fontSize: 17, color: "var(--fg2)" }}>· {total}</span></h2>
          {canBuy && mounted && cards.length > 0 && (
            <button
              type="button"
              className="fdm-btn is-outline"
              disabled={pending.length === 0}
              onClick={() => pending.forEach((c) => addToCart(cardToCart(c), 1))}
            >
              {pending.length === 0 ? "Todas están en el carrito" : `Agregar ${pending.length === 1 ? "la obra" : `las ${pending.length}`} al carrito`}
            </button>
          )}
        </div>

        {loadingArtworks ? (
          <div className="fdm-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton aspect="4/5" radius={0} />
                <Skeleton w="80%" h={15} />
                <Skeleton w="45%" h={13} />
              </div>
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div style={{ padding: "48px 20px", background: "var(--tile)", textAlign: "center", fontSize: 16, color: "var(--fg2)" }}>
            Sus obras se publican cuando abra la feria.
          </div>
        ) : (
          <>
            <div className="fdm-grid">
              {cards.map((c, i) => <ArtworkCard key={c.id} art={c} eager={i < 4} />)}
            </div>
            {hasNextPage && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 32 }}>
                <button type="button" className="fdm-btn is-ghost" onClick={() => loadMore()} disabled={isFetching}>
                  {isFetching ? "Cargando…" : "Ver más obras"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </Shell>
  );
}

/** Texto largo: muestra los primeros párrafos y "Leer más" para el resto. */
function MoreText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  // ponytail: corta por caracteres (~420), no mide el alto real.
  const long = text.length > 420;
  const shown = long && !open ? text.slice(0, text.lastIndexOf(" ", 420)).trimEnd() + "…" : text;
  return (
    <>
      <p className="fdm-ar-p">{shown}</p>
      {long && (
        <button type="button" className="fdm-link-u" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Leer menos" : "Leer más"}
        </button>
      )}
    </>
  );
}
