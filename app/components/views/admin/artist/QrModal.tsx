"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Download, ExternalLink } from "lucide-react";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";

import StudioSheet from "./StudioSheet";
import { EYEBROW, btnGhost, btnSolid, mix } from "./studioTheme";

/** El QR de una obra: se escanea en el stand y lleva a su ficha de compra. */
export default function QRModal({
  artworkId,
  open,
  onClose,
}: {
  artworkId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const enabled = Boolean(open && artworkId);
  const { data, isFetching } = useArtworkDetail(enabled ? artworkId! : undefined);

  const { savedImg, savedTarget, title } = useMemo(() => {
    const doc: any = data?.doc;
    const qr = doc?.meta?.qrPublic || {};
    return {
      savedImg: qr.imageUrl as string | undefined,
      savedTarget: qr.target as string | undefined,
      title: (doc?.title as string) || "Obra",
    };
  }, [data]);

  // Obras sin QR guardado (falló el servicio al cargarlas): se genera aquí
  // mismo hacia su ficha, igual que las etiquetas del panel.
  const fallbackTarget = artworkId && typeof window !== "undefined" ? `${window.location.origin}/obra/${artworkId}` : "";
  const [fallbackImg, setFallbackImg] = useState("");
  useEffect(() => {
    setFallbackImg("");
    if (!open || savedImg || !fallbackTarget || !data) return;
    QRCode.toDataURL(fallbackTarget, { width: 1024, margin: 2 }).then(setFallbackImg).catch(() => setFallbackImg(""));
  }, [open, savedImg, fallbackTarget, data]);

  const qrImg = savedImg || fallbackImg || undefined;
  const qrTarget = savedImg ? savedTarget : fallbackTarget || undefined;

  const downloadQr = async () => {
    if (!qrImg) return;
    const resp = await fetch(qrImg);
    const blob = await resp.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-qr.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <StudioSheet
      open={open}
      onClose={onClose}
      eyebrow="Para imprimir"
      title={title}
      description="Pégalo junto a la obra: quien lo escanee ve la ficha y puede comprarla ahí mismo."
      maxWidth={460}
      footer={
        qrImg ? (
          <>
            <button type="button" style={btnSolid} onClick={downloadQr}>
              <Download size={14} strokeWidth={1.8} />
              Descargar
            </button>
            {qrTarget && (
              <button type="button" style={btnGhost} onClick={() => window.open(qrTarget, "_blank")}>
                <ExternalLink size={13} strokeWidth={1.6} />
                Abrir destino
              </button>
            )}
          </>
        ) : undefined
      }
    >
      {isFetching ? (
        <div className="fdm-skel" style={{ width: "100%", aspectRatio: "1" }} />
      ) : qrImg ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "1",
            background: "#FFFFFF",
            border: `1px solid ${mix(14)}`,
          }}
        >
          <Image src={qrImg} alt={`Código QR de ${title}`} fill unoptimized={qrImg.startsWith("data:")} style={{ objectFit: "contain", padding: 18 }} />
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: mix(70) }}>
          Esta obra todavía no tiene QR.{" "}
          <span style={{ ...EYEBROW, fontSize: 9.5, color: mix(50) }}>
            Se genera al cargarla; si falta, avísale a la feria.
          </span>
        </p>
      )}
    </StudioSheet>
  );
}
