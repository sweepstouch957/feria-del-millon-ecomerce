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

  const title = useMemo(() => ((data?.doc as any)?.title as string) || "Obra", [data]);

  // Siempre se genera aquí hacia la ficha en el dominio actual, igual que las
  // etiquetas del panel: el QR guardado en la obra puede tener el dominio viejo.
  const qrTarget = artworkId && typeof window !== "undefined" ? `${window.location.origin}/obra/${artworkId}` : "";
  const [png, setPng] = useState("");
  useEffect(() => {
    setPng("");
    if (!open || !qrTarget) return;
    QRCode.toDataURL(qrTarget, { width: 1024, margin: 2 }).then(setPng).catch(() => setPng(""));
  }, [open, qrTarget]);

  const qrImg = png || undefined;

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
