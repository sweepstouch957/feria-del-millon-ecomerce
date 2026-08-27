"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEdition } from "@provider/editionProvider";
import { useEventArtists } from "@hooks/queries/useEventArtists";
import { useArtistProfile } from "@hooks/queries/useArtistProfile";
import { useArtworksCursor, type ArtworkRow } from "@hooks/queries/useArtworksCursor";
import SmartImage from "@components/ui/SmartImage";
import Skeleton from "@components/ui/Skeleton";
import { formatCOP } from "@lib/money";
import { pickSrc } from "@lib/utils";

/* ──────────────────────────────────────────────────────────────
   Perfil de artista — mismo sistema editorial v2 que /obra/[id].
   Combina tres fuentes: stats del evento (nombre, foto, pabellones),
   la solicitud aceptada (bio y reseña) y sus obras publicadas.
   ────────────────────────────────────────────────────────────── */

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10.5,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

const ROOT_VARS = {
  "--bg": "var(--fdm-bg,#F7F6F2)",
  "--fg": "var(--fdm-fg,#0B0B0A)",
  "--acc": "var(--fdm-green,#3FA46E)",
  "--panel": "var(--fdm-panel,#0B0B0A)",
  background: "var(--bg)",
  color: "var(--fg)",
  fontFamily: "Jost, system-ui, sans-serif",
  fontWeight: 400,
  letterSpacing: "0.005em",
  minHeight: "100vh",
  width: "100%",
  overflowX: "hidden",
} as React.CSSProperties;

const PAGE_CSS = `
  .fdm-art a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-art-link:hover { color: var(--acc); }
  .fdm-art-hero { display:flex; flex-wrap:wrap; align-items:flex-end; gap:clamp(20px,2.6vw,44px); padding:clamp(20px,2.4vw,34px) 0 clamp(16px,1.8vw,24px); border-bottom:1px solid color-mix(in srgb, var(--fg) 20%, transparent); }
  .fdm-art-photo { position:relative; flex:0 0 auto; width:clamp(120px,15vw,190px); aspect-ratio:1; border-radius:999px; overflow:hidden; }
  .fdm-art-body { display:flex; flex-wrap:wrap; align-items:flex-start; gap:clamp(22px,3vw,56px); padding:clamp(18px,2.2vw,32px) 0; }
  .fdm-art-text { flex:1 1 420px; min-width:min(100%,300px); max-width:64ch; display:flex; flex-direction:column; gap:clamp(14px,1.6vw,22px); }
  .fdm-art-side { flex:0 1 240px; min-width:min(100%,220px); display:flex; flex-direction:column; }
  .fdm-art-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%,230px), 1fr)); gap:clamp(20px,2vw,30px) clamp(16px,1.6vw,24px); padding-top:clamp(16px,1.8vw,26px); }
  .fdm-art-card:hover .fdm-art-frame { border-color: var(--acc); }
`;

