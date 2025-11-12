/* eslint-disable @typescript-eslint/no-explicit-any */
// services/tickets.service.ts
import apiClient from "src/http/axios";

/** ────────── Tipos base ────────── */
export interface PaginationParams {
  limit?: number;
  cursor?: string; // paginación basada en cursor (desde el backend)
}

export interface PaginatedCursorResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export type TicketStatus = "sold" | "refunded" | "canceled" | "checked_in";
export type TicketChannel = "online" | "presale" | "onsite";

export interface TicketBuyer {
  name: string;
  email: string;
}

export interface Ticket {
  id: string;
  _id?: string;
  eventId: string;
  buyer: TicketBuyer;
  eventDay: string;         // ISO (YYYY-MM-DD) del día del ticket
  price: number;
  currency: string;         // p.ej. "COP"
  saleChannel: TicketChannel;
  status: TicketStatus;
  qrToken?: string;         // presente al comprar
  shortCode?: string;       // humano-legible
  scannedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  /** Sólo en respuesta de compra (conveniencia) */
  qrDataUrl?: string;       // data:image/png;base64,....
}

/** ────────── DTOs ────────── */
export interface PurchaseTicketsDto {
  eventId: string;
  buyer: TicketBuyer;
  date: string;            // ISO: "YYYY-MM-DD" dentro del rango del evento
  quantity: number;        // 1..20
  channel?: TicketChannel; // default backend: "online"
  presale?: boolean;       // true para preventa
  attachQrImages?: boolean;// true si quieres dataURL en respuesta
}

export interface PurchaseTicketsResponse {
  ok: boolean;
  tickets: Ticket[];
}

export interface ValidateQrDto {
  token: string; // qrToken (JWT) leído del QR
}

export interface ValidateQrResponse {
  ok: boolean;
  status: "checked_in" | "already_checked_in";
  sameDay: boolean;
  ticket: {
    id: string;
    shortCode?: string;
    eventDay?: string;
    scannedAt?: string;
  };
}

/** Filtros de listado */
export interface TicketFilters extends PaginationParams {
  eventId?: string;
  email?: string;          // buyer.email
  date?: string;           // YYYY-MM-DD (día del ticket)
  status?: TicketStatus;
}

/** Stats diarias por evento */
export interface DailyStatsResponse {
  eventId: string;
  days: Record<
    string, // "YYYY-MM-DD"
    { sold: number; checked_in: number; refunded: number; canceled: number; total: number }
  >;
}

/** ────────── Utils ────────── */
const normalizeId = <T extends { id?: string; _id?: string }>(obj: T) => ({
  ...obj,
  id: (obj as any).id || (obj as any)._id,
});

const buildQuery = (params: Record<string, any> = {}) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

/** ────────── Endpoints ────────── */

/**
 * Compra de tickets (soporta preventa). Devuelve tickets con qrToken y (opcional) qrDataUrl.
 */
export const purchaseTickets = async (payload: PurchaseTicketsDto) => {
  const { data } = await apiClient.post<PurchaseTicketsResponse>("/tickets/purchase", payload, {
    withCredentials: true,
  });
  return {
    ok: data.ok,
    tickets: data.tickets.map(normalizeId),
  };
};

/**
 * Validación del QR en puerta. Marca el ticket como checked_in (si procede).
 */
export const validateQr = async (payload: ValidateQrDto) => {
  const { data } = await apiClient.post<ValidateQrResponse>("/tickets/validate", payload, {
    withCredentials: true,
  });
  return data;
};

/**
 * Listado de tickets (cursor-based).
 * Ej: getTickets({ eventId, limit: 50, cursor })
 */
export const getTickets = async (filters: TicketFilters = {}) => {
  const qs = buildQuery(filters);
  const url = `/tickets${qs ? `?${qs}` : ""}`;
  const { data } = await apiClient.get<PaginatedCursorResponse<Ticket>>(url, {
    withCredentials: true,
  });
  return {
    data: data.data.map(normalizeId),
    nextCursor: data.nextCursor,
  };
};

/**
 * Obtener un ticket por ID.
 */
export const getTicketById = async (id: string) => {
  const { data } = await apiClient.get<Ticket>(`/tickets/${id}`, {
    withCredentials: true,
  });
  return normalizeId(data);
};

/**
 * Stats diarias por evento (conteos por estado).
 */
export const getDailyStats = async (eventId: string) => {
  const { data } = await apiClient.get<DailyStatsResponse>(`/stats/daily?eventId=${eventId}`, {
    withCredentials: true,
  });
  return data;
};

/** ────────── Helpers opcionales para UI ────────── */

/**
 * Formatea el precio en COP (o la moneda que venga del ticket).
 */
export const formatTicketPrice = (price: number, currency = "COP") =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency, minimumFractionDigits: 0 }).format(
    price
  );

/**
 * Devuelve YYYY-MM-DD (para agrupar por día).
 */
export const toYMD = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

/**
 * Descarga un PNG a partir del `qrDataUrl` (si lo devolviste en la compra).
 * Si tu compra no adjunta `qrDataUrl`, renderiza el token en un canvas con otra lib.
 */
export const downloadQrPng = (ticket: Ticket, filename?: string) => {
  if (!ticket.qrDataUrl) return;
  const a = document.createElement("a");
  a.href = ticket.qrDataUrl;
  a.download = filename || `ticket-${ticket.shortCode || ticket.id}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
