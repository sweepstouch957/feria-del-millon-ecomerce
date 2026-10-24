"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, type FieldError } from "react-hook-form";
import toast from "react-hot-toast";
import {
  getInvitation,
  confirmInvitation,
  declineInvitation,
  getInviteLinkAsInvitation,
  registerWithInviteLink,
  type InvitationRegistration,
  type InvitationCompanion,
} from "@services/ticket.service";

/* Confirmación de invitación: llega desde el botón del correo. Es la
   inscripción del invitado (los mismos datos que pide ARTBO) y al confirmar se
   emite un QR por persona, que llega al correo que deje acá y por WhatsApp.

   Formulario con react-hook-form: cada campo dice qué está mal (en español e
   inglés) al salir de él o al enviar, el envío lleva el foco al primer error y
   los errores del servidor se pintan en el campo que corresponde. */

const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

const DOC_TYPES = ["CC", "CE", "NIT", "Pasaporte", "TI", "PPT"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const digits = (v: string) => String(v || "").replace(/\D/g, "");

// ponytail: responsable y canal de datos escritos acá; mover a site-config si la organización los cambia seguido.
const DATA_CONTACT = "info@sweepstouch.com";
const WHATSAPP = "+57 300 748 5406";

const BANNER_INVITE = "https://res.cloudinary.com/dg9gzic4s/image/upload/w_1400,q_auto,f_auto/v1792793981/feria-del-millon/invitaciones/j4qipbaaiqle8vvaoenm.jpg";
const BANNER_PASS = "https://res.cloudinary.com/dg9gzic4s/image/upload/w_1120,q_auto,f_auto/v1792785037/feria-del-millon/invitaciones/nrqpko0zuilfgouwfp0n.jpg";

type FormValues = Omit<InvitationRegistration, "dataConsent" | "companions"> & {
  dataConsent: "" | "yes" | "no";
  companions: InvitationCompanion[];
};

const EMPTY_COMPANION: InvitationCompanion = { firstName: "", lastName: "", email: "", phone: "", documentType: "", documentNumber: "" };

const isBlank = (c?: InvitationCompanion) => !c || !Object.values(c).some((v) => String(v ?? "").trim());

/** Mensajes bilingües: "Escriba su nombre / Enter your name". */
const MSG = {
  required: (es: string, en: string) => `${es} / ${en}`,
  email: "Correo no válido, ej.: nombre@correo.com / Invalid e-mail",
  phone: "Celular de 10 dígitos, ej.: 300 123 4567 / 10-digit mobile number",
  doc: "Solo números y letras, de 5 a 15 caracteres / 5–15 letters or digits",
};

const validPhone = (v: string) => {
  const d = digits(v);
  const local = d.startsWith("57") && d.length === 12 ? d.slice(2) : d;
  return (local.length === 10 && local.startsWith("3")) || (d.length >= 8 && d.length <= 15 && String(v).trim().startsWith("+"));
};

/* ── Campo con etiqueta, error y ayuda ───────────────────────────────── */
function Field({
  label, en, error, hint, className = "", children,
}: { label: string; en?: string; error?: FieldError; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block text-sm font-medium text-slate-800 ${className}`}>
      <span>
        {label} {en && <span className="font-normal text-slate-400">/ {en}</span>}
      </span>
      {children}
      {error?.message ? (
        <span role="alert" className="mt-1 flex items-start gap-1 text-xs font-normal text-red-600">
          <span aria-hidden>●</span>
          {error.message}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs font-normal text-slate-500">{hint}</span>
      ) : null}
    </label>
  );
}

const inputCls = (err?: FieldError) =>
  `mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-[15px] outline-none transition-colors ${
    err ? "border-red-500 bg-red-50/40 focus:border-red-600" : "border-slate-300 focus:border-slate-900"
  }`;

/** Página de invitación: por token (correo) o por enlace público de registro (/i/:code). */
export default function InvitationClient({ token, linkCode }: { token?: string; linkCode?: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const isLink = !token && !!linkCode;
  const qKey = ["invitation", token || `link:${linkCode}`];
  const { data: inv, isLoading, isError } = useQuery({
    queryKey: qKey,
    queryFn: () => (isLink ? getInviteLinkAsInvitation(linkCode!) : getInvitation(token!)),
    retry: false,
  });

  const {
    register, handleSubmit, control, reset, setError, getValues, watch, trigger,
    formState: { errors, isSubmitted, submitCount },
  } = useForm<FormValues>({
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
    defaultValues: {
      firstName: "", lastName: "", documentType: "", documentNumber: "", country: "Colombia", city: "",
      address: "", phone: "", email: "", company: "", position: "", corporateEmail: "",
      dataConsent: "", companions: [],
    },
  });
  const { fields: companionFields, replace: replaceCompanions } = useFieldArray({ control, name: "companions" });

  // Invitación doble = 2 QR: un bloque por acompañante.
  const seats = Math.max((inv?.admits || 1) - 1, 0);

  // Nombre y correo llegan de la invitación; se pueden corregir.
  useEffect(() => {
    if (!inv) return;
    const [first = "", ...rest] = String(inv.name || "").trim().split(/\s+/);
    const cur = getValues();
    reset({
      ...cur,
      firstName: cur.firstName || inv.firstName || first,
      lastName: cur.lastName || inv.lastName || rest.join(" "),
      email: cur.email || inv.email || "",
      companions: Array.from({ length: seats }, (_, i) => cur.companions?.[i] || { ...EMPTY_COMPANION }),
    });
  }, [inv, seats]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (companionFields.length !== seats) replaceCompanions(Array.from({ length: seats }, () => ({ ...EMPTY_COMPANION })));
  }, [seats]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Declinar" llega del botón del correo (?declinar=1). Sin useSearchParams: pide Suspense en el build.
  const [declining, setDeclining] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("declinar") === "1") setDeclining(true);
  }, []);
  const [reconsider, setReconsider] = useState(false);

  const decline = useMutation({
    mutationFn: () => declineInvitation(token!),
    onSuccess: (data) => {
      qc.setQueryData(qKey, data);
      setDeclining(false);
    },
    onError: (e: any) =>
      toast.error(
        e?.response?.data?.error === "already_confirmed"
          ? "Esta invitación ya fue confirmada. Escríbanos por WhatsApp si no podrá asistir."
          : "No pudimos registrar su respuesta. Intente de nuevo."
      ),
  });

  const confirm = useMutation({
    mutationFn: (v: FormValues) => {
      const trim = <T extends object>(o: T) =>
        Object.fromEntries(Object.entries(o).map(([k, x]) => [k, typeof x === "string" ? x.trim() : x])) as T;
      const { companions, dataConsent, ...rest } = v;
      const body = {
        ...(trim(rest) as any),
        companions: companions.filter((c) => !isBlank(c)).map(trim),
        dataConsent: dataConsent === "yes",
      };
      return isLink ? registerWithInviteLink(linkCode!, body) : confirmInvitation(token!, body);
    },
    onSuccess: (data) => {
      toast.success("Listo. Le enviamos el pase a su correo y a WhatsApp.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Por enlace público: queda en su propia página de invitación (el QR sobrevive a recargar).
      if (isLink && data.inviteToken) {
        qc.setQueryData(["invitation", data.inviteToken], data);
        router.replace(`/invitacion/${encodeURIComponent(data.inviteToken)}`);
        return;
      }
      qc.setQueryData(qKey, data);
    },
    onError: (e: any) => {
      // El servidor dice qué campo falló: se pinta en ese campo.
      const code: string = e?.response?.data?.error || "";
      const field = (name: any, message: string) => setError(name, { type: "server", message }, { shouldFocus: true });
      if (code === "data_consent_required") return field("dataConsent", "Debe aceptar el tratamiento de datos / Consent required");
      if (code === "companion_same_email") return field("companions.0.email", "Use un correo distinto al suyo: allí le llega su propio pase / Must differ from yours");
      const m = code.match(/^(companion_)?(\w+?)_(required|invalid)$/);
      if (m) {
        const name = m[1] ? `companions.0.${m[2]}` : m[2];
        return field(name, m[3] === "invalid" ? MSG.email : "Este dato es obligatorio / Required");
      }
      if (code === "invitation_canceled") return toast.error("Esta invitación fue anulada.");
      if (code === "already_registered") return field("email", "Este correo ya está registrado: su pase ya fue enviado allí / Already registered");
      if (code === "link_full" || code === "link_closed") {
        toast.error(`El registro por este enlace ya cerró. Escríbanos por WhatsApp ${WHATSAPP}.`);
        qc.invalidateQueries({ queryKey: qKey });
        return;
      }
      toast.error("No pudimos confirmar su asistencia. Intente de nuevo.");
    },
  });

  const onInvalid = () => {
    toast.error("Revise los campos marcados en rojo.");
  };

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
  const consent = watch("dataConsent");
  // Cuántos campos tienen error (cuenta también los de cada acompañante).
  const countErrors = (e: any): number =>
    !e || typeof e !== "object" ? 0 : "message" in e && "type" in e ? 1 : Object.values(e).reduce<number>((a, x) => a + countErrors(x), 0);
  const errorCount = countErrors(errors);

  /** Validación de un campo del acompañante: obligatorio solo si el bloque tiene algo. */
  const companionRule = (i: number, kind: "name" | "last" | "phone" | "email") => (v: string) => {
    const c = getValues(`companions.${i}`);
    if (isBlank(c)) return true;
    if (!String(v || "").trim()) {
      return kind === "name" ? "Escriba los nombres / Enter first name"
        : kind === "last" ? "Escriba los apellidos / Enter last name"
        : kind === "phone" ? "Escriba el celular / Enter mobile number"
        : "Escriba el correo / Enter e-mail";
    }
    if (kind === "phone" && !validPhone(v)) return MSG.phone;
    if (kind === "email") {
      if (!EMAIL_RE.test(v.trim())) return MSG.email;
      if (v.trim().toLowerCase() === String(getValues("email") || "").trim().toLowerCase())
        return "Use un correo distinto al suyo: allí le llega su propio pase / Must differ from yours";
    }
    return true;
  };
  // Al escribir en un bloque de acompañante, revalidar el bloque entero (los demás campos pasan a ser obligatorios).
  const revalidateCompanion = (i: number) => {
    if (isSubmitted) trigger([`companions.${i}.firstName`, `companions.${i}.lastName`, `companions.${i}.phone`, `companions.${i}.email`]);
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Una sola imagen arriba: banner "Invitación especial" con el
          formulario; ya confirmado, el banner "Pase de acceso". */}
      <img
        src={inv.status === "confirmed" ? BANNER_PASS : BANNER_INVITE}
        alt={inv.eventName || "Feria del Millón"}
        className="w-full"
      />

      {inv.status === "closed" && (
        <div className="mt-8 rounded-2xl border border-slate-200 p-6 text-center">
          <p className="text-xl font-semibold">El registro por este enlace ya cerró</p>
          <p className="mt-1 text-sm text-slate-500">Si necesita su pase, escríbanos al WhatsApp {WHATSAPP}. Registration through this link is closed.</p>
        </div>
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

      {inv.status === "pending" && declining && !isLink && (
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
        <form className="mt-8 space-y-6" noValidate onSubmit={handleSubmit((v) => confirm.mutate(v), onInvalid)}>
          <div className="space-y-2 text-[15px] leading-relaxed text-slate-800">
            <p className="text-xl font-semibold">{isLink ? "Regístrese como invitado" : "Confirme su asistencia"}</p>
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
            <p className="text-xs text-slate-500">Los campos con <span className="text-red-600">*</span> son obligatorios / Required fields.</p>
          </div>

          {/* Resumen de errores tras intentar enviar */}
          {submitCount > 0 && errorCount > 0 && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Faltan o hay errores en <b>{errorCount}</b> {errorCount === 1 ? "campo" : "campos"}. Están marcados en rojo abajo.
              <span className="block text-xs text-red-600/80">Please review the fields marked in red.</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombres *" en="Name" error={errors.firstName}>
              <input className={inputCls(errors.firstName)} autoComplete="given-name" aria-invalid={!!errors.firstName}
                {...register("firstName", { validate: (v) => !!v.trim() || MSG.required("Escriba sus nombres", "Enter your first name") })} />
            </Field>
            <Field label="Apellidos *" en="Last name" error={errors.lastName}>
              <input className={inputCls(errors.lastName)} autoComplete="family-name" aria-invalid={!!errors.lastName}
                {...register("lastName", { validate: (v) => !!v.trim() || MSG.required("Escriba sus apellidos", "Enter your last name") })} />
            </Field>
            <Field label="Tipo de documento *" en="ID type" error={errors.documentType}>
              <select className={inputCls(errors.documentType)} aria-invalid={!!errors.documentType}
                {...register("documentType", { required: MSG.required("Elija el tipo de documento", "Choose an ID type") })}>
                <option value="">Seleccione…</option>
                {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Número de documento *" en="ID number" error={errors.documentNumber}>
              <input className={inputCls(errors.documentNumber)} inputMode="numeric" aria-invalid={!!errors.documentNumber}
                {...register("documentNumber", {
                  validate: (v) => {
                    const s = v.trim();
                    if (!s) return MSG.required("Escriba el número de documento", "Enter your ID number");
                    return /^[A-Za-z0-9.\-]{5,15}$/.test(s) || MSG.doc;
                  },
                })} />
            </Field>
            <Field label="País *" en="Country" error={errors.country}>
              <input className={inputCls(errors.country)} autoComplete="country-name" aria-invalid={!!errors.country}
                {...register("country", { validate: (v) => !!v.trim() || MSG.required("Escriba el país", "Enter your country") })} />
            </Field>
            <Field label="Ciudad *" en="City" error={errors.city}>
              <input className={inputCls(errors.city)} autoComplete="address-level2" aria-invalid={!!errors.city}
                {...register("city", { validate: (v) => !!v.trim() || MSG.required("Escriba la ciudad", "Enter your city") })} />
            </Field>
            <Field label="Dirección *" en="Address" error={errors.address} className="sm:col-span-2">
              <input className={inputCls(errors.address)} autoComplete="street-address" placeholder="Calle 00 #00-00" aria-invalid={!!errors.address}
                {...register("address", { validate: (v) => !!v.trim() || MSG.required("Escriba la dirección", "Enter your address") })} />
            </Field>
            <Field label="Celular (WhatsApp) *" en="Mobile" error={errors.phone} hint="Ahí le llega el pase por WhatsApp.">
              <input className={inputCls(errors.phone)} inputMode="tel" autoComplete="tel" placeholder="300 000 0000" aria-invalid={!!errors.phone}
                {...register("phone", {
                  validate: (v) => (!v.trim() ? MSG.required("Escriba su celular", "Enter your mobile number") : validPhone(v) || MSG.phone),
                })} />
            </Field>
            <Field label="Correo electrónico *" en="E-mail" error={errors.email} hint="Ahí le llega su pase con el QR.">
              <input className={inputCls(errors.email)} type="email" autoComplete="email" aria-invalid={!!errors.email}
                {...register("email", {
                  validate: (v) => (!v.trim() ? MSG.required("Escriba su correo", "Enter your e-mail") : EMAIL_RE.test(v.trim()) || MSG.email),
                })} />
            </Field>
            <Field label="Nombre de la compañía" en="Company" error={errors.company}>
              <input className={inputCls(errors.company)} autoComplete="organization" {...register("company")} />
            </Field>
            <Field label="Cargo actual" en="Position" error={errors.position}>
              <input className={inputCls(errors.position)} autoComplete="organization-title" {...register("position")} />
            </Field>
            <Field label="Correo institucional" en="Corporate e-mail" error={errors.corporateEmail} className="sm:col-span-2">
              <input className={inputCls(errors.corporateEmail)} type="email" aria-invalid={!!errors.corporateEmail}
                {...register("corporateEmail", { validate: (v) => !v?.trim() || EMAIL_RE.test(v.trim()) || MSG.email })} />
            </Field>
          </div>

          {companionFields.map((field, i) => {
            const ce = errors.companions?.[i];
            return (
              <fieldset key={field.id} className={`rounded-xl border p-4 ${ce ? "border-red-300" : "border-slate-200"}`}>
                <legend className="px-1 text-sm font-semibold text-slate-800">
                  {seats > 1 ? `Acompañante ${i + 1}` : "Su acompañante"} <span className="font-normal text-slate-400">/ Companion</span>
                </legend>
                <p className="mb-3 text-xs text-slate-500">
                  Recibe su propio pase con QR en su correo y su WhatsApp. Si aún no sabe quién le acompaña, déjelo en blanco:
                  ese cupo queda en su QR.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombres" error={ce?.firstName}>
                    <input className={inputCls(ce?.firstName)}
                      {...register(`companions.${i}.firstName`, { validate: companionRule(i, "name"), onChange: () => revalidateCompanion(i) })} />
                  </Field>
                  <Field label="Apellidos" error={ce?.lastName}>
                    <input className={inputCls(ce?.lastName)}
                      {...register(`companions.${i}.lastName`, { validate: companionRule(i, "last"), onChange: () => revalidateCompanion(i) })} />
                  </Field>
                  <Field label="Celular (WhatsApp)" error={ce?.phone}>
                    <input className={inputCls(ce?.phone)} inputMode="tel" placeholder="300 000 0000"
                      {...register(`companions.${i}.phone`, { validate: companionRule(i, "phone"), onChange: () => revalidateCompanion(i) })} />
                  </Field>
                  <Field label="Correo electrónico" error={ce?.email}>
                    <input className={inputCls(ce?.email)} type="email"
                      {...register(`companions.${i}.email`, { validate: companionRule(i, "email"), onChange: () => revalidateCompanion(i) })} />
                  </Field>
                  <Field label="Tipo de documento" en="opcional">
                    <select className={inputCls()} {...register(`companions.${i}.documentType`, { onChange: () => revalidateCompanion(i) })}>
                      <option value="">—</option>
                      {DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Número de documento" en="opcional">
                    <input className={inputCls()} {...register(`companions.${i}.documentNumber`, { onChange: () => revalidateCompanion(i) })} />
                  </Field>
                </div>
              </fieldset>
            );
          })}

          <fieldset className={`rounded-xl border p-4 ${errors.dataConsent ? "border-red-300 bg-red-50/40" : "border-slate-200"}`}>
            <legend className="px-1 text-sm font-medium text-slate-800">
              He leído, entiendo y acepto los términos de tratamiento de datos descritos en la parte inferior de este formulario. <span className="text-red-600">*</span>
              <span className="block font-normal text-slate-400">I have read, understand and accept the terms of data processing described at the bottom of this form.</span>
            </legend>
            <div className="mt-2 flex gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" value="yes"
                  {...register("dataConsent", {
                    validate: (v) => v === "yes" || (v === "no"
                      ? "Sin aceptar el tratamiento de datos no podemos emitir su pase / We cannot issue your pass without consent"
                      : "Elija una opción / Choose an option"),
                  })} /> Sí / Yes
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" value="no" {...register("dataConsent")} /> No
              </label>
            </div>
            {errors.dataConsent?.message ? (
              <p role="alert" className="mt-2 text-xs text-red-600">● {errors.dataConsent.message}</p>
            ) : consent === "no" ? (
              <p className="mt-2 text-xs text-red-600">Sin aceptar el tratamiento de datos no podemos emitir su pase de acceso.</p>
            ) : null}
          </fieldset>

          <button
            type="submit"
            disabled={confirm.isPending}
            className="w-full rounded-lg bg-black py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400"
          >
            {confirm.isPending ? "Enviando…" : "Confirmar asistencia / Submit"}
          </button>
          {inv.status === "pending" && !isLink && (
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
