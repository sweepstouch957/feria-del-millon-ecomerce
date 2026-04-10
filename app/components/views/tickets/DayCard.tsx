// components/tickets/DayCard.tsx
"use client";

import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { TicketDay, badges, classNames } from "./ticketTypes";
import { CapacityBar, Pill } from "./TicketAtoms";
import { formatMoney } from "@lib/utils";

type Props = {
  day: TicketDay;
  selected?: boolean;
  onSelect?: (day: TicketDay) => void;
  currency?: string;
};

export function DayCard({ day, selected, onSelect, currency = "COP" }: Props) {
  // 👇 fallback bonito si no existe el badge para ese kind
  const k =
    badges[day.kind] ??
    ({
      label: "Día",
      className: "bg-slate-100 text-slate-700",
    } as const);

  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(day)}
      className={classNames(
        "w-full rounded-2xl border bg-white p-4 text-left transition-all",
        selected
          ? "border-slate-900 shadow-md"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <CalendarDays className="size-4 text-slate-500" />
        <span className="text-sm font-semibold">{day.display}</span>
        <Pill className={classNames("ml-auto", k.className)}>{k.label}</Pill>
       
      </div>

      <div className="mb-3 flex items-end gap-3">
        <span className="text-2xl font-bold">
          {formatMoney(day.price, currency)}
        </span>
        <span className="text-[12px] text-slate-500">por boleto</span>
      </div>

      <CapacityBar cap={day.cap} sold={day.utilization * 1000} />
    </motion.button>
  );
}
