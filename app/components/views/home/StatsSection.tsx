"use client";

import { StatItem } from "@components/StatItem";

export default function StatsSection({ stats }: { stats: { number: string; label: string; suffix?: string }[] }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Impacto y Reconocimiento</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <StatItem key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
