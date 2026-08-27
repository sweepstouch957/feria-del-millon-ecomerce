"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";
import { ApplicationCard } from "@components/views/convocatoria/ApplicationCard";
import SiteFooter from "@components/SiteFooter";
import Skeleton from "@components/ui/Skeleton";

/* Mi postulación — sistema editorial v2. */

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const ROOT_VARS = {
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

const PAGE_CSS = `
  .fdm-sol a { transition: color .3s ease, border-color .3s ease, opacity .3s ease; }
  .fdm-sol-link:hover { color: var(--acc); }
  .fdm-sol-list { display: flex; flex-direction: column; gap: clamp(20px,2.4vw,32px); }
`;

export default function MiSolicitudPage() {
  const { data: apps = [], isLoading, error } = useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
    retry: (failureCount, err: any) => {
      if (err?.response?.status === 401) return false;
      return failureCount < 2;
    },
  });

  // Sin sesión no hay postulación que mostrar.
  useEffect(() => {
    if (error && (error as any)?.response?.status === 401) {
      window.location.href = `/login?role=artist&redirect=${encodeURIComponent(
        "/convocatoria/mi-solicitud"
      )}`;
    }
  }, [error]);

  const accepted = apps.some((a: ArtistApplication) => a.status === "accepted");

  return (
    <div style={ROOT_VARS}>
      <style>{PAGE_CSS}</style>

      <div
        className="fdm-sol"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "0 clamp(20px,4vw,56px)" }}
      >
        {/* Migas */}
        <nav
          aria-label="Migas de pan"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 9,
            padding: "12px 0",
            borderBottom: `1px solid ${mix(12)}`,
            ...EYEBROW,
            fontSize: 10.5,
            letterSpacing: "0.14em",
            color: mix(55),
          }}
        >
          <Link href="/convocatoria" className="fdm-sol-link">
            Convocatoria
          </Link>
          <span aria-hidden>/</span>
          <span aria-current="page" style={{ color: mix(85) }}>
            Mi postulación
          </span>
        </nav>

        {/* Encabezado */}
        <header
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 20,
            padding: "clamp(22px,2.6vw,36px) 0 clamp(16px,1.8vw,24px)",
            borderBottom: `1px solid ${mix(20)}`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ ...EYEBROW, color: "var(--acc)" }}>Centro de control</span>
            <h1
              style={{
                margin: 0,
                fontWeight: 300,
                fontSize: "clamp(32px,4vw,62px)",
                lineHeight: 0.98,
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}
            >
              Mi postulación
            </h1>
          </div>

          {/* Si ya está adentro, lo que corresponde es cargar el catálogo. */}
          {accepted ? (
            <Link
              href="/admin/artist"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 46,
                padding: "0 26px",
                borderRadius: 999,
                background: "var(--acc)",
                color: "#0B0B0A",
                ...EYEBROW,
                fontSize: 10.5,
                letterSpacing: "0.12em",
              }}
            >
              Subir mi catálogo →
            </Link>
          ) : (
            <Link
              href="/convocatoria/aplicar"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 46,
                padding: "0 26px",
                borderRadius: 999,
                background: "var(--fg)",
                color: "var(--bg)",
                ...EYEBROW,
                fontSize: 10.5,
                letterSpacing: "0.12em",
              }}
            >
              Nueva postulación
            </Link>
          )}
        </header>

        <section style={{ padding: "clamp(22px,2.6vw,36px) 0 clamp(40px,4vw,64px)" }}>
          {isLoading ? (
            <div className="fdm-sol-list">
              {[0, 1].map((i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <Skeleton w="30%" h={11} />
                  <Skeleton w="55%" h={30} />
                  <Skeleton aspect="6/1" />
                </div>
              ))}
            </div>
          ) : error && (error as any)?.response?.status !== 401 ? (
            <p
              role="alert"
              style={{
                margin: 0,
                padding: "14px 16px",
                borderLeft: "2px solid #B4472A",
                background: mix(4),
                fontSize: 15,
                lineHeight: 1.55,
              }}
            >
              {(error as any)?.message || "No pudimos cargar tus postulaciones. Intentá de nuevo."}
            </p>
          ) : apps.length === 0 ? (
            <div
              style={{
                borderTop: `1px solid ${mix(22)}`,
                borderBottom: `1px solid ${mix(22)}`,
                padding: "clamp(46px,6vw,90px) clamp(20px,3vw,40px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 18,
                textAlign: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "clamp(21px,2.4vw,30px)",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}
              >
                Todavía no postulaste
              </span>
              <p style={{ margin: 0, maxWidth: "46ch", fontSize: 15, lineHeight: 1.6, color: mix(70) }}>
                Presentá tu obra a la convocatoria y seguí acá el estado de tu proceso, paso por paso.
              </p>
              <Link
                href="/convocatoria/aplicar"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 48,
                  padding: "0 30px",
                  borderRadius: 999,
                  background: "var(--fg)",
                  color: "var(--bg)",
                  ...EYEBROW,
                  fontSize: 11,
                  letterSpacing: "0.12em",
                }}
              >
                Empezar postulación
              </Link>
            </div>
          ) : (
            <div className="fdm-sol-list">
              {apps.map((app: ArtistApplication) => (
                <ApplicationCard key={app._id} app={app} />
              ))}
            </div>
          )}
        </section>
      </div>

      <SiteFooter />
    </div>
  );
}
