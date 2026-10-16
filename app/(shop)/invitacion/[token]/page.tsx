"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { getInvitation, confirmInvitation, type InvitationRegistration } from "@services/ticket.service";

/* Confirmación de invitación: llega desde el botón del correo. Es la
   inscripción del invitado (los mismos datos que pide ARTBO) y al confirmar se
   emite el QR, válido para `admits` personas, que llega al correo que deje acá
   y por la línea oficial de WhatsApp. */

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const DOC_TYPES = ["CC", "CE", "NIT", "Pasaporte", "TI", "PPT"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ponytail: responsable y canal de datos escritos acá; mover a site-config si la organización los cambia seguido.
const DATA_CONTACT = "info@sweepstouch.com";
const WHATSAPP = "+57 300 748 5406";

type Form = Omit<InvitationRegistration, "dataConsent"> & { dataConsent: "" | "yes" | "no" };

const EMPTY: Form = {
  firstName: "", lastName: "", documentType: "", documentNumber: "", country: "Colombia", city: "",
  address: "", phone: "", email: "", company: "", position: "", corporateEmail: "", companionName: "",
  dataConsent: "",
};

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const qc = useQueryClient();
  const { data: inv, isLoading, isError } = useQuery({
    queryKey: ["invitation", token],
    queryFn: () => getInvitation(token),
    retry: false,
  });

  const [f, setF] = useState<Form>(EMPTY);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  // Nombre y correo llegan de la invitación; se pueden corregir.
  useEffect(() => {
    if (!inv) return;
    const [first = "", ...rest] = String(inv.name || "").trim().split(/\s+/);
    setF((p) => ({
      ...p,
      firstName: p.firstName || inv.firstName || first,
      lastName: p.lastName || inv.lastName || rest.join(" "),
      email: p.email || inv.email || "",
    }));
  }, [inv]);

  const required: (keyof Form)[] = ["firstName", "lastName", "documentType", "documentNumber", "country", "city", "address", "phone", "email"];
  const missing = required.filter((k) => !String(f[k] ?? "").trim());
  const emailOk = EMAIL_RE.test(f.email.trim());
  const corpOk = !f.corporateEmail?.trim() || EMAIL_RE.test(f.corporateEmail.trim());
  const complete = !missing.length && emailOk && corpOk && f.dataConsent === "yes";

  const confirm = useMutation({
    mutationFn: () => {
      const body = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
      return confirmInvitation(token, { ...(body as any), dataConsent: f.dataConsent === "yes" });
    },
    onSuccess: (data) => {
      qc.setQueryData(["invitation", token], data);
      toast.success("Listo. Te enviamos el pase a tu correo y a WhatsApp.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (e: any) => {
      const code = e?.response?.data?.error;
      toast.error(
        code === "data_consent_required"
          ? "Debe aceptar el tratamiento de datos para inscribirse."
          : code === "email_invalid"
            ? "Revise el correo electrónico."
            : "No pudimos confirmar su asistencia. Intente de nuevo."
      );
    },
  });

  const input = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-900";
  const lbl = "block text-sm font-medium text-slate-800";
  const en = "font-normal text-slate-400";

  if (isLoading) return <main className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-slate-500">Cargando invitación…</main>;
  if (isError || !inv) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Invitación no encontrada</h1>
        <p className="mt-2 text-sm text-slate-500">Revise que el enlace esté completo o escríbanos al WhatsApp {WHATSAPP}.</p>
      </main>
    );
  }

  const when = inv.allDays ? "todos los días de la feria" : fmtDay(inv.eventDay);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex items-end justify-between border-b-[3px] border-black pb-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{inv.eventName || "Feria del Millón"}</p>
        <p className="text-right text-2xl font-bold leading-none">Invitación<br />especial</p>
      </div>

      {inv.image && <img src={inv.image} alt={inv.eventName || "Feria del Millón"} className="mt-8 w-full" />}

      {inv.status === "canceled" && (
        <p className="mt-8 rounded-2xl bg-slate-100 p-4 text-sm">Esta invitación fue anulada.</p>
      )}

      {inv.status === "confirmed" && (
        <div className="mt-8 rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-xl font-semibold">¡Gracias por confirmar su asistencia!</p>
          <p className="mt-1 text-sm text-slate-500">Thank you for confirming your attendance!</p>
          <p className="mt-4 text-sm text-slate-700">
            Pase válido para <b>{when}</b>
            {inv.admits > 1 ? <> · <b>{inv.admits} personas</b></> : null}.
          </p>
          {inv.companionName && <p className="text-sm text-slate-500">Acompañante: {inv.companionName}</p>}
          {inv.qrDataUrl && <img src={inv.qrDataUrl} alt="QR de acceso" className="mx-auto mt-4 w-64" />}
          <p className="mt-2 text-xs text-slate-500">Código {inv.shortCode}. Presente este QR en la entrada.</p>
          {inv.qrDataUrl && (
            <a href={inv.qrDataUrl} download={`invitacion-${inv.shortCode}.png`} className="mt-4 inline-block rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white">
              Descargar QR
            </a>
          )}
          <p className="mt-4 text-xs text-slate-500">También se lo enviamos a {inv.email} y por WhatsApp desde la línea oficial {WHATSAPP}.</p>
        </div>
      )}

      {inv.status === "pending" && (
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (complete) confirm.mutate();
          }}
        >
          <div className="space-y-2 text-[15px] leading-relaxed text-slate-800">
            <p className="text-xl font-semibold">Confirme su asistencia</p>
            <p>
              Para completar su registro, le solicitamos actualizar sus datos, especialmente su correo electrónico, ya que allí
              recibirá su Pase de Acceso personalizado para ingresar a la Feria. Pase válido para <b>{when}</b>
              {inv.admits > 1 ? <> · <b>{inv.admits} personas</b></> : null}.
            </p>
            <p className="text-sm text-slate-500">
              To complete your registration, please make sure your information is up to date — especially your email address, as
              your personalized entry pass for the Fair will be sent there.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={lbl}>Nombres <span className={en}>/ Name</span>
              <input className={input} value={f.firstName} onChange={set("firstName")} autoComplete="given-name" required />
            </label>
            <label className={lbl}>Apellidos <span className={en}>/ Last name</span>
              <input className={input} value={f.lastName} onChange={set("lastName")} autoComplete="family-name" required />
            </label>
            <label className={lbl}>Tipo de documento <span className={en}>/ ID type</span>
              <select className={input} value={f.documentType} onChange={set("documentType")} required>
                <option value="">NIT, CC, CE, Pasaporte…</option>
                {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className={lbl}>Número de documento <span className={en}>/ ID number</span>
              <input className={input} value={f.documentNumber} onChange={set("documentNumber")} required />
            </label>
            <label className={lbl}>País <span className={en}>/ Country</span>
              <input className={input} value={f.country} onChange={set("country")} autoComplete="country-name" placeholder="País de residencia" required />
            </label>
            <label className={lbl}>Ciudad <span className={en}>/ City</span>
              <input className={input} value={f.city} onChange={set("city")} autoComplete="address-level2" required />
            </label>
            <label className={`${lbl} sm:col-span-2`}>Dirección <span className={en}>/ Address</span>
              <input className={input} value={f.address} onChange={set("address")} autoComplete="street-address" placeholder="Calle 00 #00-00" required />
            </label>
            <label className={lbl}>Número de celular (WhatsApp) <span className={en}>/ Phone number</span>
              <input className={input} value={f.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="300 000 0000" required />
            </label>
            <label className={lbl}>Correo electrónico <span className={en}>/ E-mail</span>
              <input className={input} type="email" value={f.email} onChange={set("email")} autoComplete="email" required />
            </label>
            <label className={lbl}>Nombre de la compañía <span className={en}>/ Company name</span>
              <input className={input} value={f.company} onChange={set("company")} autoComplete="organization" />
            </label>
            <label className={lbl}>Cargo actual <span className={en}>/ Current position</span>
              <input className={input} value={f.position} onChange={set("position")} autoComplete="organization-title" />
            </label>
            <label className={`${lbl} sm:col-span-2`}>Correo electrónico institucional <span className={en}>/ Corporate e-mail</span>
              <input className={input} type="email" value={f.corporateEmail} onChange={set("corporateEmail")} />
            </label>
            {inv.admits > 1 && (
              <label className={`${lbl} sm:col-span-2`}>Nombre de su acompañante <span className={en}>/ Companion (opcional)</span>
                <input className={input} value={f.companionName} onChange={set("companionName")} />
              </label>
            )}
          </div>

          <fieldset className="rounded-xl border border-slate-200 p-4">
            <legend className="px-1 text-sm font-medium text-slate-800">
              He leído, entiendo y acepto los términos de tratamiento de datos descritos en la parte inferior de este formulario.
              <span className={`block ${en}`}>I have read, understand and accept the terms of data processing described at the bottom of this form.</span>
            </legend>
            <div className="mt-2 flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="consent" checked={f.dataConsent === "yes"} onChange={() => setF((p) => ({ ...p, dataConsent: "yes" }))} /> Sí / Yes
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="consent" checked={f.dataConsent === "no"} onChange={() => setF((p) => ({ ...p, dataConsent: "no" }))} /> No
              </label>
            </div>
            {f.dataConsent === "no" && (
              <p className="mt-2 text-xs text-red-600">Sin aceptar el tratamiento de datos no podemos emitir su pase de acceso.</p>
            )}
          </fieldset>

          {!emailOk && f.email && <p className="text-xs text-red-600">Revise el correo electrónico.</p>}
          {!corpOk && <p className="text-xs text-red-600">Revise el correo institucional.</p>}

          <button
            type="submit"
            disabled={confirm.isPending || !complete}
            className="w-full rounded-lg bg-black py-3.5 text-sm font-semibold text-white disabled:bg-slate-300"
          >
            {confirm.isPending ? "Enviando…" : "Enviar / Submit"}
          </button>

          <section className="space-y-4 border-t border-slate-200 pt-6 text-[11.5px] leading-relaxed text-slate-500">
            <div>
              <p className="mb-1 font-semibold uppercase tracking-wider text-slate-700">Aviso de privacidad</p>
              <p>
                Al registrar la información, las personas incluidas autorizan a la Feria del Millón, directamente o por medio de
                terceros, a realizar como responsable el tratamiento de sus datos personales con el fin de: a) emitir y enviar el
                pase de acceso a la Feria y validarlo en la entrada, b) mantener actualizada la información de contacto, c) evaluar
                el servicio y sus resultados, d) enviar comunicaciones sobre la Feria del Millón, sus actividades y aliados, e)
                realizar análisis, informes y estadísticas, y f) cumplir obligaciones legales y administrativas; mediante llamadas,
                SMS, correos electrónicos, aplicaciones de mensajería instantánea como WhatsApp o web y correspondencia física, de
                acuerdo con la Ley 1581 de 2012 y sus decretos reglamentarios. Si proporciona información de un tercero, garantiza
                que está autorizado para hacerlo y que aportará prueba de ello en caso de ser necesario. Como titular de la
                información podrá acceder, conocer, modificar, actualizar, rectificar, suprimir la información o revocar la
                autorización, siempre que no exista un deber legal o contractual, escribiendo a {DATA_CONTACT} o a la línea oficial
                de WhatsApp {WHATSAPP}; presentar queja ante la Superintendencia de Industria y Comercio (SIC), y abstenerse de
                responder las preguntas sobre datos sensibles o de menores de edad.
              </p>
            </div>
            <div>
              <p className="mb-1 font-semibold uppercase tracking-wider text-slate-700">Privacy notice</p>
              <p>
                By registering the information, the individuals included authorize Feria del Millón, directly or through third
                parties, to process their personal data as the data controller for the purposes of: a) issuing and sending the
                entry pass to the Fair and validating it at the entrance, b) keeping contact information up to date, c) evaluating
                the service and its results, d) sending communications about Feria del Millón, its activities and partners, e)
                conducting analyses, reports and statistics, and f) complying with legal and administrative obligations; through
                phone calls, SMS, emails, instant messaging applications such as WhatsApp or web, and physical correspondence, in
                accordance with Colombian Law 1581 of 2012 and its regulations. If you provide information relating to a third
                party, you guarantee that you are authorized to do so and that you will provide evidence of such authorization if
                required. As the data subject, you may access, review, modify, update, rectify, delete the information, or revoke
                the authorization, provided there is no legal or contractual obligation preventing it, by writing to {DATA_CONTACT}
                or the official WhatsApp line {WHATSAPP}; file a complaint with the Superintendence of Industry and Commerce (SIC);
                and refrain from answering questions regarding sensitive data or data relating to minors.
              </p>
            </div>
          </section>
        </form>
      )}
    </main>
  );
}
