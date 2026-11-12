"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

import type { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { ARTIST_DOWNLOADS_ENABLED, NO_PRINT_CSS, canDownload } from "./lock";
import { Bone, Ico } from "./ui";

/* Códigos QR para el stand (port de "Mi estudio — Códigos QR").
   Una grilla de tarjetas: primero el QR de artista (muestra todas sus obras) y
   después uno por obra. Cada tarjeta se descarga (PNG de 1024px) o se imprime
   sola; el botón de arriba imprime todas. Los QR se generan aquí hacia el
   dominio actual (el guardado en la obra puede tener el dominio viejo). */

function useQrPng(url: string) {
  const [png, setPng] = useState("");
  useEffect(() => {
    setPng("");
    if (!url) return;
    QRCode.toDataURL(url, { width: 1024, margin: 2 }).then(setPng).catch(() => setPng(""));
  }, [url]);
  return png;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "obra";

const PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    .fdm-qr-print, .fdm-qr-print * { visibility: visible !important; }
    .fdm-qr-print { position: absolute; left: 0; top: 0; width: 100%; }
    .fdm-qr-noprint { display: none !important; }
    .fdm-st-qrgrid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 12px !important; }
    .fdm-st-qr { break-inside: avoid; border-color: #ccc !important; }
    .fdm-qr-print[data-solo] .fdm-st-qr:not(.is-solo) { display: none !important; }
    .fdm-qr-print[data-solo] .fdm-st-qrgrid { grid-template-columns: 1fr !important; }
    .fdm-qr-print[data-solo] .fdm-st-qr .code { width: 320px; height: 320px; }
  }
`;

function QrCard({
  id,
  title,
  sub,
  url,
  file,
  solo,
  onPrint,
}: {
  id: string;
  title: string;
  sub: string;
  url: string;
  file: string;
  solo: boolean;
  onPrint: (id: string) => void;
}) {
  const png = useQrPng(url);
  return (
    <div className={`fdm-st-qr${solo ? " is-solo" : ""}`}>
      <span className="code">
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={png} alt={`Código QR: ${title}`} />
        ) : (
          <Bone w="70%" h="70%" />
        )}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span className="t">{title}</span>
        <span className="s">{sub}</span>
      </span>
      <div className="acts fdm-qr-noprint">
        <a
          className="fdm-st-btn is-sm"
          href={png || undefined}
          download={file}
          aria-disabled={!png || undefined}
          onClick={(e) => {
            if (!png || !canDownload()) e.preventDefault();
          }}
        >
          <Ico name="download" />
          Descargar
        </a>
        <button type="button" className="fdm-st-btn is-sm fdm-studio-plain" disabled={!png} onClick={() => onPrint(id)}>
          <Ico name="print" />
          Imprimir
        </button>
      </div>
      <a className="fdm-st-link is-mute fdm-qr-noprint" href={url || undefined} target="_blank" rel="noopener noreferrer" style={{ height: 32 }}>
        Probar a dónde lleva
      </a>
    </div>
  );
}

export default function QrHub({
  artistId,
  artistName,
  rows,
  loading,
  hasMore,
  onLoadMore,
  filtering,
  onClearFilters,
  onBack,
}: {
  artistId: string;
  artistName?: string;
  rows: ArtworkRow[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  filtering?: boolean;
  onClearFilters?: () => void;
  onBack?: () => void;
}) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const [solo, setSolo] = useState<string | null>(null);

  const print = (id: string | null) => {
    if (!canDownload()) return;
    setSolo(id);
    // Espera a que React pinte la selección antes de abrir la impresión.
    window.setTimeout(() => {
      window.print();
      setSolo(null);
    }, 80);
  };

  return (
    <div className="fdm-qr-print" data-solo={solo ? "" : undefined} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{ARTIST_DOWNLOADS_ENABLED ? PRINT_CSS : NO_PRINT_CSS}</style>

      <div className="fdm-qr-noprint" style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "12px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {onBack && (
            <button type="button" className="fdm-st-back fdm-studio-plain" onClick={onBack}>
              <Ico name="back" />
              Volver a mis obras
            </button>
          )}
          <h1 className="fdm-st-h1">Códigos QR para el stand</h1>
          <p className="fdm-st-lead" style={{ marginTop: 6, maxWidth: 560 }}>
            Imprímelos y ponlos junto a tus obras: quien los escanee llega directo a tu página o a la obra para comprarla. El de artista va en la pared del stand; el de cada obra, al lado de su etiqueta.
          </p>
        </div>
        <button type="button" className="fdm-st-btn is-solid fdm-studio-plain" style={{ flex: "0 1 280px" }} onClick={() => print(null)}>
          <Ico name="print" />
          Imprimir todos
        </button>
      </div>

      {filtering && (
        <p className="fdm-st-note fdm-qr-noprint">
          Estás viendo solo algunas obras por los filtros de «Tus obras».{" "}
          <button type="button" className="fdm-st-link fdm-studio-plain" style={{ height: "auto", display: "inline" }} onClick={onClearFilters}>
            Ver todas
          </button>
        </p>
      )}

      <div className="fdm-st-qrgrid">
        <QrCard
          id="artista"
          title="QR de artista"
          sub={artistName ? `Muestra todas las obras de ${artistName}` : "Muestra todas tus obras"}
          url={origin ? `${origin}/artista/${artistId}` : ""}
          file="qr-artista.png"
          solo={solo === "artista"}
          onPrint={print}
        />
        {loading && !rows.length
          ? [0, 1].map((i) => <Bone key={i} h={300} style={{ borderRadius: 16 }} />)
          : rows.map((r) => {
              const id = String((r as any).id ?? (r as any)._id);
              const title = (r as any).title || "Obra sin título";
              return (
                <QrCard
                  key={id}
                  id={id}
                  title={title}
                  sub="QR de esta obra"
                  url={origin ? `${origin}/obra/${id}` : ""}
                  file={`qr-obra-${slug(title)}.png`}
                  solo={solo === id}
                  onPrint={print}
                />
              );
            })}
      </div>

      {!loading && !rows.length && (
        <div className="fdm-st-empty fdm-qr-noprint">Todavía no tienes obras cargadas. Cuando las cargues, sus QR aparecen aquí.</div>
      )}

      {hasMore && (
        <button type="button" className="fdm-st-btn fdm-studio-plain fdm-qr-noprint" style={{ alignSelf: "center" }} onClick={onLoadMore}>
          Ver más obras
        </button>
      )}
    </div>
  );
}
