// ========================= components/home/TechniquesSection.tsx =========================
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTechniques } from "@hooks/queries/useTechniques";

type Brand = {
  catGradient?: string[]; // p.ej. ["from-indigo-500", "to-purple-500"]
};

function getGradient(brand?: Brand) {
  const g = brand?.catGradient;
  if (Array.isArray(g) && g.length >= 2) return `${g[0]} ${g[1]}`;
  // Fallback sobrio
  return "from-neutral-800 to-neutral-900";
}

function TechniqueCard({
  name,
  slug,
  description,
  brand,
}: {
  name: string;
  slug: string;
  description?: string;
  brand?: Brand;
}) {
  return (
    <Link
      href={`/catalogo?technique=${encodeURIComponent(slug)}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20 rounded-2xl"
    >
      <div
        className="
          h-full flex flex-col
          bg-white rounded-2xl border border-gray-100
          shadow-sm hover:shadow-xl hover:border-gray-200
          transition-all duration-300 ease-out
          hover:-translate-y-1
        "
      >
        {/* Header / Icon */}
        <div className="p-7 pb-4">
          <div
            className={`
              w-16 h-16 rounded-2xl
              bg-gradient-to-r ${getGradient(brand)}
              text-white text-2xl
              flex items-center justify-center
              shadow-sm
              transition-transform duration-300 group-hover:scale-105
            `}
            aria-hidden="true"
          >
            🎯
          </div>
        </div>

        {/* Body */}
        <div className="px-7 pb-2 flex-1">
          <h3 className="text-xl font-bold text-gray-900 leading-snug line-clamp-2">
            {name}
          </h3>

          <p className="mt-2 text-gray-600 line-clamp-3">
            {description?.trim()?.length
              ? description
              : "Explora obras de esta técnica."}
          </p>
        </div>

        {/* Footer / CTA */}
        <div className="px-7 pt-3 pb-6 mt-auto">
          <div className="inline-flex items-center text-gray-900 group-hover:text-black">
            <span className="text-sm font-medium">Explorar</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TechniquesSection({ brand }: { brand?: Brand }) {
  const { data, isLoading, isError } = useTechniques();
  const items = (data || []).filter((t: any) => t?.active !== false);

  return (
    <section className="py-20 bg-gradient-to-b from-neutral-50 to-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Explora por Técnicas
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            Descubre obras organizadas por disciplinas y medios
          </p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-48 bg-white rounded-2xl border border-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <p className="text-gray-600 text-center">
            No pudimos cargar las técnicas. Intenta de nuevo.
          </p>
        ) : !items.length ? (
          <p className="text-gray-600 text-center">
            Aún no hay técnicas disponibles.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((t: any) => (
              <TechniqueCard
                key={t.slug || t._id}
                brand={brand}
                name={t.name}
                slug={t.slug || String(t._id)}
                description={t.description}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
