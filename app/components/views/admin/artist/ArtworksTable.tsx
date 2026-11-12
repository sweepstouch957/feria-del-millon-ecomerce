"use client";

import { memo, useCallback } from "react";
import SmartImage from "@components/ui/SmartImage";

import { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { formatCOP } from "@lib/money";
import { Bone, Ico } from "./ui";

/* Las obras del artista, una tarjeta por obra (port de "Mi estudio · Obras").
   Miniatura, título, estado, ficha de cuatro datos y las acciones como botones
   de 44px que se reparten el ancho: en celular quedan de a dos por fila. */

type Props = {
  rows: ArtworkRow[];
  loading: boolean;
  /** No se cargan obras nuevas (carga cerrada). */
  locked?: boolean;
  /** Se pueden corregir las obras ya cargadas. */
  canEdit?: boolean;
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

const money = (n?: number, currency = "COP") => (typeof n === "number" ? formatCOP(n, { currency }) : "—");

function CardSkeleton() {
  return (
    <div className="fdm-st-art" aria-hidden="true">
      <Bone w={120} h={120} style={{ flex: "none", borderRadius: 0 }} />
      <div className="body">
        <Bone w="45%" h={22} />
        <Bone w="30%" h={14} />
        <Bone w="100%" h={44} style={{ borderRadius: 999 }} />
      </div>
    </div>
  );
}

/* Va memoizada y recibe la obra entera: con treinta obras, escribir en el
   buscador volvía a dibujar las treinta en cada tecla. */
const Card = memo(function Card({
  r,
  canEdit,
  onView,
  onEdit,
  onOpenQr,
  onShare,
}: {
  r: ArtworkRow;
  canEdit?: boolean;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onOpenQr: (id: string) => void;
  onShare: (id: string, title: string) => void;
}) {
  const hidden = (r as any)?.hiddenUntilEvent;
  // La feria la devolvió para corregir: se edita aunque el resto esté cerrado.
  const returned = !!(r as any)?.editUnlocked;
  const note: string = (r as any)?.editNote || "";
  const sub = [r.year, (r as any)?.dimensionsText].filter(Boolean).join(" · ") || "Sin año ni medidas";

  return (
    <article className="fdm-st-art">
      <button type="button" className="fdm-st-thumb fdm-studio-plain" onClick={() => onView(r.id)} aria-label={`Ver ${r.title}`}>
        {r.image ? <SmartImage src={r.image} alt="" fit="cover" sizes="120px" /> : "Sin foto"}
      </button>

      <div className="body">
        <div className="head">
          <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            <span className="t">{r.title}</span>
            <span className="s">{sub}</span>
          </div>
          <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {returned && <span className="fdm-st-pill is-bad">La feria te pide corregirla</span>}
            <span className={`fdm-st-pill ${hidden ? "is-warn" : "is-ok"}`}>{hidden ? "Sin publicar" : "En el catálogo"}</span>
          </span>
        </div>

        {returned && note && <p className="fdm-st-note">{note}</p>}

        <dl className="fdm-st-dl">
          <div><dt className="fdm-st-label">Pabellón</dt><dd>{r?.pavilionInfo?.name || "—"}</dd></div>
          <div><dt className="fdm-st-label">Técnica</dt><dd>{r?.techniqueInfo?.name || r.technique || "—"}</dd></div>
          <div><dt className="fdm-st-label">Precio</dt><dd style={{ fontVariantNumeric: "tabular-nums" }}>{money(r.price, r.currency)}</dd></div>
          <div><dt className="fdm-st-label">{(r as any)?.reproducible ? "Copias" : "Cantidad"}</dt><dd>{typeof r.stock === "number" ? r.stock : "—"}</dd></div>
        </dl>

        <div className="fdm-st-acts">
          <button type="button" className="fdm-st-btn is-sm fdm-studio-plain" onClick={() => onView(r.id)}><Ico name="eye" />Ver</button>
          {(canEdit || returned) && (
            <button type="button" className="fdm-st-btn is-sm fdm-studio-plain" onClick={() => onEdit(r.id)}><Ico name="edit" />Editar</button>
          )}
          <button type="button" className="fdm-st-btn is-sm fdm-studio-plain" onClick={() => onOpenQr(r.id)}><Ico name="qr" />QR</button>
          <button type="button" className="fdm-st-btn is-sm fdm-studio-plain" onClick={() => onShare(r.id, r.title)}><Ico name="share" />Compartir</button>
        </div>
      </div>
    </article>
  );
});

export default function ArtworksTable({
  rows,
  loading,
  locked,
  canEdit,
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
  const doShare = useCallback(
    async (id: string, title: string) => {
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
    },
    [onShare]
  );

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!rows.length) {
    return filtering ? (
      <div className="fdm-st-empty">
        <b>Nada con esos filtros</b>
        Prueba con otro título, otra técnica u otro pabellón.
      </div>
    ) : !locked && onCreate ? (
      <button type="button" className="fdm-st-add fdm-studio-plain" style={{ minHeight: 140, flexDirection: "column" }} onClick={onCreate}>
        <Ico name="plus" size={24} />
        <span style={{ fontSize: 18, fontWeight: 500 }}>Cargar mi primera obra</span>
        <span style={{ fontSize: 14, color: "var(--fg2)" }}>Foto, título, técnica, medidas y precio. Toma dos minutos.</span>
      </button>
    ) : (
      <div className="fdm-st-empty">
        <b>Todavía no hay obras</b>
        La carga de obras está cerrada.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {rows.map((r) => (
        <Card key={r.id} r={r} canEdit={canEdit} onView={onView} onEdit={onEdit} onOpenQr={onOpenQr} onShare={doShare} />
      ))}

      {hasMore && (
        <button type="button" className="fdm-st-btn fdm-studio-plain" style={{ alignSelf: "center" }} disabled={loadingMore} onClick={onLoadMore}>
          {loadingMore ? "Cargando…" : "Ver más obras"}
        </button>
      )}

      {!locked && onCreate && !filtering && (
        <button type="button" className="fdm-st-add fdm-studio-plain" onClick={onCreate}>
          <Ico name="plus" />
          Agregar otra obra
        </button>
      )}
    </div>
  );
}
