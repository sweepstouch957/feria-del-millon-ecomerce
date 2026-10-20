// components/tickets/DayCard.tsx — un día de feria, sistema editorial v2.
"use client";

import { TicketDay } from "./ticketTypes";
import { CapacityBar, EYEBROW, Pill } from "./TicketAtoms";
import { formatMoney } from "@lib/utils";

const KIND_LABEL: Record<string, string> = {
  opening: "Apertura",
  normal: "Día de feria",
  penultimate: "Penúltimo día",
  last: "Último día",
  presale: "Preventa",
};

type Props = {
  day: TicketDay;
  selected?: boolean;
  onSelect?: (day: TicketDay) => void;
  currency?: string;
};

export function DayCard({ day, selected, onSelect, currency = "COP" }: Props) {
  const soldOut = day.cap - day.sold <= 0;
  const [dow, ...rest] = day.display.split(" ");
  return (
    <button
      type="button"
      onClick={() => onSelect?.(day)}
      disabled={soldOut}
      aria-pressed={selected}
      className={`fdm-tix-card${selected ? " is-selected" : ""}`}
      style={{ display: "flex", flexDirection: "column", gap: 14, padding: "18px 18px 16px", textAlign: "left", cursor: soldOut ? "not-allowed" : "pointer", opacity: soldOut ? 0.45 : 1 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ ...EYEBROW, opacity: 0.65 }}>{KIND_LABEL[day.kind] || "Día"}</span>
        {day.isToday && <Pill tone="acc">Hoy</Pill>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, lineHeight: 1 }}>
        <span style={{ fontSize: "clamp(30px,3.2vw,40px)", fontWeight: 300, letterSpacing: "-0.01em" }}>{dow}</span>
        <span style={{ fontSize: 15, opacity: 0.75 }}>{rest.join(" ")}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 19, fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>{formatMoney(day.price, currency)}</span>
        <span style={{ fontSize: 12, opacity: 0.6 }}>por persona</span>
      </div>
      <CapacityBar cap={day.cap} sold={day.sold} onDark={selected} />
    </button>
  );
}
