"use client";

import Image from "next/image";
import { cloudinaryLoader, isCloudinary, isNextOptimizable } from "@lib/imageUrl";

/* Una sola puerta para todas las imágenes del sitio.

   - Cloudinary  → next/image con loader propio: el CDN devuelve la derivación
                   del ancho pedido, en AVIF/WebP. El original pesado nunca viaja.
   - Local / host declarado → next/image normal.
   - Cualquier otro host → <img>, porque next/image reventaría con un host que
                   no esté en next.config. */

type Props = {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  fit?: "contain" | "cover";
  className?: string;
  style?: React.CSSProperties;
};

export default function SmartImage({
  src,
  alt,
  fill = true,
  width,
  height,
  sizes = "100vw",
  priority,
  quality,
  fit = "contain",
  className,
  style,
}: Props) {
  const s = String(src ?? "").trim();
  if (!s) return null;

  const objectFit = { objectFit: fit } as React.CSSProperties;
  const merged = { ...objectFit, ...style };

  if (!isNextOptimizable(s)) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={s}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={className}
        style={{ width: "100%", height: "100%", ...merged }}
      />
    );
  }

  const common = {
    src: s,
    alt,
    sizes,
    priority,
    quality,
    className,
    style: merged,
    ...(isCloudinary(s) ? { loader: cloudinaryLoader } : {}),
  };

  return fill ? (
    <Image {...common} fill />
  ) : (
    <Image {...common} width={width ?? 800} height={height ?? 800} />
  );
}
