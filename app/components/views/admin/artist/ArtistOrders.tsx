"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getMyApplications,
  type ArtistApplication,
} from "@services/applications.service";
import ApplicationStatusCard from "@components/views/admin/artist/ApplicationStatusCard";
import { useArtistOrders, useSetItemDelivery } from "@hooks/queries/useArtistOrders";
import type { ArtistOrder, ArtistOrderAddress } from "@services/order.service";
import Skeleton from "@components/ui/Skeleton";
import { formatCOP } from "@lib/money";

/* Agenda de entregas del artista: quién compró, a dónde va y en qué estado.
   Sólo llegan acá las piezas propias — el recorte lo hace el backend. */

const mix = (pct: number) => `color-mix(in srgb, var(--fg) ${pct}%, transparent)`;

const EYEBROW: React.CSSProperties = {
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const FILTERS = [
  { key: "all", label: "Todas" },
  { key: "pending", label: "Por entregar" },
  { key: "delivered", label: "Entregadas" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function formatAddress(a?: ArtistOrderAddress | null) {
  if (!a) return "";
  return [a.line1, a.line2, a.city, a.state, a.zip, a.country]
    .map((x) => String(x ?? "").trim())
    .filter(Boolean)
    .join(", ");
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function ArtistOrders() {
  // Las entregas solo existen si el artista ya está en la feria. Antes de eso
  // lo útil no es un listado vacío (ni un error de red), sino en qué punto va
  // su postulación y qué le toca hacer.
  const { data: apps, isLoading: loadingApps } = useQuery<ArtistApplication[]>({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
    staleTime: 60_000,
    retry: false,
  });

  const isAccepted = (apps ?? []).some((a) => a.status === "accepted");

  const {
    data: orders = [],
    isLoading,
    isError,
    error,
  } = useArtistOrders(isAccepted);
  const setDelivery = useSetItemDelivery();
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [copied, setCopied] = useState<string | null>(null);

  const rows = useMemo(() => {
    if (filter === "all") return orders;
    return orders
      .map((o) => ({ ...o, items: o.items.filter((i) => i.deliveryStatus === filter) }))
      .filter((o) => o.items.length > 0);
  }, [orders, filter]);

  const pendingCount = useMemo(
    () =>
      orders.reduce(
        (a, o) => a + o.items.filter((i) => i.deliveryStatus === "pending").length,
        0
      ),
    [orders]
  );

  const copyAddress = async (o: ArtistOrder) => {
    const text = [
      o.buyer?.name,
      o.buyer?.phone,
      formatAddress(o.buyer?.address),
      o.buyer?.address?.notes,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(o.id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      /* sin portapapeles (http o permisos): el dato igual está a la vista */
    }
  };

  if (loadingApps) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Skeleton w="35%" h={11} />
        <Skeleton w="60%" h={26} />
        <Skeleton w="85%" h={14} />
      </div>
    );
  }

  if (!isAccepted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ margin: 0, maxWidth: "56ch", fontSize: 15, lineHeight: 1.6, color: mix(72) }}>
          Todavía no hay entregas para gestionar: tus obras se ponen a la venta
          cuando tu postulación queda aceptada. Este es el punto en el que va.
        </p>
        <ApplicationStatusCard />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Skeleton w="30%" h={11} />
            <Skeleton w="65%" h={18} />
            <Skeleton w="85%" h={14} />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    const status = (error as any)?.response?.status;
    // 502/503/504 vienen del gateway cuando el servicio de pedidos no responde:
    // no es culpa de quien mira la pantalla, y el código crudo no le sirve.
    const unreachable = !status || [502, 503, 504].includes(status);
    return (
      <p style={{ margin: 0, maxWidth: "56ch", fontSize: 15, lineHeight: 1.6, color: mix(70) }}>
        {unreachable
          ? "El servicio de pedidos no está disponible en este momento. Volvé a intentar en un rato; si sigue igual, avisanos."
          : `No pudimos cargar tus pedidos. ${(error as any)?.message || ""}`}
      </p>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <span style={{ ...EYEBROW, color: "var(--acc)" }}>
          Entregas {pendingCount > 0 && `· ${pendingCount} pendiente${pendingCount === 1 ? "" : "s"}`}
        </span>
        <div style={{ display: "flex", gap: "clamp(14px,2vw,24px)" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                background: "transparent",
                border: 0,
                padding: "4px 0",
                cursor: "pointer",
                ...EYEBROW,
                fontSize: 10.5,
                letterSpacing: "0.14em",
                color: filter === f.key ? "var(--acc)" : mix(58),
                borderBottom: `1px solid ${filter === f.key ? "var(--acc)" : "transparent"}`,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p style={{ margin: 0, maxWidth: "52ch", fontSize: 15, lineHeight: 1.6, color: mix(70) }}>
          {filter === "pending"
            ? "No tenés entregas pendientes."
            : orders.length === 0
            ? "Todavía no hay pedidos de tus obras. Cuando alguien compre una pieza tuya, vas a ver acá sus datos de entrega."
            : "Nada en este filtro."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${mix(22)}` }}>
          {rows.map((o) => {
            const address = formatAddress(o.buyer?.address);
            return (
              <article
                key={o.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "clamp(14px,2vw,30px)",
                  padding: "clamp(16px,1.8vw,22px) 0",
                  borderBottom: `1px solid ${mix(12)}`,
                }}
              >
                {/* Comprador y destino */}
                <div
                  style={{
                    flex: "1 1 280px",
                    minWidth: "min(100%,260px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <span style={{ ...EYEBROW, fontSize: 9.5, color: mix(48) }}>
                    #{o.code} · {formatDate(o.createdAt)}
                  </span>
                  <span style={{ fontWeight: 500, fontSize: 17, lineHeight: 1.25 }}>
                    {o.buyer?.name || "Comprador"}
                  </span>

                  {o.buyer?.phone && (
                    <a
                      href={`tel:${o.buyer.phone}`}
                      style={{ fontSize: 14, color: mix(72) }}
                    >
                      {o.buyer.phone}
                    </a>
                  )}
                  {o.buyer?.email && (
                    <a
                      href={`mailto:${o.buyer.email}`}
                      style={{ fontSize: 14, color: mix(72), wordBreak: "break-word" }}
                    >
                      {o.buyer.email}
                    </a>
                  )}

                  {address ? (
                    <span style={{ fontSize: 14, lineHeight: 1.5, color: mix(78) }}>{address}</span>
                  ) : (
                    <span style={{ fontSize: 13.5, color: mix(50) }}>
                      Sin dirección — entrega en feria
                    </span>
                  )}
                  {o.buyer?.address?.notes && (
                    <span style={{ fontSize: 13, lineHeight: 1.5, color: mix(58) }}>
                      Nota: {o.buyer.address.notes}
                    </span>
                  )}

                  {address && (
                    <button
                      type="button"
                      onClick={() => copyAddress(o)}
                      style={{
                        alignSelf: "flex-start",
                        marginTop: 4,
                        background: "transparent",
                        border: 0,
                        padding: 0,
                        cursor: "pointer",
                        color: "var(--acc)",
                        ...EYEBROW,
                        fontSize: 9.5,
                        letterSpacing: "0.14em",
                      }}
                    >
                      {copied === o.id ? "Copiado ✓" : "Copiar datos de envío"}
                    </button>
                  )}
                </div>

                {/* Piezas de esta orden */}
                <div
                  style={{
                    flex: "2 1 340px",
                    minWidth: "min(100%,280px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {o.items.map((it) => {
                    const delivered = it.deliveryStatus === "delivered";
                    const returned = it.deliveryStatus === "returned";
                    const busy = setDelivery.isPending;
                    return (
                      <div
                        key={it.id}
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 12,
                          padding: "8px 0",
                          borderBottom: `1px solid ${mix(9)}`,
                        }}
                      >
                        <span style={{ flex: "1 1 130px", fontSize: 14.5, minWidth: 0 }}>
                          {it.qty > 1 ? `${it.qty} × ` : ""}
                          {formatCOP(it.unitPrice, { currency: it.currency })}
                        </span>

                        <span
                          style={{
                            ...EYEBROW,
                            fontSize: 9.5,
                            letterSpacing: "0.14em",
                            color: delivered ? "var(--acc)" : returned ? "#B4472A" : mix(52),
                          }}
                        >
                          {delivered ? "Entregada" : returned ? "Devuelta" : "Por entregar"}
                          {delivered && it.deliveredAt ? ` · ${formatDate(it.deliveredAt)}` : ""}
                        </span>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setDelivery.mutate({
                              orderId: o.id,
                              itemId: it.id,
                              deliveryStatus: delivered ? "pending" : "delivered",
                            })
                          }
                          style={{
                            marginLeft: "auto",
                            height: 34,
                            padding: "0 16px",
                            borderRadius: 999,
                            cursor: busy ? "wait" : "pointer",
                            opacity: busy ? 0.6 : 1,
                            background: delivered ? "transparent" : "var(--acc)",
                            color: delivered ? "inherit" : "#0B0B0A",
                            border: `1px solid ${delivered ? mix(26) : "var(--acc)"}`,
                            ...EYEBROW,
                            fontSize: 9.5,
                            letterSpacing: "0.12em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {delivered ? "Deshacer" : "Marcar entregada"}
                        </button>
                      </div>
                    );
                  })}

                  <span style={{ ...EYEBROW, fontSize: 9.5, color: mix(50), marginTop: 2 }}>
                    Tu parte: {formatCOP(o.artistSubtotal)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
