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
import { EVENT_ID, EVENT_CARDS } from "@lib/event";
import { useSiteContent, useSiteSections } from "@provider/siteConfigProvider";
import type { SectionKey } from "@lib/siteDefaults";

export default function HomePage() {
  const add = useCart((s) => s.add);
  const content = useSiteContent();
  const sections = useSiteSections();
  const { hero, eventInfo, stats } = content;

  // Cards: iconos/estilos fijos, textos editables desde el config.
  const cards = EVENT_CARDS.map((c, i) => ({
    ...c,
    ...(content.eventCards[i] || {}),
  }));

  // Cada bloque del landing, por clave. El orden y visibilidad los define el config.
  const blocks: Record<SectionKey, React.ReactNode> = {
    eventInfo: (
      <section
        key="eventInfo"
        className={`py-16 bg-gradient-to-b ${BRAND.bgSectionLightFrom} ${BRAND.bgSectionLightTo}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-black text-white rounded-full mb-4">
              <Landmark className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">{eventInfo.badge}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {eventInfo.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {eventInfo.description}
            </p>
          </div>
          <EventInfoGrid items={cards} />
        </div>
      </section>
    ),
    pavilions: <PavilionsSection key="pavilions" brand={BRAND} eventId={EVENT_ID} />,
    featured: (
      <FeaturedArtworksSection
        key="featured"
        brand={BRAND}
        eventId={EVENT_ID}
        onAddToCart={(artwork: any) => add(artwork, 1)}
      />
    ),
    techniques: <TechniquesSection key="techniques" brand={BRAND} />,
    stats: <StatsSection key="stats" stats={stats} />,
    contact: <ContactSection key="contact" brand={BRAND} />,
  };

  return (
    <div className="min-h-screen">
      {/* HERO (siempre visible) */}
      <Hero
        brand={BRAND}
        badgeText={hero.badge}
        subtitle={hero.subtitle}
        titleMain={hero.title}
        paragraph={hero.paragraph}
        image={hero.image}
        ctas={[
          {
            href: "/catalogo",
            label: hero.ctaPrimaryLabel,
            leftIcon: <Sparkles className="mr-2 h-5 w-5" />,
            rightIcon: <ArrowRight className="ml-2 h-5 w-5" />,
          },
          { href: "/artistas", label: hero.ctaSecondaryLabel },
        ]}
        tickets={{
          href: `/tickets`,
          label: hero.ticketsLabel,
          icon: <TicketsIcon className="w-5 h-5" />,
        }}
      />

      {/* Secciones por orden + visibilidad configurables */}
      {sections.order
        .filter((k) => sections.visible[k])
        .map((k) => blocks[k])}

      {/* Estilos locales (animaciones) */}
      <LocalStyles />
    </div>
  );
}
