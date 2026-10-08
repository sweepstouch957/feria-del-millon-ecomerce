"use client";

import * as React from "react";

import { EYEBROW, btnGhost, btnLink, btnSolid, fieldHint, fieldLabel, mix } from "../studioTheme";

/* Las piezas chicas del estudio.

   Son cuatro y aburridas a propósito: versalita, campo, botón y hueso de
   carga. Estaban repetidas en siete archivos con medidas que ya no coincidían
   entre sí —una versalita de 9 px acá y de 10.5 allá—, y eso es justo lo que
   hace que una pantalla se vea hecha a pedazos. */

/* ── Versalita ──────────────────────────────────────────────────────────── */

export function Eyebrow({
  children,
  tone = "muted",
  size = 9.5,
  style,
}: {
  children: React.ReactNode;
  /** `accent` para lo que está bien, `bad` para lo que falta. */
  tone?: "accent" | "muted" | "faint" | "bad" | "inherit";
  size?: number;
  style?: React.CSSProperties;
}) {
  const color =
    tone === "accent"
      ? "var(--acc)"
      : tone === "bad"
        ? "#B4472A"
        : tone === "faint"
          ? mix(44)
          : tone === "inherit"
            ? "inherit"
            : mix(58);

  return <span style={{ ...EYEBROW, fontSize: size, color, ...style }}>{children}</span>;
}

/* ── Campo ──────────────────────────────────────────────────────────────── */

/** Etiqueta visible + control + ayuda + error, siempre en ese orden y siempre
 *  atados por `htmlFor`: un campo sin etiqueta es un campo que alguien va a
 *  llenar mal. */
export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: React.ReactNode;
  error?: unknown;
  children: React.ReactNode;
}) {
  const msg = typeof error === "string" ? error : undefined;
  return (
    <div>
      <label htmlFor={id} style={fieldLabel}>
        {label}
      </label>
      {children}
      {msg ? (
        <p role="alert" style={{ ...fieldHint, color: "#B4472A" }}>
          {msg}
        </p>
      ) : hint ? (
        <p style={fieldHint}>{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Botón ──────────────────────────────────────────────────────────────── */

type Variant = "solid" | "ghost" | "link";

const base = (v: Variant): React.CSSProperties =>
  v === "solid" ? btnSolid : v === "ghost" ? btnGhost : btnLink;

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** Alto distinto para barras y filas; el mínimo táctil sigue siendo 34. */
  compact?: boolean;
};

export function StudioButton({ variant = "ghost", compact, style, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className="fdm-studio-plain"
      {...rest}
      style={{
        ...base(variant),
        ...(compact && variant !== "link" ? { height: 34, padding: "0 16px" } : null),
        ...(rest.disabled ? { opacity: 0.45, cursor: "not-allowed" } : null),
        ...style,
      }}
    />
  );
}

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  compact?: boolean;
  disabled?: boolean;
};

/** Mismo botón, cuando lo que hace es navegar o descargar. */
export function StudioLink({ variant = "ghost", compact, disabled, style, ...rest }: LinkProps) {
  return (
    <a
      {...rest}
      aria-disabled={disabled || undefined}
      style={{
        ...base(variant),
        ...(compact && variant !== "link" ? { height: 34, padding: "0 16px" } : null),
        ...(disabled ? { opacity: 0.45, pointerEvents: "none" } : null),
        textDecoration: "none",
        ...style,
      }}
    />
  );
}

/* ── Hueso de carga ─────────────────────────────────────────────────────── */

/** Una barra que respira mientras llega el dato. Reserva el sitio, así que la
 *  página no salta cuando entra el contenido. */
export function Bone({
  w = "100%",
  h = 12,
  style,
}: {
  w?: number | string;
  h?: number | string;
  style?: React.CSSProperties;
}) {
  return <div className="fdm-skel" style={{ width: w, height: h, ...style }} />;
}
