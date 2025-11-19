"use client";

import { DEFAULT_EVENT_ID } from "@core/constants";
import TicketsUI from "./TicketsUI";
import { useTodayTicketDay } from "@hooks/queries/useTodayTicketDay";

export function ExampleTicketsSection() {
    const { data, isLoading, isError } = useTodayTicketDay(DEFAULT_EVENT_ID);
    
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
                eventId={DEFAULT_EVENT_ID}
                eventName="Feria del Millón — Semana del Arte"
                days={[data.ticketDay]} // 👈 SOLO PASAMOS EL DÍA DE HOY
            />
        </div>
    );
}
