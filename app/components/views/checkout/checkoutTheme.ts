/* Tokens del sistema editorial v2 para el checkout.
   Los mismos --bg/--fg/--acc/--panel que usan catálogo, obra y artista,
   mapeados a los --fdm-* que el layout inyecta server-side. */

export const mix = (pct: number) =>
  `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

export const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10.5,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

export const ROOT_VARS = {
  "--bg": "var(--fdm-bg,#F7F6F2)",
  "--fg": "var(--fdm-fg,#0B0B0A)",
  "--acc": "var(--fdm-green,#3FA46E)",
  "--panel": "var(--fdm-panel,#0B0B0A)",
  background: "var(--bg)",
  color: "var(--fg)",
  fontFamily: "Jost, system-ui, sans-serif",
  fontWeight: 400,
  letterSpacing: "0.005em",
  minHeight: "100vh",
  width: "100%",
  overflowX: "hidden",
} as React.CSSProperties;

export const CHECKOUT_CSS = `
  .fdm-check a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-check-link:hover { color: var(--acc); }
`;
