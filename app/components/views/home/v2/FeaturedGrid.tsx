"use client";

import Link from "next/link";
import { useArtworksCursor } from "@hooks/queries/useArtworksCursor";
import { formatCOP } from "@lib/money";

const ON_DARK = "var(--fdm-on-dark,#F5F4EF)";
const GREEN = "var(--fdm-green,#3FA46E)";

function money(value: any, currency = "COP") {
  return formatCOP(value, { currency });
}

function artistOf(a: any) {
  const f = a?.artistInfo?.firstName || "";
  const l = a?.artistInfo?.lastName || "";
  return `${f} ${l}`.trim() || a?.artist || "Artista";
}

function imageOf(a: any): string {
  if (Array.isArray(a?.images) && a.images[0]) return a.images[0];
  if (typeof a?.image === "string" && a.image) return a.image;
  return "";
}

// Rejilla de obras destacadas del diseño v2. Trae obras reales del catálogo;
// si no hay (o cargando), muestra placeholders con el mismo layout.
export default function FeaturedGrid({
  eventId,
  showPrices,
  count = 4,
}: {
  eventId: string;
  showPrices: boolean;
  count?: number;
}) {
  const { rows, isLoading } = useArtworksCursor({ event: eventId, limit: 12 });
  const featured = (rows || []).slice(0, count);

  const cards =
    !isLoading && featured.length > 0
      ? featured
      : Array.from({ length: count }).map((_, i) => ({ _placeholder: true, i }));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,250px),1fr))",
        gap: "clamp(22px,2.6vw,44px)",
      }}
    >
      {cards.map((a: any, idx: number) => {
        const isPh = a._placeholder;
        const id = a._id || a.id;
        const href = isPh ? "/catalogo" : `/obra/${encodeURIComponent(id)}`;
        const img = isPh ? "" : imageOf(a);
        return (
          <Link key={id || `ph-${idx}`} href={href} style={{ display: "block" }}>
            <div style={{ padding: "clamp(12px,1.4vw,22px)", background: "#F5F4EF" }}>
              <div
                style={{
                  aspectRatio: "4/5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  background:
                    "repeating-linear-gradient(135deg, rgba(11,11,10,0.09) 0 7px, rgba(11,11,10,0.03) 7px 14px)",
                }}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={a.title || "Obra"}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <span
                    className="fdm-mono"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      color: "rgba(11,11,10,0.45)",
                      textTransform: "uppercase",
                    }}
                  >
                    obra {String(idx + 1).padStart(2, "0")}
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                marginTop: 18,
                alignItems: "baseline",
              }}
            >
              <span>
                <span style={{ display: "block", fontWeight: 400, fontSize: 19, color: ON_DARK }}>
                  {isPh ? "Sin título" : a.title || "Sin título"}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: "rgba(245,244,239,0.58)",
                    marginTop: 5,
                  }}
                >
                  {isPh ? "Nombre del artista" : artistOf(a)}
                </span>
              </span>
              {showPrices && (
                <span className="fdm-mono" style={{ fontSize: 11.5, color: GREEN, whiteSpace: "nowrap" }}>
                  {isPh ? "$1.000.000" : money(a.price, a.currency)}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
