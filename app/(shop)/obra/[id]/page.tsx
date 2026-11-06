"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCatalogSalesPaused, useFairMode } from "@provider/siteConfigProvider";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";
import { useArtistProfile } from "@hooks/queries/useArtistProfile";
import { mergeImages, pickSrc } from "@lib/utils";
import { formatCOP } from "@lib/money";
import Skeleton from "@components/ui/Skeleton";
import SmartImage from "@components/ui/SmartImage";
import { motion, useReducedMotion } from "framer-motion";
import ArtworkViewer, { type ViewerChip } from "./ArtworkViewer";

/* ──────────────────────────────────────────────────────────────
   Detalle de obra — rediseño visual (handoff "Obra.dc.html"):
   tarjetas con radio, ficha en grilla, tarjeta del artista y barra
   fija de compra en celular. Header/footer los aporta el layout;
   el tema (claro/oscuro) sigue al toggle global (data-theme).
   ────────────────────────────────────────────────────────────── */

const PAGE_CSS = `
  .fdm-obra-root{
    --bg:var(--fdm-bg,#F7F6F2); --card:#FAFAF7; --fg:#15150F; --fg2:#5F5E57; --fg3:#8E8D86;
    --line:rgba(21,21,15,.1); --line2:rgba(21,21,15,.18); --inv:#0B0B0A; --invfg:#F5F4EF;
    --acc:var(--fdm-green,#3FA46E); --bar:color-mix(in srgb, var(--fdm-bg,#F7F6F2) 86%, transparent);
    background:var(--bg); color:var(--fg); font-family:Jost,system-ui,sans-serif; min-height:100vh; width:100%; overflow-x:hidden;
  }
  :root[data-theme="dark"] .fdm-obra-root{
    --card:#171716; --fg:#F5F4EF; --fg2:#B8B7AF; --fg3:#8E8D86;
    --line:rgba(255,255,255,.1); --line2:rgba(255,255,255,.16); --inv:#F5F4EF; --invfg:#0B0B0A;
  }
  .fdm-obra-root a{ transition:color .25s ease, background .25s ease, border-color .25s ease; }
  .fdm-obra-link:hover{ color:var(--acc); }
  .fdm-obra-page{ max-width:1280px; margin:0 auto; padding:0 40px 64px; min-width:0; }
  .fdm-obra-top{ display:flex; align-items:center; justify-content:space-between; gap:16px; padding:22px 0 26px; }
  .fdm-obra-crumb{ display:flex; align-items:center; gap:8px; font-size:13px; color:var(--fg3); flex-wrap:wrap; min-width:0; }
  .fdm-obra-crumb a{ color:var(--fg2); }
  .fdm-obra-back{ height:40px; padding:0 16px; border-radius:999px; border:1px solid var(--line2); display:inline-flex; align-items:center; gap:8px; font-size:14px; font-weight:500; color:var(--fg); flex:none; white-space:nowrap; }
  .fdm-obra-back:hover{ background:var(--inv); color:var(--invfg); border-color:var(--inv); }
  .fdm-obra-hero{ display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,1fr); gap:56px; align-items:start; }
  .fdm-obra-media{ display:flex; flex-direction:column; gap:10px; min-width:0; }
  .fdm-obra-thumbs{ display:grid; grid-template-columns:repeat(auto-fill, minmax(64px, 1fr)); gap:8px; }
  .fdm-obra-info{ display:flex; flex-direction:column; gap:28px; padding-top:8px; min-width:0; position:sticky; top:96px; }
  .fdm-obra-info h1{ margin:0; font-size:clamp(28px,3.4vw,44px); line-height:1.04; font-weight:600; letter-spacing:-.025em; text-wrap:balance; overflow-wrap:anywhere; }
  .fdm-obra-buy{ width:100%; min-width:180px; height:52px; border-radius:14px; border:0; background:var(--acc); color:#0B0B0A; font-family:inherit; font-size:15px; font-weight:600; cursor:pointer; transition:background .25s ease, opacity .25s ease; }
  .fdm-obra-buy:hover:not(:disabled){ background:#2E8A58; }
  .fdm-obra-buy:disabled{ cursor:not-allowed; opacity:.45; }
  .fdm-obra-specs{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1px; background:var(--line); border:1px solid var(--line); border-radius:16px; overflow:hidden; }
  .fdm-obra-specs > div{ background:var(--card); padding:14px 16px; display:flex; flex-direction:column; gap:4px; min-width:0; }
  .fdm-obra-artist{ display:flex; align-items:center; gap:14px; padding:14px; border-radius:16px; border:1px solid var(--line); background:var(--card); color:var(--fg); }
  .fdm-obra-artist:hover{ border-color:var(--line2); }
  .fdm-obra-more{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
  .fdm-obra-tile{ display:grid; place-items:center; aspect-ratio:4/5; padding:14px; background:var(--card); border:1px solid var(--line); border-radius:16px; overflow:hidden; transition:border-color .3s, transform .2s; position:relative; }
  .fdm-obra-card:hover .fdm-obra-tile{ border-color:var(--line2); transform:translateY(-2px); }
  .fdm-obra-sticky{ display:none; }
  @media (max-width:1180px){
    .fdm-obra-page{ padding-left:24px; padding-right:24px; }
    .fdm-obra-hero{ grid-template-columns:1fr; gap:28px; }
    .fdm-obra-hero .fdm-obra-media{ max-width:560px; margin:0 auto; width:100%; }
    .fdm-obra-info{ position:static; }
    .fdm-obra-more{ grid-template-columns:repeat(3,minmax(0,1fr)); }
  }
  @media (max-width:640px){
    .fdm-obra-page{ padding:0 16px 120px; }
    .fdm-obra-crumb{ display:none; }
    .fdm-obra-top{ justify-content:flex-end; padding:14px 0 16px; }
    .fdm-obra-info{ gap:22px; }
    .fdm-obra-info h1{ font-size:28px; }
    .fdm-obra-actions{ display:none !important; }
    .fdm-obra-specs{ grid-template-columns:1fr 1fr; }
    .fdm-obra-more{ grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .fdm-obra-artist .fdm-obra-artist-cta{ display:none; }
    .fdm-obra-sticky{ display:flex; position:fixed; left:0; right:0; bottom:0; z-index:30; gap:12px; align-items:center;
      padding:12px 16px calc(12px + env(safe-area-inset-bottom)); background:var(--bar);
      backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px); border-top:1px solid var(--line); }
    .fdm-obra-sticky .fdm-obra-buy{ height:48px; border-radius:12px; min-width:0; flex:1; }
  }
`;

