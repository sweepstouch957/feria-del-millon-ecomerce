/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/ticket/tickets.service.ts
import apiClient from "src/http/axios";

/** ────────── Tipos base ────────── */
export type TicketStatus = "sold" | "refunded" | "canceled" | "checked_in";
export type TicketChannel = "online" | "presale" | "onsite";

export interface TicketBuyer {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  nit?: string;
}

export type TicketType = "general" | "allpass" | "preview" | "empresa" | "2x1" | "estudiante";

export interface Ticket {
  id: string;
  _id?: string;
  eventId: string;
  buyer: TicketBuyer;
  eventDay: string; // ISO (YYYY-MM-DD) del día del ticket
  price: number;
  currency: string; // p.ej. "COP"
  saleChannel: TicketChannel;
  status: TicketStatus;
  qrToken?: string; // presente al comprar
  shortCode?: string; // humano-legible
  scannedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;

  /** Sólo en respuesta de compra (conveniencia) */
  qrDataUrl?: string; // data:image/png;base64,....
}

/** ────────── DTOs ────────── */
export interface PurchaseTicketsResponse {
  ok: boolean;
  tickets: Ticket[];
}

/** Día de tickets para la fecha actual (CO) */
export interface TodayTicketDayResponse {
  eventId: string;
  today: string; // YYYY-MM-DD
  ticketDay: TicketDaySummary | null;
  message?: string;
}

/** ────────── Ticket Days (configurable por evento) ────────── */
export type TicketDayKind = "opening" | "normal" | "penultimate" | "last" | string;

export interface TicketDaySummary {
  id: string;
  _id?: string;
  eventId: string;
  date: string; // "YYYY-MM-DD"
  display: string; // "Jue 20 Nov"
  cap: number;
  price: number;
  kind: TicketDayKind;
  isActive: boolean;
  sold: number;
  checked_in: number;
  used: number;
  remaining: number;
  utilization: number;
  isToday: boolean;
}

/** ────────── DTO específico para pago con Mercado Pago ────────── */
export interface PayWithMercadoPagoPayload {
  eventId: string;
  type?: TicketType;
  date?: string;      // "YYYY-MM-DD" (tipos de un día)
  studentIdUrl?: string; // foto del carné (estudiantes)
  quantity: number;
  channel?: TicketChannel;
  presale?: boolean;
  /** Clave estable por intento de cobro — evita cobro doble en reintentos. */
  idempotencyKey?: string;
  buyer: TicketBuyer; // { name, email }
  /** Omitir en entradas gratis (estudiantes). */
  card?: {
    token: string;
    installments: number;
    paymentMethodId: string;
    issuerId: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}

/** ────────── Utils internos ────────── */
const normalizeId = <T extends { id?: string; _id?: string }>(obj: T) => ({
  ...obj,
  id: (obj as any).id || (obj as any)._id,
});

/** ────────── Endpoints ────────── */

/**
 * Pago + compra de tickets usando Mercado Pago (nuevo endpoint /pay).
 * POST /ticket/tickets/pay
 */
export const payTicketsWithMercadoPago = async (
  payload: PayWithMercadoPagoPayload,
) => {
  const { data } = await apiClient.post<PurchaseTicketsResponse>(
    "/ticket/tickets/pay",
    payload,
    { withCredentials: true },
  );

  return {
    ok: data.ok,
    tickets: data.tickets.map(normalizeId),
  };
};

export const downloadQrPng = (ticket: Ticket, filename?: string) => {
  if (!ticket.qrDataUrl) return;

  const a = document.createElement("a");
  a.href = ticket.qrDataUrl;
  a.download = filename || `ticket-${ticket.shortCode || ticket.id}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const getTodayTicketDay = async (eventId: string) => {
  const { data } = await apiClient.get<TodayTicketDayResponse>(
    `/ticket/tickets/events/${encodeURIComponent(eventId)}/days/today`,
    { withCredentials: true }
  );

  return {
    ...data,
    ticketDay: data.ticketDay ? normalizeId(data.ticketDay) : null,
  };
};

/** ────────── Invitaciones (enlace del correo) ────────── */
export interface InvitationView {
  name: string;
  eventName?: string;
  eventDay: string;
  allDays: boolean;
  admits: number;
  status: "pending" | "confirmed" | "canceled";
  companionName?: string;
  shortCode?: string;
  qrDataUrl?: string;
}

export const getInvitation = async (token: string) => {
  const { data } = await apiClient.get<InvitationView>(`/ticket/tickets/invitations/${encodeURIComponent(token)}`);
  return data;
};

export const confirmInvitation = async (
  token: string,
  body: { phone: string; documentNumber?: string; companionName?: string },
) => {
  const { data } = await apiClient.post<InvitationView>(
    `/ticket/tickets/invitations/${encodeURIComponent(token)}/confirm`,
    body,
  );
  return data;
};
