"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useCart from "@store/useCart";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";
import { mergeImages, pickSrc } from "@lib/utils";
import { formatCOP } from "@lib/money";
import Skeleton from "@components/ui/Skeleton";
import SmartImage from "@components/ui/SmartImage";
import { motion, useReducedMotion } from "framer-motion";
import ArtworkViewer from "./ArtworkViewer";

/* ──────────────────────────────────────────────────────────────
   Detalle de obra — diseño editorial v2 (port de Obra.dc.html).
   Header/footer los aporta el layout. Los tokens --bg/--fg/--acc/
   --panel se mapean a los --fdm-* globales para heredar el tema.
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
  .fdm-obra a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-obra-link:hover { color: var(--acc); }
  .fdm-obra-shell { display:flex; flex-wrap:wrap; align-items:flex-start; gap:clamp(18px,2vw,30px); padding:clamp(16px,1.8vw,24px) 0 clamp(24px,2.6vw,36px); }
  .fdm-obra-media { flex:1 1 460px; min-width:min(100%,300px); display:flex; flex-direction:column; gap:10px; }
  .fdm-obra-info { flex:1 1 340px; min-width:min(100%,300px); max-width:520px; position:sticky; top:92px; display:flex; flex-direction:column; }
  .fdm-obra-thumbs { display:grid; grid-template-columns:repeat(auto-fit, minmax(70px, 1fr)); gap:8px; }
  .fdm-obra-related { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%,210px), 1fr)); gap:clamp(14px,1.6vw,22px); padding-top:clamp(14px,1.6vw,22px); }
  .fdm-obra-card:hover .fdm-obra-frame { border-color: var(--acc); }
  @media (max-width: 1079px) { .fdm-obra-info { position:static; } }
`;

/* ── Estados de carga / error ────────────────────────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={ROOT_VARS}>
      <style>{PAGE_CSS}</style>
      <div
        className="fdm-obra"
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: "clamp(40px,6vw,90px) clamp(20px,4vw,56px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          textAlign: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function BackToCatalog({ label = "Volver al catálogo" }: { label?: string }) {
  return (
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
      {label}
    </Link>
  );
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const { data, isLoading, isError, error } = useArtworkDetail(id);
  const { add, items } = useCart();

  const doc: any = data?.doc;
  const copies = data?.copies ?? [];
  const related = data?.relatedArtworks ?? [];

  const images = useMemo(
    () => mergeImages(doc?.image, doc?.images),
    [doc?.image, doc?.images]
  );

  if (isLoading) {
    return (
      <div style={ROOT_VARS}>
        <style>{PAGE_CSS}</style>
        <div
          className="fdm-obra"
          style={{ maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)" }}
        >
          {/* Mismas alturas que la vista real: al llegar los datos nada se mueve. */}
          <div style={{ padding: "12px 0", borderBottom: `1px solid ${mix(12)}` }}>
            <Skeleton w={320} h={11} />
          </div>

          <section className="fdm-obra-shell">
            <div className="fdm-obra-media">
              <Skeleton aspect="1/1" />
              <div className="fdm-obra-thumbs">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} aspect="1" />
                ))}
              </div>
            </div>

            <div className="fdm-obra-info">
              <Skeleton w="55%" h={11} />
              <div style={{ marginTop: 8 }}>
                <Skeleton w="85%" h={46} />
              </div>
              <div style={{ marginTop: 8 }}>
                <Skeleton w="45%" h={17} />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 16,
                  padding: "12px 0",
                  borderTop: `1px solid ${mix(20)}`,
                  borderBottom: `1px solid ${mix(12)}`,
                }}
              >
                <Skeleton w={160} h={34} />
                <span style={{ flex: 1 }} />
                <Skeleton w={92} h={11} />
              </div>

              <div style={{ display: "flex", gap: 8, padding: "12px 0", borderBottom: `1px solid ${mix(12)}` }}>
                <Skeleton w={190} h={48} radius={999} />
                <Skeleton w={150} h={48} radius={999} />
              </div>

              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 16,
                    padding: "8px 0",
                    borderBottom: `1px solid ${mix(9)}`,
                  }}
                >
                  <Skeleton w="38%" h={10} />
                  <Skeleton w="50%" h={14} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <Shell>
        <span
          style={{
            fontWeight: 400,
            fontSize: "clamp(24px,3vw,36px)",
            textTransform: "uppercase",
            letterSpacing: "0.02em",
          }}
        >
          {isError ? "No pudimos cargar la obra" : "Obra no encontrada"}
        </span>
        <p style={{ margin: 0, maxWidth: "42ch", fontSize: 15, lineHeight: 1.6, color: mix(70) }}>
          {error?.message || "Puede que la obra ya no esté publicada."}
        </p>
        <BackToCatalog />
      </Shell>
    );
  }

  const reduce = useReducedMotion();
  const rise = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
      };

  const currency = doc.currency || "COP";
  const stock = Number(doc.stock ?? (copies.length ? 1 : 0));
  const availableCopy = copies.find((c: any) => c.status === "available");
  const isAvailable = stock > 0 && !!availableCopy;

  const artistFullName =
    [doc.artistInfo?.firstName, doc.artistInfo?.lastName].filter(Boolean).join(" ") ||
    "Artista";

  const artistPhoto = pickSrc(doc.artistInfo?.image);

  const pavilionId = doc.pavilionInfo?._id ? String(doc.pavilionInfo._id) : "";
  const techniqueId = doc.techniqueInfo?._id ? String(doc.techniqueInfo._id) : "";

  // Las migajas apuntan al catálogo ya filtrado — el mismo estado que la URL
  // del catálogo sabe leer, así el back del navegador conserva el filtro.
  const pavilionHref = pavilionId
    ? `/catalogo?pavilion=${encodeURIComponent(pavilionId)}&modo=pabellon`
    : "/catalogo";
  const techniqueHref = techniqueId
    ? `/catalogo?tecnica=${encodeURIComponent(techniqueId)}`
    : "/catalogo";

  const inCart = items.some((i: any) => String(i.id) === String(doc._id));

  const cartPayload = {
    id: String(doc._id),
    title: doc.title,
    price: Number(doc.price ?? 0),
    image: pickSrc(doc.image) || pickSrc(doc.images?.[0]) || "/placeholder.png",
    artist: artistFullName,
  };

  const handleAddToCart = () => add(cartPayload, 1);
  const handleBuyNow = () => {
    add(cartPayload, 1);
    router.push("/checkout");
  };

  const specs: { k: string; v: string }[] = [
    doc.techniqueInfo?.name && { k: "Técnica", v: doc.techniqueInfo.name },
    doc.dimensionsText && { k: "Medidas", v: String(doc.dimensionsText) },
    doc.year && { k: "Año", v: String(doc.year) },
    availableCopy && {
      k: "Edición",
      v:
        Number(availableCopy.total) > 1
          ? `Copia ${availableCopy.number} de ${availableCopy.total}`
          : "Pieza única",
    },
    doc.pavilionInfo?.name && { k: "Pabellón", v: doc.pavilionInfo.name },
    doc.shippingNotes && { k: "Entrega", v: String(doc.shippingNotes) },
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <div style={ROOT_VARS}>
      <style>{PAGE_CSS}</style>

      <div
        className="fdm-obra"
        style={{ maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)" }}
      >
        {/* ── Migas de pan ───────────────────────────────────── */}
        <nav
          aria-label="Migas de pan"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "12px 0",
            borderBottom: `1px solid ${mix(12)}`,
            ...EYEBROW,
            fontSize: 10.5,
            letterSpacing: "0.14em",
            color: mix(55),
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <Link href="/catalogo" className="fdm-obra-link">
              Catálogo
            </Link>
            {doc.pavilionInfo?.name && (
              <>
                <span aria-hidden>/</span>
                <Link href={pavilionHref} className="fdm-obra-link">
                  {doc.pavilionInfo.name}
                </Link>
              </>
            )}
            {doc.techniqueInfo?.name && (
              <>
                <span aria-hidden>/</span>
                <Link href={techniqueHref} className="fdm-obra-link">
                  {doc.techniqueInfo.name}
                </Link>
              </>
            )}
            <span aria-hidden>/</span>
            <span aria-current="page" style={{ color: mix(85) }}>
              {doc.title}
            </span>
          </span>

          <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link href={pavilionHref} className="fdm-obra-link">
              ← Volver
            </Link>
            <span style={{ display: "block", width: 1, height: 14, background: mix(18) }} />
            <span style={{ color: isAvailable ? "var(--acc)" : mix(45) }}>
              {isAvailable ? "Disponible" : "No disponible"}
            </span>
          </span>
        </nav>

        {/* ── Obra ───────────────────────────────────────────── */}
        <section className="fdm-obra-shell">
          <ArtworkViewer
            images={images}
            title={doc.title}
            badge={
              availableCopy && Number(availableCopy.total) > 1
                ? `Copia ${availableCopy.number}/${availableCopy.total}`
                : "Pieza única"
            }
          />

          {/* Ficha */}
          <motion.div className="fdm-obra-info" {...rise}>
            <span style={{ ...EYEBROW, fontSize: 10.5, color: "var(--acc)" }}>
              {[doc.techniqueInfo?.name, doc.pavilionInfo?.name].filter(Boolean).join(" · ") ||
                "Obra original"}
            </span>

            <h1
              style={{
                margin: "8px 0 0",
                fontWeight: 400,
                fontSize: "clamp(30px,3.6vw,50px)",
                lineHeight: 1.05,
                letterSpacing: "0.015em",
                textTransform: "uppercase",
              }}
            >
              {doc.title}
            </h1>

            <span
              style={{
                marginTop: 8,
                fontWeight: 400,
                fontSize: "clamp(15px,1.2vw,18px)",
                letterSpacing: "0.02em",
                color: mix(72),
              }}
            >
              {artistFullName}
            </span>

            {/* Precio */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 12,
                marginTop: 16,
                padding: "12px 0",
                borderTop: `1px solid ${mix(20)}`,
                borderBottom: `1px solid ${mix(12)}`,
              }}
            >
              <span
                style={{
                  fontWeight: 500,
                  fontSize: "clamp(26px,2.6vw,36px)",
                  lineHeight: 1,
                  letterSpacing: "0.01em",
                }}
              >
                {formatCOP(doc.price, { currency })}
              </span>
              <span style={{ ...EYEBROW, fontSize: 10, color: mix(50) }}>IVA incluido</span>
              <span style={{ flex: 1 }} />
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  ...EYEBROW,
                  fontSize: 10,
                  color: isAvailable ? "var(--acc)" : mix(50),
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: isAvailable ? "var(--acc)" : mix(35),
                  }}
                />
                {isAvailable ? "Disponible" : "Agotada"}
              </span>
            </div>

            {/* Acciones */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                padding: "12px 0",
                borderBottom: `1px solid ${mix(12)}`,
              }}
            >
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!isAvailable}
                style={{
                  flex: "0 0 auto",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  height: 48,
                  padding: "0 28px",
                  borderRadius: 999,
                  cursor: isAvailable ? "pointer" : "not-allowed",
                  opacity: isAvailable ? 1 : 0.45,
                  ...EYEBROW,
                  fontSize: 10.5,
                  letterSpacing: "0.12em",
                  transition: "all .3s ease",
                  border: `1px solid ${inCart ? "var(--acc)" : "var(--fg)"}`,
                  background: inCart ? "var(--acc)" : "var(--fg)",
                  color: inCart ? "#0B0B0A" : "var(--bg)",
                }}
              >
                {!isAvailable ? "Agotada" : inCart ? "En el carrito ✓" : "Agregar al carrito"}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!isAvailable}
                style={{
                  flex: "0 0 auto",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  height: 48,
                  padding: "0 24px",
                  borderRadius: 999,
                  cursor: isAvailable ? "pointer" : "not-allowed",
                  opacity: isAvailable ? 1 : 0.45,
                  background: "transparent",
                  color: "inherit",
                  border: `1px solid ${mix(26)}`,
                  ...EYEBROW,
                  fontSize: 10.5,
                  letterSpacing: "0.12em",
                  transition: "all .3s ease",
                }}
              >
                Comprar ahora
              </button>

              <a
                href={`mailto:info@feriadelmillon.com?subject=${encodeURIComponent(
                  `Consulta obra ${doc.title}`
                )}`}
                className="fdm-obra-link"
                style={{
                  flex: "0 0 auto",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  height: 48,
                  padding: "0 22px",
                  border: `1px solid ${mix(26)}`,
                  borderRadius: 999,
                  ...EYEBROW,
                  fontSize: 10.5,
                  letterSpacing: "0.12em",
                  color: mix(65),
                }}
              >
                Consultar
              </a>
            </div>

            {/* Ficha técnica */}
            {specs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {specs.map((s) => (
                  <div
                    key={s.k}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 16,
                      padding: "8px 0",
                      borderBottom: `1px solid ${mix(9)}`,
                    }}
                  >
                    <span
                      style={{
                        flex: "0 0 38%",
                        ...EYEBROW,
                        fontSize: 10,
                        letterSpacing: "0.14em",
                        color: mix(50),
                      }}
                    >
                      {s.k}
                    </span>
                    <span style={{ flex: 1, fontSize: 14.5, lineHeight: 1.5 }}>{s.v}</span>
                  </div>
                ))}
              </div>
            )}

            {doc.description && (
              <p
                style={{
                  margin: "14px 0 0",
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: mix(75),
                  textWrap: "pretty",
                  whiteSpace: "pre-line",
                }}
              >
                {doc.description}
              </p>
            )}

            {/* Artista */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: 16,
                paddingTop: 14,
                borderTop: `1px solid ${mix(20)}`,
              }}
            >
              <span
                style={{
                  position: "relative",
                  overflow: "hidden",
                  flex: "0 0 auto",
                  width: 50,
                  height: 50,
                  borderRadius: 999,
                  background: mix(8),
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 500,
                  fontSize: 17,
                }}
              >
                {/* User.image existe pero puede estar vacío: iniciales de respaldo. */}
                {artistPhoto ? (
                  <SmartImage src={artistPhoto} alt={artistFullName} fit="cover" sizes="50px" />
                ) : (
                  artistFullName.charAt(0)
                )}
              </span>
              <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span style={{ fontWeight: 500, fontSize: 16 }}>{artistFullName}</span>
                <span style={{ fontSize: 13, color: mix(60) }}>
                  {doc.pavilionInfo?.name ? `Expone en ${doc.pavilionInfo.name}` : "Artista de la edición"}
                </span>
              </span>
              {doc.artist && (
                <Link
                  href={`/catalogo?artistId=${encodeURIComponent(String(doc.artist))}`}
                  className="fdm-obra-link"
                  style={{ flex: "0 0 auto", ...EYEBROW, fontSize: 10, color: "var(--acc)" }}
                >
                  Ver obras →
                </Link>
              )}
            </div>
          </motion.div>
        </section>

        {/* ── Más obras ──────────────────────────────────────── */}
        {related.length > 0 && (
          <section style={{ padding: "0 0 clamp(28px,3vw,44px)" }}>
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
                Más obras
              </span>
              <Link
                href={pavilionHref}
                className="fdm-obra-link"
                style={{ ...EYEBROW, fontSize: 10, color: "var(--acc)" }}
              >
                Ver catálogo completo →
              </Link>
            </div>

            <div className="fdm-obra-related">
              {related.map((ra: any, i: number) => (
                <motion.div
                  key={String(ra._id)}
                  initial={reduce ? undefined : { opacity: 0, y: 12 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: reduce ? 0 : i * 0.05 }}
                  whileHover={reduce ? undefined : { y: -4 }}
                >
                <Link
                  href={`/obra/${encodeURIComponent(String(ra._id))}`}
                  className="fdm-obra-card"
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <span
                    className="fdm-obra-frame"
                    style={{
                      position: "relative",
                      display: "block",
                      aspectRatio: "4/5",
                      padding: "clamp(12px,1.4vw,20px)",
                      background: mix(4),
                      border: `1px solid ${mix(10)}`,
                      transition: "border-color .4s ease",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        inset: "clamp(12px,1.4vw,20px)",
                        display: "block",
                        filter: `drop-shadow(0 10px 24px ${mix(16)})`,
                      }}
                    >
                      <SmartImage
                        src={
                          pickSrc(ra.image) || pickSrc(ra.images?.[0]) || "/placeholder.png"
                        }
                        alt={ra.title}
                        sizes="(max-width: 640px) 50vw, 220px"
                      />
                    </span>
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.25 }}>
                      {ra.title}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: 15, marginTop: 2 }}>
                      {formatCOP(ra.price, { currency: ra.currency || currency })}
                    </span>
                  </span>
                </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

    </div>
  );
}
