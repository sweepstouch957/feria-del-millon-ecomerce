"use client";

import { useMemo, useState } from "react";
import SmartImage from "@components/ui/SmartImage";
import { useQuery } from "@tanstack/react-query";
import { getMyApplications, type ArtistApplication } from "@services/applications.service";
import ApplicationStatusCard from "@components/views/admin/artist/ApplicationStatusCard";
import { useArtistOrders, useSetItemDelivery } from "@hooks/queries/useArtistOrders";
import type { ArtistOrder, ArtistOrderAddress } from "@services/order.service";
import { useInFairPavilion } from "@hooks/queries/usePavilionsByUser";
import { formatCOP } from "@lib/money";
import { Bone, Dot, Ico } from "./ui";

/* Entregas del artista (port de "Mi estudio · Entregas"): quién compró, a
   dónde va y qué falta por entregar. Una tarjeta por pedido con el comprador,
   la dirección y, por cada obra, su línea "Comprada → Entregada" con el botón.
   Sólo llegan acá las piezas propias — el recorte lo hace el backend. */

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

export function formatOrderDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Cifras de entregas, compartidas con el Inicio del estudio. */
export function orderStats(orders: ArtistOrder[]) {
  let pending = 0;
  let delivered = 0;
  for (const o of orders) for (const i of o.items) i.deliveryStatus === "delivered" ? delivered++ : i.deliveryStatus === "pending" ? pending++ : 0;
  return { pending, delivered, total: orders.reduce((a, o) => a + (o.artistSubtotal || 0), 0) };
}

