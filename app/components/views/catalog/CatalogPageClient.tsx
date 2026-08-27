"use client";

import { useMemo, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePavilions } from "@hooks/queries/usePavilions";
import useCart from "@store/useCart";
import {
  useArtworksCursor,
  type ArtworksCursorFilters,
  type ArtworkRow,
} from "@hooks/queries/useArtworksCursor";
import { useTechniques } from "@hooks/queries/useTechniques";
import { useCatalogState } from "@hooks/ui/catalog/useCatalogState";
import { useFacetCounts } from "@hooks/ui/catalog/useFacetCounts";
import { useEventArtists } from "@hooks/queries/useEventArtists";
import { useEdition } from "@provider/editionProvider";
import { formatCOP } from "@lib/money";
import { pickSrc } from "@lib/utils";
import Skeleton from "@components/ui/Skeleton";
import SmartImage from "@components/ui/SmartImage";

/* ──────────────────────────────────────────────────────────────
   Catálogo — diseño editorial v2 (port de Catalogo.dc.html).
   El header/footer los aporta el layout; aquí va solo el cuerpo.
   Tokens: --bg/--fg/--acc/--panel se mapean a los --fdm-* globales,
   así el tema claro/oscuro del sitio funciona sin lógica extra.
   ────────────────────────────────────────────────────────────── */

const MAX_PRICE = 1_000_000;
const MIN_PRICE = 100_000;

