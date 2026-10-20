// components/tickets/TicketAtoms.tsx — átomos del sistema editorial v2.
// Sin Tailwind: tokens --fg/--bg/--acc del layout (los mismos de catálogo y
// obra), así la página de entradas se ve igual al resto del sitio y sigue el
// tema claro/oscuro. Las clases .fdm-in / .fdm-step las define TicketsUI.
import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { capPct } from "./ticketTypes";

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

export const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10.5,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

export function Pill({
  children,
  tone = "line",
  style,
}: React.PropsWithChildren<{ tone?: "line" | "solid" | "acc"; style?: React.CSSProperties }>) {
  const tones: Record<string, React.CSSProperties> = {
    line: { border: `1px solid ${mix(25)}`, color: "inherit" },
    solid: { background: "var(--fg)", color: "var(--bg)" },
    acc: { background: "var(--acc)", color: "#0B0B0A" },
  };
  return (
    <span
      style={{
        ...EYEBROW,
        fontSize: 9.5,
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        padding: "0 10px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        ...tones[tone],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Barra fina de cupo: verde hasta 60 %, negra después, vacía si se agotó. */
export function CapacityBar({ cap, sold, onDark }: { cap: number; sold: number; onDark?: boolean }) {
  const pct = capPct(sold, cap);
  const track = onDark ? "rgba(245,244,239,.18)" : mix(12);
  const fill = pct >= 100 ? (onDark ? "rgba(245,244,239,.5)" : mix(45)) : pct >= 60 ? (onDark ? "var(--fdm-on-dark,#F5F4EF)" : "var(--fg)") : "var(--acc)";
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, opacity: 0.7, marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
        <span>{Math.max(0, cap - sold).toLocaleString("es-CO")} disponibles</span>
        <span>{pct}%</span>
      </div>
      <div style={{ height: 2, width: "100%", background: track, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: fill, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

type QtyStepperProps = { value: number; min?: number; max?: number; onChange: (v: number) => void };

export function QtyStepper({ value, min = 1, max = 10, onChange }: QtyStepperProps) {
  const btn: React.CSSProperties = {
    width: 44,
    height: 44,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: 0,
    color: "inherit",
    cursor: "pointer",
  };
  return (
    <div className="fdm-step" style={{ display: "inline-flex", alignItems: "center", border: `1px solid ${mix(25)}`, borderRadius: 999 }}>
      <button type="button" style={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Menos">
        <Minus size={15} />
      </button>
      <div style={{ minWidth: 36, textAlign: "center", fontSize: 17, fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <button type="button" style={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Más">
        <Plus size={15} />
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
  hint?: string;
};

/** Campo subrayado: etiqueta en versalitas, línea que se vuelve verde al enfocar. */
export function LabeledInput({ icon, label, placeholder, value, type = "text", onChange, hint }: LabeledInputProps) {
  const id = React.useId();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <label htmlFor={id} style={{ ...EYEBROW, fontSize: 9.5, opacity: 0.65 }}>{label}</label>
      <div className="fdm-in" style={{ display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${mix(25)}`, paddingBottom: 8, transition: "border-color .3s ease" }}>
        {icon && <span style={{ opacity: 0.5, display: "inline-flex" }}>{icon}</span>}
        <input
          id={id}
          style={{ width: "100%", background: "transparent", border: 0, outline: "none", color: "inherit", fontSize: 16, fontFamily: "inherit", fontWeight: 400, padding: 0 }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
        />
      </div>
      {hint && <span style={{ fontSize: 12, opacity: 0.6 }}>{hint}</span>}
    </div>
  );
}
