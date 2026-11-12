"use client";

import { useNavHeight } from "@components/views/catalog/shared";
import { STUDIO_CSS, STUDIO_VARS } from "@components/views/admin/artist/studioTheme";
import { Dot, Ico } from "@components/views/admin/artist/ui";

/* Postulación a la convocatoria — mismas piezas que el estudio del artista
   (tarjetas blancas, botones píldora, campos de 52px). Lo propio de este flujo:
   el camino de cuatro pasos que acompaña al artista de principio a fin, para
   que en cada pantalla sepa dónde va y qué sigue. */

export const JOURNEY = ["Crea tu cuenta", "Paga la inscripción", "Sube tu proyecto", "Recibe la respuesta"] as const;

const APPLY_CSS = `
  .fdm-ap { max-width: 760px; margin: 0 auto; padding: 28px 16px 72px; display: flex; flex-direction: column; gap: 24px; }
  .fdm-ap.is-narrow { max-width: 560px; }
  .fdm-ap.is-center { min-height: calc(100dvh - var(--nav-h, 73px)); justify-content: center; }
  .fdm-ap-head { display: flex; flex-direction: column; gap: 6px; }

  /* Camino de la postulación */
  .fdm-ap-way { display: flex; align-items: flex-start; }
  .fdm-ap-way > div { position: relative; flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; font-size: 13px; line-height: 1.25; color: var(--fg3); padding: 0 4px; }
  .fdm-ap-way > div.is-on { color: var(--fg); font-weight: 500; }
  .fdm-ap-way > div.is-done { color: var(--fg2); }
  .fdm-ap-way > div:not(:last-child)::after { content: ""; position: absolute; top: 13px; left: calc(50% + 20px); width: calc(100% - 40px); height: 2px; background: var(--line2); }
  .fdm-ap-way > div.is-done:not(:last-child)::after { background: var(--green); }
  .fdm-ap-way .num { width: 28px; height: 28px; border-radius: 999px; border: 2px solid var(--fg4); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: var(--fg2); background: var(--bg); }
  .fdm-ap-way > div.is-on .num { border-color: var(--green); color: var(--green-deep); box-shadow: 0 0 0 4px var(--green-soft); }
  .fdm-ap-way-m { display: none; }

  /* Pasos del formulario */
  .fdm-ap-steps { display: flex; gap: 6px; }
  .fdm-ap-steps button { flex: 1 1 0; min-width: 0; padding: 0 0 8px; border: none; background: transparent; cursor: pointer; display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 13px; color: var(--fg3); }
  .fdm-ap-steps button:disabled { cursor: default; }
  .fdm-ap-steps i { display: block; height: 4px; border-radius: 999px; background: var(--line); }
  .fdm-ap-steps button.is-done i, .fdm-ap-steps button.is-on i { background: var(--green); }
  .fdm-ap-steps button.is-on { color: var(--fg); font-weight: 500; }
  .fdm-ap-steps button.is-done { color: var(--fg2); }

  .fdm-ap-sec { display: flex; flex-direction: column; gap: 16px; }
  .fdm-ap-sec > .hd { display: flex; flex-direction: column; gap: 4px; }
  .fdm-ap-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .fdm-ap-field > label, .fdm-ap-lbl { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 14px; font-weight: 500; }
  .fdm-ap-field > label small, .fdm-ap-lbl small { font-size: 13px; font-weight: 400; color: var(--fg2); white-space: nowrap; }
  .fdm-ap-help { font-size: 14px; line-height: 1.45; color: var(--fg2); }
  .fdm-ap-help.is-ok { color: var(--green-deep); font-weight: 500; }
  .fdm-ap-help.is-bad { color: var(--bad); }
  .fdm-ap-grid { display: flex; flex-wrap: wrap; gap: 16px; }
  .fdm-ap-grid > * { flex: 1 1 200px; }
  .fdm-ap-tip { padding: 12px 16px; background: var(--bg); border-radius: 10px; font-size: 14px; line-height: 1.45; color: var(--fg2); display: flex; gap: 10px; }
  .fdm-ap-alert { padding: 14px 16px; border-radius: 12px; font-size: 15px; line-height: 1.5; display: flex; gap: 10px; align-items: flex-start; }
  .fdm-ap-alert.is-bad { background: color-mix(in srgb, var(--bad) 10%, transparent); color: var(--fg); }
  .fdm-ap-alert.is-ok { background: var(--green-soft); color: var(--fg); }
  .fdm-ap-alert.is-warn { background: var(--warn-bg); border: 1px solid var(--warn-line); color: var(--fg); }
  .fdm-ap-alert b { display: block; font-weight: 500; }
  .fdm-ap-alert.is-warn b { color: var(--warn); }

  /* Obra dentro del formulario */
  .fdm-ap-work { border: 1px solid var(--line); border-radius: 16px; background: var(--card); overflow: hidden; }
  .fdm-ap-work > .top { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--line3); }
  .fdm-ap-work > .top .t { display: flex; align-items: center; gap: 10px; min-width: 0; font-size: 17px; font-weight: 500; overflow-wrap: anywhere; }
  .fdm-ap-work > .bd { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

  /* Resumen con chulos */
  .fdm-ap-list { display: flex; flex-direction: column; }
  .fdm-ap-list > div { min-height: 56px; padding: 10px 0; border-top: 1px solid var(--line3); display: flex; align-items: center; gap: 12px; font-size: 16px; }
  .fdm-ap-list > div:first-child { border-top: none; }
  .fdm-ap-list .k { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .fdm-ap-list .k small { font-size: 14px; color: var(--fg2); }
  .fdm-ap-thumbs { display: flex; flex-wrap: wrap; gap: 8px; }
  .fdm-ap-thumbs span { width: 72px; height: 72px; background: var(--tile); overflow: hidden; }
  .fdm-ap-thumbs img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* Pago */
  .fdm-ap-price { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px 16px; }
  .fdm-ap-price b { font-size: 44px; line-height: 1; font-weight: 500; white-space: nowrap; }
  .fdm-ap-checks { display: flex; flex-direction: column; gap: 10px; font-size: 15px; line-height: 1.45; color: var(--fg2); }
  .fdm-ap-checks span { display: flex; gap: 10px; }
  .fdm-ap-checks svg { color: var(--green); margin-top: 2px; }
  .fdm-ap-opt { min-height: 72px; width: 100%; padding: 14px 16px; display: flex; align-items: center; gap: 14px; border: 1px solid var(--line2); background: var(--card); border-radius: 16px; text-align: left; color: var(--fg); cursor: pointer; transition: border-color .2s, background .2s; }
  .fdm-ap-opt:hover { border-color: var(--fg); }
  .fdm-ap-opt[aria-pressed="true"] { border-color: var(--green); background: var(--green-soft); }
  .fdm-ap-opt .k { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; font-size: 17px; }
  .fdm-ap-opt .k small { font-size: 14px; color: var(--fg2); }
  .fdm-ap-opt .p { font-size: 17px; font-weight: 500; white-space: nowrap; }
  .fdm-ap-radio { flex: none; width: 22px; height: 22px; border-radius: 999px; border: 2px solid var(--fg4); display: flex; align-items: center; justify-content: center; }
  .fdm-ap-opt[aria-pressed="true"] .fdm-ap-radio { border-color: var(--green); }
  .fdm-ap-opt[aria-pressed="true"] .fdm-ap-radio::after { content: ""; width: 10px; height: 10px; border-radius: 999px; background: var(--green); }
  .fdm-ap-kv { display: flex; flex-direction: column; }
  .fdm-ap-kv > div { padding: 12px 0; border-top: 1px solid var(--line3); display: flex; align-items: baseline; justify-content: space-between; gap: 16px; font-size: 15px; }
  .fdm-ap-kv > div > span:last-child { text-align: right; overflow-wrap: anywhere; }
  .fdm-ap-big { width: 56px; height: 56px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: var(--green-soft); color: var(--green-deep); }
  .fdm-ap-big.is-warn { background: var(--warn-soft); color: var(--warn); }
  .fdm-ap-big.is-bad { background: color-mix(in srgb, var(--bad) 14%, transparent); color: var(--bad); }

  @media (max-width: 640px) {
    .fdm-ap-way { display: none; }
    .fdm-ap-way-m { display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: var(--fg2); }
    .fdm-ap-way-m b { color: var(--fg); font-weight: 500; }
    .fdm-ap-way-m .bar { display: flex; gap: 4px; }
    .fdm-ap-way-m .bar i { flex: 1; height: 4px; border-radius: 999px; background: var(--line); }
    .fdm-ap-way-m .bar i.is-on { background: var(--green); }
    .fdm-ap-steps button span { display: none; }
    .fdm-ap-steps button.is-on span { display: block; white-space: nowrap; }
    .fdm-ap-price b { font-size: 36px; }
    .fdm-st-bar .acts { max-width: none; }
  }
`;

