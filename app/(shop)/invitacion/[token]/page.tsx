"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  getInvitation,
  confirmInvitation,
  declineInvitation,
  type InvitationRegistration,
  type InvitationCompanion,
} from "@services/ticket.service";

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

const BANNER_INVITE = "https://res.cloudinary.com/dg9gzic4s/image/upload/w_1120,q_auto,f_auto/v1792785034/feria-del-millon/invitaciones/sw91teujhzys7ezgffby.jpg";
const BANNER_PASS = "https://res.cloudinary.com/dg9gzic4s/image/upload/w_1120,q_auto,f_auto/v1792785037/feria-del-millon/invitaciones/nrqpko0zuilfgouwfp0n.jpg";

type Form = Omit<InvitationRegistration, "dataConsent" | "companions"> & { dataConsent: "" | "yes" | "no" };

const EMPTY: Form = {
  firstName: "", lastName: "", documentType: "", documentNumber: "", country: "Colombia", city: "",
  address: "", phone: "", email: "", company: "", position: "", corporateEmail: "",
  dataConsent: "",
};

const EMPTY_COMPANION: InvitationCompanion = { firstName: "", lastName: "", email: "", phone: "", documentType: "", documentNumber: "" };

/** Un acompañante se deja vacío (su cupo queda en el QR del invitado) o completo. */
const companionState = (c: InvitationCompanion) => {
  const filled = Object.values(c).some((v) => String(v ?? "").trim());
  if (!filled) return "empty";
  const ok = c.firstName.trim() && c.lastName.trim() && c.phone.trim() && EMAIL_RE.test(c.email.trim());
  return ok ? "ok" : "incomplete";
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

  // Invitación doble = 2 QR: un bloque por acompañante.
  const seats = Math.max((inv?.admits || 1) - 1, 0);
  const [companions, setCompanions] = useState<InvitationCompanion[]>([]);
  useEffect(() => {
    setCompanions((cs) => Array.from({ length: seats }, (_, i) => cs[i] || { ...EMPTY_COMPANION }));
  }, [seats]);
  const setC = (i: number, k: keyof InvitationCompanion) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCompanions((cs) => cs.map((c, j) => (j === i ? { ...c, [k]: e.target.value } : c)));

  // "Declinar" llega del botón del correo (?declinar=1). Sin useSearchParams: pide Suspense en el build.
  const [declining, setDeclining] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("declinar") === "1") setDeclining(true);
  }, []);
  // Quien declinó puede cambiar de opinión y volver al formulario.
  const [reconsider, setReconsider] = useState(false);

  const decline = useMutation({
    mutationFn: () => declineInvitation(token),
    onSuccess: (data) => {
      qc.setQueryData(["invitation", token], data);
      setDeclining(false);
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.error === "already_confirmed"
          ? "Esta invitación ya fue confirmada. Escríbanos por WhatsApp si no podrá asistir."
          : "No pudimos registrar su respuesta. Intente de nuevo."
      ),
  });

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
  const companionsOk = companions.every((c) => companionState(c) !== "incomplete");
  const complete = !missing.length && emailOk && corpOk && companionsOk && f.dataConsent === "yes";

  const confirm = useMutation({
    mutationFn: () => {
      const trim = <T extends object>(o: T) =>
        Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])) as T;
      return confirmInvitation(token, {
        ...(trim(f) as any),
        companions: companions.filter((c) => companionState(c) === "ok").map(trim),
        dataConsent: f.dataConsent === "yes",
      });
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
            : code === "companion_same_email"
              ? "Su acompañante necesita un correo distinto al suyo: allí le llega su propio pase."
              : String(code || "").startsWith("companion_")
                ? "Revise los datos de su acompañante."
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

  const rangeText = (() => {
    if (!inv.validFrom || !inv.validTo) return "";
    const d = (s: string) => new Date(`${s}T12:00:00Z`);
    const f = (x: Date, month: boolean) => x.toLocaleDateString("es-CO", { day: "numeric", ...(month ? { month: "short" } : {}), timeZone: "UTC" }).replace(".", "");
    return `${f(d(inv.validFrom), false)} al ${f(d(inv.validTo), true)}`;
  })();
  // La invitación completa: el titular más los acompañantes que ya tienen su QR.
  const totalPeople = (inv.admits || 1) + (inv.companions?.length || 0);
  const when = inv.allDays
    ? "todos los días de la feria"
    : inv.anyDay
      ? `ingreso 1 día de la Feria${rangeText ? ` (${rangeText})` : ""}`
      : fmtDay(inv.eventDay);
  const deadlineText = inv.deadline
    ? new Date(inv.deadline).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Bogota" })
    : "";
  const showForm = inv.status === "pending" || (inv.status === "declined" && reconsider);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Banner de la feria: "Invitación especial" mientras confirma, "Pase de acceso" ya confirmado. */}
      <img
        src={inv.status === "confirmed" ? BANNER_PASS : BANNER_INVITE}
        alt={inv.eventName || "Feria del Millón"}
        className="w-full"
      />

      {inv.image && inv.status !== "confirmed" && (
        <img src={inv.image} alt={`${inv.eventName || "Feria del Millón"}: horarios y plano`} className="mt-6 w-full" />
      )}

      {inv.status === "canceled" && (
        <p className="mt-8 rounded-2xl bg-slate-100 p-4 text-sm">Esta invitación fue anulada.</p>
      )}

      {inv.status === "confirmed" && (
        <div className="mt-8 rounded-2xl border border-slate-200 p-6 text-center">
          {inv.hostName ? (
            <>
              <p className="text-xl font-semibold">Su pase de acceso</p>
              <p className="mt-1 text-sm text-slate-500">{inv.hostName} le invitó como su acompañante.</p>
            </>
          ) : (
            <>
              <p className="text-xl font-semibold">¡Gracias por confirmar su asistencia!</p>
              <p className="mt-1 text-sm text-slate-500">Thank you for confirming your attendance!</p>
            </>
          )}
          <p className="mt-4 text-sm text-slate-700">
            Pase válido para <b>Inauguración: jueves 5 de noviembre, 5:00 p. m.</b> (entrada solo para mayores de edad).
            {" "}<b>{when}</b>
            {totalPeople > 1 ? <>, <b>{totalPeople} personas y un QR para cada una</b></> : <>, <b>1 persona</b></>}.
          </p>
          {!!inv.companions?.length && (
            <p className="mt-1 text-sm text-slate-500">
              Su acompañante tiene su propio QR; se lo enviamos a {inv.companions.map((c) => `${c.name} (${c.email})`).join(", ")}.
            </p>
          )}
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

      {inv.status === "declined" && !reconsider && (
        <div className="mt-8 rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-xl font-semibold">Gracias por avisarnos</p>
          <p className="mt-1 text-sm text-slate-500">Registramos que no podrá asistir. Thank you for letting us know.</p>
          <button type="button" onClick={() => setReconsider(true)} className="mt-5 rounded-lg border-2 border-black px-5 py-2.5 text-sm font-semibold">
            Cambié de opinión: confirmar asistencia
          </button>
        </div>
      )}

      {inv.status === "pending" && declining && (
        <div className="mt-8 rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-xl font-semibold">¿No podrá acompañarnos?</p>
          <p className="mt-1 text-sm text-slate-500">Si declina, liberamos su cupo. Puede volver a este enlace si cambia de opinión.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" disabled={decline.isPending} onClick={() => decline.mutate()}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300">
              {decline.isPending ? "Enviando…" : "Declinar invitación"}
            </button>
            <button type="button" onClick={() => setDeclining(false)} className="rounded-lg border-2 border-black px-5 py-2.5 text-sm font-semibold">
              Prefiero confirmar
            </button>
          </div>
        </div>
      )}

      {showForm && !declining && (
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
              recibirá su Pase de Acceso personalizado para ingresar a la Feria.
            </p>
            <p>
              <b>Inauguración:</b> jueves 5 de noviembre, 5:00 p. m. (entrada solo para mayores de edad).
            </p>
            <p>
              Pase válido para <b>{when}</b>
              {inv.admits > 1 ? <>, <b>{inv.admits} personas y un QR para cada una</b></> : null}.
            </p>
            {deadlineText && <p>Le agradecemos confirmar antes del <b>{deadlineText}</b>.</p>}
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
          </div>

          {companions.map((c, i) => {
            const st = companionState(c);
            return (
              <fieldset key={i} className="rounded-xl border border-slate-200 p-4">
                <legend className="px-1 text-sm font-semibold text-slate-800">
                  {seats > 1 ? `Acompañante ${i + 1}` : "Su acompañante"} <span className={en}>/ Companion</span>
                </legend>
                <p className="mb-3 text-xs text-slate-500">
                  Recibe su propio pase con QR en su correo y su WhatsApp. Si aún no sabe quién le acompaña, déjelo en blanco:
                  ese cupo queda en su QR.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={lbl}>Nombres
                    <input className={input} value={c.firstName} onChange={setC(i, "firstName")} />
                  </label>
                  <label className={lbl}>Apellidos
                    <input className={input} value={c.lastName} onChange={setC(i, "lastName")} />
                  </label>
                  <label className={lbl}>Celular (WhatsApp)
                    <input className={input} value={c.phone} onChange={setC(i, "phone")} inputMode="tel" placeholder="300 000 0000" />
                  </label>
                  <label className={lbl}>Correo electrónico
                    <input className={input} type="email" value={c.email} onChange={setC(i, "email")} />
                  </label>
                  <label className={lbl}>Tipo de documento <span className={en}>(opcional)</span>
                    <select className={input} value={c.documentType} onChange={setC(i, "documentType")}>
                      <option value="">—</option>
                      {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </label>
                  <label className={lbl}>Número de documento <span className={en}>(opcional)</span>
                    <input className={input} value={c.documentNumber} onChange={setC(i, "documentNumber")} />
                  </label>
                </div>
                {st === "incomplete" && (
                  <p className="mt-2 text-xs text-red-600">Complete nombres, apellidos, celular y un correo válido, o deje el bloque vacío.</p>
                )}
              </fieldset>
            );
          })}

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
          {inv.status === "pending" && (
            <p className="text-center text-sm">
              <button type="button" onClick={() => { setDeclining(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="text-slate-500 underline underline-offset-2">
                No podré asistir / Decline invitation
              </button>
            </p>
          )}

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
