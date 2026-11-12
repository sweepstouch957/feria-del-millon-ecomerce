/* Sistema del estudio del artista (/admin/artist) y de la postulación.
   Port de "Mi estudio — Artistas" (Claude Design, nov-2026): tarjetas blancas
   de radio 16, botones píldora de 44–52px en texto normal, campos con borde de
   52px y rótulos de 11px en versalitas. Mismos tokens que la tienda, con modo
   oscuro por data-theme.

   Las piezas nuevas usan las clases .fdm-st-* de STUDIO_CSS; las heredadas
   (formularios con Formik / react-hook-form / shadcn) se repintan desde aquí. */

export const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

/** Rótulo chico en versalitas (el único texto en mayúsculas del sistema). */
export const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

/** Variables base. Los modales se portalizan fuera del árbol de la página, así
 *  que cada uno las vuelve a declarar en su raíz; el resto de tokens los pone
 *  STUDIO_CSS sobre .fdm-studio / .fdm-studio-sheet. */
export const STUDIO_VARS = {
  "--bg": "var(--fdm-bg,#F7F6F2)",
  "--fg": "var(--fdm-fg,#111111)",
  "--acc": "var(--green,#1F7A50)",
  fontFamily: "Jost, system-ui, sans-serif",
  fontWeight: 400,
  letterSpacing: "0.005em",
  color: "var(--fg)",
} as React.CSSProperties;

/** Título de página. */
export const DISPLAY: React.CSSProperties = {
  margin: 0,
  fontWeight: 300,
  fontSize: "clamp(30px,4vw,36px)",
  lineHeight: 1.1,
};

/** Título dentro de un modal o tarjeta. */
export const HEADING: React.CSSProperties = {
  margin: 0,
  fontWeight: 500,
  fontSize: 20,
  lineHeight: 1.25,
};

export const BODY: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  lineHeight: 1.5,
  color: mix(68),
};

/* ── Botones: píldora, texto normal ───────────────────────────────────────
   `solid` (negro) para la acción principal de la pantalla, `green` para
   confirmar algo que queda hecho (guardar, enviar, marcar entregada) y
   `ghost` para todo lo demás. */

const BTN_BASE: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  height: 48,
  padding: "0 20px",
  borderRadius: 999,
  cursor: "pointer",
  whiteSpace: "nowrap",
  fontFamily: "Jost, system-ui, sans-serif",
  fontSize: 15,
  fontWeight: 400,
  letterSpacing: "normal",
  textTransform: "none",
  textDecoration: "none",
  boxSizing: "border-box",
  transition: "background .2s ease, border-color .2s ease, color .2s ease, opacity .2s ease, filter .2s ease",
};

export const btnSolid: React.CSSProperties = {
  ...BTN_BASE,
  fontWeight: 500,
  background: "var(--inv,#111111)",
  color: "var(--invfg,#FFFFFF)",
  border: "1px solid var(--inv,#111111)",
};

export const btnGreen: React.CSSProperties = {
  ...BTN_BASE,
  fontWeight: 500,
  background: "var(--acc)",
  color: "#FFFFFF",
  border: "1px solid var(--acc)",
};

export const btnGhost: React.CSSProperties = {
  ...BTN_BASE,
  background: "transparent",
  color: "var(--fg)",
  border: "1px solid var(--line2,#C9C6BD)",
};

/** Control segmentado (fondo gris, opción activa blanca). */
export const segmentWrap: React.CSSProperties = {
  display: "flex",
  padding: 4,
  borderRadius: 999,
  background: "var(--tile,#ECEAE3)",
};

export const segment = (active: boolean): React.CSSProperties => ({
  flex: "1 1 0",
  minWidth: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  height: 44,
  padding: "0 10px",
  borderRadius: 999,
  border: 0,
  cursor: "pointer",
  whiteSpace: "nowrap",
  background: active ? "var(--card,#FFFFFF)" : "transparent",
  color: "var(--fg)",
  fontFamily: "Jost, system-ui, sans-serif",
  fontSize: 14,
  fontWeight: active ? 500 : 400,
  letterSpacing: "normal",
  textTransform: "none",
  transition: "background .2s ease",
});

