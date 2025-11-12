"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Ticket as TicketIcon,
  Users,
  Info,
  ChevronLeft,
  ChevronRight,
  Mail,
  User,
  QrCode,
  Sparkles,
  BadgeCheck,
} from "lucide-react";

/** ─────────────────────────────────────────────────────────────────────────────
 *  Tipos
 *  ────────────────────────────────────────────────────────────────────────────*/
export type TicketDayKind =
  | "opening"
  | "penultimate"
  | "last"
  | "normal"
  | "presale";

export type TicketDay = {
  date: string; // YYYY-MM-DD
  display: string; // Ej: "Jue 25 Sep"
  price: number; // en COP p.ej. 33000
  cap: number; // capacidad total
  sold: number; // vendidos
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
  }) => void; // callback para que luego conectes tu service
};

/** ─────────────────────────────────────────────────────────────────────────────
 *  Utils
 *  ────────────────────────────────────────────────────────────────────────────*/
const fmtPrice = (v: number, currency = "COP") =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(v);

const capPct = (sold: number, cap: number) =>
  Math.max(0, Math.min(100, Math.round((sold / Math.max(1, cap)) * 100)));

const badges: Record<TicketDayKind, { label: string; className: string }> = {
  opening: {
    label: "Apertura",
    className: "bg-fuchsia-600/15 text-fuchsia-600",
  },
  penultimate: {
    label: "Penúltimo día",
    className: "bg-amber-500/15 text-amber-600",
  },
  last: { label: "Último día", className: "bg-red-500/15 text-red-600" },
  normal: { label: "Día regular", className: "bg-slate-500/10 text-slate-600" },
  presale: {
    label: "Preventa",
    className: "bg-emerald-500/15 text-emerald-600",
  },
};

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Componentes atómicos
 *  ────────────────────────────────────────────────────────────────────────────*/
function Pill({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        className
      )}
    >
      {children}
    </span>
  );
}

