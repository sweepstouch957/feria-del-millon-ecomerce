"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@components/ui/button";
import { Download, ExternalLink, X, QrCode } from "lucide-react";

/** QR del artista → su galería pública (/artista/[id]). El comprador lo escanea en la feria. */
export default function ArtistQrModal({
  artistId,
  open,
  onClose,
}: {
  artistId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [png, setPng] = useState<string>("");
  const target = typeof window !== "undefined" ? `${window.location.origin}/artista/${artistId}` : "";

  useEffect(() => {
    if (open && target) QRCode.toDataURL(target, { width: 1024, margin: 2 }).then(setPng);
  }, [open, target]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] bg-black/50 p-4 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            <h3 className="font-semibold">Mi QR de galería</h3>
          </div>
          <button className="p-1 rounded hover:bg-gray-100" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-600">
            Imprímelo y ponlo en tu stand: quien lo escanee ve todas tus obras disponibles y puede comprarlas.
          </p>
          <div className="w-full aspect-square bg-gray-50 rounded-xl ring-1 ring-gray-200 grid place-items-center">
            {png ? <img src={png} alt="QR de mi galería" className="w-full h-full object-contain p-4" /> : "Generando…"}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild disabled={!png}>
              <a href={png} download="mi-galeria-qr.png">
                <Download className="w-4 h-4 mr-1" />
                Descargar QR
              </a>
            </Button>
            <Button variant="outline" onClick={() => window.open(target, "_blank")}>
              <ExternalLink className="w-4 h-4 mr-1" />
              Ver mi galería
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
