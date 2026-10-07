"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Share2, QrCode, Pencil, Plus, Minus, RefreshCw, X, Expand } from "lucide-react";
import type { ArtworkDetailResponse } from "@services/artworks.service";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { formatCOP } from "@lib/money";

import StudioSheet from "./StudioSheet";
import { EYEBROW, btnGhost, btnSolid, hair, mix } from "./studioTheme";

/* La ficha de una obra, como la ve su autor.
   La imagen ocupa media hoja y se amplía: es lo que el artista quiere revisar
   antes de entregar —si la foto está torcida o recortada, se ve acá. */

const money = (n?: number, currency = "COP") =>
  typeof n === "number" ? formatCOP(n, { currency }) : "—";

export default function ArtworkDetailModal({
  id,
  data,
  open,
  loading,
  locked,
  onClose,
  onEdit,
  onOpenQr,
}: {
  id: string | null;
  data?: ArtworkDetailResponse;
  open: boolean;
  loading: boolean;
  locked?: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onOpenQr?: (id: string) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const share = async () => {
    if (!id) return;
    const url = `${window.location.origin}/obra/${encodeURIComponent(id)}`;
    try {
      if (navigator.share) await navigator.share({ title: data?.doc.title || "Obra", url });
      else await navigator.clipboard.writeText(url);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        /* sin portapapeles */
      }
    }
  };

  const openQr = () => {
    if (!id) return;
    if (onOpenQr) onOpenQr(id);
    else {
      const target =
        (data as any)?.doc?.meta?.qrPublic?.target ||
        (data as any)?.doc?.meta?.qrPublic?.imageUrl;
      if (target) window.open(String(target), "_blank");
    }
  };

  const doc = data?.doc;
  const hidden = (doc as any)?.hiddenUntilEvent;

  const facts: Array<[string, React.ReactNode]> = doc
    ? [
        ["Técnica", doc.techniqueInfo?.name || doc.technique || "—"],
        ["Dimensiones", (doc as any)?.dimensionsText || "—"],
        ["Año", doc.year || "—"],
        ["Precio", <span style={{ fontVariantNumeric: "tabular-nums" }}>{money(doc.price, doc.currency)}</span>],
        [(doc as any)?.reproducible ? "Copias" : "Cantidad", typeof doc.stock === "number" ? doc.stock : "—"],
        ["Pabellón", doc.pavilionInfo?.name || "—"],
        ["Tag del sistema", (doc as any)?.tagId || "Se asigna con el QR"],
      ]
    : [];

  return (
    <>
      <StudioSheet
        open={open}
        onClose={onClose}
        eyebrow={hidden ? "Sin publicar" : "En el catálogo"}
        title={doc?.title || "Obra"}
        maxWidth={920}
        footer={
          <>
            {!locked && id && onEdit && (
              <button type="button" style={btnSolid} onClick={() => onEdit(id)}>
                <Pencil size={14} strokeWidth={1.8} />
                Editar
              </button>
            )}
            <button type="button" style={btnGhost} onClick={openQr}>
              <QrCode size={14} strokeWidth={1.6} />
              Ver QR
            </button>
            <button type="button" style={btnGhost} onClick={share}>
              <Share2 size={14} strokeWidth={1.6} />
              Compartir
            </button>
          </>
        }
      >
        {loading ? (
          <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))" }}>
            <div className="fdm-skel" style={{ width: "100%", aspectRatio: "4/5" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="fdm-skel" style={{ width: "60%", height: 16 }} />
              <div className="fdm-skel" style={{ width: "90%", height: 12 }} />
              <div className="fdm-skel" style={{ width: "80%", height: 12 }} />
              <div className="fdm-skel" style={{ width: "40%", height: 12 }} />
            </div>
          </div>
        ) : !doc ? (
          <p style={{ margin: 0, fontSize: 14.5, color: mix(70) }}>No encontramos esta obra.</p>
        ) : (
          <div style={{ display: "grid", gap: "clamp(22px,3vw,36px)", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,270px),1fr))" }}>
            {/* Imagen */}
            <button
              type="button"
              className="fdm-studio-plain"
              onClick={() => doc.image && setPreviewOpen(true)}
              title={doc.image ? "Ver la imagen en grande" : undefined}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 5",
                background: mix(6),
                border: `1px solid ${mix(12)}`,
                padding: 0,
                cursor: doc.image ? "zoom-in" : "default",
                overflow: "hidden",
              }}
            >
              {doc.image ? (
                <>
                  <Image
                    src={doc.image}
                    alt={doc.title}
                    fill
                    sizes="(max-width: 768px) 92vw, 420px"
                    quality={90}
                    style={{ objectFit: "contain" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      bottom: 10,
                      right: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      background: "color-mix(in srgb, var(--bg) 88%, transparent)",
                      border: `1px solid ${mix(16)}`,
                      ...EYEBROW,
                      fontSize: 8.5,
                      color: mix(66),
                    }}
                  >
                    <Expand size={11} strokeWidth={1.6} />
                    Ampliar
                  </span>
                </>
              ) : (
                <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", ...EYEBROW, fontSize: 9.5, color: mix(40) }}>
                  Sin imagen
                </span>
              )}
            </button>

            {/* Datos */}
            <div style={{ minWidth: 0 }}>
              {doc.description && (
                <p style={{ margin: "0 0 22px", fontSize: 14.5, lineHeight: 1.7, color: mix(76), whiteSpace: "pre-line" }}>
                  {doc.description}
                </p>
              )}

              <dl style={{ margin: 0, display: "grid", gap: 0, borderTop: hair(14) }}>
                {facts.map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      display: "flex",
                      gap: 16,
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      padding: "11px 0",
                      borderBottom: hair(10),
                    }}
                  >
                    <dt style={{ ...EYEBROW, fontSize: 9, color: mix(46) }}>{k}</dt>
                    <dd style={{ margin: 0, fontSize: 14, color: mix(84), textAlign: "right", minWidth: 0 }}>{v}</dd>
                  </div>
                ))}
              </dl>

              {hidden && (
                <p style={{ margin: "18px 0 0", fontSize: 13, lineHeight: 1.6, color: mix(60) }}>
                  Esta obra ya está cargada, pero no se ve en el catálogo público hasta que la
                  feria lo publique.
                </p>
              )}
            </div>
          </div>
        )}
      </StudioSheet>

      {previewOpen && doc?.image && (
        <ImagePreviewModal src={doc.image} alt={doc.title} onClose={() => setPreviewOpen(false)} />
      )}
    </>
  );
}

