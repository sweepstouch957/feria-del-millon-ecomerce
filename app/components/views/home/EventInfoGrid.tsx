"use client";

import { EventInfoCard } from "@components/EventInfoCard";

export default function EventInfoGrid({ items }: { items: any[] }) {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {items.map((item) => (
        <EventInfoCard key={item.title} item={item} />
      ))}
    </div>
  );
}