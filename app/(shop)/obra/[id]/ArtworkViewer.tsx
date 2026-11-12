"use client";

import { useEffect, useRef, useState } from "react";
import SmartImage from "@components/ui/SmartImage";
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { I } from "@components/views/catalog/shared";
import { cloudinaryLoader, isCloudinary } from "@lib/imageUrl";

// Variante del CDN al ancho pedido (el original del artista pesa varios MB).
const cdn = (src: string, width: number) => (isCloudinary(src) ? cloudinaryLoader({ src, width }) : src);

/* Galería de la obra (port de "Obra — Desktop/Mobile" de Claude Design):
   escenario cuadrado con la obra contenida, chips de estado, "Ampliar",
   contador y miniaturas. El visor es una pantalla oscura con zoom (rueda,
   pellizco, doble toque o botones), flechas y miniaturas. */

export type ViewerChip = { label: string; tone: "green" | "inv" };

const ZOOMS = [1, 1.7, 2.6];

export default function ArtworkViewer({
  images,
  title,
  artist,
  chips,
}: {
  images: string[];
  title: string;
  artist: string;
  chips: ViewerChip[];
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const zoomRef = useRef<ReactZoomPanPinchRef | null>(null);
  const touchX = useRef<number | null>(null);
  const n = images.length;
  const many = n > 1;

  const go = (d: number) => setActive((i) => (i + d + n) % n);
  const shot = `Imagen ${active + 1} de ${n}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (!many) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  // Visor abierto: el fondo no se mueve.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Deslizar con el dedo cambia de imagen (celular).
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => (touchX.current = e.touches[0].clientX),
    onTouchEnd: (e: React.TouchEvent) => {
      if (touchX.current == null || !many) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
      touchX.current = null;
    },
  };

  const step = (dir: 1 | -1) => {
    const i = ZOOMS.findIndex((z) => z >= scale - 0.01);
    const next = ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir))];
    zoomRef.current?.centerView(next, 250);
  };

  if (!n) {
    return (
      <div className="fdm-ob-stage">
        <span className="fdm-ob-noimg">Sin imagen</span>
      </div>
    );
  }

  return (
    <>
      <div className="fdm-ob-stage" {...swipe}>
        <span className="fdm-ob-stage-img">
          <SmartImage key={images[active]} src={images[active]} alt={`${title}, de ${artist}`} priority sizes="(max-width: 767px) 100vw, 760px" />
        </span>
        <button type="button" className="fdm-ob-stage-hit" aria-label="Ampliar imagen" onClick={() => setOpen(true)} />
        <button type="button" className="fdm-ob-zoom" onClick={() => setOpen(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
          </svg>
          Ampliar
        </button>
        {chips.length > 0 && (
          <span className="fdm-ob-chips">
            {chips.map((c) => (
              <span key={c.label} className={`fdm-ob-chip is-${c.tone}`}>{c.label}</span>
            ))}
          </span>
        )}
        {many && <span className="fdm-ob-count">{active + 1} / {n}</span>}
      </div>

      {many && (
        <div className="fdm-ob-thumbs">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              className={`fdm-ob-thumb${i === active ? " is-on" : ""}`}
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={i === active}
              onClick={() => setActive(i)}
            >
              <span className="ph">
                <SmartImage src={src} alt="" sizes="80px" />
              </span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fdm-ob-viewer" role="dialog" aria-modal="true" aria-label="Visor de imágenes">
          <div className="fdm-ob-v-head">
            <div className="fdm-ob-v-title">
              <span className="t">{title}</span>
              <span className="s">{artist} · {shot}</span>
            </div>
            {many && <span className="fdm-ob-v-count">{active + 1} / {n}</span>}
            <div className="fdm-ob-v-tools">
              <button type="button" className="fdm-ob-v-btn" aria-label="Alejar" onClick={() => step(-1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5M8 11h6" /></svg>
              </button>
              <span className="fdm-ob-v-pct" aria-live="polite">{Math.round(scale * 100)}%</span>
              <button type="button" className="fdm-ob-v-btn" aria-label="Acercar" onClick={() => step(1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5M11 8v6M8 11h6" /></svg>
              </button>
              <button type="button" className="fdm-ob-v-btn is-close" aria-label="Cerrar visor" onClick={() => setOpen(false)}>
                {I.close({ size: 20, sw: 1.6 })}
              </button>
            </div>
          </div>

          <div className="fdm-ob-v-stage">
            <TransformWrapper
              key={images[active]}
              ref={zoomRef}
              initialScale={1}
              minScale={1}
              maxScale={4}
              centerOnInit
              doubleClick={{ mode: "toggle", step: 0.7 }}
              wheel={{ step: 0.12 }}
              onTransformed={(_, s) => setScale(s.scale)}
              onInit={() => setScale(1)}
            >
              <TransformComponent
                wrapperStyle={{ width: "100%", height: "100%" }}
                contentStyle={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cdn(images[active], 1920)} alt={`${title}, de ${artist}`} draggable={false} className="fdm-ob-v-img" />
              </TransformComponent>
            </TransformWrapper>
            {many && (
              <>
                <button type="button" className="fdm-ob-v-nav is-prev" aria-label="Imagen anterior" onClick={() => go(-1)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
                </button>
                <button type="button" className="fdm-ob-v-nav is-next" aria-label="Imagen siguiente" onClick={() => go(1)}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
                </button>
              </>
            )}
          </div>

          <div className="fdm-ob-v-caption">
            <span className="t">{title}</span>
            <span className="s">{artist} · {shot}</span>
          </div>

          {many && (
            <div className="fdm-ob-v-thumbs">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  className={`fdm-ob-v-thumb${i === active ? " is-on" : ""}`}
                  aria-label={`Imagen ${i + 1}`}
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={cdn(src, 400)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
