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
          {/* Track */}
          <div className="absolute left-0 right-0 top-[30px] h-1 rounded-full bg-gray-200/70 dark:bg-white/10" />

          {/* Progress (Radix) */}
          <Progress.Root
            value={pct}
            className="absolute left-0 right-0 top-[30px] h-1 rounded-full overflow-hidden"
            data-slot="stepper-progress"
          >
            <Progress.Indicator
              className={cn(
                "h-full w-full origin-left",
                "bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-500"
              )}
              style={{ transform: `translateX(-${100 - pct}%)` }}
            />
          </Progress.Root>

          {/* Steps */}
          <div
            className="relative grid grid-cols-[repeat(var(--cols),1fr)] gap-6"
            style={{
              // CSS var para grid flexible
              ["--cols" as any]: total,
            }}
          >
            {steps.map((label, i) => {
              const idx = i + 1;
              const isComplete = current > idx;
              const isCurrent = current === idx;

              const canGo =
                !lockForward ||
                idx <= current ||
                (onStepChange && idx < current);

              const ball = (
                <button
                  type="button"
                  aria-current={isCurrent ? "step" : undefined}
                  aria-label={`Paso ${idx}: ${label}`}
                  disabled={!canGo}
                  onClick={() => (canGo ? onStepChange?.(idx) : undefined)}
                  className={cn(
                    "grid size-14 place-items-center rounded-full border transition-all duration-300",
                    "shadow-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-600/60 disabled:opacity-60",
                    isComplete &&
                      "border-transparent bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-200",
                    isCurrent &&
                      "border-blue-600 bg-white text-blue-700 shadow-lg",
                    !isComplete &&
                      !isCurrent &&
                      "border-gray-300 bg-gray-100 text-gray-600"
                  )}
                >
                  {isComplete ? <Check className="h-6 w-6" /> : idx}
                </button>
              );

              return (
                <div key={label} className="flex flex-col items-center">
                  {descriptions && descriptions[i] ? (
                    <Tooltip.Provider delayDuration={100}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>{ball}</Tooltip.Trigger>
                        <Tooltip.Content
                          side="top"
                          align="center"
                          className={cn(
                            "z-50 rounded-md border bg-white px-3 py-2 text-sm shadow-md",
                            "border-gray-200 text-gray-800",
                            "dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-100"
                          )}
                        >
                          {descriptions[i]}
                          <Tooltip.Arrow className="fill-white dark:fill-neutral-900" />
                        </Tooltip.Content>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  ) : (
                    ball
                  )}

                  <div className="mt-3 text-center">
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
                    {isCurrent && (
                      <p className="mt-1 text-xs text-blue-600/80">
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
          <span className="text-xs font-semibold text-gray-900">
            {steps[current - 1]}
          </span>
        </div>

        <Progress.Root
          value={pct}
          className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200/80 dark:bg-white/10"
        >
          <Progress.Indicator
            className="h-full w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-fuchsia-500"
            style={{ transform: `translateX(-${100 - pct}%)` }}
          />
        </Progress.Root>

        <div className="flex items-center justify-between">
          {steps.map((_, i) => {
            const idx = i + 1;
            const active = current >= idx;
            return (
              <div
                key={idx}
                className={cn(
                  "grid size-6 place-items-center rounded-full text-[10px] font-semibold",
                  active
                    ? "bg-blue-600 text-white shadow"
                    : "bg-gray-300 text-gray-700"
                )}
              >
                {current > idx ? "✓" : idx}
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