/** Vista grande con zoom y arrastre: fondo negro, los controles mínimos. */
function ImagePreviewModal({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const ctrl: React.CSSProperties = {
    width: 42,
    height: 42,
    display: "grid",
    placeItems: "center",
    background: "transparent",
    border: 0,
    cursor: "pointer",
    color: "#F7F6F2",
  };

  return (
    <div
      className="fdm-fade-anim"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "#0B0B0A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `Imagen de ${alt}` : "Imagen"}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }} onClick={(e) => e.stopPropagation()}>
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          wheel={{ step: 0.12 }}
          doubleClick={{ disabled: false, step: 0.6 }}
          pinch={{ step: 0.2 }}
          onTransformed={(ref: any) => {
            setScale(ref?.state?.scale ?? ref?.instance?.transformState?.scale ?? 1);
          }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 20,
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid rgba(247,246,242,.22)",
                  borderRadius: 999,
                  background: "rgba(11,11,10,.6)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <button type="button" style={ctrl} onClick={() => zoomOut()} aria-label="Reducir">
                  <Minus size={16} strokeWidth={1.6} />
                </button>
                <span
                  style={{
                    width: 52,
                    textAlign: "center",
                    color: "#F7F6F2",
                    fontFamily: "Jost, system-ui, sans-serif",
                    fontSize: 11,
                    fontVariantNumeric: "tabular-nums",
                    userSelect: "none",
                  }}
                >
                  {Math.round((scale || 1) * 100)}%
                </span>
                <button type="button" style={ctrl} onClick={() => zoomIn()} aria-label="Ampliar">
                  <Plus size={16} strokeWidth={1.6} />
                </button>
                <button
                  type="button"
                  style={ctrl}
                  onClick={() => {
                    resetTransform();
                    setScale(1);
                  }}
                  aria-label="Volver al tamaño original"
                >
                  <RefreshCw size={15} strokeWidth={1.6} />
                </button>
              </div>

              <div style={{ width: "100%", height: "100%", cursor: "grab" }}>
                <TransformComponent
                  wrapperStyle={{ width: "100%", height: "100%" }}
                  contentStyle={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
                    <Image
                      src={src}
                      alt={alt ?? "Obra"}
                      fill
                      sizes="100vw"
                      quality={95}
                      style={{ objectFit: "contain", userSelect: "none" }}
                      priority
                    />
                  </div>
                </TransformComponent>
              </div>

              <span
                style={{
                  position: "absolute",
                  bottom: 18,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 20,
                  ...EYEBROW,
                  fontSize: 9,
                  color: "rgba(247,246,242,.6)",
                  whiteSpace: "nowrap",
                }}
              >
                Rueda o pinza para el zoom · arrastra para mover
              </span>
            </>
          )}
        </TransformWrapper>

        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          style={{ ...ctrl, position: "absolute", top: 16, right: 16, zIndex: 20, width: 44, height: 44 }}
        >
          <X size={20} strokeWidth={1.6} />
        </button>
      </div>
    </div>
  );
}
