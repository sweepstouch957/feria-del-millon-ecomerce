"use client";

import * as React from "react";

import { EYEBROW, ICON_PATHS, btnGhost, btnGreen, btnLink, btnSolid, fieldHint, fieldLabel, mix } from "../studioTheme";

/* Las piezas chicas del estudio: rótulo, campo, botón, icono y hueso de carga. */

/* ── Iconos del diseño ──────────────────────────────────────────────────── */

const SHAPES: Record<string, React.ReactNode> = {
  grid: (<><rect x="4" y="4" width="6.5" height="6.5" /><rect x="13.5" y="4" width="6.5" height="6.5" /><rect x="4" y="13.5" width="6.5" height="6.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" /></>),
  qr: (<><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2" /></>),
  user: (<><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" /></>),
  eye: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M3.5 6.5l8.5 7 8.5-7" /></>),
  pin: (<><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z" /><circle cx="12" cy="10" r="2.3" /></>),
  copy: (<><rect x="8" y="8" width="12" height="12" rx="1" /><path d="M16 8V4H4v12h4" /></>),
  id: (<><rect x="3" y="5" width="18" height="14" rx="1" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.6-1.6 1.7-2 3-2s2.4.4 3 2M15 10h3M15 14h3" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>),
  camera: (<><path d="M4 8h3l2-3h6l2 3h3v11H4V8z" /><circle cx="12" cy="13" r="3.5" /></>),
  clock: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></>),
  alert: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5v5.5M12 16v.5" /></>),
  card: (<><rect x="3" y="6" width="18" height="12" rx="1.5" /><path d="M3 10h18M7 15h4" /></>),
  file: (<><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>),
};

export type IcoName = keyof typeof ICON_PATHS | "grid" | "qr" | "user" | "eye" | "mail" | "pin" | "copy" | "id" | "search" | "camera" | "alert" | "card" | "file";

export function Ico({ name, size = 18, sw = 1.5, style }: { name: IcoName; size?: number; sw?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} aria-hidden="true" style={{ flex: "none", ...style }}>
      {SHAPES[name] ?? <path d={(ICON_PATHS as Record<string, string>)[name]} />}
    </svg>
  );
}

/** Punto de paso: círculo con chulo (verde lleno si está hecho, contorno si no). */
export function Dot({ on, size }: { on?: boolean; size?: "sm" | "xs" }) {
  return (
    <span className={`fdm-st-dot${on ? " is-on" : ""}${size ? ` is-${size}` : ""}`}>
      <Ico name="check" size={16} sw={2} />
    </span>
  );
}

/* ── Rótulo ─────────────────────────────────────────────────────────────── */

export function Eyebrow({
  children,
  tone = "muted",
  size = 11,
  style,
}: {
  children: React.ReactNode;
  /** `accent` para lo que está bien, `bad` para lo que falta. */
  tone?: "accent" | "muted" | "faint" | "bad" | "inherit";
  size?: number;
  style?: React.CSSProperties;
}) {
  const color =
    tone === "accent" ? "var(--acc)" : tone === "bad" ? "var(--bad,#B4472A)" : tone === "faint" ? mix(56) : tone === "inherit" ? "inherit" : mix(66);

  // Nunca por debajo de 11px: los rótulos de 9px no se leían en celular.
  return <span style={{ ...EYEBROW, ...style, fontSize: Math.max(11, size), color: style?.color ?? color }}>{children}</span>;
}

/* ── Campo ──────────────────────────────────────────────────────────────── */

/** Etiqueta visible + control + ayuda + error, siempre en ese orden y siempre
 *  atados por `htmlFor`. */
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
    <div style={{ minWidth: 0 }}>
      <label htmlFor={id} style={fieldLabel}>
        {label}
      </label>
      {children}
      {msg ? (
        <p role="alert" style={{ ...fieldHint, color: "var(--bad,#B4472A)" }}>
          {msg}
        </p>
      ) : hint ? (
        <p style={fieldHint}>{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Botón ──────────────────────────────────────────────────────────────── */

type Variant = "solid" | "green" | "ghost" | "link";

const base = (v: Variant): React.CSSProperties =>
  v === "solid" ? btnSolid : v === "green" ? btnGreen : v === "ghost" ? btnGhost : btnLink;

const COMPACT: React.CSSProperties = { height: 44, padding: "0 14px", fontSize: 14 };

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  /** 44px en vez de 48 (filas y barras). */
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
        ...(compact && variant !== "link" ? COMPACT : null),
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
        ...(compact && variant !== "link" ? COMPACT : null),
        ...(disabled ? { opacity: 0.45, pointerEvents: "none" } : null),
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
