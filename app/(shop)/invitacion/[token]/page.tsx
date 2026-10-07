"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getInvitation, confirmInvitation } from "@services/ticket.service";

/* Confirmación de invitación: llega desde el botón del correo. Al confirmar
   se emite el QR (válido para `admits` personas) y se envía también al correo. */

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const qc = useQueryClient();
  const { data: inv, isLoading, isError } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => getInvitation(token),
    retry: false,
  });

  // Inscripción del invitado: con esto la feria sabe quién entra.
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [address, setAddress] = useState("");
  const [companionName, setCompanionName] = useState("");

  // El nombre llega del correo con el que lo invitaron; se puede corregir.
  useEffect(() => {
    if (inv?.name) setName((n) => n || inv.name);
  }, [inv?.name]);

  const complete =
    name.trim().length >= 3 &&
    phone.trim().length >= 7 &&
    documentNumber.trim().length >= 4 &&
    address.trim().length >= 5;

  const confirm = useMutation({
    mutationFn: () =>
      confirmInvitation(token, {
        name: name.trim(),
        phone: phone.trim(),
        documentNumber: documentNumber.trim(),
        address: address.trim(),
        companionName: companionName.trim(),
      }),
    onSuccess: (data) => {
      qc.setQueryData(["invitation", token], data);
      toast.success("Listo. Te enviamos el QR a tu correo.");
    },
    onError: () => toast.error("No pudimos confirmar tu asistencia. Intenta de nuevo."),
  });

  const input = "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900";

  if (isLoading) return <main className="mx-auto max-w-lg px-4 py-24 text-center text-sm text-slate-500">Cargando invitación…</main>;
  if (isError || !inv) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Invitación no encontrada</h1>
        <p className="mt-2 text-sm text-slate-500">Revisa que el enlace esté completo o escríbenos.</p>
      </main>
    );
  }

  const when = inv.allDays ? "todos los días de la feria" : fmtDay(inv.eventDay);

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Invitación</p>
      <h1 className="mt-2 text-3xl font-semibold leading-tight">{inv.eventName || "Feria del Millón"}</h1>
      <p className="mt-3 text-slate-700">
        {inv.name}, nos alegra invitarle. Pase válido para <b>{when}</b>
        {inv.admits > 1 ? <> · <b>{inv.admits} personas</b></> : null}.
      </p>

      {inv.status === "canceled" && (
        <p className="mt-8 rounded-2xl bg-slate-100 p-4 text-sm">Esta invitación fue anulada.</p>
      )}

      {inv.status === "confirmed" && (
        <div className="mt-8 rounded-3xl border border-slate-200 p-6 text-center">
          <p className="font-semibold">Asistencia confirmada</p>
          {inv.companionName && <p className="text-sm text-slate-500">Acompañante: {inv.companionName}</p>}
          {inv.qrDataUrl && <img src={inv.qrDataUrl} alt="QR de acceso" className="mx-auto mt-4 w-64" />}
          <p className="mt-2 text-xs text-slate-500">Código {inv.shortCode}. Presenta este QR en la entrada.</p>
          {inv.qrDataUrl && (
            <a href={inv.qrDataUrl} download={`invitacion-${inv.shortCode}.png`} className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">
              Descargar QR
            </a>
          )}
        </div>
      )}

      {inv.status === "pending" && (
        <form
          className="mt-8 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (complete) confirm.mutate();
          }}
        >
          <p className="text-sm text-slate-600">
            Completa tu inscripción y te enviamos el QR de entrada a tu correo.
          </p>

          <label className="block text-sm">
            Nombre completo
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block text-sm">
            Número de celular (WhatsApp)
            <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" required />
          </label>
          <label className="block text-sm">
            Identificación
            <input
              className={input}
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              inputMode="numeric"
              placeholder="Cédula o pasaporte"
              required
            />
          </label>
          <label className="block text-sm">
            Dirección
            <input
              className={input}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Calle 00 #00-00, ciudad"
              required
            />
          </label>
          {inv.admits > 1 && (
            <label className="block text-sm">
              Nombre de su acompañante <span className="text-slate-400">(opcional)</span>
              <input className={input} value={companionName} onChange={(e) => setCompanionName(e.target.value)} />
            </label>
          )}

          <button
            type="submit"
            disabled={confirm.isPending || !complete}
            className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {confirm.isPending ? "Confirmando…" : "Confirmar e inscribirme"}
          </button>
          <p className="text-xs text-slate-500">
            Usamos estos datos para tu entrada y para avisarte de la feria. Nada más.
          </p>
        </form>
      )}
    </main>
  );
}
