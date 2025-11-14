// components/tickets/ticketTypes.ts
export type TicketDayKind = "opening" | "penultimate" | "last" | "normal" | "presale";

export type TicketDay = {
  date: string; // YYYY-MM-DD
  display: string; // Ej: "Jue 25 Sep"
  price: number;
  cap: number;
  sold: number;
  kind: TicketDayKind;
  isToday?: boolean;
};

export type TicketsUIProps = {
  eventName: string;
  currency?: string; // default: COP
  days: TicketDay[];
  initialQty?: number;
  onBuyClick?: (payload: {
    day: TicketDay;
    quantity: number;
    buyer: { name: string; email: string };
  }) => void;
};


export const capPct = (sold: number, cap: number) =>
  Math.max(0, Math.min(100, Math.round((sold / Math.max(1, cap)) * 100)));

export const badges: Record<
  TicketDayKind,
  {
    label: string;
    className: string;
  }
> = {
  opening: {
    label: "Apertura",
    className: "bg-fuchsia-600/15 text-fuchsia-600",
  },
  penultimate: {
    label: "Penúltimo día",
    className: "bg-amber-500/15 text-amber-600",
  },
  last: {
    label: "Último día",
    className: "bg-red-500/15 text-red-600",
  },
  normal: {
    label: "Día regular",
    className: "bg-slate-500/10 text-slate-600",
  },
  presale: {
    label: "Preventa",
    className: "bg-emerald-500/15 text-emerald-600",
  },
};

export function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
