"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Download, ExternalLink, Printer } from "lucide-react";

import type { ArtworkRow } from "@hooks/queries/useArtworksCursor";
import { BODY, EYEBROW, HEADING, btnGhost, btnSolid, hair, mix } from "./studioTheme";

/* Todos los QR del artista en un solo lugar.
   Preguntaban una y otra vez cuál QR va dónde: acá se dice con palabras
   simples que hay DOS tipos (uno de artista, uno por obra) y dónde se pone
   cada uno. Los QR se generan aquí hacia el dominio actual (el guardado en la
   obra puede tener el dominio viejo). PNG de 1024 px para imprimir. */

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
    .fdm-qr-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 12px !important; }
    .fdm-qr-card { break-inside: avoid; }
  }
`;

function QrImage({ png, alt }: { png: string; alt: string }) {
  return (
    <div style={{ display: "grid", placeItems: "center", width: "100%", aspectRatio: "1", background: "#FFFFFF", border: hair(12) }}>
      {png ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={png} alt={alt} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 10 }} />
      ) : (
        <div className="fdm-skel" style={{ width: "70%", aspectRatio: "1" }} />
      )}
    </div>
  );
}

function Actions({ png, file, url }: { png: string; file: string; url: string }) {
  return (
    <div className="fdm-qr-noprint" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <a
        href={png || undefined}
        download={file}
        style={{ ...btnSolid, height: 34, padding: "0 14px", flex: "1 1 auto", opacity: png ? 1 : 0.45, pointerEvents: png ? "auto" : "none" }}
      >
        <Download size={13} strokeWidth={1.8} />
        Descargar
      </a>
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, height: 34, padding: "0 14px" }} title="Probar a dónde lleva">
        <ExternalLink size={13} strokeWidth={1.6} />
        Probar
      </a>
    </div>
  );
}

function ArtworkQrCard({ row, origin }: { row: ArtworkRow; origin: string }) {
  const id = String((row as any).id ?? (row as any)._id);
  const title = (row as any).title || "Obra sin título";
  const image = (row as any).image as string | undefined;
  const url = origin ? `${origin}/obra/${id}` : "";
  const png = useQrPng(url);

  return (
    <div className="fdm-qr-card" style={{ border: hair(14), padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <div className="fdm-qr-noprint" style={{ width: 44, height: 44, flexShrink: 0, position: "relative", background: mix(7), overflow: "hidden" }}>
          {image && <Image src={image} alt="" fill sizes="44px" style={{ objectFit: "cover" }} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <span style={{ ...EYEBROW, fontSize: 8.5, color: "var(--acc)", display: "block" }}>QR de obra</span>
          <p style={{ margin: "2px 0 0", fontSize: 14.5, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
        </div>
      </div>
      <QrImage png={png} alt={`QR de la obra ${title}`} />
      <Actions png={png} file={`qr-obra-${slug(title)}.png`} url={url} />
    </div>
  );
}

function Explainer({ n, title, where, goes }: { n: string; title: string; where: string; goes: string }) {
  return (
    <div style={{ flex: "1 1 260px", padding: "16px 18px", border: hair(16), background: mix(3), display: "flex", gap: 14 }}>
      <span style={{ fontWeight: 300, fontSize: 34, lineHeight: 1, color: "var(--acc)" }}>{n}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>{title}</p>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: mix(74) }}>
          <strong style={{ fontWeight: 500, color: "var(--fg)" }}>Dónde va:</strong> {where}
        </p>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: mix(74) }}>
          <strong style={{ fontWeight: 500, color: "var(--fg)" }}>Qué abre:</strong> {goes}
        </p>
      </div>
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
}: {
  artistId: string;
  artistName?: string;
  rows: ArtworkRow[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  filtering?: boolean;
  onClearFilters?: () => void;
}) {
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  const artistUrl = origin ? `${origin}/artista/${artistId}` : "";
  const artistPng = useQrPng(artistUrl);

  return (
    <div className="fdm-qr-print" style={{ display: "flex", flexDirection: "column", gap: "clamp(26px,3vw,40px)" }}>
      <style>{PRINT_CSS}</style>

      {/* ── Los dos tipos, en palabras simples ─────────────────────────── */}
      <div className="fdm-qr-noprint" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 style={HEADING}>Tus códigos QR</h2>
        <p style={{ ...BODY, maxWidth: "60ch" }}>
          Hay <strong style={{ color: "var(--fg)", fontWeight: 500 }}>dos tipos</strong> de QR. Descárgalos o
          imprímelos todos de una vez con el botón de abajo.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Explainer
            n="1"
            title="QR de artista: muestra TODAS tus obras (uno solo)"
            where="en la pared o la entrada de tu stand, bien visible."
            goes="tu página con todas tus obras disponibles."
          />
          <Explainer
            n="2"
            title="QR de obra (uno por cada obra)"
            where="pegado al lado de cada obra, en su etiqueta."
            goes="esa obra, lista para comprarla ahí mismo."
          />
        </div>
        <div>
          <button type="button" className="fdm-studio-plain" style={{ ...btnGhost, height: 40 }} onClick={() => window.print()}>
            <Printer size={14} strokeWidth={1.6} />
            Imprimir todos los QR
          </button>
        </div>
      </div>

      {/* ── 1. QR de artista ─────────────────────────────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="fdm-qr-noprint">
          <span style={{ ...EYEBROW, color: "var(--acc)" }}>1 · Para la pared del stand</span>
          <h3 style={{ ...HEADING, marginTop: 6 }}>Tu QR de artista · todas tus obras</h3>
        </div>
        <div className="fdm-qr-card" style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", border: hair(16), padding: 16 }}>
          <div style={{ width: "min(240px,100%)" }}>
            <QrImage png={artistPng} alt="QR de mi página de artista" />
          </div>
          <div style={{ flex: "1 1 220px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <span style={{ ...EYEBROW, fontSize: 8.5, color: "var(--acc)" }}>QR de artista</span>
              <p style={{ margin: "4px 0 0", fontSize: 18 }}>{artistName || "Mi página"}</p>
              <p className="fdm-qr-noprint" style={{ ...BODY, fontSize: 13.5, marginTop: 4 }}>
                Quien lo escanee ve todas tus obras y puede comprar cualquiera.
              </p>
            </div>
            <Actions png={artistPng} file="qr-artista.png" url={artistUrl} />
          </div>
        </div>
      </section>

      {/* ── 2. Un QR por obra ────────────────────────────────────────────── */}
      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="fdm-qr-noprint" style={{ paddingTop: 6, borderTop: hair(14) }}>
          <span style={{ ...EYEBROW, color: "var(--acc)", display: "block", marginTop: 18 }}>2 · Para pegar junto a cada obra</span>
          <h3 style={{ ...HEADING, marginTop: 6 }}>QR de cada obra</h3>
          <p style={{ ...BODY, fontSize: 13.5, marginTop: 4, maxWidth: "60ch" }}>
            Cada QR lleva el nombre de su obra. Fíjate de pegarlo al lado de la obra correcta.
          </p>
          {filtering && (
            <p style={{ ...BODY, fontSize: 13, marginTop: 8 }}>
              Estás viendo solo algunas obras por los filtros del inventario.{" "}
              <button type="button" className="fdm-studio-plain" onClick={onClearFilters} style={{ background: "none", border: 0, padding: 0, color: "var(--acc)", cursor: "pointer", textDecoration: "underline", font: "inherit" }}>
                Ver todas
              </button>
            </p>
          )}
        </div>

        {loading && !rows.length ? (
          <div className="fdm-skel" style={{ height: 220 }} />
        ) : !rows.length ? (
          <p style={BODY}>Todavía no tienes obras cargadas. Cuando las cargues en «Inventario», sus QR aparecen acá.</p>
        ) : (
          <div className="fdm-qr-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
            {rows.map((r) => (
              <ArtworkQrCard key={String((r as any).id ?? (r as any)._id)} row={r} origin={origin} />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="fdm-qr-noprint">
            <button type="button" className="fdm-studio-plain" style={{ ...btnGhost, height: 38 }} onClick={onLoadMore}>
              Ver más obras
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
