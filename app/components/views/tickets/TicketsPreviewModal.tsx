// components/tickets/TicketsPreviewModal.tsx
"use client";

import { motion } from "framer-motion";
import { QrCode, Ticket as TicketIcon } from "lucide-react";
import { TicketDay } from "./ticketTypes";
import { TicketCard } from "./TicketCard";

type Props = {
  open: boolean;
  onClose: () => void;
  qty: number;
  selectedDay: TicketDay | null;
  currency?: string;
};

export function TicketsPreviewModal({
  open,
  onClose,
  qty,
  selectedDay,
  currency = "COP",
}: Props) {
  if (!open || !selectedDay) return null;

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
          {Array.from({ length: qty }).map((_, i) => (
            <div key={i} className="space-y-3">
              <TicketCard
                code={("0000" + (i + 1)).slice(-4)}
                date={selectedDay.display}
                price={selectedDay.price}
                currency={currency}
              />
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <div className="rounded-lg bg-slate-900/90 p-2">
                  <QrCode className="size-5 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium">QR listo</div>
                  <div className="text-xs text-slate-600">
                    Se mostrará aquí y llegará a tu correo.
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
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800">
            Descargar todo (zip)
          </button>
        </div>
      </motion.div>
    </div>
  );
}
