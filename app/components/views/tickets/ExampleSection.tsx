"use client";

import { useQuery } from "@tanstack/react-query";
import TicketsUI from "./TicketsUI";
import type { TicketDay } from "./ticketTypes";
import { getTicketDays } from "@services/ticket.service";
import { useEdition } from "@provider/editionProvider";

// Preventa: se compran entradas semanas antes, así que la página muestra TODOS
// los días de la feria (antes solo el de hoy, y fuera de la feria no salía nada).
export function ExampleTicketsSection() {
    const { eventId, eventName } = useEdition();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["ticketDays", eventId],
        queryFn: () => getTicketDays(eventId!),
        enabled: Boolean(eventId),
        staleTime: 60_000,
    });

    if (isLoading) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    Cargando los días de la feria…
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
                    No pudimos cargar las entradas. Intenta de nuevo en un momento.
                </div>
            </div>
        );
    }

    const days: TicketDay[] = (data ?? [])
        .filter((d) => d.isActive !== false)
        .map((d) => ({
            date: d.date,
            display: d.display,
            price: d.price,
            cap: d.cap,
            sold: d.sold,
            kind: d.kind as TicketDay["kind"],
            isToday: d.isToday,
            remaining: d.remaining,
            utilization: d.utilization,
        }));

    return (
        <div className="p-4 md:p-6">
            <TicketsUI eventId={eventId} eventName={eventName} days={days} />
        </div>
    );
}
