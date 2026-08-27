"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import SmartImage from "@components/ui/SmartImage";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

/* Visor de obra: galería con transición suave + lightbox con zoom/pan/pinch.
   Usa lo que ya estaba en el repo (framer-motion, react-zoom-pan-pinch) en vez
   de sumar dependencias nuevas. */

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const CTRL: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 40,
  minWidth: 40,
  padding: "0 14px",
  background: "transparent",
  color: "#F5F4EF",
  border: "1px solid rgba(245,244,239,0.32)",
  borderRadius: 999,
  cursor: "pointer",
  fontFamily: "Jost, system-ui, sans-serif",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

export default function ArtworkViewer({
  images,
  title,
  badge,
}: {
  images: string[];
  title: string;
  badge: string;
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  const next = () => setActive((i) => (i + 1) % images.length);
  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);

  // Flechas navegan la galería siempre; Esc solo cierra el lightbox.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  // Con el lightbox abierto el fondo no debe scrollear.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const fade = reduce ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <>
      <div className="fdm-obra-media">
        <div
          style={{
            position: "relative",
            aspectRatio: "1/1",
            padding: "clamp(20px,3vw,52px)",
            background: mix(4),
            border: `1px solid ${mix(12)}`,
          }}
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ampliar imagen"
            style={{
              position: "absolute",
              inset: "clamp(20px,3vw,52px)",
              padding: 0,
              border: 0,
              background: "transparent",
              cursor: "zoom-in",
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={images[active]}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduce ? 1 : 1.008 }}
                transition={fade}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "block",
                  filter: `drop-shadow(0 16px 40px ${mix(20)})`,
                }}
              >
                <SmartImage
                  src={images[active]}
                  alt={title}
                  priority
                  sizes="(max-width: 1079px) 100vw, 45vw"
                />
              </motion.span>
            </AnimatePresence>
          </button>

          <span
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              padding: "7px 13px",
              background: "var(--panel)",
              color: "#F5F4EF",
              fontWeight: 500,
              fontSize: 10,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {badge}
          </span>
        </div>

        {images.length > 1 && (
          <div className="fdm-obra-thumbs">
            {images.map((src, i) => (
              <motion.button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Ver imagen ${i + 1}`}
                aria-current={i === active}
                whileHover={reduce ? undefined : { y: -2 }}
                whileTap={reduce ? undefined : { scale: 0.97 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  padding: 7,
                  cursor: "pointer",
                  background: mix(4),
                  transition: "border-color .3s ease",
                  border: `1px solid ${i === active ? "var(--acc)" : mix(12)}`,
                }}
              >
                <span style={{ position: "absolute", inset: 7, display: "block" }}>
                  <SmartImage src={src} alt={`${title} — vista ${i + 1}`} sizes="90px" />
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* ── Lightbox con zoom / pan / pinch ──────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} ampliada`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              background: "rgba(11,11,10,0.94)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <TransformWrapper
              key={images[active]}
              initialScale={1}
              minScale={1}
              maxScale={6}
              centerOnInit
              doubleClick={{ mode: "toggle", step: 1.6 }}
              wheel={{ step: 0.12 }}
              pinch={{ step: 6 }}
            >
              {({ zoomIn, zoomOut, resetTransform }) => (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      padding: "clamp(12px,2vw,22px)",
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(245,244,239,0.7)",
                        fontWeight: 500,
                        fontSize: 11,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
                    >
                      {title} · {active + 1}/{images.length}
                    </span>
                    <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => zoomOut()} style={CTRL} aria-label="Alejar">
                        −
                      </button>
                      <button type="button" onClick={() => zoomIn()} style={CTRL} aria-label="Acercar">
                        +
                      </button>
                      <button type="button" onClick={() => resetTransform()} style={CTRL}>
                        Ajustar
                      </button>
                      <button type="button" onClick={() => setOpen(false)} style={CTRL}>
                        Cerrar
                      </button>
                    </span>
                  </div>

                  <TransformComponent
                    wrapperStyle={{ width: "100%", flex: 1 }}
                    contentStyle={{
                      width: "100%",
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={images[active]}
                      alt={`${title} ampliada`}
                      style={{
                        maxHeight: "78vh",
                        maxWidth: "92vw",
                        objectFit: "contain",
                        userSelect: "none",
                      }}
                      draggable={false}
                    />
                  </TransformComponent>

                  {images.length > 1 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 8,
                        padding: "clamp(12px,2vw,24px)",
                      }}
                    >
                      {images.map((src, i) => (
                        <button
                          key={src + i}
                          type="button"
                          onClick={() => setActive(i)}
                          aria-label={`Imagen ${i + 1}`}
                          style={{
                            width: 9,
                            height: 9,
                            padding: 0,
                            borderRadius: 999,
                            border: 0,
                            cursor: "pointer",
                            transition: "background .25s ease",
                            background: i === active ? "#F5F4EF" : "rgba(245,244,239,0.38)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </TransformWrapper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
