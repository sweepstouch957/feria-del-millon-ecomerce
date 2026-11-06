"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEdition } from "@provider/editionProvider";
import { useFairMode } from "@provider/siteConfigProvider";
import { useEventArtists } from "@hooks/queries/useEventArtists";
import { useArtistProfile } from "@hooks/queries/useArtistProfile";
import { useArtworksCursor, type ArtworkRow } from "@hooks/queries/useArtworksCursor";
import SmartImage from "@components/ui/SmartImage";
import Skeleton from "@components/ui/Skeleton";
import { formatCOP } from "@lib/money";
import { pickSrc } from "@lib/utils";
import { photoPosition } from "@services/applications.service";

/* ──────────────────────────────────────────────────────────────
   Perfil de artista — mismo sistema que /obra/[id] (tarjetas con
   radio, tokens claro/oscuro). Tres fuentes: stats del evento
   (nombre, pabellones), la solicitud (bio, proyecto, foto) y sus obras.
   ────────────────────────────────────────────────────────────── */

const PAGE_CSS = `
  .fdm-art-root{
    --bg:var(--fdm-bg,#F7F6F2); --card:#FAFAF7; --fg:#15150F; --fg2:#5F5E57; --fg3:#8E8D86;
    --line:rgba(21,21,15,.1); --line2:rgba(21,21,15,.18); --inv:#0B0B0A; --invfg:#F5F4EF; --acc:var(--fdm-green,#3FA46E);
    background:var(--bg); color:var(--fg); font-family:Jost,system-ui,sans-serif; min-height:100vh; width:100%; overflow-x:hidden;
  }
  :root[data-theme="dark"] .fdm-art-root{
    --card:#171716; --fg:#F5F4EF; --fg2:#B8B7AF; --fg3:#8E8D86;
    --line:rgba(255,255,255,.1); --line2:rgba(255,255,255,.16); --inv:#F5F4EF; --invfg:#0B0B0A;
  }
  .fdm-art-root a{ transition:color .25s ease, border-color .25s ease, background .25s ease; }
  .fdm-art-link:hover{ color:var(--acc); }
  .fdm-art-page{ max-width:1280px; margin:0 auto; padding:0 40px 72px; min-width:0; }
  .fdm-art-crumb{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:13px; color:var(--fg3); padding:22px 0 22px; }
  .fdm-art-crumb a{ color:var(--fg2); }
  .fdm-art-hero{ display:flex; align-items:center; gap:clamp(20px,3vw,40px); padding:clamp(20px,3vw,36px); background:var(--card); border:1px solid var(--line); border-radius:24px; }
  .fdm-art-photo{ position:relative; flex:0 0 auto; width:clamp(108px,13vw,168px); aspect-ratio:1; border-radius:999px; overflow:hidden; background:var(--line); box-shadow:0 0 0 4px var(--bg), 0 0 0 5px var(--line2); }
  .fdm-art-hero h1{ margin:0; font-size:clamp(30px,4.4vw,56px); line-height:1.02; font-weight:600; letter-spacing:-.025em; text-wrap:balance; overflow-wrap:anywhere; }
  .fdm-art-chip{ display:inline-flex; align-items:center; height:32px; padding:0 14px; border-radius:999px; border:1px solid var(--line2); font-size:13px; font-weight:500; color:var(--fg2); white-space:nowrap; }
  a.fdm-art-chip:hover{ border-color:var(--acc); color:var(--acc); }
  .fdm-art-body{ display:grid; grid-template-columns:minmax(0,1.6fr) minmax(0,1fr); gap:16px; margin-top:16px; }
  .fdm-art-card{ background:var(--card); border:1px solid var(--line); border-radius:16px; padding:clamp(18px,2.4vw,26px); min-width:0; }
  .fdm-art-label{ font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--fg3); font-weight:500; }
  .fdm-art-grid{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
  .fdm-art-tile{ position:relative; display:block; aspect-ratio:4/5; background:var(--card); border:1px solid var(--line); border-radius:16px; overflow:hidden; transition:border-color .3s, transform .2s; }
  .fdm-art-item:hover .fdm-art-tile{ border-color:var(--line2); transform:translateY(-2px); }
  .fdm-art-more{ height:46px; padding:0 26px; border-radius:14px; border:1px solid var(--line2); background:transparent; color:var(--fg); font-family:inherit; font-size:14px; font-weight:500; cursor:pointer; }
  .fdm-art-more:hover:not(:disabled){ background:var(--inv); color:var(--invfg); border-color:var(--inv); }
  @media (max-width:1180px){ .fdm-art-page{ padding:0 24px 64px; } .fdm-art-grid{ grid-template-columns:repeat(3,minmax(0,1fr)); } }
  @media (max-width:860px){ .fdm-art-body{ grid-template-columns:minmax(0,1fr); } }
  @media (max-width:640px){
    .fdm-art-page{ padding:0 16px 56px; }
    .fdm-art-crumb{ display:none; }
    .fdm-art-hero{ flex-direction:column; text-align:center; margin-top:14px; }
    .fdm-art-hero .fdm-art-chips{ justify-content:center; }
    .fdm-art-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
  }
`;

