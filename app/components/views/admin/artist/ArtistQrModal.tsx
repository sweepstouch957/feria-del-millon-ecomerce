"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, ExternalLink } from "lucide-react";

import StudioSheet from "./StudioSheet";
import { btnGhost, btnSolid, mix } from "./studioTheme";

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
    // 1024 px: tamaño cómodo para imprimir en el stand.
    if (open && target) QRCode.toDataURL(target, { width: 1024, margin: 2 }).then(setPng).catch(() => setPng(""));
  }, [open, target]);

  return (
    <StudioSheet
      open={open}
      onClose={onClose}
      eyebrow="Para imprimir"
      title="Mi QR de galería"
      description="Ponlo en tu stand: quien lo escanee ve todas tus obras disponibles y puede comprarlas."
      maxWidth={460}
      footer={
        <>
          <a
            href={png || undefined}
            download="mi-galeria-qr.png"
            style={{ ...btnSolid, opacity: png ? 1 : 0.45, pointerEvents: png ? "auto" : "none" }}
          >
            <Download size={14} strokeWidth={1.8} />
            Descargar
          </a>
          <button type="button" style={btnGhost} onClick={() => window.open(target, "_blank")}>
            <ExternalLink size={13} strokeWidth={1.6} />
            Ver mi galería
          </button>
        </>
      }
    >
      <div
        style={{
          display: "grid",
          placeItems: "center",
          width: "100%",
          aspectRatio: "1",
          background: "#FFFFFF",
          border: `1px solid ${mix(14)}`,
        }}
      >
        {png ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={png}
            alt="Código QR de mi galería"
            style={{ width: "100%", height: "100%", objectFit: "contain", padding: 18 }}
          />
        ) : (
          <div className="fdm-skel" style={{ width: "72%", aspectRatio: "1" }} />
        )}
      </div>
    </StudioSheet>
  );
}
