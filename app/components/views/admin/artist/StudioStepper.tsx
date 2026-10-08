"use client";

import { Check } from "lucide-react";
import { EYEBROW, mix } from "./studioTheme";

/* Los tres pasos para entregar el inventario.

   Antes todo estaba en una sola página larga y no se entendía qué tocaba
   primero. Acá cada paso dice qué falta y se puede ir y volver: no es un
   formulario por etapas, es un índice de lo que hay que tener listo. */

export type StepKey = "obras" | "proyecto" | "enviar";

export type Step = {
  key: StepKey;
  label: string;
  /** Qué falta o qué ya está, en una línea. */
  hint: string;
  done: boolean;
};

export default function StudioStepper({
  steps,
  current,
  onSelect,
}: {
  steps: Step[];
  current: StepKey;
  onSelect: (k: StepKey) => void;
}) {
  return (
    <nav aria-label="Pasos para entregar tu inventario">
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "grid",
          gap: 0,
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))",
          borderTop: `1px solid ${mix(16)}`,
        }}
      >
        {steps.map((s, i) => {
          const active = s.key === current;
          return (
            <li key={s.key} style={{ minWidth: 0 }}>
              <button
                type="button"
                className="fdm-studio-plain"
                onClick={() => onSelect(s.key)}
                aria-current={active ? "step" : undefined}
                style={{
                  width: "100%",
                  minHeight: 76,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 13,
                  padding: "18px 16px 18px 0",
                  background: "transparent",
                  border: 0,
                  // La línea de arriba es el riel del paso: verde si ya está.
                  borderTop: `2px solid ${active ? "var(--acc)" : s.done ? mix(40) : "transparent"}`,
                  marginTop: -1,
                  textAlign: "left",
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: 26,
                    height: 26,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 999,
                    border: `1px solid ${active || s.done ? "var(--acc)" : mix(26)}`,
                    background: s.done ? "var(--acc)" : "transparent",
                    color: s.done ? "#0B0B0A" : active ? "var(--acc)" : mix(52),
                    ...EYEBROW,
                    fontSize: 10,
                    letterSpacing: 0,
                  }}
                >
                  {s.done ? <Check size={13} strokeWidth={2.4} /> : i + 1}
                </span>

                <span style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      ...EYEBROW,
                      fontSize: 10.5,
                      letterSpacing: "0.16em",
                      color: active ? "var(--acc)" : mix(70),
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      display: "block",
                      marginTop: 6,
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: mix(active ? 66 : 48),
                    }}
                  >
                    {s.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
