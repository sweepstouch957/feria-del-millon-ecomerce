"use client";

import Link from "next/link";
import { useSiteContent, useSiteLanding } from "@provider/siteConfigProvider";
import { pdfFirstPage } from "@lib/pdfPreview";

/* Página de enlaces (/links) — la que se imprime en el QR.
   Misma línea del sitio: panel de tinta, versalitas espaciadas, filetes de 1px
   y píldoras. Todo sale de la config del admin: nada escrito acá. */

const GREEN = "var(--fdm-green,#3FA46E)";
const PANEL = "var(--fdm-panel,#0B0B0A)";
const FG = "var(--fdm-fg,#0B0B0A)";
const BG = "var(--fdm-bg,#F7F6F2)";
const ON_DARK = "#F5F4EF";
const HAIR = "color-mix(in srgb, var(--fdm-fg,#0B0B0A) 14%, transparent)";

const eyebrow: React.CSSProperties = {
  fontWeight: 300,
  fontSize: 10.5,
  letterSpacing: "0.26em",
  textTransform: "uppercase",
};

/** Un enlace de la lista: fila alta, con su descripción y la flecha. */
function LinkRow({
  label,
  description,
  href,
  highlight,
}: {
  label: string;
  description?: string;
  href: string;
  highlight?: boolean;
}) {
  const external = /^https?:\/\//i.test(href);
  const inner = (
    <>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: "clamp(16px,1.8vw,19px)",
            fontWeight: 400,
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </span>
        {description ? (
          <span
            style={{
              display: "block",
              marginTop: 4,
              fontSize: 13.5,
              lineHeight: 1.5,
              opacity: highlight ? 0.75 : 0.6,
            }}
          >
            {description}
          </span>
        ) : null}
      </span>
      <span style={{ flex: "0 0 auto", fontSize: 18, opacity: 0.7 }} aria-hidden>
        →
      </span>
    </>
  );

  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 18,
    padding: "20px 24px",
    textDecoration: "none",
    transition: "all .25s ease",
    background: highlight ? GREEN : "transparent",
    color: highlight ? "#0B0B0A" : FG,
    border: `1px solid ${highlight ? GREEN : HAIR}`,
  };

  return external ? (
    <a
      className="fdm-linkrow"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
    >
      {inner}
    </a>
  ) : (
    <Link
      className="fdm-linkrow"
      href={href}
      style={style}
    >
      {inner}
    </Link>
  );
}

export default function LinktreeView() {
  const landing = useSiteLanding();
  const content = useSiteContent();
  const lt = landing.linktree;
  const links = (lt.links || []).filter((l) => l.visible && l.href);
  const cover = pdfFirstPage(lt.doc.url, 1000);

  return (
    <div
      className="fdm-v2"
      style={{ width: "100%", overflowX: "hidden", background: BG, color: FG }}
    >
      {/* ── Encabezado en tinta ───────────────────────────────────────────── */}
      <section
        style={{
          background: PANEL,
          color: ON_DARK,
          padding: "clamp(42px,6vw,86px) clamp(20px,5vw,64px) clamp(32px,4vw,56px)",
        }}
      >
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {lt.badge ? (
            <div style={{ ...eyebrow, color: GREEN, marginBottom: 20 }}>{lt.badge}</div>
          ) : null}

          <h1
            style={{
              margin: 0,
              fontWeight: 200,
              fontSize: "clamp(34px,6vw,72px)",
              lineHeight: 1.05,
              letterSpacing: "0.01em",
            }}
          >
            {lt.title}{" "}
            {lt.titleStrong ? (
              <strong style={{ fontWeight: 500, color: GREEN }}>{lt.titleStrong}</strong>
            ) : null}
          </h1>

          {lt.paragraph ? (
            <p
              style={{
                margin: "22px 0 0",
                maxWidth: 620,
                fontSize: "clamp(15px,1.5vw,18px)",
                lineHeight: 1.65,
                color: "rgba(245,244,239,0.78)",
              }}
            >
              {lt.paragraph}
            </p>
          ) : null}

          {/* Las cifras del afiche: una por celda, separadas por filete. */}
          {lt.stats?.length ? (
            <div
              style={{
                marginTop: 38,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 1,
                background: "rgba(245,244,239,0.16)",
                border: "1px solid rgba(245,244,239,0.16)",
              }}
            >
              {lt.stats.map((s) => (
                <div
                  key={s.label}
                  style={{ background: PANEL, padding: "16px 18px 18px", minWidth: 0 }}
                >
                  <div style={{ ...eyebrow, fontSize: 9.5, color: "rgba(245,244,239,0.55)" }}>
                    {s.label}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontWeight: 300,
                      fontSize: "clamp(16px,1.7vw,20px)",
                      lineHeight: 1.25,
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* ── Botones: los enlaces y, con el mismo peso, el PDF ─────────────── */}
      <section style={{ padding: "clamp(32px,4vw,56px) clamp(20px,5vw,64px) 0" }}>
        <div
          style={{
            maxWidth: 820,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {links.map((l) => (
            <LinkRow
              key={`${l.label}-${l.href}`}
              label={l.label}
              description={l.description}
              href={l.href}
              highlight={l.highlight}
            />
          ))}

          {/* El documento es otro botón de la lista, no una tarjeta aparte:
              quien llega por el QR tiene dos acciones y se ven igual. */}
          {lt.doc.url ? (
            <LinkRow
              label={lt.doc.buttonLabel || lt.doc.title || "Abrir el PDF"}
              description={lt.doc.subtitle || lt.doc.title}
              href={lt.doc.url}
            />
          ) : null}

          {!links.length && !lt.doc.url ? (
            <p style={{ margin: 0, fontSize: 15, opacity: 0.65 }}>
              Todavía no hay enlaces publicados.
            </p>
          ) : null}
        </div>
      </section>

      {/* ── Portada del PDF ───────────────────────────────────────────────── */}
      {cover ? (
        <section style={{ padding: "clamp(28px,3.5vw,44px) clamp(20px,5vw,64px) 0" }}>
          <div style={{ maxWidth: 820, margin: "0 auto", border: `1px solid ${HAIR}` }}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 10,
                padding: "14px 20px",
                borderBottom: `1px solid ${HAIR}`,
              }}
            >
              <span style={{ ...eyebrow, fontSize: 9.5, opacity: 0.6 }}>{lt.doc.title}</span>
              <span style={{ ...eyebrow, fontSize: 9.5, opacity: 0.45 }}>Primera página</span>
            </div>
            <a
              href={lt.doc.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cover}
                alt={`Portada de ${lt.doc.title}`}
                loading="lazy"
                style={{ display: "block", width: "100%", height: "auto", background: "#fff" }}
              />
            </a>
          </div>
        </section>
      ) : null}

      {/* ── Pie ───────────────────────────────────────────────────────────── */}
      <section style={{ padding: "clamp(36px,4vw,64px) clamp(20px,5vw,64px) clamp(48px,6vw,88px)" }}>
        <div
          style={{
            maxWidth: 820,
            margin: "0 auto",
            paddingTop: 22,
            borderTop: `1px solid ${HAIR}`,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          {lt.note ? (
            <p style={{ margin: 0, flex: "1 1 320px", fontSize: 13.5, lineHeight: 1.6, opacity: 0.65 }}>
              {lt.note}
            </p>
          ) : null}
          <Link
            href="/"
            style={{ ...eyebrow, fontSize: 9.5, color: FG, opacity: 0.6, textDecoration: "none" }}
          >
            {content.brand.name || "Feria del Millón"} →
          </Link>
        </div>
      </section>
    </div>
  );
}
