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

  .fdm-acc-tablist {
    display: flex;
    flex-wrap: wrap;
    gap: clamp(18px, 2.4vw, 34px);
    background: transparent;
    border: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--fg) 20%, transparent);
    border-radius: 0;
    padding: 0;
    height: auto;
    box-shadow: none;
    width: 100%;
    justify-content: flex-start;
  }

  .fdm-acc-card {
    display: grid;
    gap: clamp(24px, 3vw, 48px);
    padding: clamp(20px, 2.4vw, 34px) 0;
    background: transparent;
    border: 0;
  }
  @media (min-width: 861px) {
    .fdm-acc-card { grid-template-columns: minmax(0, 1fr) minmax(0, 1.9fr); }
  }

  /* ── Tailwind heredado, repintado al sistema ─────────────────────
     La página traía tarjetas blancas y grises. En vez de reescribir el
     formulario (zod + react-hook-form), se reasignan sus utilitarios. */
  .fdm-acc .bg-white,
  .fdm-acc .bg-gray-50 { background: transparent; }
  .fdm-acc .bg-gray-100 { background: color-mix(in srgb, var(--fg) 7%, transparent); }
  .fdm-acc .rounded-2xl,
  .fdm-acc .rounded-xl,
  .fdm-acc .rounded-lg,
  .fdm-acc .rounded-md { border-radius: 0; }
  .fdm-acc .shadow,
  .fdm-acc .shadow-sm,
  .fdm-acc .shadow-md { box-shadow: none; }
  .fdm-acc .border-gray-100,
  .fdm-acc .border-gray-200,
  .fdm-acc .border-gray-300 { border-color: color-mix(in srgb, var(--fg) 14%, transparent); }

  .fdm-acc .text-gray-900 { color: var(--fg); }
  .fdm-acc .text-gray-700,
  .fdm-acc .text-gray-600 { color: color-mix(in srgb, var(--fg) 70%, transparent); }
  .fdm-acc .text-gray-500 { color: color-mix(in srgb, var(--fg) 58%, transparent); }
  .fdm-acc .text-gray-400 { color: color-mix(in srgb, var(--fg) 46%, transparent); }
  .fdm-acc .text-red-500 { color: #B4472A; }

  /* Etiquetas de campo */
  .fdm-acc label {
    font-weight: 500;
    font-size: 9.5px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--fg) 62%, transparent);
  }

  /* Campos: línea inferior, como en login y checkout */
  .fdm-acc input:not([type="file"]):not([type="checkbox"]):not([type="radio"]),
  .fdm-acc select,
  .fdm-acc textarea {
    width: 100%;
    height: auto;
    padding: 9px 0;
    background: transparent;
    color: inherit;
    border: 0;
    border-bottom: 1px solid color-mix(in srgb, var(--fg) 26%, transparent);
    border-radius: 0;
    box-shadow: none;
    font-family: Jost, system-ui, sans-serif;
    font-size: 16px;
    font-weight: 400;
    outline: none;
    transition: border-color .3s ease;
  }
  .fdm-acc input:focus,
  .fdm-acc select:focus,
  .fdm-acc textarea:focus {
    border-color: var(--acc);
    box-shadow: none;
    outline: none;
  }
  .fdm-acc input::placeholder,
  .fdm-acc textarea::placeholder {
    color: color-mix(in srgb, var(--fg) 36%, transparent);
  }

  /* Botones: píldora, versalitas */
  .fdm-acc button:not(.fdm-acc-tab):not([role="switch"]):not([role="tab"]) {
    border-radius: 999px;
    font-family: Jost, system-ui, sans-serif;
    font-weight: 500;
    font-size: 10.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  /* El avatar y las insignias de rol sí son redondos por diseño. */
  .fdm-acc .rounded-full { border-radius: 999px; }
`;
