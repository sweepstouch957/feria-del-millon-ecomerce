"use client";

import Link from "next/link";
import { useAuth } from "@provider/authProvider";
import { useSiteLanding } from "@provider/siteConfigProvider";

const GREEN = "var(--fdm-green,#3FA46E)";
const PANEL = "var(--fdm-panel,#0B0B0A)";
const FG = "var(--fdm-fg,#0B0B0A)";
const BG = "var(--fdm-bg,#F7F6F2)";
const DEEP = "var(--fdm-green-deep,#14513C)";
const ON_DARK = "#F5F4EF";

function Kicker({ n, label, onDark = false }: { n: string; label: string; onDark?: boolean }) {
  return (
    <div style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: onDark ? "rgba(245,244,239,0.7)" : GREEN, marginBottom: 26, display: "flex", alignItems: "center", gap: 14 }}>
      <span>{n}</span>
      <span style={{ flex: "0 1 90px", height: 1, background: "currentColor", opacity: 0.45 }} />
      <span>{label}</span>
    </div>
  );
}

const h2: React.CSSProperties = { margin: 0, fontWeight: 200, fontSize: "clamp(30px,4.2vw,64px)", lineHeight: 1.1, letterSpacing: "0.004em" };
const pill = (bg: string, fg: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", height: 54, padding: "0 34px", background: bg, color: fg, fontWeight: 300, fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", borderRadius: 999 });
const pillOutline = (border: string, color: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", height: 54, padding: "0 34px", border: `1px solid ${border}`, color, fontWeight: 300, fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", borderRadius: 999 });

const RAIL = [
  ["01", "La feria", "#quienes"], ["02", "Impacto", "#impacto"], ["03", "Cronograma", "#cronograma"],
  ["04", "Quién participa", "#participantes"], ["05", "Requisitos", "#requisitos"], ["06", "Documentos", "#documentos"],
  ["07", "Inscripción", "#pasos"], ["08", "Rechazo", "#rechazo"], ["09", "Comisiones", "#comisiones"], ["10", "Compromisos", "#compromisos"],
];

function Title({ t, s, color = FG }: { t: string; s?: string; color?: string }) {
  return (
    <h2 style={{ ...h2, color }}>
      {t} {s ? <strong style={{ fontWeight: 500 }}>{s}</strong> : null}
    </h2>
  );
}

