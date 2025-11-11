// ========================= components/home/Hero.tsx =========================
"use client";

import Link from "next/link";
import { ReactNode } from "react";

export default function Hero({
  brand,
  badgeText,
  titleMain,
  subtitle,
  ctas,
  tickets,
}: {
  brand: any;
  badgeText: string;
  titleMain: string;
  subtitle: string;
  ctas: { href: string; label: string; leftIcon?: ReactNode; rightIcon?: ReactNode }[];
  tickets: { href: string; label: string; icon?: ReactNode };
}) {
  return (
    <section className={`relative bg-gradient-to-br ${brand.bgGradientHero} text-white py-20 overflow-hidden`}>
      {/* blobs */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full mix-blend-overlay filter blur-xl opacity-20 hero-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-white/10 rounded-full mix-blend-overlay filter blur-xl opacity-15 hero-blob delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-white/10 rounded-full mix-blend-overlay filter blur-xl opacity-15 hero-blob delay-4000" />
      </div>
      {/* partículas */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => {
          const left = (i * 37) % 100;
          const top = (i * 53) % 100;
          const delay = (i % 6) * 0.4;
          const duration = 3 + (i % 5) * 0.6;
          return (
            <span
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full opacity-30 particle"
              style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
            />
          );
        })}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className={`inline-flex items-center px-4 py-2 ${brand.badgeBg} backdrop-blur-sm rounded-full ${brand.badgeBorder} mb-6 fade-in-up`} style={{ animationDelay: "0s" }}>
            <span className="text-sm font-medium">{badgeText}</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-bold mb-6 fade-in-up" style={{ animationDelay: "0.2s" }}>
            <span className="bg-gradient-to-r from-white via-neutral-200 to-white bg-clip-text text-transparent">{titleMain}</span>
            <span className="block text-3xl md:text-5xl text-neutral-300 mt-4 font-light">{subtitle}</span>
          </h1>

          <p className={`text-xl md:text-2xl mb-8 max-w-4xl mx-auto ${brand.textMuted} leading-relaxed fade-in-up`} style={{ animationDelay: "0.4s" }}>
            Descubre la colección más extraordinaria de arte contemporáneo colombiano — una experiencia que conecta artistas emergentes con coleccionistas apasionados, ahora en <span className="font-semibold text-white">Bogotá</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in-up" style={{ animationDelay: "0.6s" }}>
            {ctas.map((cta) => (
              <Link key={cta.href} href={cta.href} aria-label={cta.label}>
                <button className={`px-6 py-3 rounded-xl ${brand.ctaPrimary} inline-flex items-center`}>{cta.leftIcon}{cta.label}{cta.rightIcon}</button>
              </Link>
            ))}
          </div>

          <div className="mt-8 fade-in-up" style={{ animationDelay: "0.8s" }}>
            <Link href={tickets.href} aria-label={tickets.label}>
              <button className={`px-6 py-3 rounded-xl ${brand.ctaGradient} inline-flex items-center gap-2`}>{tickets.icon}{tickets.label}</button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