/** Acción en texto subrayado. */
export const btnLink: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  minHeight: 44,
  background: "transparent",
  border: 0,
  padding: 0,
  cursor: "pointer",
  color: "var(--fg)",
  fontFamily: "Jost, system-ui, sans-serif",
  fontSize: 15,
  fontWeight: 400,
  letterSpacing: "normal",
  textTransform: "none",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

/* ── Campos ─────────────────────────────────────────────────────────────── */

export const fieldLabel: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: "normal",
  textTransform: "none",
  color: "var(--fg)",
};

export const fieldInput: React.CSSProperties = {
  width: "100%",
  minHeight: 52,
  padding: "13px 16px",
  boxSizing: "border-box",
  background: "var(--card,#FFFFFF)",
  color: "var(--fg)",
  border: "1px solid var(--line2,#C9C6BD)",
  borderRadius: 12,
  fontFamily: "Jost, system-ui, sans-serif",
  fontSize: 16,
  outline: "none",
};

/** Nota al pie de un campo. */
export const fieldHint: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: 14,
  lineHeight: 1.45,
  color: mix(62),
};

/* ── Modales ────────────────────────────────────────────────────────────── */

export const sheetOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  // Por encima de la navegación del sitio (60) y de su menú de usuario (70).
  zIndex: 80,
  background: "rgba(17,17,17,.55)",
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
  border: "1px solid var(--line,#DEDBD3)",
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 24px 48px rgba(17,17,17,.18)",
  maxHeight: "92vh",
  display: "flex",
  flexDirection: "column",
};

/** Regla fina de separación. */
export const hair = (pct = 14) => `1px solid ${mix(pct)}`;

const SCOPE = ".fdm-studio, .fdm-studio-sheet";
const s = (sel: string) =>
  sel
    .split(",")
    .map((x) => `.fdm-studio ${x.trim()}, .fdm-studio-sheet ${x.trim()}`)
    .join(", ");

