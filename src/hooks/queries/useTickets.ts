// src/hooks/queries/useTickets.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  purchaseTickets,
  validateQr,
  getTicketDays,
  getTicketById,
  getTickets,
  getCalendarStats,
  type PurchaseTicketsDto,
  type ValidateQrDto,
  type ValidateQrResponse,
  type TicketDaysResponse,
  type Ticket,
  type TicketFilters,
  type CalendarStatsResponse,
} from "@services/ticket.service";

/** KEYS base para react-query */
const TICKETS_KEYS = {
  all: ["tickets"] as const,
  byId: (id: string) => ["tickets", "byId", id] as const,
  list: (filters: TicketFilters | undefined) =>
    ["tickets", "list", filters] as const,
  days: (eventId: string | undefined) =>
    ["tickets", "days", eventId] as const,
  calendar: (eventId: string | undefined) =>
    ["tickets", "calendar", eventId] as const,
};

/* ──────────────────────────────────────────────
 *  QUERIES PARA FRONT (no admin)
 *  - Días de evento (capacidad, precio, etc.)
 *  - Mis tickets / tickets por filtro
 *  - Ticket por ID
 * ──────────────────────────────────────────────*/

/**
 * Lista de días de tickets para un evento, con cap, price, remaining, etc.
 * Usa GET /tickets/events/:eventId/days
 */
export function useTicketDays(eventId?: string) {
  return useQuery<TicketDaysResponse>({
    queryKey: TICKETS_KEYS.days(eventId),
    queryFn: () => {
      if (!eventId) {
        throw new Error("eventId is required");
      }
      return getTicketDays(eventId);
    },
    enabled: !!eventId,
  });
}

/**
 * Stats tipo calendario para un evento (se puede usar en vista pública).
 * GET /tickets/stats/calendar?eventId=...
 */
export function useCalendarStats(eventId?: string) {
  return useQuery<CalendarStatsResponse>({
    queryKey: TICKETS_KEYS.calendar(eventId),
    queryFn: () => {
      if (!eventId) {
        throw new Error("eventId is required");
      }
      return getCalendarStats(eventId);
    },
    enabled: !!eventId,
  });
}

/**
 * Obtener un ticket puntual por ID.
 * GET /tickets/:id
 */
export function useTicket(id?: string) {
  return useQuery<Ticket>({
    queryKey: TICKETS_KEYS.byId(id || ""),
    queryFn: () => {
      if (!id) {
        throw new Error("id is required");
      }
      return getTicketById(id);
    },
    enabled: !!id,
  });
}

/**
 * Listar tickets (por ejemplo, tickets del usuario logueado filtrando por email/eventId).
 * GET /tickets
 */
export function useTicketsList(filters?: TicketFilters) {
  return useQuery<{
    data: Ticket[];
    nextCursor: string | null;
  }>({
    queryKey: TICKETS_KEYS.list(filters),
    queryFn: () => getTickets(filters || {}),
  });
}

/* ──────────────────────────────────────────────
 *  MUTATIONS PARA COMPRA / VALIDACIÓN (FRONT)
 * ──────────────────────────────────────────────*/

/**
 * Comprar tickets (flujo principal del checkout).
 * POST /tickets/purchase
 */
export function usePurchaseTickets() {
  const queryClient = useQueryClient();

  return useMutation<
    { ok: boolean; tickets: Ticket[] }, // return type
    any,                               // error
    PurchaseTicketsDto                 // variables
  >({
    mutationFn: (payload: PurchaseTicketsDto) => purchaseTickets(payload),
    onSuccess: (res, variables) => {
      // Invalidar stats relacionadas con el evento para refrescar cupos
      if (variables.eventId) {
        queryClient.invalidateQueries({
          queryKey: TICKETS_KEYS.days(variables.eventId),
        });
        queryClient.invalidateQueries({
          queryKey: TICKETS_KEYS.calendar(variables.eventId),
        });
        queryClient.invalidateQueries({
          queryKey: TICKETS_KEYS.list({ eventId: variables.eventId }),
        });
      }
    },
  });
}

/**
 * Validación del QR (puerta). No es “admin pesado”, es más operativo.
 * POST /tickets/validate
 */
export function useValidateQr() {
  const queryClient = useQueryClient();

  return useMutation<
    ValidateQrResponse,
    any,
    ValidateQrDto
  >({
    mutationFn: (payload: ValidateQrDto) => validateQr(payload),
    onSuccess: (res) => {
      // Si quieres, aquí podrías invalidar stats del evento si tienes eventId a mano.
      // No viene en la respuesta pero podrías guardarlo por fuera.
      // Por ahora, solo dejamos el éxito.
      if (res.ticket?.id) {
        queryClient.invalidateQueries({
          queryKey: TICKETS_KEYS.byId(res.ticket.id),
        });
      }
    },
  });
}
