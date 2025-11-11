"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@components/ui/button";
import {
  ArrowLeft,
  ShoppingCart,
  Share2,
  Heart,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  BadgeCheck,
  Users,
  Building2,
} from "lucide-react";
import useCart from "@store/useCart";
import { useArtworkDetail } from "@hooks/queries/useArtworkDetail";

type ArtworkDoc = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  price?: number;
  currency?: string;
  stock?: number;
  image?: string;
  images?: string[];
  status?: "published" | "draft" | string;
  artistInfo?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    instagram?: string;
    website?: string;
    email?: string;
  };
  techniqueInfo?: { _id: string; name: string; slug: string };
  pavilionInfo?: { _id: string; name: string; slug: string };
};

type Copy = {
  _id: string;
  number: number;
  total: number;
  status: "available" | "reserved" | "sold" | string;
  createdAt: string;
};

type ArtworkDetailResponse = {
  doc: ArtworkDoc;
  copies?: Copy[];
  relatedArtworks?: any[];
};

const toArrayImages = (primary?: string, extra?: string[]) => {
  const arr = [
    ...(primary ? [primary] : []),
    ...((extra ?? []).filter(Boolean) as string[]),
  ];
  return arr.length ? arr : ["/placeholder.png"];
};

const toCartPayload = (doc: any) => ({
  id: String(doc._id),
  title: doc.title,
  price: Number(doc.price ?? 0),
  image: doc.image ?? doc.images?.[0] ?? "/placeholder.png",
});

const formatPrice = (price?: number, currency = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number(price ?? 0));

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data, isLoading, isError, error } = useArtworkDetail(id);
  const { add } = useCart();

  const doc = data?.doc;
  const copies = data?.copies ?? [];
  const related = data?.relatedArtworks ?? [];

  const images = useMemo(
    () => toArrayImages(doc?.image, doc?.images),
    [doc?.image, doc?.images]
  );
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

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="animate-pulse text-center">
          <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-4" />
          <div className="h-4 w-72 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-2">Error al cargar la obra</h1>
          <p className="text-gray-600 mb-6">
            {error?.message || "Intenta nuevamente más tarde."}
          </p>
          <Link href="/catalogo">
            <Button>Volver al Catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!doc) {
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

  const currency = doc.currency || "COP";
  const stock = Number(doc.stock ?? (copies.length ? 1 : 0));
  const availableCopy = copies.find((c) => c.status === "available");
  const isAvailable = stock > 0 && !!availableCopy;

  const artistFullName = [doc.artistInfo?.firstName, doc.artistInfo?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb / Back */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/catalogo"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Catálogo
          </Link>

          {/* “Relacionada a un artista” si aplica */}
          {artistFullName && (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Obra relacionada a</span>
              <span className="font-medium text-gray-900">
                {artistFullName}
              </span>
            </div>
          )}
        </div>

        {/* Header Title */}
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            {doc.status === "published" && (
              <span className="inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                <BadgeCheck className="h-4 w-4" />
                Publicada
              </span>
            )}

            {/* Pabellón + Técnica como chips */}
            {doc.pavilionInfo?.name && (
              <Link
                href={`/pabellon/${
                  doc.pavilionInfo.slug ?? doc.pavilionInfo._id
                }`}
                className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
              >
                <Building2 className="h-4 w-4" />
                {doc.pavilionInfo.name}
              </Link>
            )}
            {doc.techniqueInfo?.name && (
              <span className="inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full bg-rose-50 text-rose-700">
                {doc.techniqueInfo.name}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full ${
                isAvailable
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {isAvailable ? "Disponible" : "No disponible"}
            </span>
          </div>

          <h1 className="mt-3 text-3xl lg:text-4xl font-bold text-gray-900">
            {doc.title}
          </h1>
          {artistFullName && (
            <p className="text-xl text-gray-600 mt-2">{artistFullName}</p>
          )}
        </div>

        {/* Main two-column content */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Gallery */}
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
                              alt={`${doc.title} - ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Main preview */}
                  <div className="md:col-span-10 relative">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
                      <img
                        src={images[active]}
                        alt={doc.title}
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
                    alt={doc.title}
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
                  alt={doc.title}
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
                          alt={`${doc.title} - ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Secondary actions */}
            <div className="flex flex-wrap gap-3">
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

          {/* Right column: info + purchase + contexto */}
          <div className="space-y-6">
            {/* Price & CTA */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Precio</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatPrice(doc.price, currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Estado</p>
                  <p
                    className={`font-semibold ${
                      isAvailable ? "text-emerald-600" : "text-gray-500"
                    }`}
                  >
                    {isAvailable ? "Disponible" : "No disponible"}
                  </p>
                  {availableCopy && (
                    <p className="text-xs text-gray-500">
                      Copia {availableCopy.number}/{availableCopy.total}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  disabled={!isAvailable}
                  onClick={() => add(toCartPayload(doc), 1)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 text-white flex items-center justify-center"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isAvailable ? "Agregar al Carrito" : "Agotado"}
                </Button>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Envío gratuito en Colombia • Garantía de autenticidad
                  </p>
                </div>
              </div>
            </div>

            {/* Contexto de exhibición (Pabellón + Técnica + Artista) */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">
                Contexto de exhibición
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {doc.pavilionInfo?.name && (
                  <div className="flex flex-col">
                    <span className="text-gray-600">Pabellón</span>
                    <Link
                      href={`/pabellon/${
                        doc.pavilionInfo.slug ?? doc.pavilionInfo._id
                      }`}
                      className="font-medium hover:underline"
                    >
                      {doc.pavilionInfo.name}
                    </Link>
                  </div>
                )}
                {doc.techniqueInfo?.name && (
                  <div className="flex flex-col">
                    <span className="text-gray-600">Técnica</span>
                    <span className="font-medium">
                      {doc.techniqueInfo.name}
                    </span>
                  </div>
                )}
                {artistFullName && (
                  <div className="flex flex-col sm:col-span-2">
                    <span className="text-gray-600">Artista</span>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-200 grid place-items-center">
                        <span className="text-sm font-semibold text-gray-600">
                          {artistFullName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{artistFullName}</span>
                        {/* Si tienes ruta de artista, descomenta */}
                        {/* <Link href={`/artista/${doc.artistInfo?._id}`} className="text-sm text-blue-600 hover:underline">Ver más del artista</Link> */}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Descripción */}
            {doc.description && (
              <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold mb-3">Descripción</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {doc.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Related (si llega con data) */}
        {related.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Obras Relacionadas
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((ra: any) => (
                <div
                  key={ra._id}
                  className="bg-white rounded-xl border shadow-sm overflow-hidden"
                >
                  <img
                    src={ra.image ?? ra.images?.[0] ?? "/placeholder.png"}
                    alt={ra.title}
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-4">
                    <p className="font-semibold">{ra.title}</p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(ra.price, ra.currency || currency)}
                    </p>
                    {/* <Link href={`/obra/${ra._id}`} className="inline-block mt-3">
                      <Button size="sm" variant="outline">Ver Detalle</Button>
                    </Link> */}
                  </div>
                </div>
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
            alt={`${doc.title} ampliada`}
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