const mix = (pct: number) =>
  `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const LABEL: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10.5,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: mix(50),
};

const FIELD: React.CSSProperties = {
  width: "100%",
  padding: "8px 0",
  background: "transparent",
  color: "inherit",
  border: 0,
  borderBottom: `1px solid ${mix(26)}`,
  fontSize: 15,
  fontWeight: 400,
  outline: "none",
  cursor: "pointer",
};

const SECTION: React.CSSProperties = {
  padding: "clamp(11px,1.1vw,14px) 0",
  borderBottom: `1px solid ${mix(12)}`,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

function artistOf(a: any) {
  const f = a?.artistInfo?.firstName || "";
  const l = a?.artistInfo?.lastName || "";
  return `${f} ${l}`.trim() || a?.artist || "Artista";
}

/** El backend guarda las medidas como texto libre en `dimensionsText`. */
function dimsOf(a: any) {
  return String(a?.dimensionsText ?? "").trim();
}

export default function CatalogPageClient() {
  const sp = useSearchParams();
  const { eventId, eventName, pavilions } = useEdition();

  const {
    q,
    setQ,
    pavilion,
    setPavilion,
    artistId,
    setArtistId,
    techniqueIds,
    toggleTechnique,
    maxPrice,
    setMaxPrice,
    viewMode,
    setViewMode,
    mode,
    setMode,
    clearAll: clearFilters,
  } = useCatalogState({
    initialQ: sp.get("q") ?? "",
    initialPavilion: sp.get("pavilion") ?? "",
    initialArtistId: sp.get("artistId") ?? "",
    initialMode: sp.get("modo") === "pabellon" ? "pabellon" : "general",
    initialTechniqueIds: (sp.get("tecnica") ?? "").split(",").filter(Boolean),
    defaultMaxPrice: MAX_PRICE,
  });

  // Orden: claves propias del catálogo editorial (el hook compartido usa otras).
  type SortKey = "recientes" | "precio-asc" | "precio-desc" | "titulo";
  const [sortBy, setSortBy] = useState<SortKey>("recientes");

  const clearAll = () => {
    setPriceTouched(false);
    clearFilters();
  };

  const { data: techniquesData = [] } = useTechniques();
  const { data: pavilionsData = [] } = usePavilions(eventId);

  const { data: artistsResp } = useEventArtists(
    eventId,
    { sort: "name", page: 1, limit: 500 },
    { staleTime: 60_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false }
  );

  const artistOptions = useMemo(
    () =>
      (artistsResp?.rows ?? []).map((row: any) => {
        const a = row.artist ?? row;
        const full = `${a.firstName ?? ""} ${a.lastName ?? ""}`.trim();
        return {
          value: String(a.id ?? a._id),
          label: full || a.name || a.displayName || "Artista sin nombre",
        };
      }),
    [artistsResp]
  );

  const techniqueCsv = techniqueIds.length ? techniqueIds.join(",") : undefined;

  const {
    rows: rawRows,
    totalLabel,
    isFetching,
    isLoading,
    hasNextPage,
    loadMore,
  } = useArtworksCursor({
    q,
    event: eventId,
    // El pabellón filtra en el backend en ambos modos: así el link es compartible
    // y "por pabellón" solo cambia cómo se agrupa lo que ya vino filtrado.
    pavilion: pavilion || undefined,
    technique: techniqueCsv,
    limit: 24,
    artist: artistId || undefined,
  } as ArtworksCursorFilters);

  const { techniques: techFacets } = useFacetCounts(rawRows);

  // El diseño fija el tope en $1.000.000, pero el catálogo real tiene obras por
  // encima. El techo del slider sale de la data (nunca por debajo de 1M) y,
  // mientras nadie lo toque, no filtra nada.
  const priceCeiling = useMemo(() => {
    const top = rawRows.reduce((m, r) => Math.max(m, Number(r.price ?? 0)), 0);
    return Math.max(MAX_PRICE, Math.ceil(top / 50_000) * 50_000);
  }, [rawRows]);

  const [priceTouched, setPriceTouched] = useState(false);
  const effectiveMax = priceTouched ? maxPrice : priceCeiling;

  const rows = useMemo(() => {
    const arr = rawRows.filter((r) => Number(r.price ?? 0) <= effectiveMax);
    arr.sort((a, b) => {
      if (sortBy === "precio-asc") return Number(a.price ?? 0) - Number(b.price ?? 0);
      if (sortBy === "precio-desc") return Number(b.price ?? 0) - Number(a.price ?? 0);
      if (sortBy === "titulo")
        return String(a.title ?? "").localeCompare(String(b.title ?? ""), "es");
      const ad = new Date(a.createdAt as unknown as string).getTime();
      const bd = new Date(b.createdAt as unknown as string).getTime();
      return bd - ad;
    });
    return arr;
  }, [rawRows, effectiveMax, sortBy]);

  // Pabellones reales del evento; fallback a los de la edición.
  const pavilionOptions = useMemo(() => {
    const src =
      pavilionsData.length > 0
        ? pavilionsData.map((p: any) => ({ id: String(p.id ?? p._id), name: p.name }))
        : pavilions.map((p) => ({ id: p.id, name: p.name }));
    const counts = new Map<string, number>();
    for (const r of rawRows) {
      const pid = String((r as any)?.pavilionInfo?._id ?? "");
      if (pid) counts.set(pid, (counts.get(pid) ?? 0) + 1);
    }
    return src.map((p) => ({ ...p, count: counts.get(p.id) ?? 0 }));
  }, [pavilionsData, pavilions, rawRows]);

  const groups = useMemo(() => {
    if (mode !== "pabellon") {
      return rows.length ? [{ label: "", count: rows.length, items: rows, showLabel: false }] : [];
    }
    const order: string[] = [];
    const byLabel = new Map<string, ArtworkRow[]>();
    for (const r of rows) {
      const label = (r as any)?.pavilionInfo?.name || "Sin pabellón";
      if (!byLabel.has(label)) {
        byLabel.set(label, []);
        order.push(label);
      }
      byLabel.get(label)!.push(r);
    }
    return order.map((label) => ({
      label,
      count: byLabel.get(label)!.length,
      items: byLabel.get(label)!,
      showLabel: true,
    }));
  }, [rows, mode]);

  const addToCart = useCart((s) => s.add);
  const cartItems = useCart((s) => s.items);
  const totalItems = useCart((s) => s.totalItems)();
  const inCart = (id: string) => cartItems.some((i: any) => String(i.id) === id);

  const handleAdd = (art: ArtworkRow) =>
    addToCart(
      {
        id: String(art._id),
        title: art.title,
        artist: artistOf(art),
        price: Number(art.price ?? 0),
        image: pickSrc(art.image) || pickSrc(art.images?.[0]) || "/placeholder.png",
      },
      1
    );

  // Infinite scroll
  const sentinel = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasNextPage) return;
    const node = sentinel.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetching) loadMore();
      },
      { rootMargin: "300px", threshold: 0.1 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [hasNextPage, isFetching, loadMore]);

  const activeFilters =
    !!q || !!pavilion || !!artistId || techniqueIds.length > 0 || effectiveMax < priceCeiling;

  return (
    <div
      style={
        {
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
        } as React.CSSProperties
      }
    >
      <style>{`
        .fdm-cat select { appearance: none; }
        .fdm-cat input[type="range"] { accent-color: var(--acc); }
        .fdm-cat input::placeholder { color: color-mix(in srgb, var(--fg) 34%, transparent); }
        .fdm-cat-shell { display:flex; flex-wrap:wrap; align-items:flex-start; gap:clamp(22px,2.4vw,38px); }
        .fdm-cat-aside { flex:1 1 224px; max-width:260px; min-width:min(100%,224px); position:sticky; top:84px; align-self:flex-start; display:flex; flex-direction:column; }
        .fdm-cat-main { flex:999 1 62%; min-width:min(100%,280px); display:flex; flex-direction:column; gap:clamp(22px,2.2vw,32px); }
        .fdm-cat-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%,240px), 1fr)); gap:clamp(20px,2vw,30px) clamp(16px,1.6vw,24px); }
        .fdm-cat-art:hover .fdm-cat-frame { border-color: var(--acc); }
        .fdm-cat-row:hover { background: color-mix(in srgb, var(--acc) 6%, transparent); }
        .fdm-cat-link:hover { color: var(--acc); }
        @media (max-width: 1079px) {
          .fdm-cat-aside { position:static; max-width:none; }
          .fdm-cat-meta { display:none; }
        }
      `}</style>

      <div className="fdm-cat">
        {/* ── Encabezado editorial ─────────────────────────────── */}
        <section id="top" style={{ padding: "clamp(18px,2.2vw,28px) clamp(20px,4vw,56px) 0" }}>
          <div style={{ maxWidth: 1600, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px clamp(20px,2.4vw,34px)",
                paddingBottom: "clamp(12px,1.4vw,16px)",
                fontWeight: 500,
                fontSize: 10.5,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: mix(52),
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--acc)" }}>
                <span style={{ display: "block", width: 6, height: 6, borderRadius: 999, background: "var(--acc)" }} />
                Obras en venta
              </span>
              <span>{eventName}</span>
              <span>Todas las obras hasta {formatCOP(MAX_PRICE)}</span>
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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "clamp(12px,1.2vw,18px)",
                  minWidth: "min(100%,300px)",
                  maxWidth: "56ch",
                }}
              >
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
                  Catálogo
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
                  Obra original de artistas emergentes colombianos. Cada pieza se vende{" "}
                  <span style={{ color: "var(--acc)" }}>directamente por el artista</span> durante la
                  edición.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 12,
                  paddingLeft: "clamp(14px,1.6vw,22px)",
                  borderLeft: "1px solid var(--acc)",
                }}
              >
                <div style={{ fontWeight: 300, fontSize: "clamp(30px,3vw,46px)", lineHeight: 1 }}>
                  {isLoading ? "—" : rows.length}
                  <span style={{ fontSize: "0.3em", letterSpacing: "0.2em", color: mix(42), marginLeft: 12 }}>
                    de {totalLabel}
                  </span>
                </div>
                <div style={{ ...LABEL, fontSize: 10 }}>Obras visibles</div>
              </div>
            </div>

            {/* Tabs + vista */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                padding: "clamp(10px,1vw,14px) 0",
                borderTop: `1px solid ${mix(14)}`,
              }}
            >
              <div style={{ display: "flex", gap: "clamp(18px,2.4vw,34px)" }}>
                <Tab active={mode === "general"} onClick={() => setMode("general")}>
                  General
                </Tab>
                <Tab active={mode === "pabellon"} onClick={() => setMode("pabellon")}>
                  Por pabellón
                </Tab>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px,1.4vw,20px)" }}>
                <Link
                  href="/carrito"
                  className="fdm-cat-link"
                  style={{
                    display: "inline-flex",
                    alignItems: "baseline",
                    gap: 10,
                    fontWeight: 500,
                    fontSize: 10.5,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: mix(65),
                  }}
                >
                  Carrito
                  <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: 0, color: "var(--acc)" }}>{totalItems}</span>
                </Link>
                <span style={{ display: "block", width: 1, height: 20, background: mix(20) }} />
                <Pill active={viewMode === "grid"} onClick={() => setViewMode("grid")}>
                  Grilla
                </Pill>
                <Pill active={viewMode === "list"} onClick={() => setViewMode("list")}>
                  Lista
                </Pill>
              </div>
            </div>
          </div>
        </section>

        {/* ── Filtros + resultados ─────────────────────────────── */}
        <section
          className="fdm-cat-shell"
          style={{
            maxWidth: 1600,
            margin: "0 auto",
            padding: "clamp(18px,1.8vw,26px) clamp(20px,4vw,56px) clamp(40px,4vw,64px)",
          }}
        >
          <aside className="fdm-cat-aside">
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                paddingBottom: 10,
                borderBottom: `1px solid ${mix(22)}`,
              }}
            >
              <span style={{ fontWeight: 500, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                Filtros
              </span>
              {activeFilters && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="fdm-cat-link"
                  style={{
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    cursor: "pointer",
                    color: "var(--acc)",
                    fontWeight: 500,
                    fontSize: 10.5,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Buscar */}
            <div style={SECTION}>
              <label htmlFor="fdm-q" style={LABEL}>
                Buscar obra
              </label>
              <input
                id="fdm-q"
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Título o artista"
                style={{ ...FIELD, padding: "6px 0", fontSize: 16, cursor: "text" }}
              />
            </div>

            {/* Pabellón — filtrable y compartible por URL (?pavilion=<id>) */}
            <div style={{ ...SECTION, gap: 2 }}>
              <span style={{ ...LABEL, marginBottom: 4 }}>Pabellón</span>
              <div>
                <FilterRow
                  active={!pavilion}
                  label="Todos los pabellones"
                  onClick={() => setPavilion("")}
                />
                {pavilionOptions.map((p) => (
                  <FilterRow
                    key={p.id}
                    active={pavilion === p.id}
                    label={p.name}
                    count={p.count || undefined}
                    onClick={() => setPavilion(pavilion === p.id ? "" : p.id)}
                  />
                ))}
              </div>
            </div>

            {/* Artista */}
            <div style={SECTION}>
              <label htmlFor="fdm-artist" style={LABEL}>
                Artista
              </label>
              <select
                id="fdm-artist"
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                style={FIELD}
              >
                <option value="">Todos los artistas</option>
                {artistOptions.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Técnica */}
            <div style={{ ...SECTION, gap: 2 }}>
              <span style={{ ...LABEL, marginBottom: 4 }}>Técnica</span>
              <div>
                {techniquesData.map((t: any) => {
                  const id = String(t.id ?? t._id);
                  const facet = techFacets.find((f) => f.name === t.name);
                  return (
                    <FilterRow
                      key={id}
                      active={techniqueIds.includes(id)}
                      label={t.name}
                      count={facet?.count}
                      onClick={() => toggleTechnique(id)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Precio máximo */}
            <div style={{ ...SECTION, gap: 14 }}>
              <span style={LABEL}>Precio máximo</span>
              <span style={{ fontWeight: 500, fontSize: 17 }}>Hasta {formatCOP(effectiveMax)}</span>
              <input
                type="range"
                min={MIN_PRICE}
                max={priceCeiling}
                step={50_000}
                value={effectiveMax}
                onChange={(e) => {
                  setPriceTouched(true);
                  setMaxPrice(Number(e.target.value));
                }}
                style={{ width: "100%", margin: 0 }}
              />
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: mix(45),
                }}
              >
                <span>{formatCOP(MIN_PRICE)}</span>
                <span>{formatCOP(priceCeiling)}</span>
              </span>
            </div>

            {/* Orden */}
            <div style={{ ...SECTION, borderBottom: 0, paddingBottom: 0 }}>
              <label htmlFor="fdm-sort" style={LABEL}>
                Ordenar por
              </label>
              <select
                id="fdm-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={FIELD}
              >
                <option value="recientes">Más recientes</option>
                <option value="precio-asc">Precio: menor a mayor</option>
                <option value="precio-desc">Precio: mayor a menor</option>
                <option value="titulo">Título A–Z</option>
              </select>
            </div>
          </aside>

          <div className="fdm-cat-main">
            {!isLoading && rows.length === 0 && (
              <div
                style={{
                  borderTop: `1px solid ${mix(22)}`,
                  borderBottom: `1px solid ${mix(22)}`,
                  padding: "clamp(46px,6vw,96px) clamp(20px,3vw,40px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 20,
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
                  Ninguna obra coincide con estos filtros. Amplía el rango de precio o quita una técnica.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  style={{
                    height: 48,
                    padding: "0 30px",
                    background: "var(--fg)",
                    color: "var(--bg)",
                    border: 0,
                    borderRadius: 999,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}

            {isLoading && (
              <div className="fdm-cat-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Skeleton aspect="4/5" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <Skeleton w="45%" h={10} />
                      <Skeleton w="80%" h={19} />
                      <Skeleton w="55%" h={14} />
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 4, paddingTop: 10, borderTop: `1px solid ${mix(14)}` }}>
                        <Skeleton w={92} h={17} />
                        <Skeleton w={96} h={36} radius={999} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {groups.map((g) => (
              <div
                key={g.label || "all"}
                style={{ display: "flex", flexDirection: "column", gap: "clamp(16px,2vw,26px)" }}
              >
                {g.showLabel && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 18,
                      paddingBottom: 12,
                      borderBottom: `1px solid ${mix(20)}`,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 400,
                        fontSize: "clamp(19px,2vw,26px)",
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {g.label}
                    </span>
                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 10,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: mix(48),
                      }}
                    >
                      {g.count} obras
                    </span>
                  </div>
                )}

                {viewMode === "grid" ? (
                  <div className="fdm-cat-grid">
                    {g.items.map((art) => (
                      <ArtCard
                        key={String(art._id)}
                        art={art}
                        inCart={inCart(String(art._id))}
                        onAdd={() => handleAdd(art)}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ borderTop: `1px solid ${mix(22)}` }}>
                    {g.items.map((art) => (
                      <ArtRow
                        key={String(art._id)}
                        art={art}
                        inCart={inCart(String(art._id))}
                        onAdd={() => handleAdd(art)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div ref={sentinel} style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
              {isFetching && (
                <span style={{ ...LABEL, letterSpacing: "0.2em" }}>Cargando más obras…</span>
              )}
              {!hasNextPage && !isLoading && !isFetching && rows.length > 0 && (
                <span style={{ ...LABEL, letterSpacing: "0.2em" }}>No hay más resultados</span>
              )}
            </div>

            {/* CTA convocatoria */}
            <div
              style={{
                background: "var(--panel)",
                color: "#F5F4EF",
                padding: "clamp(22px,2.4vw,34px) clamp(20px,2.4vw,32px)",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: "46ch" }}>
                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "var(--acc)",
                  }}
                >
                  Convocatoria
                </span>
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: "clamp(21px,2.2vw,30px)",
                    lineHeight: 1.15,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  ¿Eres artista?
                </span>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "rgba(245,244,239,0.8)" }}>
                  Postula tu obra al catálogo de la próxima edición.
                </p>
              </div>
              <Link
                href="/convocatoria"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 54,
                  padding: "0 34px",
                  background: "var(--acc)",
                  color: "#0B0B0A",
                  borderRadius: 999,
                  fontWeight: 500,
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Postular →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Piezas ─────────────────────────────────────────────────── */

function Tab({
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
        fontWeight: 500,
        fontSize: 12,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        transition: "all .3s ease",
        color: active ? "var(--acc)" : "inherit",
        borderBottom: `1px solid ${active ? "var(--acc)" : "transparent"}`,
      }}
    >
      {children}
    </button>
  );
}

function Pill({
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
        fontWeight: 500,
        fontSize: 10.5,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        transition: "all .3s ease",
        color: active ? "var(--acc)" : mix(60),
        borderBottom: `1px solid ${active ? "var(--acc)" : "transparent"}`,
      }}
    >
      {children}
    </button>
  );
}

function FilterRow({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fdm-cat-link"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "6px 0",
        background: "transparent",
        border: 0,
        cursor: "pointer",
        color: "inherit",
        textAlign: "left",
      }}
    >
      <span
        style={{
          flex: "0 0 auto",
          display: "block",
          width: 11,
          height: 11,
          border: `1px solid ${active ? "var(--acc)" : mix(26)}`,
          background: active ? "var(--acc)" : "transparent",
          transition: "all .25s ease",
        }}
      />
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 400, letterSpacing: "0.01em" }}>{label}</span>
      {count != null && (
        <span style={{ fontSize: 11.5, fontWeight: 500, color: mix(55) }}>{count}</span>
      )}
    </button>
  );
}

function artImg(art: any) {
  return pickSrc(art.image) || pickSrc(art.images?.[0]) || "/placeholder.png";
}

function addBtnStyle(inCart: boolean): React.CSSProperties {
  return {
    flex: "0 0 auto",
    display: "inline-flex",
    alignItems: "center",
    height: 36,
    padding: "0 18px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 10.5,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    transition: "all .3s ease",
    background: inCart ? "var(--acc)" : "transparent",
    color: inCart ? "#0B0B0A" : "inherit",
    border: `1px solid ${inCart ? "var(--acc)" : mix(26)}`,
  };
}

function ArtCard({
  art,
  inCart,
  onAdd,
}: {
  art: ArtworkRow;
  inCart: boolean;
  onAdd: () => void;
}) {
  const href = `/obra/${encodeURIComponent(String(art._id ?? art.id))}`;
  const dims = dimsOf(art);
  return (
    <article className="fdm-cat-art" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Link href={href} style={{ display: "block" }}>
        <div
          className="fdm-cat-frame"
          style={{
            position: "relative",
            aspectRatio: "4/5",
            padding: "clamp(12px,1.4vw,18px)",
            backgroundColor: mix(4),
            border: `1px solid ${mix(10)}`,
            transition: "border-color .4s ease, background-color .4s ease",
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
              src={artImg(art)}
              alt={art.title || "Obra"}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 240px"
            />
          </span>
        </div>
      </Link>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: "4px 10px",
            fontWeight: 500,
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: mix(45),
          }}
        >
          <span style={{ whiteSpace: "nowrap", color: "var(--acc)" }}>
            {(art as any)?.techniqueInfo?.name || "Técnica"}
          </span>
          <span style={{ whiteSpace: "nowrap" }}>{(art as any)?.pavilionInfo?.name || ""}</span>
        </span>
        <Link
          href={href}
          className="fdm-cat-link"
          style={{ fontWeight: 500, fontSize: "clamp(17px,1.3vw,20px)", lineHeight: 1.25 }}
        >
          {art.title || "Sin título"}
        </Link>
        <span style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.45, color: mix(72) }}>{artistOf(art)}</span>
        {dims && <span style={{ fontSize: 12.5, letterSpacing: "0.03em", color: mix(55) }}>{dims}</span>}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 4,
            paddingTop: 10,
            borderTop: `1px solid ${mix(14)}`,
          }}
        >
          <span style={{ fontWeight: 500, fontSize: 17, letterSpacing: "0.01em" }}>
            {formatCOP(art.price, { currency: art.currency })}
          </span>
          <button type="button" onClick={onAdd} style={addBtnStyle(inCart)}>
            {inCart ? "En carrito" : "Agregar"}
          </button>
        </div>
      </div>
    </article>
  );
}

function ArtRow({
  art,
  inCart,
  onAdd,
}: {
  art: ArtworkRow;
  inCart: boolean;
  onAdd: () => void;
}) {
  const href = `/obra/${encodeURIComponent(String(art._id ?? art.id))}`;
  const meta: React.CSSProperties = {
    flex: "0 1 130px",
    fontSize: 12.5,
    fontWeight: 400,
    letterSpacing: "0.02em",
    color: mix(62),
  };
  return (
    <article
      className="fdm-cat-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "clamp(14px,2vw,28px)",
        padding: "clamp(10px,1vw,14px) clamp(4px,0.8vw,10px)",
        borderBottom: `1px solid ${mix(12)}`,
        transition: "background-color .35s ease",
      }}
    >
      <Link href={href} style={{ flex: "0 0 auto" }}>
        <span
          style={{
            position: "relative",
            display: "block",
            width: "clamp(60px,6vw,88px)",
            aspectRatio: "1",
            padding: 8,
            backgroundColor: mix(4),
            border: `1px solid ${mix(10)}`,
          }}
        >
          <span style={{ position: "absolute", inset: 8, display: "block" }}>
            <SmartImage src={artImg(art)} alt={art.title || "Obra"} sizes="90px" />
          </span>
        </span>
      </Link>
      <span style={{ flex: "1 1 200px", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
        <Link
          href={href}
          className="fdm-cat-link"
          style={{ fontWeight: 500, fontSize: "clamp(15px,1.2vw,18px)", lineHeight: 1.3 }}
        >
          {art.title || "Sin título"}
        </Link>
        <span style={{ fontSize: 13.5, fontWeight: 400, color: mix(72) }}>{artistOf(art)}</span>
      </span>
      <span className="fdm-cat-meta" style={meta}>
        {(art as any)?.techniqueInfo?.name || ""}
      </span>
      <span className="fdm-cat-meta" style={meta}>
        {dimsOf(art)}
      </span>
      <span
        style={{
          flex: "0 0 auto",
          fontWeight: 500,
          fontSize: 16,
          letterSpacing: "0.01em",
          textAlign: "right",
          minWidth: 110,
        }}
      >
        {formatCOP(art.price, { currency: art.currency })}
      </span>
      <button type="button" onClick={onAdd} style={addBtnStyle(inCart)}>
        {inCart ? "En carrito" : "Agregar"}
      </button>
    </article>
  );
}
