"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, ExternalLink } from "lucide-react";

import { EYEBROW, btnGhost, btnSolid, mix } from "./studioTheme";

/* Los dos QR que le quedan al artista cuando entrega su inventario:
   · su página de artista (quién es, su pabellón y su obra)
   · el catálogo de la feria filtrado por él
   Se imprimen para el stand, así que el PNG va grande (1024 px). */

type Card = { key: string; title: string; hint: string; path: string; file: string };

const CARDS = (artistId: string): Card[] => [
  {
    key: "gallery",
    title: "Mi página de artista",
    hint: "Quién soy, mi pabellón y mi obra, con botón de compra.",
    path: `/artista/${artistId}`,
    file: "qr-mi-pagina.png",
  },
  {
    key: "catalog",
    title: "Mi obra en el catálogo",
    hint: "El catálogo de la feria mostrando solo mis obras.",
    path: `/catalogo?artistId=${artistId}`,
    file: "qr-mi-catalogo.png",
  },
];

function QrCard({ card }: { card: Card }) {
  const [png, setPng] = useState("");
  const url = typeof window === "undefined" ? "" : `${window.location.origin}${card.path}`;

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 1024, margin: 2 }).then(setPng).catch(() => setPng(""));
  }, [url]);

  return (
    <div
      style={{
        flex: "1 1 260px",
        minWidth: "min(100%,240px)",
        border: `1px solid ${mix(14)}`,
        padding: "clamp(16px,1.8vw,22px)",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div>
        <span style={{ ...EYEBROW, fontSize: 9, color: mix(44), display: "block", marginBottom: 6 }}>
          {card.key === "gallery" ? "Página propia" : "Catálogo filtrado"}
        </span>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.25 }}>{card.title}</p>
        <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.55, color: mix(62) }}>{card.hint}</p>
      </div>

      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: "100%",
          aspectRatio: "1",
          background: "#FFFFFF",
          border: `1px solid ${mix(12)}`,
        }}
      >
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={png}
            alt={`Código QR: ${card.title}`}
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 14 }}
          />
        ) : (
          <div className="fdm-skel" style={{ width: "70%", aspectRatio: "1" }} />
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: "auto" }}>
        <a
          href={png || undefined}
          download={card.file}
          style={{
            ...btnSolid,
            height: 36,
            padding: "0 18px",
            opacity: png ? 1 : 0.45,
            pointerEvents: png ? "auto" : "none",
          }}
        >
          <Download size={13} strokeWidth={1.8} />
          Descargar
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btnGhost, height: 36, padding: "0 18px" }}
        >
          <ExternalLink size={13} strokeWidth={1.6} />
          Abrir
        </a>
      </div>
    </div>
  );
}

export default function InventoryQrCards({ artistId }: { artistId: string }) {
  if (!artistId) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(14px,1.8vw,20px)" }}>
      {CARDS(artistId).map((c) => (
        <QrCard key={c.key} card={c} />
      ))}
    </div>
  );
}