function Root({ children }: { children: React.ReactNode }) {
  return (
    <div className="fdm-art-root">
      <style>{PAGE_CSS}</style>
      <div className="fdm-art-page">{children}</div>
    </div>
  );
}

const imgOf = (a: any) => pickSrc(a?.image) || pickSrc(a?.images?.[0]) || "";

export default function ArtistPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { eventId } = useEdition();
  const fairMode = useFairMode();
  const reduce = useReducedMotion();

  const { data: artistsResp, isLoading: loadingArtist } = useEventArtists(
    eventId,
    { artistId: id, page: 1, limit: 1 },
    { staleTime: 60_000, refetchOnWindowFocus: false }
  );
  const { data: profile, isLoading: loadingProfile } = useArtistProfile(id);
  const { rows: artworks, isLoading: loadingArtworks, hasNextPage, loadMore, isFetching } =
    useArtworksCursor({ event: eventId, artist: id, limit: 24 });

  const row: any = (artistsResp?.rows ?? [])[0];
  const artist = row?.artist;
  const stats = row?.stats;

  const name = artist?.name?.trim() || "Artista";
  // La foto de la solicitud manda; sin foto, su primera obra (mejor que unas iniciales).
  const portrait = pickSrc(profile?.photoUrl) || pickSrc(artist?.image);
  const photo = portrait || imgOf(artworks[artworks.length - 1]) || imgOf(artworks[0]);

  const pavilions: any[] = stats?.byPavilion ?? [];
  const totalArtworks = Number(stats?.totalArtworks ?? artworks.length);

  const rise = reduce
    ? {}
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } };

  const initials = useMemo(
    () => name.split(" ").filter(Boolean).slice(0, 2).map((p: string) => p[0]?.toUpperCase()).join(""),
    [name]
  );

  if (loadingArtist || loadingProfile) {
    return (
      <Root>
        <div style={{ padding: "22px 0" }}><Skeleton w={280} h={13} /></div>
        <div className="fdm-art-hero">
          <Skeleton w="clamp(108px,13vw,168px)" aspect="1" radius={999} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
            <Skeleton w="30%" h={11} />
            <Skeleton w="70%" h={48} />
            <Skeleton w="40%" h={30} radius={999} />
          </div>
        </div>
        <div className="fdm-art-grid" style={{ marginTop: 32 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Skeleton aspect="4/5" radius={16} />
              <Skeleton w="80%" h={15} />
              <Skeleton w="45%" h={13} />
            </div>
          ))}
        </div>
      </Root>
    );
  }

  if (!artist) {
    return (
      <Root>
        <div style={{ padding: "clamp(40px,8vw,110px) 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center" }}>
          <h1 style={{ margin: 0, fontWeight: 600, fontSize: "clamp(24px,3vw,36px)", letterSpacing: "-.02em" }}>Artista no encontrado</h1>
          <p style={{ margin: 0, maxWidth: "42ch", fontSize: 15, lineHeight: 1.6, color: "var(--fg2)" }}>
            Puede que no tenga obras publicadas en esta edición.
          </p>
          <Link href={fairMode ? "/" : "/catalogo"} className="fdm-art-chip" style={{ height: 46, padding: "0 24px" }}>
            {fairMode ? "Volver al inicio" : "Ver catálogo"}
          </Link>
        </div>
      </Root>
    );
  }

  return (
    <Root>
      <nav aria-label="Migas de pan" className="fdm-art-crumb">
        {!fairMode && (
          <>
            <Link href="/catalogo" className="fdm-art-link">Catálogo</Link>
            <span style={{ opacity: 0.4 }}>/</span>
          </>
        )}
        <Link href="/artistas" className="fdm-art-link">Artistas</Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <span aria-current="page" style={{ color: "var(--fg)" }}>{name}</span>
      </nav>

      {/* ── Encabezado ────────────────────────────────────── */}
      <motion.header className="fdm-art-hero" {...rise}>
        <span className="fdm-art-photo">
          {photo ? (
            <SmartImage
              src={photo}
              alt={portrait ? name : `Obra de ${name}`}
              fit="cover"
              sizes="170px"
              priority
              style={portrait ? { objectPosition: photoPosition(profile?.photoY) } : undefined}
            />
          ) : (
            <span style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", fontWeight: 500, fontSize: "clamp(32px,4vw,52px)", color: "var(--fg3)" }}>
              {initials}
            </span>
          )}
        </span>
        <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <span style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--acc)", fontWeight: 600 }}>
            Artista de la edición
          </span>
          <h1>{name}</h1>
          <div className="fdm-art-chips" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
            <span className="fdm-art-chip" style={{ background: "var(--inv)", color: "var(--invfg)", borderColor: "var(--inv)" }}>
              {totalArtworks} {totalArtworks === 1 ? "obra" : "obras"}
            </span>
            {pavilions.map((p) =>
              fairMode ? (
                <span key={String(p.pavilionId)} className="fdm-art-chip">{p.name || "Pabellón"}</span>
              ) : (
                <Link key={String(p.pavilionId)} href={`/catalogo?pavilion=${encodeURIComponent(String(p.pavilionId))}&modo=pabellon`} className="fdm-art-chip">
                  {p.name || "Pabellón"}
                </Link>
              )
            )}
          </div>
        </div>
      </motion.header>

      {/* ── Bio y proyecto ────────────────────────────────── */}
      {(profile?.bio || profile?.projectTitle || profile?.projectReview) && (
        <motion.section className="fdm-art-body" {...rise}>
          <div className="fdm-art-card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {profile?.bio && (
              <>
                <span className="fdm-art-label">Sobre el artista</span>
                <MoreText text={profile.bio} lines={3} style={{ fontSize: 16, lineHeight: 1.65 }} />
              </>
            )}
            {(profile?.projectTitle || profile?.projectReview) && (
              <>
                <span className="fdm-art-label" style={{ marginTop: profile?.bio ? 8 : 0 }}>El proyecto</span>
                {profile?.projectTitle && (
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "clamp(19px,1.8vw,24px)", lineHeight: 1.25, letterSpacing: "-.015em" }}>{profile.projectTitle}</p>
                )}
                {profile?.projectReview && (
                  <MoreText text={profile.projectReview} lines={4} style={{ fontSize: 15.5, lineHeight: 1.7 }} />
                )}
              </>
            )}
          </div>

          {pavilions.length > 0 && (
            <aside className="fdm-art-card" style={{ display: "flex", flexDirection: "column", gap: 4, alignSelf: "start" }}>
              <span className="fdm-art-label" style={{ marginBottom: 6 }}>Dónde encontrarlo</span>
              {pavilions.map((p, i) => {
                const inner = (
                  <>
                    <span style={{ fontSize: 15.5, fontWeight: 500 }}>{p.name || "Pabellón"}</span>
                    <span style={{ fontSize: 13, color: "var(--fg3)" }}>{p.artworksCount} {Number(p.artworksCount) === 1 ? "obra" : "obras"}</span>
                  </>
                );
                const style: React.CSSProperties = { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: "12px 0", borderTop: i ? "1px solid var(--line)" : undefined, color: "var(--fg)" };
                return fairMode ? (
                  <div key={String(p.pavilionId)} style={style}>{inner}</div>
                ) : (
                  <Link key={String(p.pavilionId)} href={`/catalogo?pavilion=${encodeURIComponent(String(p.pavilionId))}&modo=pabellon`} className="fdm-art-link" style={style}>{inner}</Link>
                );
              })}
            </aside>
          )}
        </motion.section>
      )}

      {/* ── Obras ─────────────────────────────────────────── */}
      <section style={{ marginTop: "clamp(36px,5vw,64px)", display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-.02em" }}>Obras</h2>

        {loadingArtworks ? (
          <div className="fdm-art-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton aspect="4/5" radius={16} />
                <Skeleton w="80%" h={15} />
                <Skeleton w="45%" h={13} />
              </div>
            ))}
          </div>
        ) : artworks.length === 0 ? (
          <div className="fdm-art-card" style={{ textAlign: "center", color: "var(--fg2)", fontSize: 15 }}>
            Sus obras se publican cuando abra la feria.
          </div>
        ) : (
          <>
            <div className="fdm-art-grid">
              {artworks.map((art: ArtworkRow, i: number) => (
                <ArtCard key={String(art._id)} art={art} index={i} reduce={!!reduce} />
              ))}
            </div>
            {hasNextPage && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
                <button type="button" className="fdm-art-more" onClick={() => loadMore()} disabled={isFetching}>
                  {isFetching ? "Cargando…" : "Ver más obras"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </Root>
  );
}

/** Texto largo recortado a `lines` líneas con "Ver más": así las obras quedan arriba. */
function MoreText({ text, lines, style }: { text: string; lines: number; style: React.CSSProperties }) {
  const [open, setOpen] = useState(false);
  // ponytail: umbral por caracteres (~70 por línea en celular), no mide el alto real.
  const long = text.length > lines * 70 || text.split("\n").length > lines;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <p
        style={{
          margin: 0,
          color: "var(--fg2)",
          textWrap: "pretty",
          whiteSpace: "pre-line",
          ...style,
          ...(long && !open
            ? { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" }
            : {}),
        }}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{ padding: "6px 0", minHeight: 36, border: 0, background: "none", color: "var(--acc)", font: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          {open ? "Ver menos" : "Ver más"}
        </button>
      )}
    </div>
  );
}

