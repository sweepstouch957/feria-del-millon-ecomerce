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

/* Mismos tokens que la ficha de la obra (tarjetas, líneas, botón verde),
   con su versión oscura según el toggle global (data-theme). */
export const CHECKOUT_CSS = `
  .fdm-check-root { --card:#FAFAF7; --fg2:#5F5E57; --fg3:#8E8D86; --line:rgba(21,21,15,.1); --line2:rgba(21,21,15,.18); --inv:#0B0B0A; --invfg:#F5F4EF; }
  :root[data-theme="dark"] .fdm-check-root { --card:#171716; --fg2:#B8B7AF; --line:rgba(255,255,255,.1); --line2:rgba(255,255,255,.16); --inv:#F5F4EF; --invfg:#0B0B0A; }
  .fdm-check a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-check-link:hover { color: var(--acc); }
  .fdm-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; height:52px; padding:0 26px; border-radius:14px; border:1px solid var(--acc); background:var(--acc); color:#0B0B0A; font-family:inherit; font-size:15px; font-weight:600; cursor:pointer; transition:background .25s ease, border-color .25s ease, color .25s ease, opacity .25s ease; text-decoration:none; }
  .fdm-btn:hover:not(:disabled) { background:#2E8A58; border-color:#2E8A58; }
  .fdm-btn:disabled { opacity:.45; cursor:not-allowed; }
  .fdm-btn.is-ghost { background:transparent; color:var(--fg); border-color:var(--line2); }
  .fdm-btn.is-ghost:hover:not(:disabled) { background:var(--inv); color:var(--invfg); border-color:var(--inv); }
`;
