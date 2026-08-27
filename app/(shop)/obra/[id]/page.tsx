"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useCart from "@store/useCart";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";
import { mergeImages, pickSrc } from "@lib/utils";
import { formatCOP } from "@lib/money";

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

  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const next = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length]);
  const prev = useCallback(
    () => setActive((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, next, prev]);

  if (isLoading) {
    return (
      <Shell>
        <span style={{ ...EYEBROW, color: mix(50) }}>Cargando obra…</span>
      </Shell>
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

  const currency = doc.currency || "COP";
  const stock = Number(doc.stock ?? (copies.length ? 1 : 0));
  const availableCopy = copies.find((c: any) => c.status === "available");
  const isAvailable = stock > 0 && !!availableCopy;

  const artistFullName =
    [doc.artistInfo?.firstName, doc.artistInfo?.lastName].filter(Boolean).join(" ") ||
    "Artista";

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
          {/* Galería */}
          <div className="fdm-obra-media">
            <div
              style={{
                position: "relative",
                aspectRatio: "1/1",
                padding: "clamp(20px,3vw,52px)",
                background: mix(4),
                border: `1px solid ${mix(12)}`,
              }}
            >
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Ampliar imagen"
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  padding: 0,
                  border: 0,
                  background: "transparent",
                  cursor: "zoom-in",
                }}
              >
                <span
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    backgroundImage: `url('${images[active]}')`,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    filter: `drop-shadow(0 16px 40px ${mix(20)})`,
                  }}
                />
              </button>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: 0,
                  padding: "7px 13px",
                  background: "var(--panel)",
                  color: "#F5F4EF",
                  ...EYEBROW,
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  whiteSpace: "nowrap",
                }}
              >
                {availableCopy && Number(availableCopy.total) > 1
                  ? `Copia ${availableCopy.number}/${availableCopy.total}`
                  : "Pieza única"}
              </span>
            </div>

            {images.length > 1 && (
              <div className="fdm-obra-thumbs">
                {images.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Ver imagen ${i + 1}`}
                    aria-current={i === active}
                    style={{
                      aspectRatio: "1",
                      padding: 7,
                      cursor: "pointer",
                      background: mix(4),
                      transition: "border-color .3s ease",
                      border: `1px solid ${i === active ? "var(--acc)" : mix(12)}`,
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url('${src}')`,
                        backgroundSize: "contain",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ficha */}
          <div className="fdm-obra-info">
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
                {artistFullName.charAt(0)}
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
          </div>
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
              {related.map((ra: any) => (
                <Link
                  key={String(ra._id)}
                  href={`/obra/${encodeURIComponent(String(ra._id))}`}
                  className="fdm-obra-card"
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <span
                    className="fdm-obra-frame"
                    style={{
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
                        display: "block",
                        width: "100%",
                        height: "100%",
                        backgroundImage: `url('${
                          pickSrc(ra.image) || pickSrc(ra.images?.[0]) || "/placeholder.png"
                        }')`,
                        backgroundSize: "contain",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        filter: `drop-shadow(0 10px 24px ${mix(16)})`,
                      }}
                    />
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {ra.techniqueInfo?.name && (
                      <span style={{ ...EYEBROW, fontSize: 10, color: "var(--acc)" }}>
                        {ra.techniqueInfo.name}
                      </span>
                    )}
                    <span style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.25 }}>
                      {ra.title}
                    </span>
                    <span style={{ fontWeight: 500, fontSize: 15, marginTop: 2 }}>
                      {formatCOP(ra.price, { currency: ra.currency || currency })}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Lightbox ─────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${doc.title} ampliada`}
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(11,11,10,0.92)",
            display: "grid",
            placeItems: "center",
            padding: "clamp(16px,4vw,48px)",
          }}
        >
          <img
            src={images[active]}
            alt={`${doc.title} ampliada`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "86vh", maxWidth: "92vw", objectFit: "contain" }}
          />
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Cerrar"
            style={{
              position: "absolute",
              top: "clamp(14px,2vw,26px)",
              right: "clamp(14px,2vw,26px)",
              height: 42,
              padding: "0 22px",
              background: "transparent",
              color: "#F5F4EF",
              border: "1px solid rgba(245,244,239,0.34)",
              borderRadius: 999,
              cursor: "pointer",
              ...EYEBROW,
              fontSize: 10.5,
              letterSpacing: "0.14em",
            }}
          >
            Cerrar
          </button>
          {images.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                bottom: "clamp(16px,3vw,34px)",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 8,
              }}
            >
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Imagen ${i + 1}`}
                  style={{
                    width: 9,
                    height: 9,
                    padding: 0,
                    borderRadius: 999,
                    border: 0,
                    cursor: "pointer",
                    background: i === active ? "#F5F4EF" : "rgba(245,244,239,0.4)",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
