/* Sistema editorial para el estudio del artista (/admin/artist).
   Hermano de accountTheme.ts: los mismos --bg/--fg/--acc del sitio, Jost,
   esquinas rectas, campos de línea inferior y versalitas.

   Existe aparte porque el estudio vive medio en Tailwind heredado (tablas,
   shadcn, react-hook-form) y medio en estilos inline. Lo que se reescribe va
   inline; lo que no, lo repinta STUDIO_CSS. */

export const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

export const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

/** Variables del sistema. Los modales se portalizan fuera del árbol de la
 *  página, así que cada uno las vuelve a declarar en su raíz. */
export const STUDIO_VARS = {
  "--bg": "var(--fdm-bg,#F7F6F2)",
  "--fg": "var(--fdm-fg,#0B0B0A)",
  "--acc": "var(--fdm-green,#3FA46E)",
  fontFamily: "Jost, system-ui, sans-serif",
  fontWeight: 400,
  letterSpacing: "0.005em",
  color: "var(--fg)",
} as React.CSSProperties;

/** Título de página: fino, en versalitas, como el resto del sitio. */
export const DISPLAY: React.CSSProperties = {
  margin: 0,
  fontWeight: 300,
  fontSize: "clamp(28px,3.6vw,46px)",
  lineHeight: 1.02,
  letterSpacing: "0.02em",
  textTransform: "uppercase",
};

/** Título dentro de un modal o bloque. */
export const HEADING: React.CSSProperties = {
  margin: 0,
  fontWeight: 400,
  fontSize: "clamp(19px,2vw,25px)",
  lineHeight: 1.15,
  letterSpacing: "0.01em",
};

export const BODY: React.CSSProperties = {
  margin: 0,
  fontSize: 14.5,
  lineHeight: 1.6,
  color: mix(72),
};

/* ── Botones ────────────────────────────────────────────────────────────────
   Píldora y versalitas. `solid` para la acción principal de la pantalla,
   `ghost` para todo lo demás: en una tabla con cuatro acciones por fila, cuatro
   botones verdes no dicen cuál importa. */

const BTN_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  height: 38,
  padding: "0 20px",
  borderRadius: 999,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "background .25s ease, border-color .25s ease, color .25s ease, opacity .25s ease",
  ...EYEBROW,
  fontSize: 10.5,
  letterSpacing: "0.14em",
};

export const btnSolid: React.CSSProperties = {
  ...BTN_BASE,
  background: "var(--acc)",
  color: "#0B0B0A",
  border: "1px solid var(--acc)",
};

export const btnGhost: React.CSSProperties = {
  ...BTN_BASE,
  background: "transparent",
  color: "var(--fg)",
  border: `1px solid ${mix(26)}`,
};

/* Interruptor de sección (inventario / entregas).
   Va chico y arriba a la derecha a propósito: la navegación de la página son
   los pasos, y esto solo cambia de asunto. Dos barras del mismo tamaño se
   leían como dos navegaciones peleando. */

export const segmentWrap: React.CSSProperties = {
  display: "inline-flex",
  padding: 3,
  gap: 2,
  borderRadius: 999,
  border: `1px solid ${mix(18)}`,
};

export const segment = (active: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  height: 32,
  padding: "0 15px",
  borderRadius: 999,
  border: 0,
  cursor: "pointer",
  background: active ? "var(--fg)" : "transparent",
  color: active ? "var(--bg)" : mix(60),
  transition: "background .25s ease, color .25s ease",
  ...EYEBROW,
  fontSize: 9.5,
  letterSpacing: "0.14em",
});

/** Acción en texto, para las filas de una tabla. */
export const btnLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  background: "transparent",
  border: 0,
  padding: "3px 0",
  cursor: "pointer",
  color: mix(62),
  transition: "color .25s ease",
  ...EYEBROW,
  fontSize: 9.5,
  letterSpacing: "0.13em",
};

/* ── Campos ─────────────────────────────────────────────────────────────── */

export const fieldLabel: React.CSSProperties = {
  display: "block",
  marginBottom: 2,
  ...EYEBROW,
  fontSize: 9.5,
  letterSpacing: "0.22em",
  color: mix(62),
};

export const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "9px 0",
  background: "transparent",
  color: "inherit",
  border: 0,
  borderBottom: `1px solid ${mix(26)}`,
  borderRadius: 0,
  fontFamily: "Jost, system-ui, sans-serif",
  fontSize: 16,
  outline: "none",
};

/** Nota al pie de un campo. */
export const fieldHint: React.CSSProperties = {
  margin: "5px 0 0",
  fontSize: 11.5,
  lineHeight: 1.5,
  color: mix(50),
};

/* ── Modales ────────────────────────────────────────────────────────────────
   Papel sobre el fondo oscurecido, sin sombras ni esquinas redondas. */

export const sheetOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 55,
  background: "color-mix(in srgb, #0B0B0A 72%, transparent)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "clamp(12px,3vw,28px)",
  overflowY: "auto",
};

export const sheetPanel: React.CSSProperties = {
  ...STUDIO_VARS,
  width: "100%",
  background: "var(--bg)",
  border: `1px solid ${mix(16)}`,
  maxHeight: "92vh",
  display: "flex",
  flexDirection: "column",
};

/** Regla fina de separación. */
export const hair = (pct = 14) => `1px solid ${mix(pct)}`;

/* ── Tailwind heredado, repintado ───────────────────────────────────────────
   El estudio trae tarjetas blancas, grises y sombras de otra época. En vez de
   reescribir formularios con zod + react-hook-form, se reasignan sus
   utilitarios — el mismo truco de accountTheme. */
