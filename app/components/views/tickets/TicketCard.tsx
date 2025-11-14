// components/tickets/TicketCard.tsx
import { formatMoney } from "@lib/utils";
import { Ticket as TicketIcon } from "lucide-react";

type TicketCardProps = {
  code: string;
  date: string;
  price: number;
  currency?: string;
};

export function TicketCard({
  code,
  date,
  price,
  currency = "COP",
}: TicketCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="rounded-xl bg-slate-900 p-3 text-white">
        <TicketIcon className="size-6" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">Ticket #{code}</div>
        <div className="text-xs text-slate-600">{date}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">{formatMoney(price, currency)}</div>
        <div className="text-[11px] text-slate-500">QR listo</div>
      </div>
    </div>
  );
}
