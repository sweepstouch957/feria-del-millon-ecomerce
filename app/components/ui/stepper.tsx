"use client";

import * as React from "react";
import { Check } from "lucide-react";

/* Pasos del checkout, sistema editorial v2: número en versalitas, raya fina
   que se va rellenando con el acento. Mismos tokens --fg/--bg/--acc que el
   resto del sitio; sin Tailwind ni azules. */

export type StepperProps = {
  /** Nombres de los pasos (en orden) */
  steps: string[];
  /** Paso actual (1..steps.length) */
  current: number;
  /** Permite ir a otro paso. Úsalo para bloquear avances si falta validación. */
  onStepChange?: (next: number) => void;
  /** Si es true, solo permite retroceder con click */
  lockForward?: boolean;
  className?: string;
  /** Descripción corta bajo cada paso. Opcional */
  descriptions?: string[];
};

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;
const EYEBROW: React.CSSProperties = { fontWeight: 500, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" };

export function Stepper({ steps, current, onStepChange, lockForward = true, className, descriptions }: StepperProps) {
  const total = steps.length;
  return (
    <ol
      className={className}
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
        gap: 10,
      }}
    >
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        const canGo = !lockForward || idx < current;
        return (
          <li key={label} style={{ minWidth: 0 }}>
            <button
              type="button"
              aria-current={active ? "step" : undefined}
              disabled={!canGo}
              onClick={() => (canGo ? onStepChange?.(idx) : undefined)}
              style={{
                width: "100%",
                background: "transparent",
                border: 0,
                padding: 0,
                color: "inherit",
                font: "inherit",
                textAlign: "left",
                cursor: canGo ? "pointer" : "default",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span
                aria-hidden
                style={{
                  display: "block",
                  height: 2,
                  width: "100%",
                  background: done || active ? "var(--acc)" : mix(14),
                  transition: "background-color .3s ease",
                }}
              />
              <span style={{ display: "flex", alignItems: "center", gap: 8, ...EYEBROW, color: active ? "var(--fg)" : mix(done ? 70 : 45) }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    border: `1px solid ${active ? "var(--fg)" : done ? "var(--acc)" : mix(30)}`,
                    background: done ? "var(--acc)" : "transparent",
                    color: done ? "#0B0B0A" : "inherit",
                    fontSize: 10,
                    letterSpacing: 0,
                    flex: "0 0 auto",
                  }}
                >
                  {done ? <Check size={11} /> : idx}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
              </span>
              {descriptions?.[i] && (
                <span className="fdm-step-desc" style={{ fontSize: 12.5, lineHeight: 1.4, color: mix(active ? 70 : 45) }}>
                  {descriptions[i]}
                </span>
              )}
            </button>
          </li>
        );
      })}
      <style>{`@media (max-width: 600px) { .fdm-step-desc { display: none; } }`}</style>
    </ol>
  );
}