/** Ilustración de mapa del diseño: abre la dirección en Google Maps. */
function MapLink({ address }: { address: string }) {
  const road: React.CSSProperties = { position: "absolute", background: "var(--bg)" };
  return (
    <a
      className="fdm-st-map"
      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Abrir la dirección en el mapa"
    >
      <span style={{ ...road, left: 0, top: "34%", width: "100%", height: 10 }} />
      <span style={{ ...road, left: 0, top: "72%", width: "100%", height: 6 }} />
      <span style={{ ...road, left: "28%", top: 0, width: 8, height: "100%" }} />
      <span style={{ ...road, left: "66%", top: 0, width: 12, height: "100%" }} />
      <span style={{ ...road, left: "-10%", top: "52%", width: "120%", height: 6, transform: "rotate(-14deg)" }} />
      <span style={{ position: "absolute", left: "50%", top: "50%", margin: "-40px 0 0 -18px", width: 36, height: 36, borderRadius: 999, background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Ico name="pin" />
      </span>
      <span style={{ position: "absolute", left: 10, bottom: 10, padding: "4px 10px", borderRadius: 999, background: "var(--card)", fontSize: 12, color: "var(--fg2)" }}>Abrir en el mapa</span>
    </a>
  );
}

export default function ArtistOrders({ inFair = false }: { inFair?: boolean }) {
  // Las entregas solo existen si el artista ya está en la feria. Antes de eso
  // lo útil es en qué punto va su postulación.
  const { data: apps, isLoading: loadingApps } = useQuery<ArtistApplication[]>({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
    staleTime: 60_000,
    retry: false,
  });

  const inPavilion = useInFairPavilion();
  const isAccepted = inFair || inPavilion || (apps ?? []).some((a) => a.status === "accepted" || a.invited);

  // Siempre se piden: los artistas puestos directo en el pabellón no tienen postulación.
  const { data: orders = [], isLoading, isError, error } = useArtistOrders(true);
  const setDelivery = useSetItemDelivery();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const stats = useMemo(() => orderStats(orders), [orders]);
  const counts: Record<FilterKey, number> = { all: stats.pending + stats.delivered, pending: stats.pending, delivered: stats.delivered };

  const rows = useMemo(() => {
    const byStatus =
      filter === "all"
        ? orders
        : orders.map((o) => ({ ...o, items: o.items.filter((i) => i.deliveryStatus === filter) })).filter((o) => o.items.length > 0);
    const needle = q.trim().toLowerCase();
    if (!needle) return byStatus;
    return byStatus.filter((o) =>
      [o.code, o.buyer?.name, o.buyer?.email, o.buyer?.phone, o.buyer?.document, ...o.items.map((i) => i.title)].some((v) =>
        String(v ?? "").toLowerCase().includes(needle)
      )
    );
  }, [orders, filter, q]);

  const copyAddress = async (o: ArtistOrder) => {
    const text = [o.buyer?.name, o.buyer?.phone, formatAddress(o.buyer?.address), o.buyer?.address?.notes].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(o.id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      /* sin portapapeles (http o permisos): el dato igual está a la vista */
    }
  };

  if (loadingApps || isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }} aria-busy="true">
        <Bone h={84} style={{ borderRadius: 16 }} />
        <Bone h={52} style={{ borderRadius: 999 }} />
        <Bone h={280} style={{ borderRadius: 16 }} />
      </div>
    );
  }

  if (!isAccepted && !orders.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p className="fdm-st-lead">
          Todavía no hay entregas para gestionar: tus obras se ponen a la venta cuando tu postulación queda aceptada. Este es el punto en el que va.
        </p>
        <ApplicationStatusCard />
      </div>
    );
  }

  if (isError) {
    const status = (error as any)?.response?.status;
    // 502/503/504 vienen del gateway cuando el servicio de pedidos no responde.
    const unreachable = !status || [502, 503, 504].includes(status);
    return (
      <div className="fdm-st-empty">
        <b>No pudimos cargar tus entregas</b>
        {unreachable ? "El servicio de pedidos no está disponible en este momento. Vuelve a intentar en un rato." : (error as any)?.message || ""}
      </div>
    );
  }

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="fdm-st-stats">
        <div><span className="fdm-st-label">Por entregar</span><b>{stats.pending}</b></div>
        <div><span className="fdm-st-label">Entregadas</span><b>{stats.delivered}</b></div>
        <div><span className="fdm-st-label">Tu parte total</span><b>{formatCOP(stats.total)}</b></div>
      </div>

      {orders.length > 0 && (
        <div className="fdm-st-filters" style={{ position: "sticky", top: "calc(var(--nav-h,73px) + 61px)", zIndex: 10, padding: "10px 0", background: "var(--bg)" }}>
          <div className="fdm-st-seg" role="group" aria-label="Filtrar entregas">
            {FILTERS.map((f) => (
              <button key={f.key} type="button" className="fdm-studio-plain" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label} · {counts[f.key]}
              </button>
            ))}
          </div>
          <label className="fdm-st-search">
            <Ico name="search" />
            <input type="search" aria-label="Buscar por comprador, correo, teléfono, obra o código" placeholder="Buscar comprador, obra o código" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="fdm-st-empty" style={{ padding: "56px 24px" }}>
          <b>
            {orders.length === 0
              ? "Todavía no hay pedidos de tus obras"
              : filter === "delivered" && !q.trim()
              ? "Aún no has entregado obras"
              : filter === "pending" && !q.trim()
              ? "Estás al día"
              : "No hay entregas con ese filtro"}
          </b>
          <span style={{ fontSize: 15 }}>
            {orders.length === 0
              ? "Cuando alguien compre una pieza tuya, vas a ver aquí sus datos de entrega."
              : filter === "delivered" && !q.trim()
              ? "Cuando marques una entrega, aparecerá aquí."
              : filter === "pending" && !q.trim()
              ? "No tienes entregas pendientes."
              : "Prueba con otra búsqueda o cambia el filtro."}
          </span>
        </div>
      ) : (
        rows.map((o) => {
          const address = formatAddress(o.buyer?.address);
          const allDone = o.items.every((i) => i.deliveryStatus === "delivered");
          return (
            <article key={o.id} className="fdm-st-order">
              <div className="top">
                <span><b>#{o.code}</b> · {formatOrderDate(o.createdAt)}</span>
                <span className={`fdm-st-pill ${allDone ? "is-ok" : "is-warn"}`}>{allDone ? "Entregada" : "Por entregar"}</span>
              </div>

              <div className="mid">
                <div>
                  <span className="fdm-st-label">Comprador</span>
                  <span style={{ fontSize: 18, fontWeight: 500 }}>{o.buyer?.name || "Comprador"}</span>
                  {o.buyer?.document && <span className="line"><Ico name="id" />Documento: {o.buyer.document}</span>}
                  {o.buyer?.phone && <span className="line"><Ico name="phone" />{o.buyer.phone}</span>}
                  {o.buyer?.email && <span className="line"><Ico name="mail" />{o.buyer.email}</span>}
                  {(o.buyer?.phone || o.buyer?.email) && (
                    <div className="fdm-st-acts" style={{ paddingTop: 4 }}>
                      {o.buyer?.phone && <a className="fdm-st-btn is-sm" href={`tel:${o.buyer.phone}`}><Ico name="phone" />Llamar</a>}
                      {o.buyer?.email && <a className="fdm-st-btn is-sm" href={`mailto:${o.buyer.email}`}><Ico name="mail" />Escribir</a>}
                    </div>
                  )}
                </div>

                <div>
                  <span className="fdm-st-label">Dirección de entrega</span>
                  {address ? (
                    <>
                      <span style={{ display: "flex", gap: 10, fontSize: 16, lineHeight: 1.4 }}>
                        <Ico name="pin" style={{ color: "var(--green)", marginTop: 2 }} />
                        {address}
                      </span>
                      {o.buyer?.address?.notes && <span className="fdm-st-note">Nota: {o.buyer.address.notes}</span>}
                      <MapLink address={address} />
                      <div className="fdm-st-acts">
                        <a className="fdm-st-btn is-sm" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer"><Ico name="pin" />Cómo llegar</a>
                        <button type="button" className="fdm-st-btn is-sm fdm-studio-plain" onClick={() => copyAddress(o)}><Ico name="copy" />{copied === o.id ? "Datos copiados" : "Copiar datos de envío"}</button>
                      </div>
                    </>
                  ) : (
                    <span className="fdm-st-empty" style={{ padding: "20px 16px", fontSize: 15 }}>Sin dirección: se entrega en la feria.</span>
                  )}
                </div>
              </div>

              {o.items.map((it) => {
                const delivered = it.deliveryStatus === "delivered";
                const returned = it.deliveryStatus === "returned";
                const busy = setDelivery.isPending;
                return (
                  <div key={it.id} className="fdm-st-item">
                    <div className="what">
                      <span className="fdm-st-thumb" style={{ width: 64, height: 64 }}>
                        {it.image ? <SmartImage src={it.image} alt="" fit="cover" sizes="64px" /> : "Obra"}
                      </span>
                      <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 18, overflowWrap: "anywhere" }}>{it.title || "Obra"}</span>
                        <span style={{ fontSize: 15, fontWeight: 500 }}>{it.qty > 1 ? `${it.qty} × ` : ""}{formatCOP(it.unitPrice, { currency: it.currency })}</span>
                      </span>
                    </div>

                    {returned ? (
                      <span className="fdm-st-pill is-bad">Devuelta</span>
                    ) : (
                      <div className="track">
                        <Dot on size="xs" />
                        <span>Comprada</span>
                        <i aria-hidden="true" className={delivered ? "is-on" : ""} />
                        <Dot on={delivered} size="xs" />
                        <span style={{ color: delivered ? "var(--fg)" : "var(--fg2)" }}>
                          Entregada{delivered && it.deliveredAt ? ` · ${formatOrderDate(it.deliveredAt)}` : ""}
                        </span>
                      </div>
                    )}

                    {delivered ? (
                      <button type="button" className="fdm-st-link is-mute fdm-studio-plain" disabled={busy} onClick={() => setDelivery.mutate({ orderId: o.id, itemId: it.id, deliveryStatus: "pending" })}>
                        Deshacer
                      </button>
                    ) : (
                      <button type="button" className="fdm-st-btn is-green fdm-studio-plain" disabled={busy} onClick={() => setDelivery.mutate({ orderId: o.id, itemId: it.id, deliveryStatus: "delivered" })}>
                        <Ico name="check" size={16} sw={2} />
                        Marcar entregada
                      </button>
                    )}
                  </div>
                );
              })}

              <div className="fdm-st-item" style={{ paddingTop: 12, paddingBottom: 12 }}>
                <span style={{ fontSize: 14, color: "var(--green-deep)", fontWeight: 500 }}>Tu parte de este pedido: {formatCOP(o.artistSubtotal)}</span>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
