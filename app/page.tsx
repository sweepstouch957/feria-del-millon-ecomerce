"use client";

import { useState } from "react";
import Link from "next/link";
import FeaturedGrid from "@components/views/home/v2/FeaturedGrid";
import { EVENT_ID } from "@lib/event";
import {
  useSiteContent,
  useSiteLanding,
  useSiteSections,
} from "@provider/siteConfigProvider";
import type { SectionKey } from "@lib/siteDefaults";

const GREEN = "var(--fdm-green,#3FA46E)";
const PANEL = "var(--fdm-panel,#0B0B0A)";
const FG = "var(--fdm-fg,#0B0B0A)";
const BG = "var(--fdm-bg,#F7F6F2)";
const ON_DARK = "#F5F4EF";
const LOGO = "/assets/fdm/logo-fdm.jpg";

// Kicker "01 —— Título" reutilizable
function Kicker({ n, label, onDark = false }: { n: string; label: string; onDark?: boolean }) {
  return (
    <div
      style={{
        fontWeight: 300,
        fontSize: 10.5,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color: onDark ? "rgba(245,244,239,0.65)" : GREEN,
        marginBottom: 26,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span>{n}</span>
      <span style={{ flex: "0 1 90px", height: 1, background: "currentColor", opacity: 0.45 }} />
      <span>{label}</span>
    </div>
  );
}

// Título grande editorial: resalta artículos (del/de/la) en verde, última palabra en bold
function BigTitle({ text, color = FG }: { text: string; color?: string }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => {
        const low = w.toLowerCase().replace(/[^a-záéíóú]/gi, "");
        const isArticle = ["del", "de", "la", "el", "tu"].includes(low);
        const isLast = i === words.length - 1;
        return (
          <span
            key={i}
            style={{
              color: isArticle ? GREEN : color,
              fontWeight: isLast ? 500 : 200,
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </>
  );
}

// Título del hero: 1ª palabra en su línea (thin), el resto en la 2ª línea
// con artículos en verde y la última palabra en bold — igual al diseño.
function HeroTitle({ text, color = "#F5F4EF" }: { text: string; color?: string }) {
  const words = text.split(" ");
  const first = words[0];
  const rest = words.slice(1);
  const isArticle = (w: string) =>
    ["del", "de", "la", "el", "tu"].includes(w.toLowerCase().replace(/[^a-záéíóú]/gi, ""));
  return (
    <>
      <span style={{ display: "block", fontWeight: 200, color }}>{first}</span>
      {rest.length > 0 && (
        <span style={{ display: "block" }}>
          {rest.map((w, i) => (
            <span
              key={i}
              style={{
                color: isArticle(w) ? GREEN : color,
                fontWeight: i === rest.length - 1 ? 400 : 200,
              }}
            >
              {w}
              {i < rest.length - 1 ? " " : ""}
            </span>
          ))}
        </span>
      )}
    </>
  );
}

const pill = (bg: string, fg: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  height: 54,
  padding: "0 34px",
  background: bg,
  color: fg,
  fontWeight: 300,
  fontSize: 11.5,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  borderRadius: 999,
});

const pillOutline = (border: string, color: string): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  height: 54,
  padding: "0 34px",
  border: `1px solid ${border}`,
  color,
  fontWeight: 300,
  fontSize: 11.5,
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  borderRadius: 999,
});

const h2Style: React.CSSProperties = {
  margin: 0,
  fontWeight: 200,
  fontSize: "clamp(30px,4.2vw,66px)",
  lineHeight: 1.1,
  letterSpacing: "0.004em",
};

export default function HomePage() {
  const content = useSiteContent();
  const landing = useSiteLanding();
  const sections = useSiteSections();
  const [subscribed, setSubscribed] = useState(false);

  const { hero, featured, techniques, contact, social } = content;
  const meta = landing.heroMeta;
  const logoSrc = content.brand.logo || LOGO; // logo del CMS (o el wordmark FDM)

  // ── Bloques por clave (orden + visibilidad configurables) ──────────────
  const blocks: Record<SectionKey, React.ReactNode> = {
    // 01 — La feria (intro + stats)
    about: (
      <section key="about" id="feria" style={{ padding: "clamp(64px,9vw,150px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))",
              gap: "clamp(36px,5vw,90px)",
            }}
          >
            <div>
              <Kicker n="01" label={landing.about.badge} />
              <h2 style={{ ...h2Style, maxWidth: "24ch" }}>
                <BigTitle text={landing.about.title} />
              </h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 26, maxWidth: "58ch" }}>
              {landing.about.paragraphs.map((p, i) => (
                <p
                  key={i}
                  style={{
                    margin: 0,
                    fontSize: "clamp(15.5px,1.25vw,19px)",
                    lineHeight: 1.7,
                    color: i === 0 ? FG : `color-mix(in srgb, ${FG} 65%, transparent)`,
                  }}
                >
                  {p}
                </p>
              ))}
              <Link
                href={landing.about.ctaHref}
                className="fdm-link"
                style={{
                  fontWeight: 300,
                  fontSize: 11,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  alignSelf: "flex-start",
                  paddingBottom: 6,
                  borderBottom: `1px solid color-mix(in srgb, ${FG} 40%, transparent)`,
                }}
              >
                {landing.about.ctaLabel}
              </Link>
            </div>
          </div>
          {/* stats */}
          <div
            style={{
              marginTop: "clamp(48px,6vw,96px)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,340px),1fr))",
              gap: 1,
              background: `color-mix(in srgb, ${FG} 14%, transparent)`,
              borderTop: `1px solid color-mix(in srgb, ${FG} 14%, transparent)`,
            }}
          >
            {landing.about.stats.map((s, i) => (
              <div key={i} style={{ background: BG, padding: "clamp(28px,3vw,46px) 24px" }}>
                <div
                  style={{
                    fontWeight: 200,
                    fontSize: "clamp(40px,4.6vw,82px)",
                    lineHeight: 1,
                    color: s.accent ? GREEN : FG,
                  }}
                >
                  {s.value}
                </div>
                <div
                  className="fdm-mono"
                  style={{
                    fontSize: 10.5,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: `color-mix(in srgb, ${FG} 58%, transparent)`,
                    marginTop: 14,
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    // 02 — Obras destacadas (panel oscuro, datos reales)
    featured: (
      <section
        key="featured"
        id="obras"
        style={{ background: PANEL, color: ON_DARK, padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}
      >
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 24,
              marginBottom: "clamp(40px,5vw,72px)",
            }}
          >
            <div>
              <Kicker n="02" label={featured.badge} onDark />
              <h2 style={{ ...h2Style, color: ON_DARK }}>
                <BigTitle text={featured.title} color={ON_DARK} />
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="fdm-link"
              style={{
                fontWeight: 300,
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                borderBottom: "1px solid rgba(245,244,239,0.45)",
                paddingBottom: 6,
              }}
            >
              Catálogo completo →
            </Link>
          </div>
          <FeaturedGrid eventId={EVENT_ID} showPrices={landing.showPrices} count={4} />
        </div>
      </section>
    ),

    // 03 — Técnicas
    techniques: (
      <section key="techniques" id="tecnicas" style={{ padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <Kicker n="03" label="Técnicas" />
          <h2 style={{ ...h2Style, marginBottom: "clamp(34px,4vw,60px)" }}>
            <BigTitle text={techniques.title} />
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,215px),1fr))",
              gap: "clamp(10px,1.2vw,18px)",
            }}
          >
            {landing.techniqueItems.map((t, i) => (
              <Link key={i} href={t.href} className="fdm-tech" style={{ position: "relative", display: "block", overflow: "hidden", background: PANEL }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.image}
                  alt={t.name}
                  loading="lazy"
                  style={{ display: "block", width: "100%", aspectRatio: "1", objectFit: "cover" }}
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,11,10,0.8) 0%, rgba(11,11,10,0.12) 46%, rgba(11,11,10,0) 72%)" }} />
                <div
                  style={{
                    position: "absolute",
                    inset: "auto 0 0 0",
                    padding: "clamp(14px,1.6vw,22px)",
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 12,
                    color: ON_DARK,
                  }}
                >
                  <span style={{ fontWeight: 400, fontSize: "clamp(17px,1.9vw,26px)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {t.name}
                  </span>
                  <span className="fdm-mono" style={{ fontSize: 10.5, letterSpacing: "0.2em" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    ),

    // 04 — Sedes (verde profundo)
    sedes: (
      <section
        key="sedes"
        id="ciudades"
        style={{ position: "relative", background: "var(--fdm-green-deep,#14513C)", color: ON_DARK, padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)", overflow: "hidden" }}
      >
        <div style={{ position: "relative", maxWidth: 1600, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: 24,
              marginBottom: "clamp(40px,5vw,72px)",
            }}
          >
            <div>
              <Kicker n="04" label={landing.sedes.badge} onDark />
              <h2 style={{ ...h2Style, color: ON_DARK }}>
                <BigTitle text={landing.sedes.title} color={ON_DARK} />
              </h2>
            </div>
            <p style={{ margin: 0, maxWidth: "38ch", fontSize: 15.5, lineHeight: 1.7, color: "rgba(245,244,239,0.75)" }}>
              {landing.sedes.subtitle}
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,220px),1fr))",
              gap: 1,
              background: "rgba(245,244,239,0.24)",
            }}
          >
            {landing.sedes.items.map((s, i) => (
              <div key={i} style={{ background: "var(--fdm-green-deep,#14513C)", padding: "clamp(26px,3vw,42px) clamp(18px,2vw,30px)", display: "flex", flexDirection: "column", gap: 10 }}>
                <span style={{ fontWeight: 400, fontSize: "clamp(24px,2.4vw,36px)", letterSpacing: "0.004em" }}>{s.name}</span>
                <span className="fdm-mono" style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: s.highlight ? "#8FE3B4" : "rgba(245,244,239,0.55)" }}>
                  {s.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    ),

    // 05 — Programas
    programs: (
      <section key="programs" id="programas" style={{ padding: "clamp(64px,9vw,140px) clamp(20px,4vw,56px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto" }}>
          <Kicker n="05" label={landing.programs.badge} />
          <h2 style={{ ...h2Style, marginBottom: "clamp(34px,4vw,60px)" }}>
            <BigTitle text={landing.programs.title} />
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,270px),1fr))",
              gap: "clamp(20px,2.4vw,34px)",
            }}
          >
            {landing.programs.items.map((p, i) => (
              <Link
                key={i}
                href={p.href}
                className="fdm-prog"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 52,
                  minHeight: 290,
                  padding: "clamp(24px,2.6vw,36px)",
                  border: `1px solid color-mix(in srgb, ${FG} 18%, transparent)`,
                  transition: "background .3s ease, color .3s ease, border-color .3s ease",
                }}
              >
                <span style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <span style={{ display: "block", fontWeight: 400, fontSize: "clamp(22px,2.2vw,32px)", letterSpacing: "0.004em" }}>{p.title}</span>
                  <span style={{ display: "block", fontSize: 14.5, lineHeight: 1.65, marginTop: 14, opacity: 0.72 }}>{p.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    ),

    // 06 — Convocatoria
    convocatoria: landing.convocatoria.open ? (
      <section key="convocatoria" id="convocatoria" style={{ padding: "0 clamp(20px,4vw,56px) clamp(64px,8vw,130px)" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", position: "relative", background: PANEL, color: ON_DARK, padding: "clamp(14px,2vw,22px)", overflow: "hidden" }}>
          <div
            style={{
              border: "1px solid rgba(245,244,239,0.24)",
              padding: "clamp(36px,6vw,90px) clamp(24px,4vw,72px)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,300px),1fr))",
              gap: "clamp(32px,4vw,72px)",
              alignItems: "center",
            }}
          >
            <div>
              <Kicker n="06" label={landing.convocatoria.badge} onDark />
              <h2 style={{ margin: 0, fontWeight: 200, fontSize: "clamp(34px,5.4vw,92px)", lineHeight: 1, letterSpacing: "0.004em", color: ON_DARK }}>
                {landing.convocatoria.title}{" "}
                <strong style={{ fontWeight: 500, color: GREEN }}>{landing.convocatoria.titleAccent}</strong>
              </h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "clamp(20px,3vw,44px)", marginTop: "clamp(28px,3vw,44px)", fontWeight: 300, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,244,239,0.6)" }}>
                <span><span style={{ display: "block", color: ON_DARK, fontWeight: 700, marginBottom: 6 }}>Apertura</span>{landing.convocatoria.openDate}</span>
                <span><span style={{ display: "block", color: ON_DARK, fontWeight: 700, marginBottom: 6 }}>Cierre</span>{landing.convocatoria.closeDate}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <p style={{ margin: 0, fontSize: "clamp(15.5px,1.25vw,19px)", lineHeight: 1.7, color: "rgba(245,244,239,0.76)", maxWidth: "44ch" }}>
                {landing.convocatoria.paragraph}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <Link href={landing.convocatoria.primaryHref} style={pill(GREEN, "#0B0B0A")}>{landing.convocatoria.ctaPrimaryLabel}</Link>
                <Link href={landing.convocatoria.secondaryHref} style={pillOutline("rgba(245,244,239,0.42)", ON_DARK)}>{landing.convocatoria.ctaSecondaryLabel}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    ) : null,

    // 07 — Boletín
    newsletter: landing.newsletter.enabled ? (
      <section key="newsletter" id="boletin" style={{ padding: "clamp(56px,7vw,120px) clamp(20px,4vw,56px)", borderTop: `1px solid color-mix(in srgb, ${FG} 14%, transparent)` }}>
        <div
          style={{
            maxWidth: 1600,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))",
            gap: "clamp(28px,4vw,72px)",
            alignItems: "center",
          }}
        >
          <div>
            <Kicker n="07" label={landing.newsletter.badge} />
            <h2 style={{ margin: 0, fontWeight: 200, fontSize: "clamp(26px,3.4vw,52px)", lineHeight: 1.1, letterSpacing: "0.004em", maxWidth: "26ch" }}>
              <BigTitle text={landing.newsletter.title} />
            </h2>
            <p style={{ margin: "18px 0 0", fontSize: 15, lineHeight: 1.7, color: `color-mix(in srgb, ${FG} 62%, transparent)`, maxWidth: "44ch" }}>
              {landing.newsletter.paragraph}
            </p>
          </div>
          <div>
            <form
              onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }}
              style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "stretch" }}
            >
              <input
                type="email"
                required
                aria-label="Correo electrónico"
                placeholder="tu@correo.com"
                style={{
                  flex: "1 1 220px",
                  minWidth: 0,
                  height: 56,
                  padding: "0 20px",
                  background: "transparent",
                  color: "inherit",
                  border: `1px solid color-mix(in srgb, ${FG} 26%, transparent)`,
                  borderRadius: 999,
                  fontSize: 15,
                  outline: "none",
                }}
              />
              <button type="submit" style={{ ...pill(FG, BG), height: 56, border: "none", cursor: "pointer" }}>
                Suscribirme
              </button>
            </form>
            {subscribed && (
              <p style={{ margin: "16px 0 0", fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: GREEN }}>
                Listo. Te escribiremos a ese correo.
              </p>
            )}
            <p style={{ margin: "16px 0 0", fontSize: 12.5, lineHeight: 1.6, color: `color-mix(in srgb, ${FG} 50%, transparent)`, maxWidth: "40ch" }}>
              {landing.newsletter.note}
            </p>
          </div>
        </div>
      </section>
    ) : null,
  };

  return (
    <div className="fdm-v2" id="top" style={{ width: "100%", overflowX: "hidden" }}>
      {/* ══ HERO ══ */}
      <section style={{ position: "relative", background: PANEL, color: ON_DARK, padding: "clamp(14px,2.2vw,26px)" }}>
        <div
          style={{
            position: "relative",
            border: "1px solid rgba(245,244,239,0.24)",
            padding: "clamp(32px,5vw,84px) clamp(20px,4vw,64px) clamp(28px,3.4vw,52px)",
            minHeight: "min(88vh,900px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            gap: "clamp(40px,6vw,80px)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "auto -8% -30% auto",
              width: "min(62vw,760px)",
              aspectRatio: "2.46",
              backgroundImage: `url('${logoSrc}')`,
              backgroundSize: "cover",
              backgroundPosition: "49% center",
              filter: "invert(1) contrast(1.5) brightness(1.05)",
              mixBlendMode: "lighten",
              opacity: 0.1,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14, fontWeight: 300, fontSize: 10.5, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(245,244,239,0.6)" }}>
            <span>{meta.edition}</span>
            <span style={{ color: GREEN }}>{meta.location}</span>
            <span>{meta.year}</span>
          </div>

          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "clamp(18px,2.4vw,30px)" }}>
            <span
              style={{
                display: "block",
                width: "clamp(100px,13vw,172px)",
                aspectRatio: "2.46",
                backgroundImage: `url('${logoSrc}')`,
                backgroundSize: "cover",
                backgroundPosition: "49% center",
                filter: "invert(1) contrast(1.5) brightness(1.05)",
                mixBlendMode: "lighten",
              }}
            />
            <h1 style={{ margin: 0, fontWeight: 200, fontSize: "clamp(50px,11.2vw,190px)", lineHeight: 1.02, letterSpacing: "0.015em", textTransform: "uppercase" }}>
              <HeroTitle text={hero.title} color={ON_DARK} />
            </h1>
            <p style={{ margin: 0, maxWidth: "52ch", fontSize: "clamp(15px,1.25vw,19px)", lineHeight: 1.65, color: "rgba(245,244,239,0.74)" }}>
              {hero.paragraph}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 6 }}>
              <Link href="/tickets" style={pill(ON_DARK, "#0B0B0A")}>{hero.ctaPrimaryLabel}</Link>
              <Link href="/catalogo" style={pillOutline("rgba(245,244,239,0.42)", ON_DARK)}>{hero.ctaSecondaryLabel}</Link>
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))",
              gap: "clamp(16px,2vw,32px)",
              paddingTop: "clamp(20px,2.6vw,34px)",
              borderTop: "1px solid rgba(245,244,239,0.2)",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "rgba(245,244,239,0.6)",
            }}
            className="fdm-mono"
          >
            {meta.stats.map((s, i) => (
              <span key={i}>
                <span style={{ display: "block", color: ON_DARK, fontWeight: 700, marginBottom: 6 }}>{s.label}</span>
                {s.value}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TICKER ══ */}
      {landing.showTicker && landing.ticker.enabled && (
        <div style={{ background: PANEL, color: ON_DARK, borderTop: "1px solid rgba(245,244,239,0.2)", overflow: "hidden", padding: "12px 0" }}>
          <div style={{ display: "flex", width: "max-content", animation: "fdm-marquee 46s linear infinite", fontWeight: 300, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase" }}>
            {[0, 1].map((rep) => (
              <span key={rep} style={{ display: "flex" }}>
                {landing.ticker.items.map((it, i) => (
                  <span key={i} style={{ display: "flex" }}>
                    <span style={{ paddingRight: 34, color: i === 0 ? GREEN : "inherit" }}>{it}</span>
                    <span style={{ paddingRight: 34 }}>—</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ══ SECCIONES (orden + visibilidad configurables) ══ */}
      {sections.order.filter((k) => sections.visible[k]).map((k) => blocks[k])}

      {/* ══ FOOTER ══ */}
      <footer id="acceso" style={{ borderTop: `1px solid color-mix(in srgb, ${FG} 14%, transparent)`, padding: "clamp(48px,6vw,96px) clamp(20px,4vw,56px) 40px" }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,230px),1fr))", gap: "clamp(32px,4vw,64px)" }}>
          <div>
            <span style={{ display: "block", width: "clamp(120px,14vw,180px)", aspectRatio: "2.46", backgroundImage: `url('${logoSrc}')`, backgroundSize: "cover", backgroundPosition: "49% center", filter: "var(--logoF,none) contrast(1.25)", mixBlendMode: "multiply" as any }} />
            <div style={{ fontWeight: 300, fontSize: "clamp(22px,2.4vw,30px)", letterSpacing: "0.02em", textTransform: "uppercase", marginTop: 18 }}>{content.brand.name}</div>
            <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.7, color: `color-mix(in srgb, ${FG} 60%, transparent)`, maxWidth: "32ch" }}>{landing.footer.description}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14.5 }}>
            <span style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: `color-mix(in srgb, ${FG} 48%, transparent)`, marginBottom: 8 }}>Navegar</span>
            <Link href="/catalogo" className="fdm-link">Catálogo</Link>
            <Link href="/tickets" className="fdm-link">Tickets</Link>
            <Link href="/convocatoria" className="fdm-link">Convocatoria</Link>
            <Link href="/#programas" className="fdm-link">Programas</Link>
            <Link href="/#ciudades" className="fdm-link">Sedes</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14.5 }}>
            <span style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: `color-mix(in srgb, ${FG} 48%, transparent)`, marginBottom: 8 }}>Contacto</span>
            <a href={`mailto:${contact.email}`} className="fdm-link" style={{ wordBreak: "break-word" }}>{contact.email}</a>
            <span style={{ color: `color-mix(in srgb, ${FG} 68%, transparent)` }}>{contact.phone}</span>
            <span style={{ color: `color-mix(in srgb, ${FG} 68%, transparent)` }}>Bogotá — Colombia</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14.5 }}>
            <span style={{ fontWeight: 300, fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", color: `color-mix(in srgb, ${FG} 48%, transparent)`, marginBottom: 8 }}>Síguenos</span>
            {social.instagram && <a href={social.instagram} className="fdm-link">Instagram</a>}
            {social.facebook && <a href={social.facebook} className="fdm-link">Facebook</a>}
            {social.tiktok && <a href={social.tiktok} className="fdm-link">TikTok</a>}
            {social.youtube && <a href={social.youtube} className="fdm-link">YouTube</a>}
          </div>
        </div>
        <div className="fdm-mono" style={{ maxWidth: 1600, margin: "clamp(40px,5vw,76px) auto 0", paddingTop: 22, borderTop: `1px solid color-mix(in srgb, ${FG} 14%, transparent)`, display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: `color-mix(in srgb, ${FG} 48%, transparent)` }}>
          <span>© Feria del Millón · Oficina para la Cultura SAS</span>
          <span style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Link href="/sobre-nosotros" className="fdm-link">Privacidad</Link>
            <Link href="/sobre-nosotros" className="fdm-link">Términos</Link>
            <Link href="/sobre-nosotros" className="fdm-link">FAQ</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