export const STUDIO_CSS = `
  ${SCOPE} {
    --fg2:#55534D; --fg3:#6B6963; --fg4:#8A877F;
    --line:#DEDBD3; --line2:#C9C6BD; --line3:#E7E4DC;
    --card:#FFFFFF; --tile:#ECEAE3; --soft:#F2F0EA;
    --green:#1F7A50; --green-deep:#17603F; --green-soft:#E4F1EA; --green-line:#BFD9CB;
    --warn:#6B4E00; --warn-soft:#F3E9D2; --warn-bg:#FBF3DF; --warn-line:#B58A1B; --warn-hair:#E6D5A8;
    --bad:#B4472A; --heart:#C2410C; --inv:#111111; --invfg:#FFFFFF;
    font-family: Jost, system-ui, sans-serif;
    letter-spacing: 0.005em;
  }
  :root[data-theme="dark"] .fdm-studio, :root[data-theme="dark"] .fdm-studio-sheet {
    --fg2:#B8B7AF; --fg3:#8E8D86; --fg4:#6E6D67;
    --line:rgba(255,255,255,.12); --line2:rgba(255,255,255,.22); --line3:rgba(255,255,255,.08);
    --card:#171716; --tile:#262624; --soft:#202020;
    --green:#3FA46E; --green-deep:#7FDDAA; --green-soft:rgba(63,164,110,.18); --green-line:rgba(63,164,110,.35);
    --warn:#E8C36A; --warn-soft:rgba(232,195,106,.16); --warn-bg:rgba(232,195,106,.10); --warn-line:#B58A1B; --warn-hair:rgba(232,195,106,.25);
    --bad:#E0745A; --inv:#F0EFEA; --invfg:#0C0C0B;
  }
  ${s("*")} { box-sizing: border-box; }

  /* ── Tailwind/shadcn heredado, repintado ─────────────────────────────── */
  ${s(".bg-white, .bg-gray-50")} { background: transparent; }
  ${s(".bg-gray-100")} { background: var(--tile); }
  ${s('[class*="shadow"]')} { box-shadow: none; }
  ${s('[class*="border-gray"], [class*="ring-gray"]')} { border-color: var(--line); --tw-ring-color: var(--line); }
  ${s(".text-gray-900")} { color: var(--fg); }
  ${s(".text-gray-700, .text-gray-600")} { color: var(--fg2); }
  ${s(".text-gray-500, .text-gray-400")} { color: var(--fg3); }
  ${s(".text-red-600, .text-red-500")} { color: var(--bad); }

  ${s("label")} {
    font-size: 14px; font-weight: 500; letter-spacing: normal; text-transform: none; color: var(--fg);
  }
  ${s("label.fdm-studio-check")} { font-weight: 400; font-size: 15px; line-height: 1.5; color: var(--fg2); }

  ${s('input:not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="search"]), select, textarea')} {
    width: 100%;
    min-height: 52px;
    height: auto;
    padding: 13px 16px;
    background: var(--card);
    color: var(--fg);
    border: 1px solid var(--line2);
    border-radius: 12px;
    box-shadow: none;
    font-family: Jost, system-ui, sans-serif;
    font-size: 16px;
    font-weight: 400;
    outline: none;
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  ${s("select")} { cursor: pointer; }
  ${s("textarea")} { line-height: 1.55; resize: vertical; }
  ${s("input:focus, select:focus, textarea:focus")} {
    border-color: var(--green);
    box-shadow: 0 0 0 3px var(--green-soft);
    outline: none;
  }
  ${s('input[aria-invalid="true"], select[aria-invalid="true"], textarea[aria-invalid="true"]')} { border-color: var(--bad); }
  ${s("input::placeholder, textarea::placeholder")} { color: var(--fg4); }
  ${s("input:disabled, select:disabled, textarea:disabled")} { background: var(--soft); color: var(--fg2); }
  ${s('input[type="checkbox"], input[type="radio"]')} { accent-color: var(--green); width: 18px; height: 18px; }
  ${s('input[type="range"]')} { accent-color: var(--green); }

  /* Botones heredados (shadcn): píldora en texto normal */
  ${s("button:not(.fdm-studio-plain)")} {
    border-radius: 999px;
    font-family: Jost, system-ui, sans-serif;
    font-weight: 500;
    font-size: 15px;
    letter-spacing: normal;
    text-transform: none;
  }
  ${s("button")} { font-family: inherit; }
  ${s("a")} { transition: color .2s ease, border-color .2s ease; }
  ${s(":focus-visible")} { outline: 2px solid var(--green); outline-offset: 2px; }

  /* Carga: barras que respiran */
  @keyframes fdmPulse { 0%,100% { opacity: .6 } 50% { opacity: .25 } }
  .fdm-skel { background: var(--tile, #ECEAE3); border-radius: 6px; animation: fdmPulse 1.4s ease-in-out infinite; }

  @keyframes fdmSheetIn { from { opacity: 0; transform: translateY(10px) scale(.99) } to { opacity: 1; transform: none } }
  @keyframes fdmFadeIn { from { opacity: 0 } to { opacity: 1 } }
  .fdm-sheet-anim { animation: fdmSheetIn .26s cubic-bezier(.22,.8,.3,1) }
  .fdm-fade-anim { animation: fdmFadeIn .2s ease-out }

  /* ══ Piezas del sistema ═════════════════════════════════════════════ */
  .fdm-st-wrap { max-width: 1120px; margin: 0 auto; padding-left: 16px; padding-right: 16px; }
  .fdm-st-main { padding-top: 28px; padding-bottom: 72px; }
  .fdm-st-col { display: flex; flex-direction: column; gap: 24px; }
  .fdm-st-eyebrow { font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: var(--green); font-weight: 500; }
  .fdm-st-label { font-size: 11px; font-weight: 500; letter-spacing: .18em; text-transform: uppercase; color: var(--fg2); }
  .fdm-st-h1 { margin: 0; font-size: 36px; line-height: 1.1; font-weight: 300; overflow-wrap: anywhere; }
  .fdm-st-h2 { margin: 0; font-size: 26px; font-weight: 300; }
  .fdm-st-h3 { margin: 0; font-size: 20px; font-weight: 500; }
  .fdm-st-lead { margin: 0; max-width: 640px; font-size: 16px; line-height: 1.5; color: var(--fg2); }
  .fdm-st-note { margin: 0; font-size: 15px; line-height: 1.5; color: var(--fg2); }
  .fdm-st-card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 20px; }
  .fdm-st-back { align-self: flex-start; height: 44px; padding: 0; display: inline-flex; align-items: center; gap: 8px; border: none; background: transparent; font-size: 15px; color: var(--fg2); cursor: pointer; }
  .fdm-st-back:hover { color: var(--fg); }
  .fdm-st-empty { padding: 28px 20px; background: var(--tile); border-radius: 16px; font-size: 16px; color: var(--fg2); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .fdm-st-empty b { font-size: 22px; font-weight: 400; color: var(--fg); }
  .fdm-st-pill { padding: 6px 12px; border-radius: 999px; font-size: 13px; font-weight: 500; white-space: nowrap; }
  .fdm-st-pill.is-warn { background: var(--warn-soft); color: var(--warn); }
  .fdm-st-pill.is-ok { background: var(--green-soft); color: var(--green-deep); }
  .fdm-st-pill.is-bad { background: color-mix(in srgb, var(--bad) 14%, transparent); color: var(--bad); }
  .fdm-st-pill.is-mute { background: var(--tile); color: var(--fg2); }

  /* Botones */
  .fdm-st-btn { height: 48px; padding: 0 20px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--line2); background: transparent; color: var(--fg); border-radius: 999px; font-size: 15px; font-weight: 400; white-space: nowrap; cursor: pointer; text-decoration: none; transition: background .2s, border-color .2s, color .2s, opacity .2s, filter .2s; }
  .fdm-st-btn:hover { border-color: var(--fg); color: var(--fg); }
  .fdm-st-btn.is-solid { background: var(--inv); border-color: var(--inv); color: var(--invfg); font-weight: 500; }
  .fdm-st-btn.is-solid:hover { opacity: .88; color: var(--invfg); }
  .fdm-st-btn.is-green { background: var(--green); border-color: var(--green); color: #fff; font-weight: 500; }
  .fdm-st-btn.is-green:hover { filter: brightness(.9); color: #fff; }
  .fdm-st-btn.is-sm { height: 44px; padding: 0 14px; font-size: 14px; }
  .fdm-st-btn.is-lg { height: 52px; padding: 0 24px; font-size: 16px; }
  .fdm-st-btn:disabled, .fdm-st-btn[aria-disabled="true"] { opacity: .45; cursor: not-allowed; }
  .fdm-st-link { height: 44px; padding: 0; display: inline-flex; align-items: center; gap: 8px; border: none; background: transparent; font-size: 15px; color: var(--fg); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  .fdm-st-link.is-mute { color: var(--fg2); font-size: 14px; }

  /* Pestañas del estudio (bajo el navbar) */
  .fdm-st-tabs { position: sticky; top: var(--nav-h, 73px); z-index: 20; background: var(--bg); border-bottom: 1px solid var(--line); }
  .fdm-st-tabs nav { display: flex; }
  .fdm-st-tab { position: relative; flex: 1 1 0; min-width: 0; height: 60px; padding: 0 2px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; border: none; background: transparent; color: var(--fg2); font-size: 13px; cursor: pointer; box-shadow: inset 0 -2px 0 transparent; transition: color .2s, box-shadow .2s; }
  .fdm-st-tab:hover { color: var(--fg); }
  .fdm-st-tab[aria-pressed="true"] { color: var(--fg); font-weight: 500; box-shadow: inset 0 -2px 0 var(--green); }
  .fdm-st-tab .n { position: absolute; top: 6px; left: 50%; margin-left: 8px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 999px; background: var(--green); color: #fff; font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; }

  /* Cifras */
  .fdm-st-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
  .fdm-st-stats > div { padding: 16px; background: var(--card); display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .fdm-st-stats b { font-size: 30px; line-height: 1; font-weight: 500; white-space: nowrap; font-variant-numeric: tabular-nums; }

  /* Inicio */
  .fdm-st-next { padding: 24px; background: #111111; color: #FFFFFF; border-radius: 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 32px; }
  .fdm-st-next .txt { flex: 1 1 320px; display: flex; flex-direction: column; gap: 6px; }
  .fdm-st-next .k { font-size: 11px; font-weight: 500; letter-spacing: .18em; text-transform: uppercase; color: #9FE0BF; }
  .fdm-st-next .t { font-size: 24px; line-height: 1.2; }
  .fdm-st-next .s { font-size: 15px; line-height: 1.5; color: #D8D5CC; }
  .fdm-st-next button { flex: 0 1 260px; height: 52px; padding: 0 24px; border: none; background: #FFFFFF; color: #111111; border-radius: 999px; font-size: 15px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
  .fdm-st-quick { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .fdm-st-quick > * { min-height: 88px; padding: 14px; background: var(--card); border: 1px solid var(--line); border-radius: 16px; display: flex; flex-direction: column; align-items: flex-start; justify-content: space-between; gap: 10px; font-size: 15px; font-weight: 500; color: var(--fg); text-align: left; cursor: pointer; text-decoration: none; transition: border-color .2s; }
  .fdm-st-quick > *:hover { border-color: var(--fg); color: var(--fg); }
  .fdm-st-rowcard { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 16px 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; }
  .fdm-st-thumb { position: relative; flex: none; background: var(--tile); overflow: hidden; display: flex; align-items: center; justify-content: center; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--fg2); text-align: center; }

  /* Estado del inventario */
  .fdm-st-inv { border-radius: 16px; overflow: hidden; background: var(--green-soft); border: 1px solid var(--green); --tone: var(--green-deep); --hairline: var(--green-line); }
  .fdm-st-inv.is-warn { background: var(--warn-bg); border-color: var(--warn-line); --tone: var(--warn); --hairline: var(--warn-hair); }
  .fdm-st-inv.is-mute { background: var(--soft); border-color: var(--line2); --tone: var(--fg); --hairline: var(--line); }
  .fdm-st-inv-top { padding: 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px; }
  .fdm-st-inv-top .txt { flex: 1 1 320px; display: flex; flex-direction: column; gap: 4px; }
  .fdm-st-inv-top .t { font-size: 20px; color: var(--tone); font-weight: 500; }
  .fdm-st-inv-top .s { font-size: 15px; line-height: 1.5; color: var(--fg); }
  .fdm-st-inv-top .fdm-st-btn { border-color: var(--tone); color: var(--tone); font-weight: 500; }
  .fdm-st-inv-top .fdm-st-btn.is-fill { background: var(--tone); color: var(--bg); }
  .fdm-st-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1px; background: var(--hairline); border-top: 1px solid var(--hairline); }
  .fdm-st-step { padding: 16px; display: flex; gap: 12px; background: var(--bg); border: none; text-align: left; color: var(--fg); cursor: pointer; font-size: 16px; }
  .fdm-st-step:hover { background: var(--soft); }
  .fdm-st-step[aria-current="step"] { box-shadow: inset 0 -2px 0 var(--green); }
  .fdm-st-step .txt { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .fdm-st-step .txt u { font-size: 14px; text-underline-offset: 3px; }
  .fdm-st-dot { flex: none; width: 28px; height: 28px; border-radius: 999px; border: 2px solid var(--fg4); color: transparent; display: flex; align-items: center; justify-content: center; }
  .fdm-st-dot.is-on { background: var(--green); border-color: var(--green); color: #fff; }
  .fdm-st-dot.is-sm { width: 22px; height: 22px; }
  .fdm-st-dot.is-xs { width: 24px; height: 24px; }

  /* Tarjeta de obra */
  .fdm-st-art { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 20px; display: flex; flex-wrap: wrap; gap: 20px; }
  .fdm-st-art .fdm-st-thumb { width: 120px; height: 120px; cursor: pointer; border: none; padding: 0; }
  .fdm-st-art .body { flex: 1 1 280px; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
  .fdm-st-art .head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 8px 16px; }
  .fdm-st-art .head .t { font-size: 22px; line-height: 1.2; overflow-wrap: anywhere; }
  .fdm-st-art .head .s { font-size: 15px; color: var(--fg2); }
  .fdm-st-dl { margin: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 16px; }
  .fdm-st-dl > div { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .fdm-st-dl dd { margin: 0; font-size: 16px; overflow-wrap: anywhere; }
  .fdm-st-acts { display: flex; flex-wrap: wrap; gap: 8px; }
  .fdm-st-acts > * { flex: 1 1 110px; }
  .fdm-st-add { min-height: 72px; width: 100%; border: 1px dashed var(--fg4); background: transparent; border-radius: 16px; font-size: 16px; color: var(--fg); display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: background .2s; }
  .fdm-st-add:hover { background: var(--soft); }
  .fdm-st-filters { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .fdm-st-search { flex: 1 1 280px; height: 52px; display: flex; align-items: center; gap: 10px; padding: 0 16px; background: var(--card); border: 1px solid var(--line2); border-radius: 999px; color: var(--fg2); }
  .fdm-st-search input { flex: 1; min-width: 0; height: 100%; border: none !important; outline: none; background: transparent; font: inherit; font-size: 16px; color: var(--fg); box-shadow: none !important; }
  .fdm-st-seg { flex: 1 1 320px; display: flex; padding: 4px; background: var(--tile); border-radius: 999px; }
  .fdm-st-seg button { flex: 1 1 0; min-width: 0; height: 44px; padding: 0 6px; border: none; background: transparent; color: var(--fg); border-radius: 999px; font-size: 14px; white-space: nowrap; cursor: pointer; }
  .fdm-st-seg button[aria-pressed="true"] { background: var(--card); font-weight: 500; }
  .fdm-st-select { flex: 0 1 220px; }

  /* Barra fija de acciones */
  .fdm-st-bar { position: sticky; bottom: 0; z-index: 15; margin: 0 -16px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: var(--bg); border-top: 1px solid var(--line); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px; }
  .fdm-st-bar .st { font-size: 15px; color: var(--fg2); }
  .fdm-st-bar .st b { color: var(--fg); font-weight: 500; }
  .fdm-st-bar .acts { flex: 1 1 280px; max-width: 460px; display: flex; gap: 10px; }
  .fdm-st-bar .acts > * { flex: 1 1 0; height: 52px; }
  .fdm-st-bar .acts > .is-main { flex: 2 1 0; font-size: 16px; }

  /* Editor de obra */
  .fdm-st-editor { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 24px 40px; }
  .fdm-st-editor > .main { flex: 2 1 420px; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
  .fdm-st-editor > aside { flex: 1 1 300px; min-width: 0; position: sticky; top: calc(var(--nav-h, 73px) + 76px); display: flex; flex-direction: column; gap: 16px; }
  .fdm-st-sec { display: flex; flex-direction: column; gap: 16px; }
  .fdm-st-grid2 { display: flex; flex-wrap: wrap; gap: 16px; }
  .fdm-st-grid2 > * { flex: 1 1 200px; min-width: 0; }
  .fdm-st-drop { position: relative; min-height: 180px; padding: 20px; border: 1px dashed var(--fg4); background: var(--bg); border-radius: 12px; color: var(--fg); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; text-align: center; overflow: hidden; transition: border-color .2s, background .2s; }
  .fdm-st-drop.is-on { border-color: var(--green); background: var(--green-soft); }
  .fdm-st-drop.is-drag { border-style: solid; border-color: var(--green); }
  .fdm-st-drop .t { font-size: 17px; font-weight: 500; }
  .fdm-st-drop .s { font-size: 14px; color: var(--fg2); font-weight: 400; }
  .fdm-st-drop img { max-width: 100%; max-height: 260px; object-fit: contain; display: block; }
  .fdm-st-hintbox { padding: 12px 16px; background: var(--bg); border-radius: 10px; font-size: 14px; line-height: 1.45; color: var(--fg2); }
  .fdm-st-pv { aspect-ratio: 4 / 5; max-height: 320px; background: var(--tile); display: flex; align-items: center; justify-content: center; padding: 16px; }
  .fdm-st-pv img { max-width: 100%; max-height: 100%; object-fit: contain; display: block; }
  .fdm-st-pv span { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--fg2); }
  .fdm-st-ck { display: flex; align-items: center; gap: 10px; font-size: 15px; color: var(--fg2); }
  .fdm-st-ck.is-on { color: var(--fg); }

  /* QR */
  .fdm-st-qrgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
  .fdm-st-qr { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
  .fdm-st-qr .code { width: 148px; height: 148px; background: #FFFFFF; border: 1px solid var(--line); display: grid; place-items: center; }
  .fdm-st-qr .code img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
  .fdm-st-qr .t { font-size: 17px; font-weight: 500; overflow-wrap: anywhere; }
  .fdm-st-qr .s { font-size: 14px; color: var(--fg2); }
  .fdm-st-qr .acts { align-self: stretch; display: flex; gap: 8px; margin-top: auto; }
  .fdm-st-qr .acts > * { flex: 1 1 0; padding: 0 10px; }

  /* Entregas */
  .fdm-st-order { background: var(--card); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
  .fdm-st-order > .top { padding: 14px 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; border-bottom: 1px solid var(--line3); font-size: 14px; color: var(--fg2); }
  .fdm-st-order > .top b { color: var(--fg); font-weight: 600; letter-spacing: .06em; }
  .fdm-st-order > .mid { padding: 20px; display: flex; flex-wrap: wrap; gap: 24px 40px; }
  .fdm-st-order > .mid > div { flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
  .fdm-st-order .line { display: flex; align-items: center; gap: 10px; font-size: 15px; color: color-mix(in srgb, var(--fg) 78%, transparent); overflow-wrap: anywhere; }
  .fdm-st-order .line svg { flex: none; }
  .fdm-st-item { padding: 14px 20px; background: var(--bg); border-top: 1px solid var(--line3); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px 24px; }
  .fdm-st-item .what { flex: 1 1 240px; min-width: 0; display: flex; align-items: center; gap: 14px; }
  .fdm-st-item .track { flex: 1 1 240px; display: flex; align-items: center; gap: 10px; font-size: 14px; }
  .fdm-st-item .track i { flex: 1; min-width: 16px; max-width: 80px; height: 2px; background: var(--line2); }
  .fdm-st-item .track i.is-on { background: var(--green); }
  .fdm-st-item .fdm-st-btn.is-green { flex: 1 1 220px; max-width: 320px; height: 52px; font-size: 16px; }
  .fdm-st-map { position: relative; height: 160px; background: var(--line3); border-radius: 12px; overflow: hidden; border: 0; width: 100%; display: block; }

  /* Cuenta */
  .fdm-st-avatar { position: relative; overflow: hidden; flex: none; width: 64px; height: 64px; border-radius: 999px; background: var(--green); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600; }
  .fdm-st-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .fdm-st-kv { padding: 16px 0; border-top: 1px solid var(--line3); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; }
  .fdm-st-kv .v { display: block; font-size: 16px; overflow-wrap: anywhere; }
  .fdm-st-contact { min-height: 44px; display: flex; align-items: center; gap: 10px; font-size: 15px; overflow-wrap: anywhere; color: var(--fg); text-decoration: underline; text-underline-offset: 3px; }

  @media (max-width: 640px) {
    .fdm-st-h1 { font-size: 32px; }
    .fdm-st-next button, .fdm-st-inv-top .fdm-st-btn { flex: 1 1 100%; }
    .fdm-st-art .fdm-st-thumb { width: 96px; height: 96px; }
    .fdm-st-editor > aside { position: static; }
  }

  @media (prefers-reduced-motion: reduce) {
    .fdm-studio *, .fdm-studio-sheet * {
      animation-duration: .01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .01ms !important;
    }
  }
`;

/* ── Iconos del diseño (trazo 1.5, caja de 24) ────────────────────────── */
export const ICON_PATHS = {
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4v-9z",
  box: "M3 8l9-4 9 4v8l-9 4-9-4V8zM3 8l9 4 9-4M12 12v8",
  plus: "M12 5v14M5 12h14",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 6l-6 6 6 6",
  ext: "M7 17L17 7M9 7h8v8",
  check: "M5 12.5l4.5 4.5L19 7.5",
  edit: "M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4",
  share: "M12 15V4M8 8l4-4 4 4M5 13v6h14v-6",
  download: "M12 4v11M8 11l4 4 4-4M5 20h14",
  print: "M7 9V4h10v5M7 17H4V9h16v8h-3M7 14h10v6H7z",
  phone: "M6 3h4l1.5 5-2.5 1.5a11 11 0 0 0 5.5 5.5L16 12.5l5 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z",
  logout: "M10 5H6v14h4M14 8l4 4-4 4M18 12H9",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M5 11h14v9H5z",
  clock: "M12 7v5l3 2",
} as const;
