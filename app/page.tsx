"use client";

import {
  Sparkles,
  ArrowRight,
  Tickets as TicketsIcon,
  Landmark,
} from "lucide-react";
import useCart from "@store/useCart";

// Secciones
import Hero from "@components/views/home/Hero";
import EventInfoGrid from "@components/views/home/EventInfoGrid";
import PavilionsSection from "@components/views/home/PavilionsSection";
import FeaturedArtworksSection from "@components/views/home/FeaturedArtworksSection";
import TechniquesSection from "@components/views/home/TechniquesSection";
import StatsSection from "@components/views/home/StatsSection";
import ContactSection from "@components/views/home/ContactSection";
import LocalStyles from "@components/views/home/LocalStyles";

// Constantes (evento / brand)
import { BRAND } from "@lib/brand";
import {
  EVENT_ID,
  EVENT_BADGE_TEXT,
  EVENT_CARDS,
  EVENT_DATES_LABEL,
  STATS,
} from "@lib/event";

export default function HomePage() {
  const add = useCart((s) => s.add);

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <Hero
        brand={BRAND}
        badgeText={EVENT_BADGE_TEXT}
        subtitle="Semana del Arte 2025"
        titleMain="Feria del Millón"
        ctas={[
          {
            href: "/catalogo",
            label: "Explorar Catálogo",
            leftIcon: <Sparkles className="mr-2 h-5 w-5" />,
            rightIcon: <ArrowRight className="ml-2 h-5 w-5" />,
          },
          { href: "/artistas", label: "Conocer Artistas" },
        ]}
        tickets={{
          href: `/tickets`,
          label: `Comprar tickets · ${EVENT_DATES_LABEL}`,
          icon: <TicketsIcon className="w-5 h-5" />,
        }}
      />

      {/* INFO DEL EVENTO */}
      <section
        className={`py-16 bg-gradient-to-b ${BRAND.bgSectionLightFrom} ${BRAND.bgSectionLightTo}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full mb-4">
              <Landmark className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Evento Destacado</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Feria del Millón 2025 — Bogotá
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              La plataforma más importante de arte emergente en Colombia,
              reuniendo a los talentos más prometedores del panorama artístico
              nacional.
            </p>
          </div>
          <EventInfoGrid items={EVENT_CARDS} />
        </div>
      </section>

      {/* PABELLONES (hook interno) */}
      <PavilionsSection brand={BRAND} eventId={EVENT_ID} />

      {/* OBRAS DESTACADAS (hook interno + add to cart) */}
      <FeaturedArtworksSection
        brand={BRAND}
        eventId={EVENT_ID}
        onAddToCart={(artwork: any) => add(artwork, 1)}
      />

      {/* TÉCNICAS (hook interno) */}
      <TechniquesSection brand={BRAND} />

      {/* STATS */}
      <StatsSection stats={STATS} />

      {/* CONTACTO */}
      <ContactSection brand={BRAND} />

      {/* Estilos locales (animaciones) */}
      <LocalStyles />
    </div>
  );
}
