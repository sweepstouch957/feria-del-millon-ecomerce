"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, Controller, type FieldError } from "react-hook-form";
import toast from "react-hot-toast";
import PhoneInput, { isValidPhone } from "@components/PhoneInput";
import { createSaleClaim, type ClaimMethod } from "@services/order.service";

/* "Compré una obra y no tengo confirmación". El comprador cuenta qué compró y
   cómo pagó; el artista lo confirma y la feria registra la venta y coordina la
   entrega. Llega desde la página de la obra (?obra=<id>) o por enlace directo.
   Mismo estilo que /entrega/:token. */

const WHATSAPP = "+57 300 748 5406";
const METHODS: { value: ClaimMethod; label: string }[] = [
  { value: "datafono", label: "Tarjeta en datáfono" },
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia / Nequi / QR" },
  { value: "en_linea", label: "En línea (página web)" },
  { value: "otro", label: "Otro" },
];

type FormValues = {
  artwork: string; purchasedOn: string; method: ClaimMethod | ""; amount: string; voucher: string; seller: string;
  name: string; email: string; phone: string; document: string; address: string; note: string;
};

function Field({ label, error, hint, className = "", children }: { label: string; error?: FieldError; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block text-sm font-medium text-slate-800 ${className}`}>
      <span>{label}</span>
      {children}
      {error?.message ? (
        <span role="alert" className="mt-1 flex items-start gap-1 text-xs font-normal text-red-600"><span aria-hidden>●</span>{error.message}</span>
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

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

export default function ClaimClient({ artwork }: { artwork: string }) {
  const [done, setDone] = useState<null | { alreadyRegistered: boolean }>(null);
  const { register, control, handleSubmit, setError, formState: { errors } } = useForm<FormValues>({
    mode: "onTouched",
    defaultValues: {
      artwork: artwork ? `${typeof window !== "undefined" ? window.location.origin : ""}/obra/${artwork}` : "",
      purchasedOn: today(), method: "", amount: "", voucher: "", seller: "",
      name: "", email: "", phone: "", document: "", address: "", note: "",
    },
  });

  const send = useMutation({
    mutationFn: (v: FormValues) => createSaleClaim({ ...v, method: v.method as ClaimMethod }),
    onSuccess: (r) => { setDone({ alreadyRegistered: r.alreadyRegistered }); window.scrollTo({ top: 0, behavior: "smooth" }); },
    onError: (e: any) => {
      const code: string = e?.response?.data?.error || "";
      const field = (name: keyof FormValues, message: string) => setError(name, { type: "server", message }, { shouldFocus: true });
      if (code === "name_invalid") return field("name", "Escriba su nombre completo");
      if (code === "email_invalid") return field("email", "Correo inválido");
      if (code === "phone_invalid") return field("phone", "Número incompleto");
      if (code === "artwork_invalid") return field("artwork", "Díganos cuál obra compró");
      if (code === "date_invalid") return field("purchasedOn", "Elija la fecha");
      if (code === "method_invalid") return field("method", "Elija cómo pagó");
      if (code === "too_many") return toast.error(`Ya recibimos varios reportes suyos. Escríbanos al WhatsApp ${WHATSAPP}.`);
      toast.error("No pudimos enviar. Intente de nuevo.");
    },
  });

  if (done) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border-2 border-black p-6">
          <h1 className="text-2xl font-bold">Recibimos su reporte</h1>
          <p className="mt-2 text-[15px] text-slate-700">
            {done.alreadyRegistered
              ? "Encontramos una compra de esa obra a su nombre: su venta sí está registrada. Igual revisaremos su caso y le escribiremos."
              : "Lo verificaremos con el artista y con los pagos de la feria. Le escribiremos al correo y al celular que nos dejó para confirmar su compra y coordinar la entrega."}
          </p>
          <p className="mt-4 text-sm text-slate-500">¿Dudas? WhatsApp {WHATSAPP}.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-right text-[26px] font-bold leading-tight">Reportar<br />una compra</p>
      <div className="mt-3 border-t-[3px] border-black" />
      <h1 className="mt-6 text-2xl font-bold">¿Compró una obra y no tiene confirmación?</h1>
      <p className="mt-2 text-[15px] text-slate-700">
        Cuéntenos qué compró y cómo pagó. Lo verificamos con el artista y con los pagos de la feria, y le confirmamos la compra y la entrega.
      </p>

      <form className="mt-8 space-y-8" noValidate onSubmit={handleSubmit((v) => send.mutate(v), () => toast.error("Revise los campos marcados en rojo."))}>
        <section className="space-y-4">
          <p className="text-xl font-semibold">La compra</p>
          <Field label="¿Qué obra compró? *" error={errors.artwork} hint="Pegue el enlace de la obra (el del QR) o escriba el nombre de la obra y del artista.">
            <input className={inputCls(errors.artwork)} placeholder="Nombre de la obra — Artista"
              {...register("artwork", { validate: (v) => v.trim().length >= 3 || "Díganos cuál obra compró" })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha de la compra *" error={errors.purchasedOn}>
              <input type="date" max={today()} className={inputCls(errors.purchasedOn)} {...register("purchasedOn", { required: "Elija la fecha" })} />
            </Field>
            <Field label="¿Cómo pagó? *" error={errors.method}>
              <select className={inputCls(errors.method)} {...register("method", { required: "Elija cómo pagó" })}>
                <option value="">Seleccione…</option>
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </Field>
            <Field label="Valor pagado" error={errors.amount} hint="En pesos, si lo recuerda.">
              <input inputMode="numeric" className={inputCls(errors.amount)} placeholder="1.200.000" {...register("amount")} />
            </Field>
            <Field label="Comprobante" error={errors.voucher} hint="Número de aprobación del voucher, últimos 4 dígitos de la tarjeta o referencia de la transferencia.">
              <input className={inputCls(errors.voucher)} {...register("voucher")} />
            </Field>
            <Field label="¿Quién le vendió?" error={errors.seller} hint="Nombre de la persona de caja o del artista, si lo recuerda." className="sm:col-span-2">
              <input className={inputCls(errors.seller)} {...register("seller")} />
            </Field>
          </div>
        </section>

        <section className="space-y-4">
          <p className="text-xl font-semibold">Sus datos</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo *" error={errors.name} className="sm:col-span-2">
              <input className={inputCls(errors.name)} autoComplete="name" {...register("name", { validate: (v) => v.trim().length >= 3 || "Escriba su nombre completo" })} />
            </Field>
            <Field label="Correo *" error={errors.email}>
              <input type="email" className={inputCls(errors.email)} autoComplete="email"
                {...register("email", { validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Correo inválido" })} />
            </Field>
            <Field label="Celular *" error={errors.phone}>
              <Controller name="phone" control={control}
                rules={{ validate: (v) => (!v.trim() ? "Escriba su celular" : isValidPhone(v) || "Número incompleto") }}
                render={({ field }) => (
                  <PhoneInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.phone}
                    selectClassName={inputCls(errors.phone)} inputClassName={inputCls(errors.phone)} />
                )} />
            </Field>
            <Field label="Cédula / NIT" error={errors.document}>
              <input className={inputCls(errors.document)} {...register("document")} />
            </Field>
            <Field label="Dirección de entrega" error={errors.address} hint="Ciudad incluida, si quiere que se la enviemos.">
              <input className={inputCls(errors.address)} autoComplete="street-address" {...register("address")} />
            </Field>
            <Field label="¿Algo más que debamos saber?" error={errors.note} className="sm:col-span-2">
              <textarea rows={3} className={inputCls(errors.note)} {...register("note")} />
            </Field>
          </div>
        </section>

        <button type="submit" disabled={send.isPending}
          className="w-full rounded-lg bg-black py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400">
          {send.isPending ? "Enviando…" : "Enviar reporte"}
        </button>
        <p className="text-center text-xs text-slate-500">¿Prefiere hablar con alguien? WhatsApp {WHATSAPP}.</p>
      </form>
    </main>
  );
}