function Chrome({ children }: { children: React.ReactNode }) {
  return (
    <div style={ROOT_VARS}>
      <style>{PAGE_CSS}</style>
      <div
        className="fdm-art"
        style={{ maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)" }}
      >
        {children}
      </div>
    </div>
  );
}

export default function ArtistPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { eventId } = useEdition();
  const reduce = useReducedMotion();

  const { data: artistsResp, isLoading: loadingArtist } = useEventArtists(
    eventId,
    { artistId: id, page: 1, limit: 1 },
    { staleTime: 60_000, refetchOnWindowFocus: false }
  );

  const { data: profile, isLoading: loadingProfile } = useArtistProfile(id);

  const {
    rows: artworks,
    isLoading: loadingArtworks,
    hasNextPage,
    loadMore,
    isFetching,
  } = useArtworksCursor({ event: eventId, artist: id, limit: 24 });

  const row: any = (artistsResp?.rows ?? [])[0];
  const artist = row?.artist;
  const stats = row?.stats;

  const name = artist?.name?.trim() || "Artista";
  // La foto de la solicitud manda: es la que el artista eligió mostrar.
  const photo = pickSrc(profile?.photoUrl) || pickSrc(artist?.image);

  const pavilions: any[] = stats?.byPavilion ?? [];
  const totalArtworks = Number(stats?.totalArtworks ?? artworks.length);

  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
      };

  const loading = loadingArtist || loadingProfile;

  const initials = useMemo(
    () =>
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p: string) => p[0]?.toUpperCase())
        .join(""),
    [name]
  );

  if (loading) {
    return (
      <Chrome>
        <div style={{ padding: "12px 0", borderBottom: `1px solid ${mix(12)}` }}>
          <Skeleton w={280} h={11} />
        </div>
        <div className="fdm-art-hero">
          <Skeleton w="clamp(120px,15vw,190px)" aspect="1" radius={999} />
          <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 12 }}>
            <Skeleton w="40%" h={11} />
            <Skeleton w="70%" h={54} />
            <Skeleton w="50%" h={14} />
          </div>
        </div>
        <div className="fdm-art-body">
          <div className="fdm-art-text">
            <Skeleton w="100%" h={14} />
            <Skeleton w="94%" h={14} />
            <Skeleton w="88%" h={14} />
          </div>
        </div>
        <div className="fdm-art-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Skeleton aspect="4/5" />
              <Skeleton w="80%" h={18} />
              <Skeleton w="50%" h={14} />
            </div>
          ))}
        </div>
      </Chrome>
    );
  }

  if (!artist) {
    return (
      <Chrome>
        <div
          style={{
            padding: "clamp(40px,6vw,90px) 0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontWeight: 400,
              fontSize: "clamp(24px,3vw,36px)",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            Artista no encontrado
          </span>
          <p style={{ margin: 0, maxWidth: "42ch", fontSize: 15, lineHeight: 1.6, color: mix(70) }}>
            Puede que no tenga obras publicadas en esta edición.
          </p>
          <Link
            href="/catalogo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 48,
              padding: "0 30px",
              background: "var(--fg)",
              color: "var(--bg)",
              borderRadius: 999,
              ...EYEBROW,
              fontSize: 11,
              letterSpacing: "0.12em",
            }}
          >
            Ver catálogo
          </Link>
        </div>
      </Chrome>
    );
  }

  return (
    <Chrome>
      {/* ── Migas ─────────────────────────────────────────── */}
      <nav
        aria-label="Migas de pan"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 9,
          padding: "12px 0",
          borderBottom: `1px solid ${mix(12)}`,
          ...EYEBROW,
          fontSize: 10.5,
          letterSpacing: "0.14em",
          color: mix(55),
        }}
      >
        <Link href="/catalogo" className="fdm-art-link">
          Catálogo
        </Link>
        <span aria-hidden>/</span>
        <Link href="/artistas" className="fdm-art-link">
          Artistas
        </Link>
        <span aria-hidden>/</span>
        <span aria-current="page" style={{ color: mix(85) }}>
          {name}
        </span>
      </nav>

      {/* ── Encabezado ────────────────────────────────────── */}
      <motion.header className="fdm-art-hero" {...rise}>
        <span className="fdm-art-photo" style={{ background: mix(8) }}>
          {photo ? (
            <SmartImage src={photo} alt={name} fit="cover" sizes="190px" priority />
          ) : (
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: "100%",
                height: "100%",
                fontWeight: 300,
                fontSize: "clamp(34px,4vw,56px)",
                color: mix(45),
              }}
            >
              {initials}
            </span>
          )}
        </span>

        <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ ...EYEBROW, color: "var(--acc)" }}>Artista de la edición</span>
          <h1
            style={{
              margin: 0,
              fontWeight: 300,
              fontSize: "clamp(34px,4.6vw,68px)",
              lineHeight: 1,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {name}
          </h1>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 22px",
              ...EYEBROW,
              fontSize: 10.5,
              color: mix(55),
            }}
          >
            <span>
              {totalArtworks} {totalArtworks === 1 ? "obra" : "obras"}
            </span>
            {pavilions.map((p) => (
              <Link
                key={String(p.pavilionId)}
                href={`/catalogo?pavilion=${encodeURIComponent(String(p.pavilionId))}&modo=pabellon`}
                className="fdm-art-link"
              >
                {p.name || "Pabellón"} · {p.artworksCount}
              </Link>
            ))}
          </div>
        </div>
      </motion.header>

      {/* ── Bio y reseña ──────────────────────────────────── */}
      {(profile?.bio || profile?.projectReview) && (
        <motion.section className="fdm-art-body" {...rise}>
          <div className="fdm-art-text">
            {profile?.bio && (
              <>
                <span style={{ ...EYEBROW, fontSize: 10, color: mix(50) }}>Sobre el artista</span>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(15.5px,1.15vw,18px)",
                    lineHeight: 1.7,
                    color: mix(78),
                    textWrap: "pretty",
                    whiteSpace: "pre-line",
                  }}
                >
                  {profile.bio}
                </p>
              </>
            )}

            {profile?.projectReview && (
              <>
                <span style={{ ...EYEBROW, fontSize: 10, color: mix(50), marginTop: 6 }}>
                  El proyecto
                </span>
                <p
                  style={{
                    margin: 0,
                    fontSize: "clamp(15px,1.1vw,17px)",
                    lineHeight: 1.7,
                    color: mix(72),
                    textWrap: "pretty",
                    whiteSpace: "pre-line",
                  }}
                >
                  {profile.projectReview}
                </p>
              </>
            )}
          </div>

          {pavilions.length > 0 && (
            <aside className="fdm-art-side">
              <span
                style={{
                  ...EYEBROW,
                  fontSize: 10,
                  color: mix(50),
                  paddingBottom: 10,
                  borderBottom: `1px solid ${mix(20)}`,
                }}
              >
                Dónde encontrarlo
              </span>
              {pavilions.map((p) => (
                <Link
                  key={String(p.pavilionId)}
                  href={`/catalogo?pavilion=${encodeURIComponent(String(p.pavilionId))}&modo=pabellon`}
                  className="fdm-art-link"
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: `1px solid ${mix(9)}`,
                    fontSize: 14.5,
                  }}
                >
                  <span>{p.name || "Pabellón"}</span>
                  <span style={{ fontWeight: 500, fontSize: 11.5, color: mix(55) }}>
                    {p.artworksCount}
                  </span>
                </Link>
              ))}
            </aside>
          )}
        </motion.section>
      )}

      {/* ── Obras ─────────────────────────────────────────── */}
      <section style={{ padding: "clamp(10px,1.2vw,18px) 0 clamp(40px,4vw,64px)" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            paddingBottom: 12,
            borderBottom: `1px solid ${mix(22)}`,
          }}
        >
          <span
            style={{
              fontWeight: 400,
              fontSize: "clamp(19px,2vw,27px)",
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            Obras
          </span>
          <Link
            href={`/catalogo?artistId=${encodeURIComponent(String(id))}`}
            className="fdm-art-link"
            style={{ ...EYEBROW, fontSize: 10, color: "var(--acc)" }}
          >
            Verlas en el catálogo →
          </Link>
        </div>

        {loadingArtworks ? (
          <div className="fdm-art-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Skeleton aspect="4/5" />
                <Skeleton w="80%" h={18} />
                <Skeleton w="50%" h={14} />
              </div>
            ))}
          </div>
        ) : artworks.length === 0 ? (
          <p style={{ margin: "clamp(28px,4vw,56px) 0", fontSize: 15, color: mix(65) }}>
            Este artista todavía no tiene obras publicadas en la edición.
          </p>
        ) : (
          <>
            <div className="fdm-art-grid">
              {artworks.map((art: ArtworkRow, i: number) => (
                <ArtCard key={String(art._id)} art={art} index={i} reduce={!!reduce} />
              ))}
            </div>

            {hasNextPage && (
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 26 }}>
                <button
                  type="button"
                  onClick={() => loadMore()}
                  disabled={isFetching}
                  style={{
                    height: 46,
                    padding: "0 28px",
                    background: "transparent",
                    color: "inherit",
                    border: `1px solid ${mix(26)}`,
                    borderRadius: 999,
                    cursor: isFetching ? "wait" : "pointer",
                    ...EYEBROW,
                    fontSize: 10.5,
                    letterSpacing: "0.12em",
                  }}
                >
                  {isFetching ? "Cargando…" : "Ver más obras"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </Chrome>
  );
}

