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

/** Todos los días de la feria (configurados o derivados de las fechas del evento). */
export const getTicketDays = async (eventId: string) => {
  const { data } = await apiClient.get<{ eventId: string; days: TicketDaySummary[] }>(
    `/ticket/tickets/events/${encodeURIComponent(eventId)}/days`
  );
  return (data?.days ?? []).map(normalizeId);
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

/** ────────── Preventa: tipos de entrada del evento ──────────
 * El backend decide qué se vende, a qué precio, con qué cupo y en qué ventana.
 * Aquí solo se muestra: nunca se confía en precios del cliente.
 */
export type TicketTypeKey = "general" | "allpass" | "preview" | "empresa" | "2x1" | "estudiante";

export interface TicketTypeOption {
  key: TicketTypeKey;
  label: string;
  desc?: string;
  /** Banner de la tarjeta (lo sube el panel). */
  image?: string | null;
  /** null = lo pone el día elegido. */
  price: number | null;
  pickDay: boolean;
  allDays: boolean;
  quantities: number[] | null;
  /** Precio por persona según el paquete elegido (empresas: 20 → 55.000, 50/100 → 44.000). */
  packPrices?: Record<string, number> | null;
  maxQty: number | null;
  cap: number | null;
  sold: number;
  remaining: number | null;
  enabled: boolean;
  salesFrom: string | null;
  salesTo: string | null;
  open: boolean;
  closedReason: "disabled" | "not_started" | "ended" | "sold_out" | null;
  requiresStudentId: boolean;
  bonus?: { weekday: number; from: string; to: string } | null;
  sortOrder: number;
}

export interface TicketTypesResponse {
  eventId: string;
  eventName: string;
  validFrom: string;
  validTo: string;
  currency: string;
  types: TicketTypeOption[];
}

/** GET /ticket/tickets/events/:eventId/ticket-types (público) */
export const getTicketTypes = async (eventId: string) => {
  const { data } = await apiClient.get<TicketTypesResponse>(
    `/ticket/tickets/events/${encodeURIComponent(eventId)}/ticket-types`,
  );
  return data;
};

/** ────────── Invitaciones (enlace del correo) ────────── */
export interface InvitationView {
  name: string;
  email?: string;
  phone?: string;
  documentNumber?: string;
  address?: string;
  city?: string;
  firstName?: string;
  lastName?: string;
  /** Imagen de cabecera del correo de invitación. */
  image?: string;
  /** "Confirme antes de…" (solo informativo). */
  deadline?: string;
  /** Si este pase es de un acompañante: quién lo invitó. */
  hostName?: string;
  /** Acompañantes con su propio QR (ya inscritos). */
  companions?: { name: string; email: string }[];
  eventName?: string;
  eventDay: string;
  allDays: boolean;
  /** Un día a elección entre validFrom y validTo. */
  anyDay?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  admits: number;
  /** closed = enlace público apagado o sin cupo. */
  status: "pending" | "confirmed" | "canceled" | "declined" | "closed";
  /** Al registrarse por enlace público: el token de su invitación (para ver el pase). */
  inviteToken?: string;
  /** Solo enlaces públicos: logo del aliado y texto propio. */
  logo?: string;
  message?: string;
  companionName?: string;
  shortCode?: string;
  qrDataUrl?: string;
}

export const getInvitation = async (token: string) => {
  const { data } = await apiClient.get<InvitationView>(`/ticket/tickets/invitations/${encodeURIComponent(token)}`);
  return data;
};

export interface InvitationRegistration {
  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  company?: string;
  position?: string;
  corporateEmail?: string;
  /** Cada acompañante recibe su propio QR en su correo y WhatsApp. */
  companions?: InvitationCompanion[];
  /** Aceptó el tratamiento de datos: sin esto el servidor no inscribe. */
  dataConsent: boolean;
}

export interface InvitationCompanion {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType?: string;
  documentNumber?: string;
}

/** El invitado dice que no va. */
export const declineInvitation = async (token: string) => {
  const { data } = await apiClient.post<InvitationView>(
    `/ticket/tickets/invitations/${encodeURIComponent(token)}/decline`,
    {},
  );
  return data;
};

/** Inscripción del invitado: al confirmar recibe el QR por correo y WhatsApp. */
export const confirmInvitation = async (token: string, body: InvitationRegistration) => {
  const { data } = await apiClient.post<InvitationView>(
    `/ticket/tickets/invitations/${encodeURIComponent(token)}/confirm`,
    body,
  );
  return data;
};

/** Ya confirmado: nombra a los acompañantes que le faltaron (cada uno recibe su QR). */
export const addInvitationCompanions = async (token: string, companions: InvitationCompanion[]) => {
  const { data } = await apiClient.post<InvitationView>(
    `/ticket/tickets/invitations/${encodeURIComponent(token)}/companions`,
    { companions },
  );
  return data;
};

/* ────────── Enlace público de registro (/i/:code) ────────── */
export interface InviteLinkPublic {
  code: string;
  label: string;
  admits: number;
  allDays: boolean;
  anyDay: boolean;
  date: string | null;
  open: boolean;
  eventName?: string;
  validFrom?: string | null;
  validTo?: string | null;
  /** Logo del aliado y texto propio del enlace (los mismos del correo). */
  logo?: string;
  message?: string;
}

/** La info del enlace, con la forma de una invitación pendiente para reusar el formulario. */
export const getInviteLinkAsInvitation = async (code: string): Promise<InvitationView> => {
  const { data } = await apiClient.get<InviteLinkPublic>(`/ticket/tickets/invite-links/public/${encodeURIComponent(code)}`);
  return {
    name: "",
    email: "",
    eventName: data.eventName,
    eventDay: data.date || data.validFrom || "",
    allDays: data.allDays,
    anyDay: data.anyDay,
    validFrom: data.validFrom,
    validTo: data.validTo,
    admits: data.admits,
    status: data.open ? "pending" : "closed",
    logo: data.logo || "",
    message: data.message || "",
  } as InvitationView;
};

/** Registro por enlace público: crea la invitación y la confirma; devuelve el pase. */
export const registerWithInviteLink = async (code: string, body: InvitationRegistration) => {
  const { data } = await apiClient.post<InvitationView>(
    `/ticket/tickets/invite-links/public/${encodeURIComponent(code)}/register`,
    body,
  );
  return data;
};
