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
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// artwork esperado:
// {
//   _id, event, pavilion, artist, technique, title, slug, price, currency, stock,
//   image, images[], status, tags[], createdAt,
//   artistInfo: { firstName, lastName, email, ... },
//   techniqueInfo: { name, slug },
//   pavilionInfo: { name, slug }
//   dimensions? | { width, height, depth, units? }
// }

export default function ArtworkCard({ artwork, onAddToCart }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [current, setCurrent] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  // -------- helpers
  const formatMoney = (value, currency = "COP") =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(Number(value || 0));

  const techniqueTone = (slug = "") => {
    const map = {
      "dibujo-drawing": "from-blue-600 to-blue-700",
      "acuarela-watercolor": "from-cyan-700 to-blue-700",
      fotografia: "from-purple-600 to-indigo-700",
      "oleo-oil": "from-emerald-600 to-green-700",
      "mixta-mixed-media": "from-pink-600 to-rose-700",
      escultura: "from-amber-600 to-orange-700",
    };
    return map[slug] || "from-neutral-700 to-neutral-900";
  };

  const artistName = useMemo(() => {
    const f = artwork?.artistInfo?.firstName || "";
    const l = artwork?.artistInfo?.lastName || "";
    const full = `${f} ${l}`.trim();
    return full || artwork.artist || "Artista";
  }, [artwork]);

  // -------- imágenes (acepta image string o images array)
  const imgs = useMemo(() => {
    const fromArray = Array.isArray(artwork.images) ? artwork.images : [];
    const fromSingle = artwork.image ? [artwork.image] : [];
    const merged = [...fromArray, ...fromSingle]
      .map((u) => (typeof u === "string" ? u.trim() : u))
      .filter(Boolean);
    return merged.length
      ? merged
      : ["https://via.placeholder.com/800x600?text=Sin+imagen"];
  }, [artwork.images, artwork.image]);

  const hasCarousel = imgs.length > 1;
  const next = () => setCurrent((c) => (c + 1) % imgs.length);
  const prev = () => setCurrent((c) => (c - 1 + imgs.length) % imgs.length);
  const goTo = (i) => setCurrent(i);

  // Autoplay
  useEffect(() => {
    if (!hasCarousel || isHovered) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCarousel, isHovered, imgs.length]);

  // Swipe
  const onTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const onTouchEnd = (e) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
    setTouchStartX(null);
  };

  const techniqueName = artwork?.techniqueInfo?.name || "Técnica";
  const techniqueSlug = artwork?.techniqueInfo?.slug;
  const pavilionName = artwork?.pavilionInfo?.name;
  const pavilionSlug = artwork?.pavilionInfo?.slug;
  const detailHref = `/obra/${encodeURIComponent(artwork._id || artwork.id)}`;

  const available = Number(artwork.stock || 0) > 0;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:border-gray-200 hover:shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* MEDIA */}
      <div
        className="relative h-64 w-full overflow-hidden sm:h-72 md:h-80"
        onTouchStart={hasCarousel ? onTouchStart : undefined}
        onTouchEnd={hasCarousel ? onTouchEnd : undefined}
      >
        {imgs.map((src, idx) => (
          <img
            key={String(src) + idx}
            src={src}
            alt={artwork.title}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              idx === current ? "opacity-100" : "opacity-0"
            }`}
            draggable={false}
          />
        ))}

        {/* Overlay sutil */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Chip Técnica */}
        <div className="absolute left-4 top-4">
          <Link
            href={`/catalogo?technique=${encodeURIComponent(
              techniqueSlug || ""
            )}`}
            className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${techniqueTone(
              techniqueSlug
            )} px-3 py-1 text-xs font-medium text-white shadow-lg hover:brightness-110`}
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{techniqueName}</span>
          </Link>
        </div>

        {/* Fav */}
        <div className="absolute right-4 top-4 flex flex-col space-y-2">
          <button
            onClick={() => setIsLiked((v) => !v)}
            className={`flex h-10 w-10 translate-x-12 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-all duration-300 ${
              isLiked
                ? "bg-rose-500 text-white"
                : "bg-white/20 text-white hover:bg-white/30"
            } ${isHovered ? "translate-x-0 opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "0.1s" }}
            aria-label={isLiked ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* CTA ver detalles */}
        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center md:flex">
          <Link
            href={detailHref}
            className={`pointer-events-auto scale-75 opacity-0 transition-all duration-300 ${
              isHovered ? "scale-100 opacity-100" : ""
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

        {/* Controles carrusel */}
        {hasCarousel && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                prev();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/40 p-2 text-white shadow-md transition hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                next();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-black/40 p-2 text-white shadow-md transition hover:bg-black/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    goTo(i);
                  }}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    i === current ? "bg-white" : "bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Ir a imagen ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* CONTENIDO */}
      <div className="p-6">
        {/* Título */}
        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-neutral-800">
          {artwork.title}
        </h3>

        {/* Artista + Pabellón */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700">{artistName}</p>
          {pavilionSlug && (
            <Link
              href={`/pabellones/${encodeURIComponent(pavilionSlug)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 shadow-sm transition hover:bg-gray-50"
              title={pavilionName}
            >
              <Landmark className="h-3.5 w-3.5" />
              <span className="max-w-[12rem] truncate">{pavilionName}</span>
            </Link>
          )}
        </div>

        {/* Técnica + Dimensiones */}
        <div className="mb-4 grid grid-cols-1 gap-1 text-xs text-gray-600">
          <p>
            <span className="font-semibold">Técnica:</span> {techniqueName}
          </p>
          <p className="line-clamp-1">
            <span className="font-semibold">Dimensiones:</span>{" "}
            {artwork.dimensionsText || "Sin especificar"}
          </p>
        </div>

        {/* Descripción (si existe) */}
        {artwork.description && (
          <p className="mb-4 leading-relaxed text-sm text-gray-600 line-clamp-2">
            {artwork.description}
          </p>
        )}

        {/* Precio + CTA */}
        <div className="flex items-end justify-between">
          <div>
            <p className="mb-1 text-xs text-gray-500">Precio</p>
            <p className="text-xl font-bold text-gray-900">
              {formatMoney(artwork.price, artwork.currency)}
            </p>
          </div>
          <Button
            variant="default"
            onClick={() => onAddToCart(artwork)}
            size="sm"
            disabled={!available}
            className={`text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${
              available
                ? "bg-gradient-to-r from-neutral-900 to-black"
                : "bg-neutral-300 cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {available ? "Agregar" : "Agotado"}
          </Button>
        </div>

        {/* Disponibilidad + ID */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                available ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="text-xs text-gray-500">
              {available ? "Disponible" : "No disponible"}
            </span>
          </div>
          <Link
            href={detailHref}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            ID: {artwork._id || artwork.id}
          </Link>
        </div>
      </div>

      {/* Shine */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
      </div>
    </div>
  );
}