function CapacityBar({ cap, sold }: { cap: number; sold: number }) {
  const pct = capPct(sold, cap);
  const soft = pct < 60;
  const medium = pct >= 60 && pct < 85;
  const danger = pct >= 85;

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-[12px] text-slate-600">
        <span>
          Vendidos: <strong>{sold}</strong> / {cap}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
        <div
          className={classNames(
            "h-full transition-all",
            soft && "bg-emerald-500",
            medium && "bg-amber-500",
            danger && "bg-red-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function QtyStepper({
  value,
  min = 1,
  max = 10,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-xl border border-slate-300 overflow-hidden">
      <button
        type="button"
        className="px-3 py-2 hover:bg-slate-50 disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <ChevronLeft className="size-4" />
      </button>
      <div className="px-4 py-2 text-sm font-semibold tabular-nums">
        {value}
      </div>
      <button
        type="button"
        className="px-3 py-2 hover:bg-slate-50 disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function LabeledInput({
  icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon?: React.ReactNode;
  label: string;
  placeholder?: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-slate-900">
        {icon}
        <input
          className="w-full bg-transparent outline-none text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
        />
      </div>
    </div>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Tarjeta de día (selección)
 *  ────────────────────────────────────────────────────────────────────────────*/
function DayCard({
  day,
  selected,
  onSelect,
  currency = "COP",
}: {
  day: TicketDay;
  selected?: boolean;
  onSelect?: (day: TicketDay) => void;
  currency?: string;
}) {
  const k = badges[day.kind];
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect?.(day)}
      className={classNames(
        "w-full text-left rounded-2xl border transition-all p-4 bg-white",
        selected
          ? "border-slate-900 shadow-md"
          : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays className="size-4 text-slate-500" />
        <span className="text-sm font-semibold">{day.display}</span>
        <Pill className={classNames("ml-auto", k.className)}>{k.label}</Pill>
        {day.isToday && (
          <Pill className="bg-blue-500/10 text-blue-600">Hoy</Pill>
        )}
      </div>

      <div className="flex items-end gap-3 mb-3">
        <span className="text-2xl font-bold">
          {fmtPrice(day.price, currency)}
        </span>
        <span className="text-[12px] text-slate-500">por boleto</span>
      </div>

      <CapacityBar cap={day.cap} sold={day.sold} />
    </motion.button>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Tarjeta de boleto (previa visual post-compra)
 *  ────────────────────────────────────────────────────────────────────────────*/
function TicketCard({
  code,
  date,
  price,
  currency = "COP",
}: {
  code: string;
  date: string;
  price: number;
  currency?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-4">
      <div className="rounded-xl bg-slate-900 text-white p-3">
        <TicketIcon className="size-6" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">Ticket #{code}</div>
        <div className="text-xs text-slate-600">{date}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold">{fmtPrice(price, currency)}</div>
        <div className="text-[11px] text-slate-500">QR listo</div>
      </div>
    </div>
  );
}

/** ─────────────────────────────────────────────────────────────────────────────
 *  Sección principal de UI
 *  ────────────────────────────────────────────────────────────────────────────*/
export default function TicketsUI({
  eventName,
  currency = "COP",
  days,
  initialQty = 1,
  onBuyClick,
}: TicketsUIProps) {
  const [selectedDay, setSelectedDay] = useState<TicketDay | null>(
    days[0] ?? null
  );
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
    // Solo preview local (UI), para que veas cómo se vería inmediatamente
    setShowPreview(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="size-5 text-slate-800" />
          <h2 className="text-xl md:text-2xl font-bold">{eventName}</h2>
          <Pill className="bg-slate-900 text-white ml-auto">
            <Users className="size-3.5 mr-1.5" />
            Cap. dinámica por día
          </Pill>
        </div>
        <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
          <Info className="size-4" />
          Apertura 3,000 @ 55.000 — Intermedios 2,000 @ 33.000 —
          Penúltimo/Último 2,500 @ 33.000.
        </p>
      </div>

      {/* Days */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compra */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-5 text-slate-800" />
            <h3 className="text-lg font-semibold">Completar datos</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
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
              <div className="text-2xl font-bold">
                {fmtPrice(total, currency)}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!canBuy || !selectedDay || qty > remaining}
            onClick={handleBuy}
            className={classNames(
              "w-full rounded-2xl py-3 text-white font-semibold transition-all",
              canBuy && qty <= remaining
                ? "bg-slate-900 hover:bg-slate-800"
                : "bg-slate-300 cursor-not-allowed"
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
        <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-2">
            <QrCode className="size-5 text-slate-800" />
            <h3 className="text-lg font-semibold">Resumen</h3>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <CalendarDays className="size-4 text-slate-500" />
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {selectedDay ? selectedDay.display : "Selecciona un día"}
                </div>
                <div className="text-xs text-slate-600">
                  {selectedDay
                    ? `${fmtPrice(selectedDay.price, currency)} por boleto`
                    : "—"}
                </div>
              </div>
              <Pill className="bg-slate-900 text-white">{qty} boletos</Pill>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">Subtotal</span>
              <span className="text-sm font-semibold">
                {fmtPrice(total, currency)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm text-slate-600">Cargos</span>
              <span className="text-sm font-semibold">—</span>
            </div>
            <div className="mt-2 border-t border-slate-200 pt-2 flex items-center justify-between">
              <span className="text-sm">Total a pagar</span>
              <span className="text-lg font-bold">
                {fmtPrice(total, currency)}
              </span>
            </div>
          </div>

          <div className="text-[12px] text-slate-500 leading-relaxed">
            Al continuar aceptas los términos del evento. Tu QR se enviará por
            correo y también podrás descargarlo desde tu cuenta.
          </div>
        </div>
      </div>

      {/* Preview modal simple (sin libs) */}
      {showPreview && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPreview(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TicketIcon className="size-5 text-slate-800" />
                <h4 className="text-lg font-semibold">Boletos generados</h4>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="rounded-xl px-3 py-1.5 text-sm border border-slate-300 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {Array.from({ length: qty }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <TicketCard
                    code={("0000" + (i + 1)).slice(-4)}
                    date={selectedDay.display}
                    price={selectedDay.price}
                    currency={currency}
                  />
                  <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-3">
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
                onClick={() => setShowPreview(false)}
              >
                Listo
              </button>
              <button className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm hover:bg-slate-800">
                Descargar todo (zip)
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

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
      cap: 1500,          // viernes 1500
      sold: 0,
      price: 33000,
      kind: "normal",
    },
    {
      date: "2025-11-22",
      display: "Sáb 22 Nov",
      cap: 2500,          // sábado 2500
      sold: 0,
      price: 33000,
      kind: "penultimate",
    },
    {
      date: "2025-11-23",
      display: "Dom 23 Nov",
      cap: 2500,          // domingo 2500
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