const LABEL: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--fg3)",
  fontWeight: 500,
};

function Root({ children }: { children: React.ReactNode }) {
  return (
    <div className="fdm-obra-root">
      <style>{PAGE_CSS}</style>
      {children}
    </div>
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
  const reduce = useReducedMotion();
  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] as const },
      };

  const doc: any = data?.doc;
  const copies = data?.copies ?? [];
  const related = data?.relatedArtworks ?? [];

  const images = useMemo(() => mergeImages(doc?.image, doc?.images), [doc?.image, doc?.images]);
  // La foto que el artista eligió para su página (solicitud); la del usuario casi nunca está.
  const { data: artistProfile } = useArtistProfile(doc?.artist ? String(doc.artist) : undefined);

  /* Carga: misma estructura que la vista real, así al llegar los datos nada salta. */
  if (isLoading) {
    return (
      <Root>
        <div className="fdm-obra-page">
          <div className="fdm-obra-top">
            <Skeleton w={320} h={13} />
            <Skeleton w={96} h={40} radius={999} />
          </div>
          <section className="fdm-obra-hero">
            <div className="fdm-obra-media">
              <Skeleton aspect="4/5" radius={24} />
            </div>
            <div className="fdm-obra-info">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Skeleton w="45%" h={11} />
                <Skeleton w="90%" h={44} />
                <Skeleton w="40%" h={22} />
              </div>
              <Skeleton w="55%" h={34} />
              <Skeleton w="100%" h={52} radius={14} />
              <Skeleton w="100%" h={140} radius={16} />
              <Skeleton w="100%" h={80} radius={16} />
            </div>
          </section>
        </div>
      </Root>
    );
  }

  if (isError || !doc) {
    return (
      <Root>
        <div className="fdm-obra-page" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center", paddingTop: "clamp(40px,8vw,110px)" }}>
          <h1 style={{ margin: 0, fontSize: "clamp(24px,3vw,36px)", fontWeight: 600, letterSpacing: "-.02em" }}>
            {isError ? "No pudimos cargar la obra" : "Obra no encontrada"}
          </h1>
          <p style={{ margin: 0, maxWidth: "42ch", fontSize: 15, lineHeight: 1.6, color: "var(--fg2)" }}>
            {error?.message || "Puede que la obra ya no esté publicada."}
          </p>
          <Link href={fairMode ? "/" : "/catalogo"} className="fdm-obra-back">
            {fairMode ? "Volver al inicio" : "Volver al catálogo"}
          </Link>
        </div>
      </Root>
    );
  }

  const currency = doc.currency || "COP";
  const stock = Number(doc.stock ?? (copies.length ? 1 : 0));
  const availableCopy = copies.find((c: any) => c.status === "available");
  const inStock = stock > 0 && !!availableCopy;
  // Edición = copias reales (sin anuladas). No se usa copy.total: queda viejo
  // cuando el artista sube el stock (1 → 10 dejaba la copia 1 en "1/1").
  const edition = Math.max(stock, copies.filter((c: any) => c.status !== "void").length);
  const isAvailable = inStock && !salesPaused;
  // Con la venta pausada la obra sigue disponible: solo no se compra en línea aún.
  const statusText = inStock ? "Disponible" : fairMode ? "Vendida" : "Agotada";
  const buyLabel = salesPaused && inStock ? "Venta en feria" : !inStock ? statusText : fairMode ? "Comprar esta obra" : "Comprar ahora";

  const artistFullName =
    [doc.artistInfo?.firstName, doc.artistInfo?.lastName].filter(Boolean).join(" ") || "Artista";
  const artistPhoto = pickSrc(artistProfile?.photoUrl) || pickSrc(doc.artistInfo?.image);
  const artistHref = doc.artist ? `/artista/${encodeURIComponent(String(doc.artist))}` : "";

  const pavilionId = doc.pavilionInfo?._id ? String(doc.pavilionInfo._id) : "";
  const techniqueId = doc.techniqueInfo?._id ? String(doc.techniqueInfo._id) : "";
  // Las migajas apuntan al catálogo ya filtrado (el back del navegador conserva el filtro).
  const pavilionHref = pavilionId ? `/catalogo?pavilion=${encodeURIComponent(pavilionId)}&modo=pabellon` : "/catalogo";
  const techniqueHref = techniqueId ? `/catalogo?tecnica=${encodeURIComponent(techniqueId)}` : "/catalogo";

  // Sin carrito: ?artwork= vacía el carrito y deja solo esta obra.
  const handleBuyNow = () => router.push(`/checkout?artwork=${encodeURIComponent(String(doc._id))}`);

  const editionText = edition > 1 ? `${stock} de ${edition} disponibles` : "Pieza única";
  const specs: { k: string; v: string }[] = [
    doc.techniqueInfo?.name && { k: "Técnica", v: doc.techniqueInfo.name },
    doc.dimensionsText && { k: "Medidas", v: String(doc.dimensionsText) },
    doc.year && { k: "Año", v: String(doc.year) },
    availableCopy && { k: "Edición", v: editionText },
    doc.pavilionInfo?.name && { k: "Pabellón", v: doc.pavilionInfo.name },
    doc.shippingNotes && { k: "Entrega", v: String(doc.shippingNotes) },
  ].filter(Boolean) as { k: string; v: string }[];

  const chips: ViewerChip[] = [
    { label: statusText, tone: inStock ? "acc" : "mute" },
    { label: edition > 1 ? `Edición de ${edition}` : "Pieza única", tone: "inv" },
  ];

  const avatar = (size: number) => (
    <span
      style={{
        position: "relative",
        overflow: "hidden",
        flex: "0 0 auto",
        width: size,
        height: size,
        borderRadius: 999,
        background: "var(--line)",
        display: "grid",
        placeItems: "center",
        fontWeight: 600,
        fontSize: size * 0.36,
        color: "var(--fg2)",
      }}
    >
      {/* User.image existe pero puede estar vacío: inicial de respaldo. */}
      {artistPhoto ? <SmartImage src={artistPhoto} alt="" fit="cover" sizes={`${size}px`} /> : artistFullName.charAt(0)}
    </span>
  );

  const buyButton = (
    <button type="button" className="fdm-obra-buy" onClick={handleBuyNow} disabled={!isAvailable}>
      {buyLabel}
    </button>
  );

  return (
    <Root>
      <main className="fdm-obra-page">
        {/* ── Migas + volver ─────────────────────────────────── */}
        <div className="fdm-obra-top">
          {fairMode ? (
            <span />
          ) : (
            <nav aria-label="Migas de pan" className="fdm-obra-crumb">
              <Link href="/catalogo" className="fdm-obra-link">Catálogo</Link>
              {doc.pavilionInfo?.name && (
                <>
                  <span style={{ opacity: 0.4 }}>/</span>
                  <Link href={pavilionHref} className="fdm-obra-link">{doc.pavilionInfo.name}</Link>
                </>
              )}
              {doc.techniqueInfo?.name && (
                <>
                  <span style={{ opacity: 0.4 }}>/</span>
                  <Link href={techniqueHref} className="fdm-obra-link">{doc.techniqueInfo.name}</Link>
                </>
              )}
              <span style={{ opacity: 0.4 }}>/</span>
              <span aria-current="page" style={{ color: "var(--fg)" }}>{doc.title}</span>
            </nav>
          )}
          {fairMode ? (
            artistHref && <Link href={artistHref} className="fdm-obra-back">Más del artista</Link>
          ) : (
            <Link href={pavilionHref} className="fdm-obra-back">← Volver</Link>
          )}
        </div>

        {/* ── Obra ───────────────────────────────────────────── */}
        <section className="fdm-obra-hero">
          <ArtworkViewer images={images} title={doc.title} chips={chips} />

          <motion.div className="fdm-obra-info" {...rise}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--acc)", fontWeight: 600, marginBottom: 12 }}>
                {[doc.techniqueInfo?.name, doc.pavilionInfo?.name].filter(Boolean).join(" · ") || "Obra original"}
              </div>
              <h1>{doc.title}</h1>
              {artistHref ? (
                <Link href={artistHref} className="fdm-obra-link" style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 16, fontSize: 16, color: "var(--fg2)" }}>
                  {avatar(28)}
                  <span>{artistFullName}</span>
                </Link>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 16, fontSize: 16, color: "var(--fg2)" }}>
                  {avatar(28)}
                  {artistFullName}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1 }}>
                {formatCOP(doc.price, { currency })}
              </span>
              <span style={{ fontSize: 13, color: "var(--fg3)" }}>
                {currency}
                {inStock ? ` · ${editionText}` : ` · ${statusText}`}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="fdm-obra-actions" style={{ display: "flex" }}>{buyButton}</div>
              {/* El aviso de la pausa se ve también en celular (ahí el botón va en la barra fija). */}
              {salesPaused && inStock && (
                <p style={{ margin: 0, padding: "12px 14px", borderRadius: 12, background: "var(--card)", border: "1px solid var(--line)", fontSize: 13.5, lineHeight: 1.5, color: "var(--fg2)" }}>
                  {salesPausedMsg}
                </p>
              )}
              {/* Ventas que no quedaron registradas (caja sin orden): el comprador lo reporta. */}
              <Link href={`/reclamo?obra=${encodeURIComponent(String(doc._id))}`} className="fdm-obra-link" style={{ fontSize: 13, color: "var(--fg3)" }}>
                ¿Ya compró esta obra y no tiene confirmación?
              </Link>
            </div>

            {specs.length > 0 && (
              <div className="fdm-obra-specs">
                {specs.map((s) => (
                  <div key={s.k}>
                    <span style={LABEL}>{s.k}</span>
                    <span style={{ fontSize: 15, fontWeight: 500, overflowWrap: "anywhere" }}>{s.v}</span>
                  </div>
                ))}
              </div>
            )}

            {doc.description && (
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: "var(--fg2)", textWrap: "pretty", whiteSpace: "pre-line" }}>
                {doc.description}
              </p>
            )}

            {artistHref && (
              <Link href={artistHref} className="fdm-obra-artist">
                {avatar(52)}
                <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{artistFullName}</span>
                  <span style={{ fontSize: 13, color: "var(--fg3)" }}>
                    {doc.pavilionInfo?.name ? `Expone en ${doc.pavilionInfo.name}` : "Artista de la edición"}
                  </span>
                </span>
                <span className="fdm-obra-artist-cta" style={{ fontSize: 13, fontWeight: 500, color: "var(--acc)", whiteSpace: "nowrap" }}>
                  Ver perfil →
                </span>
              </Link>
            )}
          </motion.div>
        </section>

        {/* ── Más obras ──────────────────────────────────────── */}
        {related.length > 0 && !fairMode && (
          <section style={{ marginTop: 72, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: "-.02em" }}>Más obras</h2>
              <Link href={pavilionHref} style={{ fontSize: 13, fontWeight: 500, color: "var(--acc)", whiteSpace: "nowrap" }}>
                Ver catálogo completo →
              </Link>
            </div>
            <div className="fdm-obra-more">
              {related.map((ra: any, i: number) => (
                <motion.div
                  key={String(ra._id)}
                  initial={reduce ? undefined : { opacity: 0, y: 12 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}
                  style={{ minWidth: 0 }}
                >
                  <Link href={`/obra/${encodeURIComponent(String(ra._id))}`} className="fdm-obra-card" style={{ display: "flex", flexDirection: "column", gap: 10, color: "var(--fg)" }}>
                    <span className="fdm-obra-tile">
                      <span style={{ position: "absolute", inset: 14, display: "block", filter: "drop-shadow(0 10px 24px rgba(0,0,0,.3))" }}>
                        <SmartImage
                          src={pickSrc(ra.image) || pickSrc(ra.images?.[0]) || "/placeholder.png"}
                          alt={ra.title}
                          sizes="(max-width: 640px) 46vw, (max-width: 1180px) 30vw, 300px"
                        />
                      </span>
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 3, padding: "0 2px", minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {ra.title}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--fg3)" }}>
                        {formatCOP(ra.price, { currency: ra.currency || currency })}
                      </span>
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Barra fija de compra (celular) ─────────────────── */}
      <div className="fdm-obra-sticky">
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, flex: "none" }}>
          <span style={{ fontSize: 18, fontWeight: 600, whiteSpace: "nowrap" }}>{formatCOP(doc.price, { currency })}</span>
          <span style={{ fontSize: 11, color: inStock ? "var(--acc)" : "var(--fg3)", marginTop: 3 }}>{statusText}</span>
        </div>
        {buyButton}
      </div>
    </Root>
  );
}
