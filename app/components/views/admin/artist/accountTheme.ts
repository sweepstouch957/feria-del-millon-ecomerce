/* Tokens del sistema editorial v2 para el panel de cuenta.
   Los mismos --bg/--fg/--acc/--panel del resto del sitio. */

export const mix = (pct: number) =>
  `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

export const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.18em",
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

export const ACCOUNT_CSS = `
  .fdm-acc a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-acc-link:hover { color: var(--acc); }

  /* Pestañas de shadcn repintadas al subrayado editorial. */
  .fdm-acc-tab {
    background: transparent;
    border: 0;
    border-bottom: 1px solid transparent;
    border-radius: 0;
    padding: 6px 0;
    cursor: pointer;
    font-family: Jost, system-ui, sans-serif;
    font-weight: 500;
    font-size: 11.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--fg) 55%, transparent);
    transition: color .3s ease, border-color .3s ease;
  }
  .fdm-acc-tab:hover { color: var(--acc); }
  .fdm-acc-tab[data-state="active"] {
    color: var(--acc);
    border-bottom-color: var(--acc);
    background: transparent;
    box-shadow: none;
  }
`;
