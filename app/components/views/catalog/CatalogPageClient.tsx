"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePavilions } from "@hooks/queries/usePavilions";
import { useArtworksCursor, type ArtworksCursorFilters } from "@hooks/queries/useArtworksCursor";
import { useTechniques } from "@hooks/queries/useTechniques";
import { useEventArtists } from "@hooks/queries/useEventArtists";
import { useCatalogState } from "@hooks/ui/catalog/useCatalogState";
import { useDebouncedValue } from "@hooks/artist/useDebouncedValue";
import { useEdition } from "@provider/editionProvider";
import Skeleton from "@components/ui/Skeleton";
import { ArtworkCard, ArtworkRow } from "./ArtworkCard";
import { I, MAX_PRICE, MIN_PRICE, ShopShell, fmt, plural, toCardArt, type CardArt } from "./shared";

/* ──────────────────────────────────────────────────────────────
   Catálogo — port de "Catálogo Feria del Millón — rediseño desktop y mobile".
   Escritorio: barra sticky con búsqueda + desplegables (Pabellón, Precio,
   Tipo, Artista, Técnica) + orden + vista. Celular: botón "Filtros" que abre
   una hoja inferior con las mismas secciones. Chips de filtros activos,
   grilla/lista, progreso "Viendo X de Y" y "Cargar más obras".
   ────────────────────────────────────────────────────────────── */

type SortKey = "recientes" | "asc" | "desc" | "az";
type Kind = "" | "unica" | "reproduccion";
type DdKey = "pab" | "pre" | "tip" | "art" | "tec";

type Facet = { value: string; label: string; on: boolean; count?: number; toggle: () => void };

const SORTS: { value: SortKey; label: string }[] = [
  { value: "recientes", label: "Más recientes" },
  { value: "asc", label: "Precio: menor a mayor" },
  { value: "desc", label: "Precio: mayor a menor" },
  { value: "az", label: "Título A–Z" },
];

const KINDS: { value: Kind; label: string }[] = [
  { value: "", label: "Todas" },
  { value: "unica", label: "Obra única" },
  { value: "reproduccion", label: "Reproducciones" },
];

