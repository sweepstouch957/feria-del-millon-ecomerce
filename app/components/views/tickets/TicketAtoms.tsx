// components/tickets/TicketAtoms.tsx
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { capPct, classNames } from "./ticketTypes";

export function Pill({
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

export function CapacityBar({ cap, sold }: { cap: number; sold: number }) {
  const pct = capPct(sold, cap);
  const soft = pct < 60;
  const medium = pct >= 60 && pct < 85;
  const danger = pct >= 85;

  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-[12px] text-slate-600">
        <span>
          Vendidos: <strong>{sold}</strong> / {cap}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
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

type QtyStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
};

export function QtyStepper({ value, min = 1, max = 10, onChange }: QtyStepperProps) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-300">
      <button
        type="button"
        className="px-3 py-2 hover:bg-slate-50 disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <ChevronLeft className="size-4" />
      </button>
      <div className="px-4 py-2 text-sm font-semibold tabular-nums">{value}</div>
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

type LabeledInputProps = {
  icon?: React.ReactNode;
  label: string;
  placeholder?: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
};

export function LabeledInput({
  icon,
  label,
  placeholder,
  value,
  type = "text",
  onChange,
}: LabeledInputProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-slate-900">
        {icon}
        <input
          className="w-full bg-transparent text-sm outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
        />
      </div>
    </div>
  );
}
