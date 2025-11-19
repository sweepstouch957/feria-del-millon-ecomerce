import { getTodayTicketDay } from "@services/ticket.service";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook React Query para obtener el día actual del evento (Colombia).
 */
export function useTodayTicketDay(eventId?: string):any {
  return useQuery({
    queryKey: ["ticketDayToday", eventId],
    queryFn: () => getTodayTicketDay(eventId!),
    enabled: Boolean(eventId),
    staleTime: 1000 * 60 * 2, // 2 minutos (opcional)
  });
}
