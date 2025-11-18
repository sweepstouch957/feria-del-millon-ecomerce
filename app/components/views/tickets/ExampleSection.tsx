"use client";

import { DEFAULT_EVENT_ID } from "@core/constants";
import TicketsUI from "./TicketsUI";
import { useTicketDays } from "@hooks/queries/useTickets";
import { useMemo } from "react";

export function ExampleTicketsSection() {
    const { data, isLoading, isError } = useTicketDays(DEFAULT_EVENT_ID);

    const days: any[] = useMemo(
        () =>
            (data?.days ?? []).map((d) => ({
                date: d.date,
                display: d.display,
                cap: d.cap,
                sold: d.sold,
                price: d.price,
                kind: d.kind,
                isToday: d.isToday,
            })),
        [data],
    );

    if (isLoading) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-6">
                    Cargando días del evento…
                </div>
            </div>
        );
    }

    if (isError || !days.length) {
        return (
            <div className="p-4 md:p-6">
                <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                    No se pudieron cargar los días de tickets. Verifica la configuración
                    del evento.
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6">
            <TicketsUI
                eventId={DEFAULT_EVENT_ID}
                eventName="Feria del Millón — Semana del Arte"
                days={days}
            />
        </div>
    );
}