function ArtCard({
  art,
  index,
  reduce,
}: {
  art: ArtworkRow;
  index: number;
  reduce: boolean;
}) {
  const img =
    pickSrc((art as any).image) || pickSrc((art as any).images?.[0]) || "/placeholder.png";

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: reduce ? 0 : Math.min(index, 8) * 0.04 }}
      whileHover={reduce ? undefined : { y: -4 }}
    >
      <Link
        href={`/obra/${encodeURIComponent(String(art._id ?? art.id))}`}
        className="fdm-art-card"
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <span
          className="fdm-art-frame"
          style={{
            position: "relative",
            display: "block",
            aspectRatio: "4/5",
            padding: "clamp(12px,1.4vw,18px)",
            background: mix(4),
            border: `1px solid ${mix(10)}`,
            transition: "border-color .4s ease",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: "clamp(12px,1.4vw,18px)",
              display: "block",
              filter: `drop-shadow(0 10px 26px ${mix(16)})`,
            }}
          >
            <SmartImage
              src={img}
              alt={art.title || "Obra"}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 230px"
            />
          </span>
        </span>

        <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {(art as any)?.techniqueInfo?.name && (
            <span style={{ ...EYEBROW, fontSize: 10, letterSpacing: "0.14em", color: "var(--acc)" }}>
              {(art as any).techniqueInfo.name}
            </span>
          )}
          <span style={{ fontWeight: 500, fontSize: "clamp(17px,1.3vw,20px)", lineHeight: 1.25 }}>
            {art.title || "Sin título"}
          </span>
          <span style={{ fontWeight: 500, fontSize: 16 }}>
            {formatCOP(art.price, { currency: art.currency })}
          </span>
        </span>
      </Link>
    </motion.div>
  );
}
