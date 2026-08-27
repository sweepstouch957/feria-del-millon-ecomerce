"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEventArtists } from "@hooks/queries/useEventArtists";
import { useEdition } from "@provider/editionProvider";
import SmartImage from "@components/ui/SmartImage";
import Skeleton from "@components/ui/Skeleton";
import SiteFooter from "@components/SiteFooter";

/* ──────────────────────────────────────────────────────────────
   Artistas — mismo sistema editorial v2 que /catalogo y /obra.
   Cada tarjeta lleva al perfil en /artista/[id].
   ────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 24;

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
  .fdm-arts a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-arts-link:hover { color: var(--acc); }
  .fdm-arts-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%,232px), 1fr)); gap:clamp(20px,2.2vw,34px) clamp(16px,1.8vw,26px); }
  .fdm-arts-card:hover .fdm-arts-photo { border-color: var(--acc); }
  .fdm-arts-input { width:100%; padding:8px 0; background:transparent; color:inherit; border:0; border-bottom:1px solid color-mix(in srgb, var(--fg) 26%, transparent); font-size:16px; outline:none; }
  .fdm-arts-input:focus { border-color: var(--acc); }
  .fdm-arts-input::placeholder { color: color-mix(in srgb, var(--fg) 34%, transparent); }
`;

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "A"
  );
}

export default function ArtistasPage() {
  const { eventId, eventName } = useEdition();
  const reduce = useReducedMotion();

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"artworks" | "name">("artworks");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useEventArtists(
    eventId,
    { q: q.trim() || undefined, sort, page, limit: PAGE_SIZE },
    { staleTime: 60_000, refetchOnWindowFocus: false }
  );

  const rows: any[] = data?.rows ?? [];
  const total = Number(data?.total ?? 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const totalArtworks = useMemo(
    () => rows.reduce((a, r) => a + Number(r?.stats?.totalArtworks ?? 0), 0),
    [rows]
  );

  // Cambiar de filtro siempre vuelve a la primera página: si estabas en la 3 y
  // el nuevo filtro trae 1 sola, te quedabas mirando una página vacía.
  const onQuery = (v: string) => {
    setQ(v);
    setPage(1);
  };
  const onSort = (v: "artworks" | "name") => {
    setSort(v);
    setPage(1);
  };

  return (
    <div style={ROOT_VARS}>
      <style>{PAGE_CSS}</style>

      <div
        className="fdm-arts"
        style={{ maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)" }}
      >
        {/* ── Encabezado ─────────────────────────────────── */}
        <section style={{ padding: "clamp(18px,2.2vw,28px) 0 0" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px clamp(20px,2.4vw,34px)",
              paddingBottom: "clamp(12px,1.4vw,16px)",
              ...EYEBROW,
              letterSpacing: "0.16em",
              color: mix(52),
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--acc)" }}>
              <span
                style={{ display: "block", width: 6, height: 6, borderRadius: 999, background: "var(--acc)" }}
              />
              Artistas
            </span>
            <span>{eventName}</span>
          </div>

          <div
            style={{
              borderTop: `1px solid ${mix(22)}`,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "clamp(20px,2.6vw,40px)",
              padding: "clamp(20px,2.4vw,32px) 0 clamp(16px,1.8vw,24px)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: "56ch" }}>
              <h1
                style={{
                  margin: 0,
                  fontWeight: 300,
                  fontSize: "clamp(38px,5.2vw,78px)",
                  lineHeight: 0.95,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                }}
              >
                Artistas
              </h1>
              <p
                style={{
                  margin: 0,
                  maxWidth: "48ch",
                  fontSize: "clamp(15px,1.1vw,17px)",
                  lineHeight: 1.6,
                  color: mix(68),
                  textWrap: "pretty",
                }}
              >
                Quienes exponen en esta edición. Entrá a cada perfil para ver su{" "}
                <span style={{ color: "var(--acc)" }}>obra completa</span>.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 10,
                paddingLeft: "clamp(14px,1.6vw,22px)",
                borderLeft: "1px solid var(--acc)",
              }}
            >
              <div style={{ fontWeight: 300, fontSize: "clamp(30px,3vw,46px)", lineHeight: 1 }}>
                {isLoading ? "—" : total}
              </div>
              <div style={{ ...EYEBROW, fontSize: 10, color: mix(50) }}>
                {totalArtworks > 0 ? `${totalArtworks} obras en pantalla` : "En la edición"}
              </div>
            </div>
          </div>

          {/* Buscador + orden */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: "16px clamp(20px,3vw,44px)",
              padding: "clamp(10px,1vw,14px) 0",
              borderTop: `1px solid ${mix(14)}`,
            }}
          >
            <div style={{ flex: "1 1 260px", maxWidth: 380, display: "flex", flexDirection: "column", gap: 8 }}>
              <label htmlFor="fdm-artist-q" style={{ ...EYEBROW, fontSize: 10, color: mix(50) }}>
                Buscar artista
              </label>
              <input
                id="fdm-artist-q"
                className="fdm-arts-input"
                type="text"
                value={q}
                onChange={(e) => onQuery(e.target.value)}
                placeholder="Nombre"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "clamp(16px,2vw,28px)" }}>
              <span style={{ ...EYEBROW, fontSize: 10, color: mix(50) }}>Ordenar</span>
              <SortTab active={sort === "artworks"} onClick={() => onSort("artworks")}>
                Más obras
              </SortTab>
              <SortTab active={sort === "name"} onClick={() => onSort("name")}>
                Nombre
              </SortTab>
            </div>
          </div>
        </section>

        {/* ── Grilla ─────────────────────────────────────── */}
        <section style={{ padding: "clamp(18px,2vw,28px) 0 clamp(40px,4vw,64px)" }}>
          {isLoading ? (
            <div className="fdm-arts-grid">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Skeleton aspect="1" radius={999} />
                  <Skeleton w="70%" h={18} />
                  <Skeleton w="45%" h={12} />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div
              style={{
                borderTop: `1px solid ${mix(22)}`,
                borderBottom: `1px solid ${mix(22)}`,
                padding: "clamp(46px,6vw,96px) clamp(20px,3vw,40px)",
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
                  fontSize: "clamp(21px,2.4vw,30px)",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}
              >
                Sin resultados
              </span>
              <p style={{ margin: 0, maxWidth: "40ch", fontSize: 15, lineHeight: 1.6, color: mix(70) }}>
                Ningún artista coincide con esa búsqueda.
              </p>
              {q && (
                <button
                  type="button"
                  onClick={() => onQuery("")}
                  style={{
                    height: 46,
                    padding: "0 28px",
                    background: "var(--fg)",
                    color: "var(--bg)",
                    border: 0,
                    borderRadius: 999,
                    cursor: "pointer",
                    ...EYEBROW,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                  }}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="fdm-arts-grid" style={{ opacity: isFetching ? 0.6 : 1, transition: "opacity .2s ease" }}>
                {rows.map((r, i) => (
                  <ArtistCard key={String(r.artist?.id ?? i)} row={r} index={i} reduce={!!reduce} />
                ))}
              </div>

              {pages > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 18,
                    paddingTop: "clamp(26px,3vw,44px)",
                  }}
                >
                  <PagerButton disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    ← Anterior
                  </PagerButton>
                  <span style={{ ...EYEBROW, fontSize: 10.5, color: mix(55) }}>
                    {page} / {pages}
                  </span>
                  <PagerButton
                    disabled={page >= pages}
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  >
                    Siguiente →
                  </PagerButton>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}

/* ── Piezas ──────────────────────────────────────────────────── */

function SortTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent",
        border: 0,
        padding: "4px 0",
        cursor: "pointer",
        ...EYEBROW,
        fontSize: 10.5,
        letterSpacing: "0.14em",
        transition: "all .3s ease",
        color: active ? "var(--acc)" : mix(60),
        borderBottom: `1px solid ${active ? "var(--acc)" : "transparent"}`,
      }}
    >
      {children}
    </button>
  );
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 44,
        padding: "0 24px",
        background: "transparent",
        color: "inherit",
        border: `1px solid ${mix(26)}`,
        borderRadius: 999,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        ...EYEBROW,
        fontSize: 10.5,
        letterSpacing: "0.12em",
      }}
    >
      {children}
    </button>
  );
}

