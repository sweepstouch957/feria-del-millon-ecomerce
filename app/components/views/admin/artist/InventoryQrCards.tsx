"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, ExternalLink } from "lucide-react";

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
    // Margen 2 y 1024 px: tamaño cómodo para imprimir en el stand.
    QRCode.toDataURL(url, { width: 1024, margin: 2 }).then(setPng).catch(() => setPng(""));
  }, [url]);

  return (
    <div className="flex-1 min-w-[240px] rounded-2xl border border-gray-200 p-4">
      <p className="font-semibold text-sm">{card.title}</p>
      <p className="mt-0.5 text-xs text-gray-500">{card.hint}</p>

      <div className="mt-3 aspect-square w-full bg-gray-50 rounded-xl ring-1 ring-gray-200 grid place-items-center">
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={png} alt={card.title} className="w-full h-full object-contain p-3" />
        ) : (
          <span className="text-xs text-gray-400">Generando…</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={png || "#"}
          download={card.file}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
            png ? "border-gray-300 hover:bg-gray-50" : "border-gray-200 text-gray-400 pointer-events-none"
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          Descargar
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir
        </a>
      </div>
    </div>
  );
}

export default function InventoryQrCards({ artistId }: { artistId: string }) {
  if (!artistId) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {CARDS(artistId).map((c) => (
        <QrCard key={c.key} card={c} />
      ))}
    </div>
  );
}
