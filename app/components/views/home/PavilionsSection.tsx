"use client";

import Link from "next/link";
import { Landmark, Tickets as TicketsIcon, ArrowRight } from "lucide-react";
import { usePavilions } from "@hooks/queries/usePavilions";

function PavilionCard({
  name,
  slug,
  description,
}: {
  name: string;
  slug: string;
  description?: string;
}) {
  return (
    <Link href={`/pabellones/${slug}`} className="group block h-full">
      <div className="h-full flex flex-col bg-white rounded-2xl p-6 border border-gray-100 shadow hover:shadow-xl hover:-translate-y-1 transition-all">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 text-white flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          {/* forzamos 2 líneas máx y una altura mínima similar */}
          <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 min-h-[3rem]">
            {name}
          </h3>
        </div>

        {/* bloque de descripción crece para empujar el CTA hacia abajo */}
        <div className="text-gray-600 line-clamp-2 min-h-[48px]">
          {description && description !== "1"
            ? description
            : "Explora las obras de este pabellón."}
        </div>

        {/* CTA abajo siempre */}
        <div className="mt-auto pt-4 inline-flex items-center text-black">
          Ver pabellón{" "}
          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default function PavilionsSection({
  brand,
  eventId,
}: {
  brand: any;
  eventId: string;
}) {
  const { data: pavilions, isLoading } = usePavilions(eventId);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div className="text-left">
            <div className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full mb-4">
              <Landmark className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Pabellones</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Recorre nuestro pabellón
            </h2>

          </div>
          <Link href={`/tickets?event=${eventId}`}>
            <button
              className={`px-5 py-3 rounded-xl ${brand.ctaGradient} inline-flex items-center`}
            >
              <TicketsIcon className="w-4 h-4 mr-2" /> Comprar tickets
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-neutral-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : pavilions && pavilions.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {pavilions.map((p: any) => (
              <div key={p._id} className="h-full">
                <PavilionCard
                  name={p.name}
                  slug={p.slug}
                  description={p.description as any}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No hay pabellones disponibles aún.</p>
        )}
      </div>
    </section>
  );
}
