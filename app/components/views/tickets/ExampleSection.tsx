"use client";

import { useQuery } from "@tanstack/react-query";
import TicketsUI from "./TicketsUI";
import type { TicketDay } from "./ticketTypes";
import { getTicketDays } from "@services/ticket.service";
import { useEdition } from "@provider/editionProvider";
import { ROOT_VARS, EYEBROW, mix } from "@components/views/checkout/checkoutTheme";

// Preventa: se compran entradas semanas antes, así que la página muestra TODOS
// los días de la feria. Misma cáscara editorial v2 que catálogo, obra y checkout.
export function ExampleTicketsSection() {
    const { eventId, eventName } = useEdition();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["ticketDays", eventId],
        queryFn: () => getTicketDays(eventId!),
        enabled: Boolean(eventId),
        staleTime: 60_000,
    });

    if (isLoading || isError) {
        return (
            <div style={ROOT_VARS}>
                <div style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(40px,6vw,80px) clamp(16px,3vw,32px)", display: "flex", flexDirection: "column", gap: 12 }}>
                    <span style={{ ...EYEBROW, opacity: 0.65 }}>Entradas</span>
                    <p style={{ margin: 0, fontSize: 18, fontWeight: 300, color: isError ? "inherit" : mix(60) }}>
                        {isError ? "No pudimos cargar las entradas. Intenta de nuevo en un momento." : "Cargando los días de la feria…"}
                    </p>
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
        <div style={ROOT_VARS}>
            <TicketsUI eventId={eventId} eventName={eventName} days={days} />
        </div>
    );
}
