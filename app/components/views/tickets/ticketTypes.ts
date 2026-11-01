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
  remaining: number; // cupo restante
  utilization: number; // porcentaje de cupo vendido
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


/** Espejo de TICKET_TYPES en tickets-svc (el backend es quien fija el precio). */
export const TICKET_TYPE_OPTIONS: {
  key: "general" | "allpass" | "empresa" | "2x1";
  label: string;
  desc: string;
  price?: number; // sin precio = el del día elegido
  pickDay?: boolean;
  quantities?: number[];
  packPrices?: Record<string, number>;
  maxQty?: number;
}[] = [
  { key: "general", label: "General", desc: "Un día a elección.", pickDay: true },
  { key: "allpass", label: "All pass 4 días", desc: "Entra los cuatro días de feria.", price: 80000 },
  { key: "2x1", label: "Promoción 2x1", desc: "Solo en línea. Compra una entrada y recibe otra para el viernes de 12:00 a 6:00 p.m., hora Colombia.", pickDay: true },
  { key: "empresa", label: "Empresas", desc: "Paquetes de 20, 50 o 100 entradas, válidas por un día. Recibes un enlace para repartir. 20% de descuento desde 50.", price: 55000, quantities: [20, 50, 100], packPrices: { 20: 55000, 50: 44000, 100: 44000 } },
];

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
