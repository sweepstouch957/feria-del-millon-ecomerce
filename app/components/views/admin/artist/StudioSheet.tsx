"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import {
  EYEBROW,
  HEADING,
  STUDIO_CSS,
  hair,
  mix,
  sheetOverlay,
  sheetPanel,
} from "./studioTheme";

/* La hoja de papel de los modales del estudio.
   Está acá y no repetida en cada modal porque las cosas que se olvidan son
   siempre las mismas: cerrar con Escape, no dejar que el fondo siga haciendo
   scroll, y que el botón de cerrar se pueda tocar con el dedo. */

export default function StudioSheet({
  open,
  onClose,
  eyebrow,
  title,
  description,
  maxWidth = 620,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  description?: string;
  maxWidth?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    // El foco entra a la hoja: si no, el teclado sigue en la página de atrás.
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fdm-studio-sheet fdm-fade-anim" style={sheetOverlay} onClick={onClose}>
      <style>{STUDIO_CSS}</style>
      <div
        ref={panel}
        tabIndex={-1}
        className="fdm-sheet-anim"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        style={{ ...sheetPanel, maxWidth, outline: "none" }}
      >
        {/* Cabecera */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            padding: "clamp(18px,2.2vw,26px) clamp(18px,2.4vw,30px) 16px",
            borderBottom: hair(14),
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {eyebrow && (
              <span style={{ ...EYEBROW, fontSize: 9.5, color: "var(--acc)", display: "block", marginBottom: 7 }}>
                {eyebrow}
              </span>
            )}
            <h2 style={HEADING}>{title}</h2>
            {description && (
              <p style={{ margin: "9px 0 0", fontSize: 13.5, lineHeight: 1.6, color: mix(64), maxWidth: "62ch" }}>
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="fdm-studio-plain"
            style={{
              width: 44,
              height: 44,
              marginTop: -10,
              marginRight: -12,
              display: "grid",
              placeItems: "center",
              background: "transparent",
              border: 0,
              borderRadius: 999,
              cursor: "pointer",
              color: mix(60),
              flexShrink: 0,
            }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: "clamp(18px,2.4vw,28px) clamp(18px,2.4vw,30px)", overflowY: "auto" }}>
          {children}
        </div>

        {footer && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              padding: "16px clamp(18px,2.4vw,30px)",
              borderTop: hair(14),
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
