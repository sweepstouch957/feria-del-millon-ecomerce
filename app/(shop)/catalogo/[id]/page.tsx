"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@components/ui/button.jsx";
import {
  ArrowLeft,
  ShoppingCart,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";
import { artworks } from "@data/artworks.js";
import ArtworkCard from "@components/ArtworkCard.jsx";
import useCart from "@store/useCart";

const toArrayImages = (img: string | string[] | undefined | null) => {
  if (Array.isArray(img)) return img.filter(Boolean);
  if (typeof img === "string" && img.trim() !== "") return [img];
  return ["/placeholder.png"];
};

// Normaliza el artwork a la forma que tu hook espera (Omit<CartItem, 'quantity'>)
const toCartPayload = (artwork: any) => ({
  id: String(artwork.id),
  title: artwork.title,
  price: Number(artwork.price ?? 0),
  image: Array.isArray(artwork.image)
    ? artwork.image[0] ?? "/placeholder.png"
    : artwork.image ?? "/placeholder.png",
});

export default function Page() {
  const params = useParams<{ id: string }>();
  const { add } = useCart();

  const artwork = artworks.find(
    (art: any) => String(art.id) === String(params?.id)
  );

  const images = useMemo(() => toArrayImages(artwork?.image), [artwork?.image]);
  const hasGallery = images.length > 1;
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const next = useCallback(
    () => setActive((i) => (i + 1) % images.length),
    [images.length]
  );
  const prev = useCallback(
    () => setActive((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, next, prev]);

  const relatedArtworks = useMemo(() => {
    if (!artwork) return [];
    return artworks
      .filter(
        (art: any) =>
          String(art.id) !== String(artwork.id) &&
          (art.artist === artwork.artist || art.category === artwork.category)
      )
      .slice(0, 3);
  }, [artwork]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price);

  if (!artwork) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Obra no encontrada
          </h1>
          <Link href="/catalogo">
            <Button>Volver al Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navegación */}
        <div className="mb-8">
          <Link
            href="/catalogo"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Catálogo
          </Link>
        </div>

        {/* Contenido Principal */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Imagen / Galería */}
          <div className="space-y-4">
            {/* Desktop */}
            <div className="hidden md:grid md:grid-cols-12 gap-4">
              {hasGallery ? (
                <>
                  {/* Thumbs vertical */}
                  <div className="md:col-span-2">
                    <div className="flex md:flex-col gap-3 overflow-auto md:max-h-[620px]">
                      {images.map((src, idx) => {
                        const selected = idx === active;
                        return (
                          <button
                            key={src + idx}
                            onClick={() => setActive(idx)}
                            className={[
                              "relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border",
                              selected
                                ? "border-blue-600 ring-2 ring-blue-200"
                                : "border-gray-200 hover:border-gray-300",
                            ].join(" ")}
                            aria-label={`Ver imagen ${idx + 1}`}
                          >
                            <img
                              src={src}
                              alt={`${artwork.title} - ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preview principal */}
                  <div className="md:col-span-10 relative">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
                      <img
                        src={images[active]}
                        alt={artwork.title}
                        className="w-full h-96 lg:h-[600px] object-contain bg-white"
                      />
                      <button
                        onClick={prev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 border hover:bg-white shadow"
                        aria-label="Anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={next}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 border hover:bg-white shadow"
                        aria-label="Siguiente"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setLightboxOpen(true)}
                        className="absolute bottom-3 right-3 px-3 py-1.5 text-sm rounded-md bg-white/90 border hover:bg-white shadow inline-flex items-center"
                        aria-label="Ampliar"
                      >
                        <Maximize2 className="h-4 w-4 mr-1" />
                        Ampliar
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="md:col-span-12 bg-white rounded-lg shadow-lg overflow-hidden">
                  <img
                    src={images[0]}
                    alt={artwork.title}
                    className="w-full h-96 lg:h-[600px] object-contain bg-white"
                  />
                </div>
              )}
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-3">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
                <img
                  src={images[active]}
                  alt={artwork.title}
                  className="w-full h-80 object-contain bg-white"
                />
                {hasGallery && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 border hover:bg-white shadow"
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 border hover:bg-white shadow"
                      aria-label="Siguiente"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setLightboxOpen(true)}
                      className="absolute bottom-3 right-3 px-3 py-1.5 text-sm rounded-md bg-white/90 border hover:bg-white shadow inline-flex items-center"
                      aria-label="Ampliar"
                    >
                      <Maximize2 className="h-4 w-4 mr-1" />
                      Ampliar
                    </button>
                  </>
                )}
              </div>

              {hasGallery && (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((src, idx) => {
                    const selected = idx === active;
                    return (
                      <button
                        key={src + idx}
                        onClick={() => setActive(idx)}
                        className={[
                          "relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border",
                          selected
                            ? "border-blue-600 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300",
                        ].join(" ")}
                        aria-label={`Ver imagen ${idx + 1}`}
                      >
                        <img
                          src={src}
                          alt={`${artwork.title} - ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Acciones secundarias */}
            <div className="flex space-x-4">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Compartir
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Favoritos
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full mb-4">
                {artwork.category}
              </span>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {artwork.title}
              </h1>
              <p className="text-xl text-gray-600 mb-4">
                {artwork.artist} • {artwork.year}
              </p>
            </div>

            {/* Detalles técnicos */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Detalles Técnicos</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Técnica:</span>
                  <span className="font-medium">{artwork.medium}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensiones:</span>
                  <span className="font-medium">{artwork.dimensions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Año:</span>
                  <span className="font-medium">{artwork.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoría:</span>
                  <span className="font-medium">{artwork.category}</span>
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Descripción</h3>
              <p className="text-gray-700 leading-relaxed">
                {artwork.description}
              </p>
            </div>

            {/* Precio y Compra */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Precio</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatPrice(Number(artwork.price))}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => add(toCartPayload(artwork), 1)} // 👈 usa tu hook: add(artwork, qty)
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Agregar al Carrito
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Envío gratuito en Colombia • Garantía de autenticidad
                  </p>
                </div>
              </div>
            </div>

            {/* Artista */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Sobre el Artista</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600">
                    {artwork.artist?.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{artwork.artist}</p>
                  <p className="text-sm text-gray-600">Artista Colombiano</p>
                </div>
              </div>
              <Link
                href={`/artista/${(artwork.artist || "")
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <Button variant="outline" size="sm">
                  Ver más obras del artista
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Obras Relacionadas */}
        {relatedArtworks.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Obras Relacionadas
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArtworks.map((relatedArtwork: any) => (
                <ArtworkCard
                  key={relatedArtwork.id}
                  artwork={relatedArtwork}
                  onAddToCart={() => add(toCartPayload(relatedArtwork), 1)} // 👈 consistente
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white shadow"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            onClick={prev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white shadow"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <img
            src={images[active]}
            alt={`${artwork.title} ampliada`}
            className="max-h-[85vh] max-w-[92vw] object-contain rounded-lg shadow-2xl"
          />

          <button
            onClick={next}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/90 hover:bg-white shadow"
            aria-label="Siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {hasGallery && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActive(idx)}
                  className={[
                    "w-2.5 h-2.5 rounded-full",
                    idx === active
                      ? "bg-white"
                      : "bg-white/50 hover:bg-white/80",
                  ].join(" ")}
                  aria-label={`Ir a imagen ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
