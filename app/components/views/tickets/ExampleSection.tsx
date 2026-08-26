"use client";

import TicketsUI from "./TicketsUI";
import { useTodayTicketDay } from "@hooks/queries/useTodayTicketDay";
import { useEdition } from "@provider/editionProvider";

export function ExampleTicketsSection() {
    const { eventId, eventName } = useEdition();
    const { data, isLoading, isError } = useTodayTicketDay(eventId);
    
    if (isLoading) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    Cargando día actual del evento…
                </div>
            </div>
        );
    }

    // Caso: error o sin día hoy
    if (isError || !data?.ticketDay) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-700">
                    Hoy no hay un día activo del evento.
                    Cuando exista un TicketDay para hoy, aparecerá aquí automáticamente.
                </div>
            </div>
        );
    }

    // Día actual obtenido correctamente
    return (
        <div className="p-4 md:p-6">
            <TicketsUI
                eventId={eventId}
                eventName={eventName}
                days={[data.ticketDay]} // SOLO PASAMOS EL DÍA DE HOY
            />
        </div>
    );
}
