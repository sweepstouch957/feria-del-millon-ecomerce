"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import {
  ShoppingCart,
  Eye,
  Heart,
  ChevronLeft,
  ChevronRight,
  Landmark,
  FlaskConical,
} from "lucide-react";
import { formatMoney, mergeImages } from "@lib/utils";

export type CatalogCardProps = {
  artwork: any;
  onAddToCart?: (art?: any) => void;
  variant?: "grid" | "list";
  /** Mostrar el ID (oculto por defecto) */
  showId?: boolean;
};

const techniqueTone = (slug = "") => {
  const map: Record<string, string> = {
    "dibujo-drawing": "from-blue-600 to-blue-700",
    "acuarela-watercolor": "from-cyan-700 to-blue-700",
    fotografia: "from-purple-600 to-indigo-700",
    "oleo-oil": "from-emerald-600 to-green-700",
    "mixta-mixed-media": "from-pink-600 to-rose-700",
    escultura: "from-amber-600 to-orange-700",
  };
  return map[slug] || "from-neutral-700 to-neutral-900";
};

export default function CatalogCard({
  artwork,
  onAddToCart,
  variant = "grid",
  showId = false,
}: CatalogCardProps) {
  const router = useRouter();

  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [current, setCurrent] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const artistName = useMemo(() => {
    const f = artwork?.artistInfo?.firstName || "";
    const l = artwork?.artistInfo?.lastName || "";
    const full = `${f} ${l}`.trim();
    return full || artwork.artist || "Artista";
  }, [artwork]);

  const imgs = useMemo(
    () => mergeImages(artwork?.image, artwork?.images),
    [artwork]
  );
  const hasCarousel = imgs.length > 1;

  const next = () => setCurrent((c) => (c + 1) % imgs.length);
  const prev = () => setCurrent((c) => (c - 1 + imgs.length) % imgs.length);
  const goTo = (i: number) => setCurrent(i);

  useEffect(() => {
    if (!hasCarousel || isHovered) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCarousel, isHovered, imgs.length]);

  const onTouchStart = (e: React.TouchEvent) =>
    setTouchStartX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    setTouchStartX(null);
  };

  const techniqueName = artwork?.techniqueInfo?.name || "Técnica";
  const techniqueSlug = artwork?.techniqueInfo?.slug;
  const pavilionName = artwork?.pavilionInfo?.name;
  const pavilionSlug = artwork?.pavilionInfo?.slug;
  const detailHref = `/obra/${encodeURIComponent(artwork?._id || artwork?.id)}`;
  const available = Number(artwork?.stock || 0) > 0;

  // ─────────────────────────────
  // Navegación al hacer click en el card (mobile + desktop)
  // ─────────────────────────────
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Si se hizo click en un botón o link interno, NO navegamos
    if (target.closest("button") || target.closest("a")) return;

    router.push(detailHref);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(detailHref);
    }
  };

  if (variant === "list") {
    return (
      <div
        className="bg-white rounded-lg shadow-md p-6 flex flex-col md:flex-row gap-6 cursor-pointer"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <div className="w-full md:w-48">
          <Image
            src={imgs[0]}
            alt={artwork?.title}
            width={320}
            height={320}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2 !uppercase line-clamp-2">
            {artwork?.title}
          </h3>
          <p className="text-gray-600 mb-2">{artistName}</p>
          <p className="text-sm text-gray-500 mb-2">{techniqueName}</p>
          <p className="text-sm text-gray-500 mb-4">{pavilionName ?? ""}</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold">
              {formatMoney(Number(artwork?.price ?? 0), artwork?.currency)}
            </span>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart?.(artwork);
              }}
              disabled={!available}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {available ? "Agregar al Carrito" : "Agotado"}
            </Button>
          </div>
          {showId && (
            <p className="mt-3 text-xs text-gray-400">
              ID: {artwork?._id || artwork?.id}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:border-gray-200 hover:shadow-2xl cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {/* Media */}
      <div
        className="relative h-64 w-full overflow-hidden sm:h-72 md:h-80"
        onTouchStart={hasCarousel ? onTouchStart : undefined}
        onTouchEnd={hasCarousel ? onTouchEnd : undefined}
      >
        {imgs.map((src, idx) => (
          <img
            key={`${src}-${idx}`}
            src={src}
            alt={artwork?.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${idx === current ? "opacity-100" : "opacity-0"
              }`}
            draggable={false}
          />
        ))}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute left-4 top-4">
          <Link
            href={`/catalogo?technique=${encodeURIComponent(
              techniqueSlug || ""
            )}`}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${techniqueTone(
              techniqueSlug
            )} px-3 py-1 text-xs font-medium text-white shadow-lg hover:brightness-110`}
            title={techniqueName}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{techniqueName}</span>
          </Link>
        </div>

        <div className="absolute right-4 top-4 flex flex-col space-y-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsLiked((v) => !v);
            }}
            className={`flex h-10 w-10 translate-x-12 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-all duration-300 ${isLiked
                ? "bg-rose-500 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
              } ${isHovered ? "translate-x-0 opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "0.1s" }}
            aria-label={isLiked ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          </button>
        </div>

        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
          <Link
            href={detailHref}
            onClick={(e) => e.stopPropagation()}
            className={`pointer-events-auto scale-75 opacity-0 transition-all duration-300 ${isHovered ? "scale-100 opacity-100" : ""
              }`}
          >
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white hover:shadow-xl"
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver detalles
            </Button>
          </Link>
        </div>

        {hasCarousel && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/40 p-2 text-white shadow-md transition hover:bg-black/60 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                next();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/40 p-2 text-white shadow-md transition hover:bg-black/60 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goTo(i);
                  }}
                  className={`h-2.5 w-2.5 rounded-full transition ${i === current ? "bg-white" : "bg-white/50 hover:bg-white/80"
                    }`}
                  aria-label={`Ir a imagen ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Contenido */}
      <div className="p-6">
        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-neutral-800">
          {artwork?.title}
        </h3>

        {/* FILA MEJORADA: artista + chip de pabellón */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-gray-700 min-w-0 flex-1 truncate">
            {artistName}
          </p>
          {pavilionSlug && (
            <Link
              href={`/pabellones/${encodeURIComponent(pavilionSlug)}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 shrink-0 max-w-full sm:max-w-[70%] md:max-w-[60%]
                         rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700
                         shadow-sm transition hover:bg-gray-50"
              title={pavilionName}
              aria-label={`Pabellón ${pavilionName ?? ""}`}
            >
              <Landmark className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{pavilionName}</span>
            </Link>
          )}
        </div>

        <div className="mb-4 grid grid-cols-1 gap-1 text-xs text-gray-600">
          <p>
            <span className="font-semibold">Técnica:</span> {techniqueName}
          </p>
          <p className="line-clamp-1">
            <span className="font-semibold">Dimensiones:</span>{" "}
            {artwork?.dimensionsText || "Sin especificar"}
          </p>
        </div>

        {artwork?.description && (
          <p className="mb-4 leading-relaxed text-sm text-gray-600 line-clamp-2">
            {artwork.description}
          </p>
        )}

        <div className="flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs text-gray-500">Precio</p>
            <p className="text-xl font-bold text-gray-900">
              {formatMoney(artwork?.price, artwork?.currency)}
            </p>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart?.(artwork);
            }}
            size="sm"
            disabled={!available}
            className={`text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${available
                ? "bg-gradient-to-r from-neutral-900 to-black"
                : "bg-neutral-300 cursor-not-allowed"
              }`}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {available ? "Agregar" : "Agotado"}
          </Button>
        </div>

        {/* Pie: disponibilidad (ID opcional) */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${available ? "bg-emerald-500" : "bg-rose-500"
                }`}
            />
            <span className="text-xs text-gray-500">
              {available ? "Disponible" : "No disponible"}
            </span>
          </div>

          {showId && (
            <span className="text-xs text-gray-400">
              ID: {artwork?._id || artwork?.id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
