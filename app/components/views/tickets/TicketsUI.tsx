// components/tickets/TicketsUI.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { BadgeCheck, Info, Mail, QrCode, Sparkles, User, Users } from "lucide-react";

import {
  TicketDay,
  TicketsUIProps,
  classNames,
} from "./ticketTypes";
import { Pill, QtyStepper, LabeledInput } from "./TicketAtoms";
import { DayCard } from "./DayCard";
import { TicketsPreviewModal } from "./TicketsPreviewModal";
import { formatMoney } from "@lib/utils";

export default function TicketsUI({
  eventName,
  currency = "COP",
  days,
  initialQty = 1,
  onBuyClick,
}: TicketsUIProps) {
  const [selectedDay, setSelectedDay] = useState<TicketDay | null>(days[0] ?? null);
  const [qty, setQty] = useState<number>(initialQty);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const total = useMemo(
    () => (!selectedDay ? 0 : selectedDay.price * qty),
    [selectedDay, qty]
  );

  const canBuy = Boolean(
    selectedDay && qty > 0 && buyerName && /\S+@\S+\.\S+/.test(buyerEmail)
  );

  const remaining = useMemo(() => {
    if (!selectedDay) return 0;
    return Math.max(0, selectedDay.cap - selectedDay.sold);
  }, [selectedDay]);

  const handleBuy = () => {
    if (!selectedDay) return;

    onBuyClick?.({
      day: selectedDay,
      quantity: qty,
      buyer: { name: buyerName, email: buyerEmail },
    });

    setShowPreview(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-slate-800" />
          <h2 className="text-xl font-bold md:text-2xl">{eventName}</h2>
          <Pill className="ml-auto bg-slate-900 text-white">
            <Users className="mr-1.5 size-3.5" />
            Cap. dinámica por día
          </Pill>
        </div>
        <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
          <Info className="size-4" />
          Apertura 3,000 @ 55.000 — Intermedios 2,000 @ 33.000 — Penúltimo/Último 2,500 @
          33.000.
        </p>
      </div>

      {/* Days */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((d) => (
          <DayCard
            key={d.date}
            day={d}
            selected={selectedDay?.date === d.date}
            onSelect={setSelectedDay}
            currency={currency}
          />
        ))}
      </div>

      {/* Order box */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compra */}
        <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-5 text-slate-800" />
            <h3 className="text-lg font-semibold">Completar datos</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledInput
              label="Nombre"
              placeholder="Tu nombre completo"
              value={buyerName}
              onChange={setBuyerName}
              icon={<User className="size-4 text-slate-500" />}
            />
            <LabeledInput
              label="Email"
              placeholder="tucorreo@dominio.com"
              value={buyerEmail}
              onChange={setBuyerEmail}
              icon={<Mail className="size-4 text-slate-500" />}
              type="email"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Cantidad</div>
              <QtyStepper
                value={qty}
                min={1}
                max={Math.min(10, Math.max(1, remaining))}
                onChange={setQty}
              />
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Total</div>
              <div className="text-2xl font-bold">{formatMoney(total, currency)}</div>
            </div>
          </div>

          <button
            type="button"
            disabled={!canBuy || !selectedDay || qty > remaining}
            onClick={handleBuy}
            className={classNames(
              "w-full rounded-2xl py-3 text-sm font-semibold text-white transition-all",
              canBuy && qty <= remaining
                ? "bg-slate-900 hover:bg-slate-800"
                : "cursor-not-allowed bg-slate-300"
            )}
          >
            Comprar boletos
          </button>

          {!!selectedDay && (
            <p className="text-xs text-slate-500">
              {remaining > 0
                ? `Disponibles hoy: ${remaining}`
                : "Capacidad completa para este día"}
            </p>
          )}
        </div>

        {/* Resumen */}
        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <QrCode className="size-5 text-slate-800" />
            <h3 className="text-lg font-semibold">Resumen</h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <QrCode className="size-4 text-slate-500" />
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {selectedDay ? selectedDay.display : "Selecciona un día"}
                </div>
                <div className="text-xs text-slate-600">
                  {selectedDay
                    ? `${formatMoney(selectedDay.price, currency)} por boleto`
                    : "—"}
                </div>
              </div>
              <Pill className="bg-slate-900 text-white">{qty} boletos</Pill>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">Subtotal</span>
              <span className="text-sm font-semibold">
                {formatMoney(total, currency)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-slate-600">Cargos</span>
              <span className="text-sm font-semibold">—</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="text-sm">Total a pagar</span>
              <span className="text-lg font-bold">
                {formatMoney(total, currency)}
              </span>
            </div>
          </div>

          <div className="text-[12px] leading-relaxed text-slate-500">
            Al continuar aceptas los términos del evento. Tu QR se enviará por
            correo y también podrás descargarlo desde tu cuenta.
          </div>
        </div>
      </div>

      {/* Preview modal */}
      <TicketsPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        qty={qty}
        selectedDay={selectedDay}
        currency={currency}
      />
    </div>
  );
}

/**
 * Ejemplo opcional para pruebas
 */
export function ExampleTicketsSection() {
  const days: TicketDay[] = [
    {
      date: "2025-11-20",
      display: "Jue 20 Nov",
      cap: 3000,
      sold: 0,
      price: 55000,
      kind: "opening",
      isToday: false,
    },
    {
      date: "2025-11-21",
      display: "Vie 21 Nov",
      cap: 1500,
      sold: 0,
      price: 33000,
      kind: "normal",
    },
    {
      date: "2025-11-22",
      display: "Sáb 22 Nov",
      cap: 2500,
      sold: 0,
      price: 33000,
      kind: "penultimate",
    },
    {
      date: "2025-11-23",
      display: "Dom 23 Nov",
      cap: 2500,
      sold: 0,
      price: 33000,
      kind: "last",
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <TicketsUI
        eventName="Feria del Millón — Semana del Arte"
        days={days}
        onBuyClick={(payload) => console.log("BUY (mock):", payload)}
      />
    </div>
  );
}