function ArtCard({ art, index, reduce }: { art: ArtworkRow; index: number; reduce: boolean }) {
  const img = imgOf(art) || "/placeholder.png";
  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: reduce ? 0 : Math.min(index, 8) * 0.04 }}
      style={{ minWidth: 0 }}
    >
      <Link
        href={`/obra/${encodeURIComponent(String(art._id ?? art.id))}`}
        className="fdm-art-item"
        style={{ display: "flex", flexDirection: "column", gap: 10, color: "var(--fg)" }}
      >
        <span className="fdm-art-tile">
          <span style={{ position: "absolute", inset: 14, display: "block", filter: "drop-shadow(0 10px 24px rgba(0,0,0,.3))" }}>
            <SmartImage src={img} alt={art.title || "Obra"} sizes="(max-width: 640px) 46vw, (max-width: 1180px) 30vw, 300px" />
          </span>
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 2px", minWidth: 0 }}>
          {(art as any)?.techniqueInfo?.name && (
            <span style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--acc)", fontWeight: 600 }}>
              {(art as any).techniqueInfo.name}
            </span>
          )}
          <span style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {art.title || "Sin título"}
          </span>
          <span style={{ fontSize: 13.5, color: "var(--fg3)" }}>{formatCOP(art.price, { currency: art.currency })}</span>
        </span>
      </Link>
    </motion.div>
  );
}