export default function CatalogPageClient() {
  const sp = useSearchParams();
  const { eventId, eventName, pavilions } = useEdition();

  const {
    q, setQ,
    pavilion, setPavilion,
    artistId, setArtistId,
    techniqueIds, toggleTechnique,
    maxPrice, setMaxPrice,
    viewMode, setViewMode,
    clearAll: clearShared,
  } = useCatalogState({
    initialQ: sp.get("q") ?? "",
    initialPavilion: sp.get("pavilion") ?? "",
    initialArtistId: sp.get("artistId") ?? "",
    initialTechniqueIds: (sp.get("tecnica") ?? "").split(",").filter(Boolean),
    defaultMaxPrice: MAX_PRICE,
  });

  // Varios artistas a la vez: el estado compartido guarda el csv (?artistId=a,b).
  const artistIds = useMemo(() => artistId.split(",").filter(Boolean), [artistId]);
  const toggleArtist = (id: string) =>
    setArtistId((artistIds.includes(id) ? artistIds.filter((x) => x !== id) : [...artistIds, id]).join(","));

  const [sort, setSort] = useState<SortKey>("recientes");
  const [kind, setKind] = useState<Kind>("");
  const [priceTouched, setPriceTouched] = useState(false);
  const [artQ, setArtQ] = useState("");
  const [dd, setDd] = useState<DdKey | null>(null);
  const [sheet, setSheet] = useState(false);
  const [ceiling, setCeiling] = useState(MAX_PRICE);

  const dq = useDebouncedValue(q, 250);

  const clearAll = () => {
    setPriceTouched(false);
    setKind("");
    setArtQ("");
    setDd(null);
    clearShared();
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
        return { value: String(a.id ?? a._id), label: full || a.name || a.displayName || "Artista sin nombre" };
      }),
    [artistsResp]
  );

  const pavilionOptions = useMemo(() => {
    const src = pavilionsData.length > 0 ? pavilionsData : pavilions;
    return src.map((p: any) => ({ value: String(p.id ?? p._id), label: String(p.name ?? "") }));
  }, [pavilionsData, pavilions]);

  const { rows: rawRows, total, isLoading, isFetching, isFetchingNextPage, hasNextPage, loadMore } = useArtworksCursor({
    q: dq,
    event: eventId,
    pavilion: pavilion || undefined,
    technique: techniqueIds.length ? techniqueIds.join(",") : undefined,
    artist: artistIds.length ? artistIds.join(",") : undefined,
    limit: 24,
    reproducible: kind ? kind === "reproduccion" : undefined,
    maxPrice: priceTouched ? maxPrice : undefined,
    sortBy: sort === "asc" || sort === "desc" ? "price" : "createdAt",
    sortDir: sort === "asc" ? "asc" : "desc",
  } as ArtworksCursorFilters);

  // El tope del slider sale de la data (nunca por debajo de $1.000.000) y solo crece.
  useEffect(() => {
    const top = rawRows.reduce((m, r) => Math.max(m, Number(r.price ?? 0)), 0);
    const next = Math.max(MAX_PRICE, Math.ceil(top / 50_000) * 50_000);
    if (next > ceiling) setCeiling(next);
  }, [rawRows, ceiling]);

  const works: CardArt[] = useMemo(() => {
    const arr = rawRows.map(toCardArt);
    // ponytail: "Título A–Z" ordena lo cargado; el servidor no ordena por título.
    if (sort === "az") arr.sort((a, b) => a.title.localeCompare(b.title, "es"));
    return arr;
  }, [rawRows, sort]);

  const allLoaded = !isLoading && !hasNextPage;
  const countBy = (pick: (r: any) => string | undefined) => {
    if (!allLoaded) return undefined;
    const m = new Map<string, number>();
    for (const r of rawRows) {
      const k = pick(r);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  };
  const pavCounts = countBy((r) => (r?.pavilionInfo?._id ? String(r.pavilionInfo._id) : undefined));
  const tecCounts = countBy((r) => (r?.techniqueInfo?._id ? String(r.techniqueInfo._id) : undefined));
  const artCounts = countBy((r) => (r?.artistInfo?._id ? String(r.artistInfo._id) : r?.artist ? String(r.artist) : undefined));

  // Pabellón es de a uno (el servidor filtra por un solo id): se comporta como radio.
  const pabFacets: Facet[] = pavilionOptions.map((p) => ({
    ...p,
    on: pavilion === p.value,
    count: pavCounts?.get(p.value),
    toggle: () => setPavilion(pavilion === p.value ? "" : p.value),
  }));
  const tecFacets: Facet[] = techniquesData.map((t: any) => {
    const id = String(t.id ?? t._id);
    return { value: id, label: t.name, on: techniqueIds.includes(id), count: tecCounts?.get(id), toggle: () => toggleTechnique(id) };
  });
  const aql = artQ.trim().toLowerCase();
  const artFacets: Facet[] = artistOptions
    .filter((a) => !aql || a.label.toLowerCase().includes(aql))
    .map((a) => ({ ...a, on: artistIds.includes(a.value), count: artCounts?.get(a.value), toggle: () => toggleArtist(a.value) }));

  const chips: { label: string; remove: () => void }[] = [];
  pabFacets.filter((f) => f.on).forEach((f) => chips.push({ label: f.label, remove: f.toggle }));
  artistOptions.filter((a) => artistIds.includes(a.value)).forEach((a) => chips.push({ label: a.label, remove: () => toggleArtist(a.value) }));
  techniquesData
    .filter((t: any) => techniqueIds.includes(String(t.id ?? t._id)))
    .forEach((t: any) => chips.push({ label: t.name, remove: () => toggleTechnique(String(t.id ?? t._id)) }));
  if (kind) chips.push({ label: kind === "unica" ? "Obra única" : "Reproducción", remove: () => setKind("") });
  if (priceTouched) chips.push({ label: `Hasta ${fmt(maxPrice)}`, remove: () => { setPriceTouched(false); setMaxPrice(ceiling); } });
  if (q) chips.push({ label: `Búsqueda: ${q}`, remove: () => setQ("") });

  const effectiveMax = priceTouched ? maxPrice : ceiling;
  const onMax = (v: number) => { setPriceTouched(true); setMaxPrice(v); };

  const seen = works.length;
  const totalN = isLoading ? 0 : Math.max(total, seen);
  const obras = plural(totalN, "obra", "obras");
  const ddCta = isLoading ? "Cargando…" : totalN === 0 ? "Sin resultados" : `Ver ${totalN} ${obras}`;
  const empty = !isLoading && works.length === 0;

  // Escape cierra desplegable y hoja; la hoja bloquea el scroll de fondo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setDd(null); setSheet(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!sheet) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [sheet]);

  const ddBadge = (n: number) => (n > 0 ? String(n) : "");
  const toggleDd = (k: DdKey) => setDd((cur) => (cur === k ? null : k));

  /* ── Secciones de filtro compartidas (desplegable y hoja) ─── */
  const pabList = () => <>{pabFacets.map((f) => <Check key={f.value} f={f} />)}</>;
  const priceBlock = (compact?: boolean) => (
    <>
      {compact ? (
        <span className="fdm-range-top">Hasta {fmt(effectiveMax)}</span>
      ) : (
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span className="lg">Precio máximo</span>
          <span style={{ fontSize: 17, fontWeight: 500 }}>Hasta {fmt(effectiveMax)}</span>
        </div>
      )}
      <input
        type="range"
        aria-label="Precio máximo"
        min={MIN_PRICE}
        max={ceiling}
        step={50_000}
        value={effectiveMax}
        onChange={(e) => onMax(Number(e.target.value))}
        style={{ width: "100%", height: 44, margin: 0 }}
      />
      <div className="fdm-range-ends"><span>{fmt(MIN_PRICE)}</span><span>{fmt(ceiling)}</span></div>
    </>
  );
  const kindBlock = (round?: boolean) => (
    <div style={{ display: "flex", flexDirection: round ? "row" : "column", flexWrap: "wrap", gap: 8, paddingTop: round ? 12 : 6 }}>
      {KINDS.map((k) => (
        <button key={k.value} type="button" className={`fdm-kind${kind === k.value ? " is-on" : ""}`} aria-pressed={kind === k.value} onClick={() => setKind(k.value)}>
          {k.label}
        </button>
      ))}
    </div>
  );
  const artList = () => (
    <>
      <input type="search" className="fdm-dd-search" aria-label="Buscar artista" placeholder="Buscar artista" value={artQ} onChange={(e) => setArtQ(e.target.value)} />
      {artFacets.length === 0 && <span style={{ padding: "10px 0", fontSize: 14, color: "var(--fg3)" }}>Sin coincidencias</span>}
      {artFacets.map((f) => <Check key={f.value} f={f} />)}
    </>
  );
  const tecList = () => <>{tecFacets.map((f) => <Check key={f.value} f={f} />)}</>;

  return (
    <ShopShell>
      <main className="fdm-wrap">
        {/* ── Cabecera ─────────────────────────────────────── */}
        <section className="fdm-hero">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="fdm-eyebrow">Obras en venta · {eventName || "Edición 2026"}</span>
            <h1 className="fdm-h1">Catálogo</h1>
          </div>
          <p className="fdm-lead">
            Obra original de artistas emergentes colombianos. Cada pieza se vende directamente por el artista durante la edición.
          </p>
        </section>

        {/* Celular: búsqueda arriba de la barra */}
        <div className="fdm-m-search">
          <SearchBox q={q} setQ={setQ} placeholder="Buscar por título o artista" />
        </div>

        {/* ── Barra de filtros ─────────────────────────────── */}
        <div className="fdm-bar">
          {dd && <button type="button" className="fdm-dd-mask" aria-label="Cerrar filtro" onClick={() => setDd(null)} />}

          <div className="fdm-d-only" style={{ display: "contents" }}>
            <SearchBox q={q} setQ={setQ} placeholder="Buscar obra o artista" />
            <Dd label="Pabellón" k="pab" dd={dd} badge={ddBadge(pavilion ? 1 : 0)} onToggle={toggleDd} width={320} cta={ddCta} onClose={() => setDd(null)}>
              {pabList()}
            </Dd>
            <Dd label="Precio" k="pre" dd={dd} badge={ddBadge(priceTouched ? 1 : 0)} onToggle={toggleDd} width={300} cta={ddCta} onClose={() => setDd(null)}>
              {priceBlock(true)}
            </Dd>
            <Dd label="Tipo" k="tip" dd={dd} badge={ddBadge(kind ? 1 : 0)} onToggle={toggleDd} width={260} cta={ddCta} onClose={() => setDd(null)}>
              {kindBlock()}
            </Dd>
            <Dd label="Artista" k="art" dd={dd} badge={ddBadge(artistIds.length)} onToggle={toggleDd} width={300} cta={ddCta} onClose={() => setDd(null)}>
              {artList()}
            </Dd>
            <Dd label="Técnica" k="tec" dd={dd} badge={ddBadge(techniqueIds.length)} onToggle={toggleDd} width={260} cta={ddCta} onClose={() => setDd(null)}>
              {tecList()}
            </Dd>
          </div>

          {/* Celular: botón Filtros */}
          <button type="button" className="fdm-pill is-filter fdm-m-only" onClick={() => setSheet(true)} aria-haspopup="dialog" aria-expanded={sheet}>
            {I.filter({ size: 18 })}
            Filtros
            {chips.length > 0 && <span className="fdm-badge">{chips.length}</span>}
          </button>

          <div className="fdm-bar-right">
            <select className="fdm-sort" aria-label="Ordenar por" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="fdm-view fdm-d-only" role="group" aria-label="Vista">
              <button type="button" className={viewMode === "grid" ? "is-on" : ""} aria-label="Vista grilla" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")}>{I.grid({ size: 18 })}</button>
              <button type="button" className={viewMode === "list" ? "is-on" : ""} aria-label="Vista lista" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")}>{I.list({ size: 18 })}</button>
            </div>
          </div>
        </div>

        {/* ── Conteo + chips ───────────────────────────────── */}
        <div className="fdm-chips">
          <span className="fdm-count" aria-live="polite">
            <strong>{isLoading ? "—" : totalN}</strong> {obras}
          </span>
          {chips.length > 0 && (
            <span className="fdm-chip-n"><i />{chips.length} {plural(chips.length, "filtro activo", "filtros activos")}</span>
          )}
          {chips.map((c, i) => (
            <button key={`${c.label}-${i}`} type="button" className="fdm-chip" onClick={c.remove}>
              {c.label}
              <span role="img" aria-label="Quitar filtro" style={{ display: "inline-flex" }}>{I.close({ size: 14, sw: 1.8 })}</span>
            </button>
          ))}
          {chips.length > 0 && <button type="button" className="fdm-clear" onClick={clearAll}>Limpiar todo</button>}
        </div>

        {/* ── Resultados ───────────────────────────────────── */}
        {isLoading && (
          <section className="fdm-grid" aria-busy="true" aria-label="Cargando obras">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="fdm-card">
                <Skeleton aspect="4/5" />
                <Skeleton w="80%" h={18} />
                <Skeleton w="55%" h={14} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <Skeleton w={90} h={18} />
                  <Skeleton w={100} h={44} radius={999} />
                </div>
              </div>
            ))}
          </section>
        )}

        {empty && (
          <div className="fdm-empty">
            <span className="t">No hay obras con estos filtros</span>
            <span className="s">Prueba subir el precio máximo o quitar algún filtro.</span>
            <button type="button" className="fdm-btn is-outline is-caps" onClick={clearAll}>Limpiar filtros</button>
          </div>
        )}

        {!isLoading && works.length > 0 && (viewMode === "grid" ? (
          <section className="fdm-grid" aria-label="Obras">
            {works.map((w) => <ArtworkCard key={w.id} art={w} />)}
          </section>
        ) : (
          <section className="fdm-rows" aria-label="Obras">
            {works.map((w) => <ArtworkRow key={w.id} art={w} />)}
          </section>
        ))}

        {!isLoading && works.length > 0 && (
          <section className="fdm-more">
            <span className="l">Viendo {seen} de {totalN} {obras}</span>
            <div className="bar" aria-hidden="true"><i style={{ width: `${totalN ? Math.round((seen / totalN) * 100) : 0}%` }} /></div>
            {hasNextPage && (
              <button type="button" className="fdm-btn is-outline is-caps" onClick={() => loadMore()} disabled={isFetchingNextPage}>
                {isFetchingNextPage ? "Cargando…" : "Cargar más obras"}
              </button>
            )}
          </section>
        )}
        {!isLoading && works.length === 0 && <div style={{ height: 48 }} />}
      </main>

      {/* ── ¿Eres artista? ───────────────────────────────── */}
      <section className="fdm-strip">
        <div className="fdm-wrap fdm-strip-in">
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="t">¿Eres artista?</span>
            <span className="s">Postula tu obra al catálogo de la próxima edición.</span>
          </div>
          <Link href="/convocatoria" className="fdm-btn is-green is-caps">Postular</Link>
        </div>
      </section>

      {/* ── Hoja de filtros (celular) ────────────────────── */}
      {sheet && (
        <>
          <button type="button" className="fdm-sheet-mask" aria-label="Cerrar filtros" onClick={() => setSheet(false)} />
          <div className="fdm-sheet" role="dialog" aria-modal="true" aria-label="Filtros">
            <div className="fdm-sheet-handle"><i /></div>
            <div className="fdm-sheet-head">
              <h2>Filtros</h2>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button type="button" className="fdm-link-u is-mute" style={{ padding: "0 12px" }} onClick={clearAll}>Limpiar todo</button>
                <button type="button" className="fdm-icon-btn" aria-label="Cerrar filtros" onClick={() => setSheet(false)}>{I.close()}</button>
              </div>
            </div>
            <div className="fdm-sheet-body">
              <fieldset>
                <legend>Pabellón</legend>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column" }}>{pabList()}</div>
              </fieldset>
              <div style={{ padding: "18px 0", borderBottom: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 6 }}>
                {priceBlock()}
              </div>
              <fieldset style={{ paddingBottom: 18 }}>
                <legend>Tipo de obra</legend>
                {kindBlock(true)}
              </fieldset>
              <fieldset>
                <legend>Artista</legend>
                <div style={{ display: "flex", flexDirection: "column" }}>{artList()}</div>
              </fieldset>
              <fieldset>
                <legend>Técnica</legend>
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column" }}>{tecList()}</div>
              </fieldset>
            </div>
            <div className="fdm-sheet-foot">
              <button type="button" className="fdm-dd-cta" onClick={() => setSheet(false)}>{ddCta}</button>
            </div>
          </div>
        </>
      )}
    </ShopShell>
  );
}

