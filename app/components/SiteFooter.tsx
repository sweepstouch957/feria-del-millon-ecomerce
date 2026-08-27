"use client";

import Link from "next/link";
import { useSiteContent, useSiteNav } from "@provider/siteConfigProvider";

/* Footer editorial v2 — port del pie de Catalogo.dc.html / Obra.dc.html.
   Se monta una sola vez en el layout: los textos salen de site-config, así
   el admin los edita sin tocar código. */

const JOST = "Jost, system-ui, sans-serif";
const LOGO = "/assets/fdm/logo-fdm.jpg";
const mix = (pct: number) =>
  `color-mix(in srgb, var(--fdm-fg,#0B0B0A) ${pct}%, transparent)`;

const COL_LABEL: React.CSSProperties = {
  fontFamily: JOST,
  fontWeight: 500,
  fontSize: 10.5,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: mix(52),
  marginBottom: 6,
};

export default function SiteFooter() {
  const { brand, contact, social } = useSiteContent();
  const nav = useSiteNav();
  const navItems = nav.items.filter((i: any) => i.visible).slice(0, 5);

  const socials = [
    ["Instagram", social?.instagram],
    ["Facebook", social?.facebook],
    ["TikTok", social?.tiktok],
    ["YouTube", social?.youtube],
  ].filter(([, href]) => !!href) as [string, string][];

  return (
    <footer
      style={{
        background: "var(--fdm-bg,#F7F6F2)",
        color: "var(--fdm-fg,#0B0B0A)",
        borderTop: `1px solid ${mix(18)}`,
        padding: "clamp(30px,3.6vw,56px) clamp(20px,4vw,56px) clamp(20px,2.4vw,32px)",
        fontFamily: JOST,
        fontWeight: 400,
      }}
    >
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,210px),1fr))",
          gap: "clamp(22px,2.6vw,44px)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              display: "block",
              width: 92,
              aspectRatio: "2.46",
              backgroundImage: `url('${brand?.logo || LOGO}')`,
              backgroundSize: "cover",
              backgroundPosition: "49% center",
              filter: "var(--fdm-logo-filter,none) contrast(1.25)",
              mixBlendMode: "var(--fdm-logo-blend,multiply)" as any,
            }}
          />
          <p style={{ margin: 0, maxWidth: "34ch", fontSize: 14.5, lineHeight: 1.65, color: mix(68) }}>
            {brand?.tagline || "Arte emergente colombiano al alcance de todos."}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 14.5 }}>
          <span style={COL_LABEL}>Navegación</span>
          {navItems.map((i: any) => (
            <Link key={i.href} href={i.href} className="fdm-foot-link">
              {i.label}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 14.5 }}>
          <span style={COL_LABEL}>Contacto</span>
          {contact?.email && (
            <a
              href={`mailto:${contact.email}`}
              className="fdm-foot-link"
              style={{ wordBreak: "break-word" }}
            >
              {contact.email}
            </a>
          )}
          {contact?.phone && <span style={{ color: mix(72) }}>{contact.phone}</span>}
          <span style={{ color: mix(72) }}>Bogotá — Colombia</span>
        </div>

        {socials.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 14.5 }}>
            <span style={COL_LABEL}>Síguenos</span>
            {socials.map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="fdm-foot-link"
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          maxWidth: 1600,
          margin: "clamp(26px,3vw,44px) auto 0",
          paddingTop: 16,
          borderTop: `1px solid ${mix(14)}`,
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          justifyContent: "space-between",
          fontWeight: 500,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: mix(52),
        }}
      >
        <span>© {brand?.name || "Feria del Millón"} · Oficina para la Cultura SAS</span>
        <span style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <Link href="/legal" className="fdm-foot-link">
            Privacidad
          </Link>
          <Link href="/legal" className="fdm-foot-link">
            Términos
          </Link>
        </span>
      </div>
    </footer>
  );
}