export function ApplyShell({
  children,
  narrow,
  center,
}: {
  children: React.ReactNode;
  /** Columna de 560px (pago, resultados, mensajes). */
  narrow?: boolean;
  /** Centra el contenido en la pantalla. */
  center?: boolean;
}) {
  const navH = useNavHeight();
  return (
    <div className="fdm-studio" style={{ ...STUDIO_VARS, "--nav-h": `${navH}px`, background: "var(--bg)", minHeight: "100vh" } as React.CSSProperties}>
      <style>{STUDIO_CSS}</style>
      <style>{APPLY_CSS}</style>
      <main className={`fdm-ap${narrow ? " is-narrow" : ""}${center ? " is-center" : ""}`}>{children}</main>
    </div>
  );
}

/** En qué punto del camino va (0 cuenta · 1 pago · 2 proyecto · 3 respuesta). */
export function Journey({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <>
      <div className="fdm-ap-way" role="img" aria-label={`Paso ${current + 1} de 4: ${JOURNEY[current]}`}>
        {JOURNEY.map((label, i) => (
          <div key={label} className={i < current ? "is-done" : i === current ? "is-on" : ""}>
            {i < current ? <Dot on /> : <span className="num">{i + 1}</span>}
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="fdm-ap-way-m" aria-hidden="true">
        <span>Paso {current + 1} de 4 · <b>{JOURNEY[current]}</b></span>
        <span className="bar">{JOURNEY.map((l, i) => <i key={l} className={i <= current ? "is-on" : ""} />)}</span>
      </div>
    </>
  );
}

export function Alert({ tone, title, children }: { tone: "ok" | "bad" | "warn"; title?: string; children?: React.ReactNode }) {
  return (
    <div className={`fdm-ap-alert is-${tone}`} role={tone === "bad" ? "alert" : "status"}>
      <Ico name={tone === "ok" ? "check" : "alert"} size={20} sw={1.7} style={{ marginTop: 1, color: tone === "ok" ? "var(--green)" : tone === "warn" ? "var(--warn)" : "var(--bad)" }} />
      <span>
        {title && <b>{title}</b>}
        {children}
      </span>
    </div>
  );
}

export { Dot, Ico };
