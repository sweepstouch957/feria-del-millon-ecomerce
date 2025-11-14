"use client";

import * as React from "react";
import * as Progress from "@radix-ui/react-progress";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Separator } from "@radix-ui/react-separator";
import { Check } from "lucide-react";
import { cn } from "@lib/utils";

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
  /** Descripciones para tooltip (mismo length que steps). Opcional */
  descriptions?: string[];
};

export function Stepper({
  steps,
  current,
  onStepChange,
  lockForward = true,
  className,
  descriptions,
}: StepperProps) {
  const total = steps.length;
  const pct =
    total > 1
      ? Math.min(100, Math.max(0, ((current - 1) / (total - 1)) * 100))
      : 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Desktop */}
      <div className="hidden sm:block">
        <div className="relative mx-auto max-w-4xl px-3">
          {/* Track base */}
          <div className="pointer-events-none absolute left-2 right-2 top-[34px] h-1 rounded-full bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200" />

          {/* Track progresivo */}
          <Progress.Root
            value={pct}
            className="pointer-events-none absolute left-2 right-2 top-[34px] h-1 overflow-hidden rounded-full"
            data-slot="stepper-progress"
          >
            <Progress.Indicator
              className={cn(
                "h-full w-full origin-left",
                "bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-500",
                "transition-transform duration-500 ease-out"
              )}
              style={{ transform: `translateX(-${100 - pct}%)` }}
            />
          </Progress.Root>

          {/* Steps */}
          <div
            className="relative grid gap-10"
            style={{
              ["--cols" as any]: total,
              gridTemplateColumns: `repeat(${total}, minmax(0,1fr))`,
            }}
          >
            {steps.map((label, i) => {
              const idx = i + 1;
              const isComplete = current > idx;
              const isCurrent = current === idx;
              const isPending = current < idx;

              const canGo =
                !lockForward || idx <= current || (onStepChange && idx < current);

              const stateLabel = isCurrent
                ? "En curso"
                : isComplete
                  ? "Completado"
                  : "Pendiente";

              const circle = (
                <button
                  type="button"
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Paso ${idx}: ${label}`}
                  disabled={!canGo}
                  onClick={() => (canGo ? onStepChange?.(idx) : undefined)}
                  className={cn(
                    "group relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-300",
                    "outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500/70 disabled:cursor-default disabled:opacity-60",
                    isComplete &&
                    "border-transparent bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-300/50",
                    isCurrent &&
                    "border-blue-500 bg-white text-blue-700 shadow-lg shadow-blue-300/40",
                    isPending &&
                    "border-gray-300 bg-gray-100 text-gray-500 hover:border-gray-400 hover:bg-gray-50"
                  )}
                >
                  {/* Glow para el paso actual */}
                  {isCurrent && (
                    <span className="pointer-events-none absolute inset-[-4px] rounded-full bg-blue-500/10 blur-sm" />
                  )}

                  <span className="relative flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold">
                    {isComplete ? <Check className="h-5 w-5" /> : idx}
                  </span>
                </button>
              );

              return (
                <div
                  key={label}
                  className="flex flex-col items-center text-center"
                >
                  {descriptions && descriptions[i] ? (
                    <Tooltip.Provider delayDuration={100}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>{circle}</Tooltip.Trigger>
                        <Tooltip.Content
                          side="top"
                          align="center"
                          sideOffset={8}
                          className={cn(
                            "z-50 rounded-md border bg-white px-3 py-2 text-xs shadow-md",
                            "border-gray-200 text-gray-800"
                          )}
                        >
                          {descriptions[i]}
                          <Tooltip.Arrow className="fill-white" />
                        </Tooltip.Content>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  ) : (
                    circle
                  )}

                  <div className="mt-3 space-y-1">
                    <p
                      className={cn(
                        "text-sm font-semibold tracking-tight",
                        isCurrent
                          ? "text-blue-700"
                          : isComplete
                            ? "text-gray-900"
                            : "text-gray-500"
                      )}
                    >
                      {label}
                    </p>
                    <div className="flex items-center justify-center">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          isCurrent &&
                          "bg-blue-50 text-blue-700 border border-blue-100",
                          isComplete &&
                          "bg-emerald-50 text-emerald-700 border border-emerald-100",
                          isPending &&
                          "bg-gray-100 text-gray-500 border border-gray-200"
                        )}
                      >
                        {stateLabel}
                      </span>
                    </div>
                    {isCurrent && (
                      <p className="text-xs text-blue-600/80">
                        Completa este paso para continuar
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile compacto */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            Paso {current} de {total}
          </span>
          <span className="max-w-[60%] truncate text-xs font-semibold text-gray-900">
            {steps[current - 1]}
          </span>
        </div>

        <Progress.Root
          value={pct}
          className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200/80"
        >
          <Progress.Indicator
            className="h-full w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-500 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${100 - pct}%)` }}
          />
        </Progress.Root>

        <div className="flex items-center justify-between">
          {steps.map((_, i) => {
            const idx = i + 1;
            const active = current >= idx;
            const done = current > idx;
            return (
              <div
                key={idx}
                className={cn(
                  "grid size-7 place-items-center rounded-full text-[10px] font-semibold shadow-sm",
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-700"
                )}
              >
                {done ? "✓" : idx}
              </div>
            );
          })}
        </div>

        <Separator
          decorative
          className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent"
        />
      </div>
    </div>
  );
}
