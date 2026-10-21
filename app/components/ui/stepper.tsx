"use client";

import * as React from "react";
import { Check } from "lucide-react";

/* Pasos del checkout, sistema editorial v2: círculos finos unidos por una raya
   que se va rellenando con el acento. En el teléfono solo se nombra el paso
   actual ("Paso 2 de 3 · Pago"). Mismos tokens --fg/--bg/--acc del sitio. */

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
  /** Ignorado: el stepper ya no muestra descripciones. */
  descriptions?: string[];
};

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;
const EYEBROW: React.CSSProperties = { fontWeight: 500, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase" };

export function Stepper({ steps, current, onStepChange, lockForward = true, className }: StepperProps) {
  const total = steps.length;
  return (
    <nav aria-label="Pasos de la compra" className={`fdm-steps${className ? ` ${className}` : ""}`}>
      <style>{`
        .fdm-steps { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .fdm-steps-item { display: inline-flex; align-items: center; gap: 10px; background: transparent; border: 0; padding: 0; color: inherit; font: inherit; white-space: nowrap; }
        .fdm-steps-item:disabled { cursor: default; }
        .fdm-steps-item:not(:disabled) { cursor: pointer; }
        .fdm-steps-item:not(:disabled):hover .fdm-steps-label { color: var(--acc); }
        .fdm-steps-dot { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; border: 1px solid ${mix(28)}; font-size: 11px; font-variant-numeric: tabular-nums; transition: all .3s ease; flex: 0 0 auto; }
        .fdm-steps-item.is-active .fdm-steps-dot { background: var(--fg); border-color: var(--fg); color: var(--bg); }
        .fdm-steps-item.is-done .fdm-steps-dot { background: var(--acc); border-color: var(--acc); color: #0B0B0A; }
        .fdm-steps-label { transition: color .3s ease; color: ${mix(45)}; }
        .fdm-steps-item.is-active .fdm-steps-label { color: var(--fg); }
        .fdm-steps-item.is-done .fdm-steps-label { color: ${mix(70)}; }
        .fdm-steps-line { flex: 1 1 24px; height: 1px; background: ${mix(14)}; min-width: 16px; transition: background-color .3s ease; }
        .fdm-steps-line.is-done { background: var(--acc); }
        .fdm-steps-mobile { display: none; }
        @media (max-width: 640px) {
          .fdm-steps-item:not(.is-active) .fdm-steps-label { display: none; }
          .fdm-steps-mobile { display: inline; }
        }
      `}</style>
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = current > idx;
        const active = current === idx;
        const canGo = !lockForward || idx < current;
        return (
          <React.Fragment key={label}>
            {i > 0 && <span aria-hidden className={`fdm-steps-line${current > i ? " is-done" : ""}`} />}
            <button
              type="button"
              className={`fdm-steps-item${active ? " is-active" : ""}${done ? " is-done" : ""}`}
              aria-current={active ? "step" : undefined}
              disabled={!canGo}
              onClick={() => (canGo ? onStepChange?.(idx) : undefined)}
            >
              <span className="fdm-steps-dot">{done ? <Check size={13} /> : idx}</span>
              <span className="fdm-steps-label" style={EYEBROW}>
                {active && <span className="fdm-steps-mobile">Paso {idx} de {total} · </span>}
                {label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
