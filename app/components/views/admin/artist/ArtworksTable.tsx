"use client";

import Image from "next/image";
import { Eye, Pencil, Share2, QrCode, ImageOff, Plus } from "lucide-react";

import { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { formatCOP } from "@lib/money";
import { BODY, EYEBROW, btnGhost, btnLink, hair, mix } from "./studioTheme";

/* El índice de obras del artista.
   No es una tabla de base de datos: la imagen manda, el resto son datos de
   ficha. En pantalla angosta cada obra se apila sola; no hay scroll lateral. */

type Props = {
  rows: ArtworkRow[];
  loading: boolean;
  /** Inventario enviado: se mira, no se toca. */
  locked?: boolean;
  /** Hay filtros puestos: cambia el texto del estado vacío. */
  filtering?: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onCreate?: () => void;
  onShare: (msg: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  onOpenQr: (id: string) => void;
};

const money = (n?: number, currency = "COP") =>
  typeof n === "number" ? formatCOP(n, { currency }) : "—";

/** Dato de ficha: etiqueta chica arriba, valor debajo. */
function Cell({ label, value, width }: { label: string; value: React.ReactNode; width: number }) {
  return (
    <div style={{ flex: `0 1 ${width}px`, minWidth: 92 }}>
      <span style={{ ...EYEBROW, fontSize: 9, color: mix(42), display: "block", marginBottom: 3 }}>
        {label}
      </span>
      <span style={{ fontSize: 14, lineHeight: 1.4, color: mix(82) }}>{value}</span>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div style={{ display: "flex", gap: 18, alignItems: "center", padding: "18px 0", borderBottom: hair(10) }}>
      <div className="fdm-skel" style={{ width: 76, height: 76, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
        <div className="fdm-skel" style={{ width: "42%", height: 15 }} />
        <div className="fdm-skel" style={{ width: "26%", height: 11 }} />
      </div>
      <div className="fdm-skel" style={{ width: 90, height: 11 }} />
    </div>
  );
}

export default function ArtworksTable({
  rows,
  loading,
  locked,
  filtering,
  onView,
  onEdit,
  onCreate,
  onShare,
  onLoadMore,
  hasMore,
  loadingMore,
  onOpenQr,
}: Props) {
  const doShare = async (id: string, title: string) => {
    const url = `${window.location.origin}/obra/${encodeURIComponent(id)}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else await navigator.clipboard.writeText(url);
      onShare("Enlace listo para compartir");
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        onShare("Enlace copiado");
      } catch {
        /* sin portapapeles: el enlace igual está en la obra */
      }
    }
  };

  if (loading) {
    return (
      <div>
        {[0, 1, 2, 3].map((i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div
        style={{
          padding: "clamp(26px,3vw,40px)",
          border: `1px dashed ${mix(20)}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 14,
        }}
      >
        <h3 style={{ margin: 0, fontWeight: 400, fontSize: "clamp(17px,1.9vw,21px)", letterSpacing: "0.01em" }}>
          {filtering ? "Nada con esos filtros" : "Todavía no hay obras"}
        </h3>
        <p style={{ ...BODY, maxWidth: "48ch" }}>
          {filtering
            ? "Prueba con otro título, otra técnica u otro pabellón."
            : "Cada obra lleva su imagen, sus dimensiones, su técnica y su precio. Puedes cargarlas de a una y editarlas hasta que envíes el inventario."}
        </p>
        {!filtering && !locked && onCreate && (
          <button type="button" style={btnGhost} onClick={onCreate}>
            <Plus size={15} strokeWidth={1.8} />
            Cargar mi primera obra
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      {rows.map((r) => {
        const hidden = (r as any)?.hiddenUntilEvent;
        return (
          <article
            key={r.id}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "clamp(14px,2vw,26px)",
              padding: "clamp(16px,2vw,22px) 0",
              borderBottom: hair(11),
            }}
          >
            {/* Imagen + nombre: el bloque por el que se reconoce la obra */}
            <button
              type="button"
              className="fdm-studio-plain"
              onClick={() => onView(r.id)}
              style={{
                flex: "1 1 260px",
                minWidth: "min(100%,240px)",
                display: "flex",
                alignItems: "center",
                gap: 16,
                background: "transparent",
                border: 0,
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
                color: "inherit",
              }}
              aria-label={`Ver ${r.title}`}
            >
              <div
                style={{
                  width: "clamp(68px,7vw,84px)",
                  aspectRatio: "1",
                  flexShrink: 0,
                  background: mix(7),
                  border: `1px solid ${mix(12)}`,
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {r.image ? (
                  <Image src={r.image} alt={r.title} fill sizes="84px" style={{ objectFit: "cover" }} />
                ) : (
                  <ImageOff size={17} strokeWidth={1.4} style={{ color: mix(34) }} />
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontWeight: 400,
                    fontSize: "clamp(16px,1.6vw,19px)",
                    lineHeight: 1.25,
                    letterSpacing: "0.005em",
                  }}
                >
                  {r.title}
                </h3>
                <p style={{ margin: "5px 0 0", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                  <span style={{ ...EYEBROW, fontSize: 9, color: mix(46) }}>
                    {[r.year, (r as any)?.dimensionsText].filter(Boolean).join(" · ") || "Sin año"}
                  </span>
                  <span
                    style={{
                      ...EYEBROW,
                      fontSize: 8.5,
                      padding: "2px 8px",
                      border: `1px solid ${hidden ? mix(22) : "var(--acc)"}`,
                      color: hidden ? mix(56) : "var(--acc)",
                    }}
                  >
                    {hidden ? "Sin publicar" : "En el catálogo"}
                  </span>
                </p>
              </div>
            </button>

            <Cell label="Pabellón" value={r?.pavilionInfo?.name || "—"} width={130} />
            <Cell label="Técnica" value={r?.techniqueInfo?.name || r.technique || "—"} width={130} />
            <Cell
              label="Precio"
              value={<span style={{ fontVariantNumeric: "tabular-nums" }}>{money(r.price, r.currency)}</span>}
              width={120}
            />
            <Cell
              label={(r as any)?.reproducible ? "Copias" : "Stock"}
              value={<span style={{ fontVariantNumeric: "tabular-nums" }}>{typeof r.stock === "number" ? r.stock : "—"}</span>}
              width={74}
            />

            {/* Acciones: texto, no cuatro botones compitiendo */}
            <div
              style={{
                flex: "1 1 200px",
                minWidth: "min(100%,180px)",
                display: "flex",
                flexWrap: "wrap",
                gap: "clamp(12px,1.6vw,20px)",
                justifyContent: "flex-start",
              }}
            >
              <button type="button" className="fdm-studio-plain" style={btnLink} onClick={() => onView(r.id)}>
                <Eye size={13} strokeWidth={1.6} />
                Ver
              </button>
              {!locked && (
                <button type="button" className="fdm-studio-plain" style={btnLink} onClick={() => onEdit(r.id)}>
                  <Pencil size={13} strokeWidth={1.6} />
                  Editar
                </button>
              )}
              <button type="button" className="fdm-studio-plain" style={btnLink} onClick={() => onOpenQr(r.id)}>
                <QrCode size={13} strokeWidth={1.6} />
                QR
              </button>
              <button
                type="button"
                className="fdm-studio-plain"
                style={btnLink}
                onClick={() => doShare(r.id, r.title)}
              >
                <Share2 size={13} strokeWidth={1.6} />
                Compartir
              </button>
            </div>
          </article>
        );
      })}

      {hasMore && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "clamp(22px,2.6vw,34px)" }}>
          <button type="button" style={btnGhost} disabled={loadingMore} onClick={onLoadMore}>
            {loadingMore ? "Cargando…" : "Ver más obras"}
          </button>
        </div>
      )}
    </div>
  );
}