export default function ConvocatoriaPage() {
  const { isAuthenticated } = useAuth();
  const landing = useSiteLanding();
  const cp = landing.convocatoriaPage;
  const open = landing.convocatoria.open;
  const postularHref = isAuthenticated ? "/convocatoria/aplicar" : "/convocatoria/register";
  const mailto = `mailto:${cp.contactEmails[0] || "convocatorias@feriadelmillon.com"}`;

  return (
    <div className="fdm-v2" id="top" style={{ width: "100%", overflowX: "hidden" }}>
      {/* Banner de cerrada */}
      {!open && (
        <div style={{ background: DEEP, color: ON_DARK, padding: "clamp(14px,2vw,20px) clamp(20px,4vw,56px)", textAlign: "center", fontWeight: 300, fontSize: 13, letterSpacing: "0.04em" }}>
          <strong style={{ fontWeight: 500 }}>{cp.closed.title}.</strong> {cp.closed.message}
        </div>
      )}

      {/* HERO */}
      <section style={{ position: "relative", background: PANEL, color: ON_DARK, padding: "clamp(14px,2.2vw,26px)" }}>
        <div style={{ position: "relative", border: "1px solid rgba(245,244,239,0.24)", overflow: "hidden" }}>
          {/* eyebrow bar */}
          <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "clamp(16px,2vw,24px) clamp(20px,4vw,56px)", borderBottom: "1px solid rgba(245,244,239,0.18)", fontWeight: 300, fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(245,244,239,0.6)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 12, color: open ? GREEN : "rgba(245,244,239,0.6)" }}>
              <span style={{ display: "block", width: 7, height: 7, borderRadius: 999, background: open ? GREEN : "rgba(245,244,239,0.5)" }} />
              {open ? cp.hero.badgeLeft : cp.closed.title}
            </span>
            <span>{cp.hero.badgeCenter}</span>
            <span>{cp.hero.badgeRight}</span>
          </div>

          {/* hero body */}
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(32px,4vw,72px)", padding: "clamp(40px,6vw,96px) clamp(20px,4vw,56px) clamp(32px,4vw,56px)", alignItems: "end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "clamp(20px,2.4vw,32px)" }}>
              <h1 style={{ margin: 0, fontWeight: 200, fontSize: "clamp(44px,8.4vw,132px)", lineHeight: 1.02, letterSpacing: "0.015em", textTransform: "uppercase" }}>
                {cp.hero.title} <strong style={{ fontWeight: 400 }}>{cp.hero.titleStrong}</strong>
                <br />
                <span style={{ fontSize: "0.44em", letterSpacing: "0.06em", color: GREEN }}>{cp.hero.year}</span>
              </h1>
              <p style={{ margin: 0, maxWidth: "48ch", fontSize: "clamp(15.5px,1.3vw,20px)", lineHeight: 1.7, color: "rgba(245,244,239,0.76)" }}>{cp.hero.paragraph}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
                {open ? (
                  <Link href={postularHref} style={pill(GREEN, "#0B0B0A")}>{isAuthenticated ? "Continuar postulación →" : cp.hero.ctaPrimary}</Link>
                ) : (
                  <span style={{ ...pill("rgba(245,244,239,0.14)", "rgba(245,244,239,0.6)"), cursor: "not-allowed" }}>Convocatoria cerrada</span>
                )}
                <a href="#requisitos" style={pillOutline("rgba(245,244,239,0.42)", ON_DARK)}>{cp.hero.ctaSecondary}</a>
              </div>
            </div>

            {/* info card */}
            <div style={{ border: "1px solid rgba(245,244,239,0.24)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "clamp(20px,2.2vw,30px)", borderBottom: "1px solid rgba(245,244,239,0.18)" }}>
                <div style={{ fontWeight: 300, fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(245,244,239,0.55)" }}>{open ? cp.dates.openLabel : cp.closed.title}</div>
                <div style={{ fontWeight: 300, fontSize: "clamp(17px,1.7vw,23px)", lineHeight: 1.4, marginTop: 12 }}>{open ? cp.dates.openValue : cp.closed.message}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "rgba(245,244,239,0.18)" }}>
                <div style={{ background: PANEL, padding: "clamp(18px,2vw,26px)" }}>
                  <div style={{ fontWeight: 300, fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(245,244,239,0.55)" }}>Selección</div>
                  <div style={{ fontSize: 15.5, lineHeight: 1.5, marginTop: 10 }}>{cp.dates.seleccionValue}</div>
                </div>
                <div style={{ background: PANEL, padding: "clamp(18px,2vw,26px)" }}>
                  <div style={{ fontWeight: 300, fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(245,244,239,0.55)" }}>Evento</div>
                  <div style={{ fontSize: 15.5, lineHeight: 1.5, marginTop: 10 }}>{cp.dates.eventoValue}</div>
                </div>
              </div>
              <div style={{ padding: "clamp(20px,2.2vw,30px)", borderTop: "1px solid rgba(245,244,239,0.18)", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontWeight: 300, fontSize: 10, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(245,244,239,0.55)" }}>Contacto</div>
                {cp.contactEmails.map((e) => (
                  <a key={e} href={`mailto:${e}`} className="fdm-link" style={{ fontSize: 15, wordBreak: "break-word" }}>{e}</a>
                ))}
              </div>
            </div>
          </div>

          {/* stats row */}
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,150px),1fr))", gap: 1, background: "rgba(245,244,239,0.22)", borderTop: "1px solid rgba(245,244,239,0.22)" }}>
            {cp.stats.map((s, i) => (
              <div key={i} style={{ background: PANEL, padding: "clamp(22px,2.6vw,34px) clamp(18px,2vw,26px)" }}>
                <div style={{ fontWeight: 200, fontSize: "clamp(30px,3.4vw,52px)", lineHeight: 1, color: s.accent ? GREEN : ON_DARK }}>{s.value}</div>
                <div style={{ fontWeight: 300, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(245,244,239,0.6)", marginTop: 12 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* sub-nav rail */}
      <div style={{ position: "sticky", top: 60, zIndex: 40, background: "color-mix(in srgb, var(--fdm-bg,#F7F6F2) 92%, transparent)", backdropFilter: "blur(14px)", borderBottom: `1px solid color-mix(in srgb, ${FG} 14%, transparent)`, overflowX: "auto" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)", display: "flex", gap: "clamp(16px,2vw,32px)", fontWeight: 300, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          {RAIL.map(([n, label, href]) => (
            <a key={n} href={href} className="fdm-link" style={{ padding: "16px 0" }}>{n} {label}</a>
          ))}
        </div>
      </div>

      {/* 01 quienes */}
      <section id="quienes" style={{ padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(36px,5vw,90px)" }}>
          <div>
            <Kicker n="01" label={cp.intro.badge} />
            <h2 style={{ ...h2, maxWidth: "22ch" }}>{cp.intro.title} <strong style={{ fontWeight: 500 }}>{cp.intro.titleStrong}</strong></h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: "58ch" }}>
            {cp.intro.paragraphs.map((p, i) => (
              <p key={i} style={{ margin: 0, fontSize: i === 0 ? "clamp(16px,1.35vw,20px)" : "clamp(15.5px,1.25vw,19px)", lineHeight: 1.7, color: i === 0 ? FG : `color-mix(in srgb, ${FG} 65%, transparent)` }}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* 02 impacto */}
      <section id="impacto" style={{ background: DEEP, color: ON_DARK, padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <Kicker n="02" label={cp.impacto.badge} onDark />
          <Title t={cp.impacto.title} s={cp.impacto.titleStrong} color={ON_DARK} />
          <div style={{ marginTop: "clamp(34px,4vw,60px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,380px),1fr))", gap: "0 clamp(32px,4vw,80px)", borderTop: "1px solid rgba(245,244,239,0.28)" }}>
            {cp.impacto.items.map((it, i) => (
              <span key={i} style={{ display: "flex", alignItems: "baseline", gap: "clamp(16px,2vw,28px)", padding: "clamp(16px,1.8vw,24px) 0", borderBottom: "1px solid rgba(245,244,239,0.18)" }}>
                <span style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.22em", color: "#8FE3B4" }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: "clamp(16px,1.5vw,21px)", lineHeight: 1.5 }}>{it}</span>
              </span>
            ))}
          </div>
          <p style={{ margin: "clamp(28px,3vw,44px) 0 0", maxWidth: "52ch", fontSize: 15, lineHeight: 1.7, color: "rgba(245,244,239,0.72)" }}>{cp.impacto.note}</p>
        </div>
      </section>

      {/* 03 cronograma */}
      <section id="cronograma" style={{ padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <Kicker n="03" label={cp.cronograma.badge} />
          <div style={{ marginBottom: "clamp(34px,4vw,60px)" }}><Title t={cp.cronograma.title} s={cp.cronograma.titleStrong} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 1, background: `color-mix(in srgb, ${FG} 14%, transparent)`, borderTop: `1px solid color-mix(in srgb, ${FG} 14%, transparent)` }}>
            <div style={{ background: BG, padding: "clamp(26px,3vw,42px) clamp(18px,2vw,30px)", display: "flex", flexDirection: "column", gap: 18 }}>
              <span style={{ fontWeight: 400, fontSize: "clamp(19px,1.9vw,25px)", letterSpacing: "0.06em", textTransform: "uppercase" }}>¿Cuándo?</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 15.5, lineHeight: 1.6 }}>
                {cp.cronograma.cuando.map((c, i) => (
                  <span key={i}><span style={{ display: "block", fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: GREEN, marginBottom: 6 }}>{c.label}</span>{c.value}</span>
                ))}
              </span>
            </div>
            <div style={{ background: BG, padding: "clamp(26px,3vw,42px) clamp(18px,2vw,30px)", display: "flex", flexDirection: "column", gap: 18 }}>
              <span style={{ fontWeight: 400, fontSize: "clamp(19px,1.9vw,25px)", letterSpacing: "0.06em", textTransform: "uppercase" }}>¿Dónde?</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 15.5, lineHeight: 1.6 }}>
                <span style={{ fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: GREEN }}>Plataforma</span>
                <Link href={cp.cronograma.plataformaUrl} className="fdm-link" style={{ alignSelf: "flex-start", paddingBottom: 3, borderBottom: `1px solid color-mix(in srgb, ${FG} 30%, transparent)`, wordBreak: "break-word" }}>Formulario de postulación</Link>
              </span>
            </div>
            <div style={{ background: BG, padding: "clamp(26px,3vw,42px) clamp(18px,2vw,30px)", display: "flex", flexDirection: "column", gap: 18 }}>
              <span style={{ fontWeight: 400, fontSize: "clamp(19px,1.9vw,25px)", letterSpacing: "0.06em", textTransform: "uppercase" }}>¿Contacto?</span>
              <span style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 15.5, lineHeight: 1.6 }}>
                {cp.contactEmails.map((e) => <a key={e} href={`mailto:${e}`} className="fdm-link" style={{ wordBreak: "break-word" }}>{e}</a>)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 04 participantes */}
      <TwoCol id="participantes" n="04" badge={cp.participantes.badge} title={cp.participantes.title} strong={cp.participantes.titleStrong}
        onDark noTitle={cp.participantes.noTitle} no={cp.participantes.no} siTitle={cp.participantes.siTitle} si={cp.participantes.si} />

      {/* 05 requisitos */}
      <TwoCol id="requisitos" n="05" badge={cp.requisitos.badge} title={cp.requisitos.title} strong={cp.requisitos.titleStrong}
        noTitle={cp.requisitos.noTitle} no={cp.requisitos.no} siTitle={cp.requisitos.siTitle} si={cp.requisitos.si} />

      {/* 06 documentos */}
      <section id="documentos" style={{ background: PANEL, color: ON_DARK, padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: "clamp(40px,5vw,72px)" }}>
            <div><Kicker n="06" label={cp.documentos.badge} onDark /><Title t={cp.documentos.title} s={cp.documentos.titleStrong} color={ON_DARK} /></div>
            <p style={{ margin: 0, maxWidth: "34ch", fontSize: 15, lineHeight: 1.7, color: "rgba(245,244,239,0.7)" }}>{cp.documentos.note}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,290px),1fr))", gap: 1, background: "rgba(245,244,239,0.22)", borderTop: "1px solid rgba(245,244,239,0.22)" }}>
            {cp.documentos.items.map((d, i) => (
              <div key={i} style={{ background: PANEL, padding: "clamp(24px,2.8vw,38px) clamp(18px,2vw,30px)", display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontWeight: 300, fontSize: 10, letterSpacing: "0.24em", color: "rgba(245,244,239,0.45)" }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontWeight: 400, fontSize: "clamp(18px,1.8vw,23px)" }}>{d.title}</span>
                {d.spec && <span style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: GREEN }}>{d.spec}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 07 pasos */}
      <section id="pasos" style={{ padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <Kicker n="07" label={cp.pasos.badge} />
          <div style={{ marginBottom: "clamp(34px,4vw,60px)" }}><Title t={cp.pasos.title} s={cp.pasos.titleStrong} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,280px),1fr))", gap: 1, background: `color-mix(in srgb, ${FG} 14%, transparent)`, borderTop: `1px solid color-mix(in srgb, ${FG} 14%, transparent)` }}>
            {cp.pasos.items.map((p, i) => (
              <div key={i} style={{ background: BG, padding: "clamp(26px,3vw,42px) clamp(18px,2vw,30px)", display: "flex", flexDirection: "column", gap: "clamp(28px,3vw,52px)", minHeight: 290 }}>
                <span style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.24em", color: GREEN }}>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span style={{ display: "block", fontWeight: 400, fontSize: "clamp(20px,2vw,27px)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{p.title}</span>
                  <span style={{ display: "block", fontSize: 14.5, lineHeight: 1.7, marginTop: 14, color: `color-mix(in srgb, ${FG} 65%, transparent)` }}>{p.description}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 08 rechazo */}
      <section id="rechazo" style={{ padding: "0 clamp(20px,4vw,56px) clamp(64px,9vw,140px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: "clamp(32px,4vw,80px)" }}>
          <div><Kicker n="08" label={cp.rechazo.badge} /><h2 style={{ ...h2, maxWidth: "18ch" }}>{cp.rechazo.title} <strong style={{ fontWeight: 500 }}>{cp.rechazo.titleStrong}</strong></h2></div>
          <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid color-mix(in srgb, ${FG} 14%, transparent)` }}>
            {cp.rechazo.items.map((it, i) => (
              <span key={i} style={{ display: "flex", gap: "clamp(14px,2vw,26px)", alignItems: "baseline", padding: "clamp(16px,1.8vw,22px) 0", borderBottom: `1px solid color-mix(in srgb, ${FG} 14%, transparent)`, fontSize: "clamp(15.5px,1.4vw,19px)", lineHeight: 1.55 }}>
                <span style={{ fontSize: 10.5, letterSpacing: "0.2em", color: GREEN }}>{String(i + 1).padStart(2, "0")}</span>{it}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 09 comisiones */}
      <section id="comisiones" style={{ background: PANEL, color: ON_DARK, padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <Kicker n="09" label={cp.comisiones.badge} onDark />
          <h2 style={{ ...h2, color: ON_DARK, marginBottom: "clamp(20px,2.4vw,32px)" }}>{cp.comisiones.title}</h2>
          <p style={{ margin: "0 0 clamp(34px,4vw,56px)", maxWidth: "56ch", fontSize: 15, lineHeight: 1.7, color: "rgba(245,244,239,0.7)" }}>{cp.comisiones.note}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap: 1, background: "rgba(245,244,239,0.22)", borderTop: "1px solid rgba(245,244,239,0.22)" }}>
            {cp.comisiones.items.map((c, i) => (
              <div key={i} style={{ background: PANEL, padding: "clamp(24px,2.8vw,38px) clamp(18px,2vw,30px)", display: "flex", flexDirection: "column", gap: 12 }}>
                <span style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: c.tag.toLowerCase().includes("adicional") ? "rgba(245,244,239,0.55)" : GREEN }}>{c.tag}</span>
                <span style={{ fontWeight: 300, fontSize: "clamp(17px,1.7vw,22px)", lineHeight: 1.5 }}>{c.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10 compromisos */}
      <section id="compromisos" style={{ padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <Kicker n="10" label={cp.compromisos.badge} />
          <div style={{ marginBottom: "clamp(34px,4vw,60px)" }}><Title t={cp.compromisos.title} s={cp.compromisos.titleStrong} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap: "clamp(32px,4vw,72px)" }}>
            {[[cp.compromisos.artistaTitle, cp.compromisos.artista], [cp.compromisos.feriaTitle, cp.compromisos.feria]].map(([title, list], k) => (
              <div key={k}>
                <div style={{ fontWeight: 400, fontSize: "clamp(19px,1.9vw,25px)", letterSpacing: "0.05em", textTransform: "uppercase", paddingBottom: 20, borderBottom: `1px solid color-mix(in srgb, ${FG} 30%, transparent)` }}>{title as string}</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {(list as string[]).map((it, i) => (
                    <span key={i} style={{ padding: "14px 0", borderBottom: `1px solid color-mix(in srgb, ${FG} 12%, transparent)`, fontSize: 15.5, lineHeight: 1.6 }}>{it}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA postular */}
      <section id="postular" style={{ padding: "0 clamp(20px,4vw,56px) clamp(64px,8vw,130px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", position: "relative", background: PANEL, color: ON_DARK, padding: "clamp(14px,2vw,22px)", overflow: "hidden" }}>
          <div style={{ border: "1px solid rgba(245,244,239,0.24)", padding: "clamp(36px,6vw,90px) clamp(24px,4vw,72px)", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: "clamp(32px,4vw,72px)", alignItems: "center" }}>
            <div>
              <Kicker n="11" label={cp.cta.badge} onDark />
              <h2 style={{ margin: 0, fontWeight: 200, fontSize: "clamp(32px,5vw,86px)", lineHeight: 1.04, letterSpacing: "0.004em", maxWidth: "18ch", color: ON_DARK }}>
                {open ? cp.cta.title : "Convocatoria"} <strong style={{ fontWeight: 500, color: GREEN }}>{open ? cp.cta.titleStrong : "cerrada"}</strong>
              </h2>
              <p style={{ margin: "24px 0 0", fontSize: "clamp(15.5px,1.3vw,19px)", lineHeight: 1.7, color: "rgba(245,244,239,0.76)", maxWidth: "46ch" }}>{open ? cp.cta.paragraph : cp.closed.message}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 24, borderBottom: "1px solid rgba(245,244,239,0.2)", fontSize: 15.5, lineHeight: 1.6 }}>
                <span><span style={{ display: "block", fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(245,244,239,0.55)", marginBottom: 8 }}>{open ? cp.dates.openLabel : cp.closed.title}</span>{open ? cp.dates.openValue : "—"}</span>
                <span><span style={{ display: "block", fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(245,244,239,0.55)", marginBottom: 8 }}>Contacto</span><a href={mailto} className="fdm-link" style={{ wordBreak: "break-word" }}>{cp.contactEmails[0]}</a></span>
              </div>
              <p style={{ margin: 0, fontSize: "clamp(15.5px,1.3vw,18px)", lineHeight: 1.7, color: "rgba(245,244,239,0.7)" }}>{cp.cta.note}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {open ? (
                  <Link href={postularHref} style={pill(GREEN, "#0B0B0A")}>{isAuthenticated ? "Continuar postulación →" : cp.cta.ctaPrimary}</Link>
                ) : (
                  <Link href="/#boletin" style={pill(GREEN, "#0B0B0A")}>Avísame de la próxima →</Link>
                )}
                <a href={mailto} style={pillOutline("rgba(245,244,239,0.42)", ON_DARK)}>{cp.cta.ctaSecondary}</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer style={{ borderTop: `1px solid color-mix(in srgb, ${FG} 14%, transparent)`, padding: "clamp(48px,6vw,96px) clamp(20px,4vw,56px) 40px" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))", gap: "clamp(32px,4vw,64px)" }}>
          <div>
            <div style={{ fontWeight: 300, fontSize: "clamp(22px,2.4vw,30px)", letterSpacing: "0.02em", textTransform: "uppercase" }}>Feria del Millón</div>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.7, color: `color-mix(in srgb, ${FG} 60%, transparent)`, maxWidth: "32ch" }}>{cp.footerDescription}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14.5 }}>
            <span style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: `color-mix(in srgb, ${FG} 48%, transparent)`, marginBottom: 8 }}>Convocatoria</span>
            <a href="#cronograma" className="fdm-link">Cronograma</a>
            <a href="#documentos" className="fdm-link">Documentos</a>
            <a href="#comisiones" className="fdm-link">Comisiones</a>
            <a href="#compromisos" className="fdm-link">Compromisos</a>
            <Link href="/" className="fdm-link">Volver al inicio</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14.5 }}>
            <span style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: `color-mix(in srgb, ${FG} 48%, transparent)`, marginBottom: 8 }}>Contacto</span>
            {cp.contactEmails.map((e) => <a key={e} href={`mailto:${e}`} className="fdm-link" style={{ wordBreak: "break-word" }}>{e}</a>)}
          </div>
        </div>
        <div className="fdm-mono" style={{ maxWidth: 1600, margin: "clamp(40px,5vw,76px) auto 0", paddingTop: 22, borderTop: `1px solid color-mix(in srgb, ${FG} 14%, transparent)`, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: `color-mix(in srgb, ${FG} 48%, transparent)` }}>
          © Feria del Millón · Oficina para la Cultura SAS
        </div>
      </footer>
    </div>
  );
}

// Sección de dos columnas (No pueden / Pueden) reutilizable (participantes + requisitos)
function TwoCol({ id, n, badge, title, strong, onDark = false, noTitle, no, siTitle, si }: {
  id: string; n: string; badge: string; title: string; strong: string; onDark?: boolean;
  noTitle: string; no: string[]; siTitle: string; si: string[];
}) {
  const bg = onDark ? PANEL : BG;
  const text = onDark ? ON_DARK : FG;
  const line = onDark ? "rgba(245,244,239,0.24)" : `color-mix(in srgb, ${FG} 14%, transparent)`;
  const muted = onDark ? "rgba(245,244,239,0.55)" : `color-mix(in srgb, ${FG} 50%, transparent)`;
  const xMuted = onDark ? "rgba(245,244,239,0.4)" : `color-mix(in srgb, ${FG} 40%, transparent)`;
  return (
    <section id={id} style={{ background: onDark ? PANEL : "transparent", color: text, padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}>
      <div style={{ maxWidth: 1600, margin: "0 auto" }}>
        <Kicker n={n} label={badge} onDark={onDark} />
        <div style={{ marginBottom: "clamp(34px,4vw,60px)" }}><Title t={title} s={strong} color={text} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))", gap: 1, background: line, borderTop: `1px solid ${line}` }}>
          <div style={{ background: bg, padding: "clamp(26px,3vw,42px) clamp(18px,2vw,30px)" }}>
            <div style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: muted, marginBottom: 24 }}>{noTitle}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {no.map((it, i) => (
                <span key={i} style={{ display: "flex", gap: 14, alignItems: "baseline", fontSize: "clamp(17px,1.7vw,22px)", lineHeight: 1.45 }}><span style={{ color: xMuted }}>×</span>{it}</span>
              ))}
            </div>
          </div>
          <div style={{ background: bg, padding: "clamp(26px,3vw,42px) clamp(18px,2vw,30px)" }}>
            <div style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: GREEN, marginBottom: 24 }}>{siTitle}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {si.map((it, i) => (
                <span key={i} style={{ display: "flex", gap: 14, alignItems: "baseline", fontSize: "clamp(17px,1.7vw,22px)", lineHeight: 1.45 }}><span style={{ color: GREEN }}>✓</span>{it}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
