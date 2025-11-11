// ========================= components/home/FeaturedArtworksSection.tsx =========================
"use client";

import { ChevronDown, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import ArtworkCard from "@components/ArtworkCard";
import { useArtworksCursor } from "@hooks/queries/useArtworksCursor";

export default function FeaturedArtworksSection({ brand, eventId, onAddToCart }: { brand: any; eventId: string; onAddToCart: (artwork: any) => void }) {
  const { rows, totalLabel, isLoading, isFetchingNextPage, hasNextPage, loadMore } = useArtworksCursor({ event: eventId, limit: 24 });
  const featured = rows.slice(0, 6);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full mb-4">
            <Star className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Selección Curada</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Obras destacadas</h2>
          <p className="text-gray-600">{isLoading ? "Cargando obras…" : `Mostrando ${Math.min(featured.length, 6)} de ${totalLabel} obras`}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(isLoading ? Array.from({ length: 6 }).map((_, i) => ({ id: `s-${i}`, _skeleton: true })) : featured).map((artwork: any, index: number) => (
            <div key={artwork.id ?? artwork._id ?? index} className="fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              {artwork._skeleton ? (
                <div className="h-96 bg-neutral-100 rounded-2xl animate-pulse" />
              ) : (
                <ArtworkCard artwork={artwork} onAddToCart={onAddToCart} />
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 text-center mt-16">
          <Link href="/catalogo" aria-label="Ver Catálogo Completo" className={`px-6 py-3 rounded-xl ${brand.ctaGradient} inline-flex items-center`}>
            <Sparkles className="mr-2 h-5 w-5" /> Ver Catálogo Completo <span className="sr-only">→</span>
          </Link>
          {hasNextPage && (
            <button onClick={loadMore} disabled={isFetchingNextPage} className="mt-2 border border-gray-300 hover:bg-neutral-50 px-4 py-2 rounded-xl inline-flex items-center">
              {isFetchingNextPage ? "Cargando…" : "Cargar más"}
              <ChevronDown className="ml-2 w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
