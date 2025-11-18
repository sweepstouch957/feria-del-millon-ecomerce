// components/tickets/TicketCard.tsx
"use client";

import { formatMoney } from "@lib/utils";
import { Ticket as TicketIcon } from "lucide-react";
import type { Ticket } from "@services/ticket.service";

type TicketCardProps = {
  ticket: Ticket;
  currency?: string;
  onDownload?: (ticket: Ticket) => void;
};

export function TicketCard({
  ticket,
  currency = "COP",
  onDownload,
}: TicketCardProps) {
  const code = ticket.shortCode || ticket.id;
  const dateLabel = new Date(ticket.eventDay).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="rounded-xl bg-slate-900 p-3 text-white">
        <TicketIcon className="size-6" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">Ticket #{code}</div>
        <div className="text-xs text-slate-600">{dateLabel}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">
          {formatMoney(ticket.price, currency)}
        </div>
        <div className="text-[11px] text-slate-500">
          {ticket.qrToken ? "QR listo" : "Generando QR…"}
        </div>
        {ticket.qrDataUrl && (
          <button
            type="button"
            onClick={() => onDownload?.(ticket)}
            className="mt-1 text-[11px] font-medium text-slate-900 underline"
          >
            Descargar QR
          </button>
        )}
      </div>
    </div>
  );
}
