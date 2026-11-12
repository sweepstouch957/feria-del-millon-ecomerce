"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";

/* "Comprar en caja": QR grande de la obra para que la cajera lo escanee
   (el lector de caja entiende <tienda>/obra/<id>, igual que la etiqueta). */
// compact = barra fija del celular (al lado de "Comprar esta obra").
// className = estilo de la página que lo usa (sin estilos en línea).
export default function CajaQrButton({ id, title, price, compact = false, className }: { id: string; title: string; price: string; compact?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const [png, setPng] = useState("");

  useEffect(() => {
    if (!open || png) return;
    QRCode.toDataURL(`${window.location.origin}/obra/${id}`, { width: 720, margin: 2 }).then(setPng).catch(() => setPng(""));
  }, [open, png, id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        style={className ? undefined : compact
          ? { flex: "none", height: 48, padding: "0 14px", borderRadius: 12, border: "1px solid var(--line2)", background: "var(--card)", color: "var(--fg)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }
          : { width: "100%", height: 52, borderRadius: 14, border: "1px solid var(--line2)", background: "transparent", color: "var(--fg)", fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
      >
        {compact ? "En caja" : "Comprar en caja"}
      </button>

      {/* Portal: la barra fija tiene backdrop-filter, que vuelve "fixed" relativo a ella. */}
      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Código para comprar en caja"
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.6)", display: "grid", placeItems: "center", padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 400, background: "#fff", color: "#0B0B0A", borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, textAlign: "center" }}
          >
            <b style={{ fontSize: 20, lineHeight: 1.2 }}>Comprar en caja</b>
            <span style={{ fontSize: 14.5, lineHeight: 1.5, color: "#444" }}>
              Acércate a la <b>caja de la feria</b> y muéstrale este código a la cajera. Pagas en efectivo, datáfono o transferencia.
            </span>
            {png ? (
              <img src={png} alt={`Código QR de ${title}`} style={{ width: "100%", maxWidth: 300, height: "auto", display: "block" }} />
            ) : (
              <div style={{ width: 300, maxWidth: "100%", aspectRatio: "1", background: "#f2f2f2", borderRadius: 8 }} />
            )}
            <div style={{ fontSize: 15 }}>
              <b>{title}</b>
              <div style={{ color: "#444", marginTop: 2 }}>{price}</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ width: "100%", height: 46, borderRadius: 12, border: 0, background: "#0B0B0A", color: "#fff", fontFamily: "inherit", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Cerrar
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
