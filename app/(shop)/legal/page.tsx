import { Fragment } from "react";
import { EYEBROW, ROOT_VARS, mix } from "@components/views/checkout/checkoutTheme";
import { LEGAL_ENTITY, LEGAL_SECTIONS, type LegalBlock } from "@lib/legalContent";

export const metadata = {
  title: "Legal: privacidad y términos | Feria del Millón",
  description:
    "Aviso de privacidad, política de tratamiento de datos personales, términos y condiciones y preguntas frecuentes de la Feria del Millón (Oficina para la Cultura S.A.S.).",
};

const CSS = `
  .fdm-legal a { transition: color .3s ease, opacity .3s ease; }
  .fdm-legal a:hover { color: var(--acc); }
  .fdm-legal-grid { display: grid; grid-template-columns: 1fr; gap: 48px; }
  .fdm-legal-nav { display: flex; flex-wrap: wrap; gap: 10px; }
  .fdm-legal section { scroll-margin-top: 110px; }
  .fdm-legal details > summary { list-style: none; cursor: pointer; }
  .fdm-legal details > summary::-webkit-details-marker { display: none; }
  .fdm-legal details > summary .fdm-plus { transition: transform .3s ease; }
  .fdm-legal details[open] > summary .fdm-plus { transform: rotate(45deg); }
  @media (min-width: 960px) {
    .fdm-legal-grid { grid-template-columns: 220px minmax(0, 1fr); gap: 72px; }
    .fdm-legal-nav { position: sticky; top: 110px; flex-direction: column; align-self: start; }
  }
`;

// Correos dentro del texto legal → enlaces.
const EMAIL = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;
function Linkify({ text }: { text: string }) {
  return (
    <>
      {text.split(EMAIL).map((part, i) =>
        i % 2 ? <a key={i} href={`mailto:${part}`} style={{ color: "inherit" }}>{part}</a> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

const p: React.CSSProperties = { margin: 0, fontSize: 15, lineHeight: 1.75, color: mix(80), maxWidth: "72ch" };
const pill: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", height: 40, padding: "0 20px", borderRadius: 999,
  border: `1px solid ${mix(20)}`, color: "inherit", textDecoration: "none", fontWeight: 400,
  fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", whiteSpace: "nowrap",
};

function Block({ b }: { b: LegalBlock }) {
  if ("h" in b) {
    return <h3 style={{ ...EYEBROW, margin: "18px 0 0", fontSize: 11.5, letterSpacing: "0.12em", lineHeight: 1.6, color: "var(--fg)" }}>{b.h}</h3>;
  }
  if ("q" in b) {
    return (
      <details style={{ borderTop: `1px solid ${mix(12)}` }}>
        <summary style={{ display: "flex", gap: 16, alignItems: "baseline", padding: "18px 0", fontSize: 16, fontWeight: 400, lineHeight: 1.45 }}>
          <span style={{ flex: 1 }}>{b.q}</span>
          <span className="fdm-plus" aria-hidden style={{ color: "var(--acc)", fontSize: 20, fontWeight: 200, lineHeight: 1 }}>+</span>
        </summary>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 20 }}>
          {b.a.map((t, i) => <p key={i} style={p}><Linkify text={t} /></p>)}
        </div>
      </details>
    );
  }
  const list = b.list?.length ? (
    <ul style={{ ...p, margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
      {b.list.map((t, i) => <li key={i}><Linkify text={t} /></li>)}
    </ul>
  ) : null;
  if (!("text" in b)) return list;
  return (
    <>
      <p style={p}>
        {b.lead && <b style={{ fontWeight: 500, color: "var(--fg)" }}>{b.lead} </b>}
        <Linkify text={b.text} />
        {b.more?.map((t, i) => <Fragment key={i}><br /><Linkify text={t} /></Fragment>)}
      </p>
      {list}
    </>
  );
}

export default function LegalPage() {
  return (
    <div className="fdm-legal" style={ROOT_VARS}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(56px,8vw,120px) clamp(20px,4vw,56px) clamp(64px,8vw,120px)" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: 22, paddingBottom: "clamp(40px,5vw,72px)", borderBottom: `1px solid ${mix(12)}`, marginBottom: "clamp(40px,5vw,72px)" }}>
          <div style={{ ...EYEBROW, fontWeight: 300, letterSpacing: "0.28em", color: "var(--acc)", display: "flex", alignItems: "center", gap: 14 }}>
            <span>Legal</span>
            <span style={{ flex: "0 1 90px", height: 1, background: "currentColor", opacity: 0.45 }} />
            <span>Feria del Millón</span>
          </div>
          <h1 style={{ margin: 0, fontWeight: 200, fontSize: "clamp(36px,5.2vw,76px)", lineHeight: 1.05, letterSpacing: "0.004em", maxWidth: "16ch" }}>
            Privacidad, datos y términos
          </h1>
          <p style={{ ...p, color: mix(65) }}>
            {LEGAL_ENTITY.name} · NIT {LEGAL_ENTITY.nit} · {LEGAL_ENTITY.address} ·{" "}
            <a href={`mailto:${LEGAL_ENTITY.email}`} style={{ color: "inherit" }}>{LEGAL_ENTITY.email}</a> ·{" "}
            <a href={`tel:${LEGAL_ENTITY.phone.replace(/\s/g, "")}`} style={{ color: "inherit" }}>{LEGAL_ENTITY.phone}</a>
          </p>
        </header>

        <div className="fdm-legal-grid">
          <nav aria-label="Secciones" className="fdm-legal-nav">
            {LEGAL_SECTIONS.map((s, i) => (
              <a key={s.id} href={`#${s.id}`} style={pill}>
                <span style={{ color: "var(--acc)", marginRight: 10 }}>{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </a>
            ))}
          </nav>

          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(56px,7vw,104px)", minWidth: 0 }}>
            {LEGAL_SECTIONS.map((s, i) => (
              <section key={s.id} id={s.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ ...EYEBROW, fontWeight: 300, letterSpacing: "0.28em", color: "var(--acc)", display: "flex", alignItems: "center", gap: 14 }}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ flex: "0 1 90px", height: 1, background: "currentColor", opacity: 0.45 }} />
                  <span>{s.title}</span>
                </div>
                <h2 style={{ margin: "0 0 8px", fontWeight: 200, fontSize: "clamp(28px,3.4vw,48px)", lineHeight: 1.1 }}>{s.title}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: s.id === "faq" ? 0 : 16 }}>
                  {s.blocks.map((b, j) => <Block key={j} b={b} />)}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
