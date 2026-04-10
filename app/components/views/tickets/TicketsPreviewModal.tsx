// components/tickets/TicketsPreviewModal.tsx
"use client";

import { motion } from "framer-motion";
import { Ticket as TicketIcon } from "lucide-react";
import type { Ticket } from "@services/ticket.service";
import { TicketCard } from "./TicketCard";
import { QrCode } from "lucide-react";
import { downloadQrPng } from "@services/ticket.service";

type Props = {
  open: boolean;
  onClose: () => void;
  tickets: Ticket[];
  currency?: string;
};

export function TicketsPreviewModal({
  open,
  onClose,
  tickets,
  currency = "COP",
}: Props) {
  if (!open || !tickets || tickets.length === 0) return null;

  const handleDownloadAll = () => {
    tickets.forEach((t, idx) => {
      downloadQrPng(t, `ticket-${t.shortCode || t.id || idx + 1}.png`);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="relative z-10 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TicketIcon className="size-5 text-slate-800" />
            <h4 className="text-lg font-semibold">Boletos generados</h4>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="space-y-3">
              <TicketCard
                ticket={ticket}
                currency={currency}
                onDownload={downloadQrPng}
              />
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <div className="rounded-lg bg-slate-900/90 p-2">
                  <QrCode className="size-5 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">QR listo</div>
                  <div className="text-xs text-slate-600">
                    Puedes descargarlo aquí o desde tu correo.
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
            onClick={onClose}
          >
            Listo
          </button>
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            onClick={handleDownloadAll}
          >
            Descargar todos los QR
          </button>
        </div>
      </motion.div>
    </div>
  );
}