/* ── Piezas ─────────────────────────────────────────────────── */

function SearchBox({ q, setQ, placeholder }: { q: string; setQ: (v: string) => void; placeholder: string }) {
  return (
    <label className="fdm-search">
      {I.search({ size: 18 })}
      <input type="search" aria-label="Buscar por título o artista" placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
      {q && (
        <button type="button" onClick={() => setQ("")} aria-label="Borrar búsqueda" style={{ border: "none", background: "transparent", color: "var(--fg3)", display: "flex", padding: 4, cursor: "pointer" }}>
          {I.close({ size: 14 })}
        </button>
      )}
    </label>
  );
}

function Check({ f }: { f: Facet }) {
  const dis = f.count === 0 && !f.on;
  return (
    <label className={`fdm-check${dis ? " is-dis" : ""}`}>
      <input type="checkbox" checked={f.on} disabled={dis} onChange={f.toggle} />
      <span style={{ flex: 1 }}>{f.label}</span>
      {f.count != null && <span className="n">{f.count}</span>}
    </label>
  );
}

function Dd({
  label, k, dd, badge, onToggle, width, cta, onClose, children,
}: {
  label: string; k: DdKey; dd: DdKey | null; badge: string; onToggle: (k: DdKey) => void;
  width: number; cta: string; onClose: () => void; children: React.ReactNode;
}) {
  const open = dd === k;
  const active = badge !== "";
  return (
    <div className="fdm-dd-wrap">
      <button type="button" className={`fdm-pill${open ? " is-open" : ""}${active ? " is-active" : ""}`} aria-expanded={open} aria-haspopup="dialog" onClick={() => onToggle(k)}>
        {label}
        {active && <span style={{ fontWeight: 600 }}>{badge}</span>}
        <span className="fdm-rot" style={{ display: "inline-flex" }}>{I.chevron({ size: 16 })}</span>
      </button>
      {open && (
        <div className="fdm-dd" role="dialog" aria-label={label} style={{ width }}>
          <div className="fdm-dd-scroll">{children}</div>
          <button type="button" className="fdm-dd-cta" onClick={onClose}>{cta}</button>
        </div>
      )}
    </div>
  );
}