function ArtistCard({ row, index, reduce }: { row: any; index: number; reduce: boolean }) {
  const artist = row?.artist ?? {};
  const stats = row?.stats ?? {};
  const name = String(artist.name || "").trim() || "Artista";
  const photo = String(artist.image || "").trim();
  const count = Number(stats.totalArtworks ?? 0);
  const pavilions: any[] = stats.byPavilion ?? [];

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0, y: 12 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: reduce ? 0 : Math.min(index, 10) * 0.04 }}
      whileHover={reduce ? undefined : { y: -4 }}
    >
      <Link
        href={`/artista/${encodeURIComponent(String(artist.id))}`}
        className="fdm-arts-card"
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <span
          className="fdm-arts-photo"
          style={{
            position: "relative",
            display: "block",
            aspectRatio: "1",
            borderRadius: 999,
            overflow: "hidden",
            background: mix(6),
            border: `1px solid ${mix(12)}`,
            transition: "border-color .4s ease",
          }}
        >
          {photo ? (
            <SmartImage src={photo} alt={name} fit="cover" sizes="(max-width: 640px) 50vw, 232px" />
          ) : (
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: "100%",
                height: "100%",
                fontWeight: 300,
                fontSize: "clamp(28px,3vw,44px)",
                color: mix(40),
              }}
            >
              {initialsOf(name)}
            </span>
          )}
        </span>

        <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={{ fontWeight: 500, fontSize: "clamp(17px,1.3vw,20px)", lineHeight: 1.25 }}>
            {name}
          </span>
          <span style={{ ...EYEBROW, fontSize: 10, letterSpacing: "0.14em", color: "var(--acc)" }}>
            {count} {count === 1 ? "obra" : "obras"}
          </span>
          {pavilions.length > 0 && (
            <span style={{ fontSize: 13, color: mix(58), lineHeight: 1.4 }}>
              {pavilions.map((p) => p?.name).filter(Boolean).join(" · ")}
            </span>
          )}
        </span>
      </Link>
    </motion.div>
  );
}