export const STUDIO_CSS = `
  .fdm-studio, .fdm-studio-sheet {
    font-family: Jost, system-ui, sans-serif;
    letter-spacing: 0.005em;
  }

  /* Superficies y bordes heredados */
  .fdm-studio .bg-white,
  .fdm-studio .bg-gray-50,
  .fdm-studio-sheet .bg-white,
  .fdm-studio-sheet .bg-gray-50 { background: transparent; }
  .fdm-studio .bg-gray-100,
  .fdm-studio-sheet .bg-gray-100 { background: ${mix(7)}; }
  .fdm-studio [class*="rounded"],
  .fdm-studio-sheet [class*="rounded"] { border-radius: 0; }
  .fdm-studio .rounded-full,
  .fdm-studio-sheet .rounded-full { border-radius: 999px; }
  .fdm-studio [class*="shadow"],
  .fdm-studio-sheet [class*="shadow"] { box-shadow: none; }
  .fdm-studio [class*="border-gray"],
  .fdm-studio [class*="ring-gray"],
  .fdm-studio-sheet [class*="border-gray"],
  .fdm-studio-sheet [class*="ring-gray"] { border-color: ${mix(14)}; --tw-ring-color: ${mix(14)}; }

  .fdm-studio .text-gray-900, .fdm-studio-sheet .text-gray-900 { color: var(--fg); }
  .fdm-studio .text-gray-700, .fdm-studio .text-gray-600,
  .fdm-studio-sheet .text-gray-700, .fdm-studio-sheet .text-gray-600 { color: ${mix(70)}; }
  .fdm-studio .text-gray-500, .fdm-studio-sheet .text-gray-500 { color: ${mix(56)}; }
  .fdm-studio .text-gray-400, .fdm-studio-sheet .text-gray-400 { color: ${mix(44)}; }
  .fdm-studio .text-red-600, .fdm-studio .text-red-500,
  .fdm-studio-sheet .text-red-600, .fdm-studio-sheet .text-red-500 { color: #B4472A; }

  /* Etiquetas de campo */
  .fdm-studio label, .fdm-studio-sheet label {
    font-weight: 500;
    font-size: 9.5px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: ${mix(62)};
  }
  /* La casilla con su frase larga al lado se lee como texto, no como etiqueta */
  .fdm-studio label.fdm-studio-check, .fdm-studio-sheet label.fdm-studio-check {
    font-size: 13.5px;
    letter-spacing: 0.005em;
    text-transform: none;
    font-weight: 400;
    color: ${mix(72)};
    line-height: 1.5;
  }

  /* Campos: línea inferior, como login y checkout */
  .fdm-studio input:not([type="file"]):not([type="checkbox"]):not([type="radio"]),
  .fdm-studio select,
  .fdm-studio textarea,
  .fdm-studio-sheet input:not([type="file"]):not([type="checkbox"]):not([type="radio"]),
  .fdm-studio-sheet select,
  .fdm-studio-sheet textarea {
    width: 100%;
    height: auto;
    padding: 9px 0;
    background: transparent;
    color: inherit;
    border: 0;
    border-bottom: 1px solid ${mix(26)};
    border-radius: 0;
    box-shadow: none;
    font-family: Jost, system-ui, sans-serif;
    font-size: 16px;
    font-weight: 400;
    outline: none;
    transition: border-color .3s ease;
  }
  .fdm-studio textarea, .fdm-studio-sheet textarea { line-height: 1.6; resize: vertical; }
  .fdm-studio input:focus, .fdm-studio select:focus, .fdm-studio textarea:focus,
  .fdm-studio-sheet input:focus, .fdm-studio-sheet select:focus, .fdm-studio-sheet textarea:focus {
    border-color: var(--acc);
    box-shadow: none;
    outline: none;
  }
  .fdm-studio input::placeholder, .fdm-studio textarea::placeholder,
  .fdm-studio-sheet input::placeholder, .fdm-studio-sheet textarea::placeholder {
    color: ${mix(36)};
  }
  .fdm-studio input[type="checkbox"], .fdm-studio-sheet input[type="checkbox"] {
    accent-color: var(--acc);
    width: 15px;
    height: 15px;
  }

  /* Botones heredados de shadcn: píldora y versalitas */
  .fdm-studio button:not(.fdm-studio-plain),
  .fdm-studio-sheet button:not(.fdm-studio-plain) {
    border-radius: 999px;
    font-family: Jost, system-ui, sans-serif;
    font-weight: 500;
    font-size: 10.5px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .fdm-studio a, .fdm-studio-sheet a { transition: color .3s ease, border-color .3s ease; }

  /* Foco visible: se navega con teclado y el anillo del navegador no se quita */
  .fdm-studio :focus-visible, .fdm-studio-sheet :focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 2px;
  }

  /* Carga: barras que respiran, no spinners */
  @keyframes fdmPulse { 0%,100% { opacity: .5 } 50% { opacity: .2 } }
  .fdm-skel {
    background: ${mix(20)};
    animation: fdmPulse 1.4s ease-in-out infinite;
  }

  /* Entrada de modales y filas, con su salida más corta */
  @keyframes fdmSheetIn { from { opacity: 0; transform: translateY(10px) scale(.99) } to { opacity: 1; transform: none } }
  @keyframes fdmFadeIn { from { opacity: 0 } to { opacity: 1 } }
  .fdm-sheet-anim { animation: fdmSheetIn .26s cubic-bezier(.22,.8,.3,1) }
  .fdm-fade-anim { animation: fdmFadeIn .2s ease-out }

  @media (prefers-reduced-motion: reduce) {
    .fdm-studio *, .fdm-studio-sheet * {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .01ms !important;
    }
  }
`;
