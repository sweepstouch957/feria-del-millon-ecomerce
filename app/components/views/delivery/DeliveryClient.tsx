"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, type FieldError } from "react-hook-form";
import toast from "react-hot-toast";
import PhoneInput, { isValidPhone } from "@components/PhoneInput";
import { getDelivery, confirmDelivery } from "@services/order.service";
import { listCities } from "@services/city.service";

/* Confirmar dirección de entrega: llega del botón del correo de confirmación de
   compra. Muestra las obras compradas y pide revisar dirección, ciudad y celular.
   Mismo estilo que /invitacion/:token. */

const WHATSAPP = "+57 300 748 5406";
const money = (n: number) => `$${Number(n || 0).toLocaleString("es-CO")}`;

type FormValues = { line1: string; line2: string; cityId: string; phone: string };

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

export default function DeliveryClient({ token }: { token: string }) {
  const qc = useQueryClient();
  const qKey = ["delivery", token];
  const { data: d, isLoading, isError } = useQuery({ queryKey: qKey, queryFn: () => getDelivery(token), retry: false });
  const { data: cities = [] } = useQuery({ queryKey: ["cities"], queryFn: listCities, staleTime: 3_600_000 });

  const { register, control, handleSubmit, reset, setError, formState: { errors } } = useForm<FormValues>({
    mode: "onTouched",
    defaultValues: { line1: "", line2: "", cityId: "", phone: "" },
  });

  useEffect(() => {
    if (!d) return;
    const bogota = cities.find((c) => /bogot/i.test(c.name))?.id || "";
    reset({ line1: d.address?.line1 || "", line2: d.address?.line2 || "", cityId: d.cityId || bogota, phone: d.phone || "" });
  }, [d, cities, reset]);

  const save = useMutation({
    mutationFn: (v: FormValues) => confirmDelivery(token, { line1: v.line1.trim(), line2: v.line2.trim(), cityId: v.cityId, phone: v.phone.trim() }),
    onSuccess: () => {
      toast.success("¡Listo! Guardamos su dirección de entrega.");
      qc.invalidateQueries({ queryKey: qKey });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    onError: (e: any) => {
      const code: string = e?.response?.data?.error || "";
      const field = (name: keyof FormValues, message: string) => setError(name, { type: "server", message }, { shouldFocus: true });
      if (code === "line1_invalid") return field("line1", "Escriba la dirección completa");
      if (code === "phone_invalid") return field("phone", "Número incompleto");
      if (code === "city_invalid") return field("cityId", "Elija la ciudad");
      toast.error("No pudimos guardar. Intente de nuevo.");
    },
  });

  if (isLoading) return <main className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-slate-500">Cargando su compra…</main>;
  if (isError || !d) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Enlace no encontrado</h1>
        <p className="mt-2 text-sm text-slate-500">Revise que el enlace esté completo o escríbanos al WhatsApp {WHATSAPP}.</p>
      </main>
    );
  }

  const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name, "es"));

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-right text-[26px] font-bold leading-tight">Confirmación<br />de compra</p>
      <div className="mt-3 border-t-[3px] border-black" />
      <h1 className="mt-6 text-2xl font-bold">Gracias por su compra{d.name ? `, ${d.name}` : ""}</h1>

      {d.confirmedAt && (
        <div className="mt-6 rounded-2xl border-2 border-black p-5">
          <p className="text-lg font-semibold">Dirección confirmada</p>
          <p className="mt-1 text-sm text-slate-600">
            Enviaremos {d.items.length > 1 ? "sus obras" : "su obra"} a <b>{[d.address?.line1, d.address?.line2, d.cityName].filter(Boolean).join(", ")}</b>.
            Si necesita cambiarla, corríjala abajo y guarde de nuevo.
          </p>
        </div>
      )}

      <section className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{d.items.length > 1 ? "Sus obras" : "Su obra"}</p>
        <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200">
          {d.items.map((a, i) => (
            <li key={i} className="flex gap-4 py-4">
              {a.image && <img src={a.image} alt={a.title} className="h-28 w-28 shrink-0 bg-slate-50 object-contain" />}
              <div className="min-w-0">
                <p className="font-semibold">{a.title}</p>
                <p className="text-sm text-slate-600">{[a.artist, a.technique, a.dimensions].filter(Boolean).join(" · ")}</p>
                <p className="mt-1 text-sm">{a.qty > 1 ? `${a.qty} × ` : ""}{money(a.price)}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right font-semibold">Total: {money(d.total)} COP</p>
        <p className="text-right text-xs text-slate-500">Referencia{d.refs.length > 1 ? "s" : ""}: {d.refs.map((r) => `#${r}`).join(", ")}</p>
      </section>

      <form className="mt-10 space-y-5" noValidate onSubmit={handleSubmit((v) => save.mutate(v), () => toast.error("Revise los campos marcados en rojo."))}>
        <div>
          <p className="text-xl font-semibold">Dirección de entrega</p>
          <p className="mt-1 text-[15px] text-slate-700">Para que su obra llegue bien, confirme o corrija estos datos.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Dirección *" error={errors.line1} className="sm:col-span-2">
            <input className={inputCls(errors.line1)} autoComplete="street-address" placeholder="Calle 00 #00-00"
              {...register("line1", { validate: (v) => v.trim().length >= 5 || "Escriba la dirección completa" })} />
          </Field>
          <Field label="Apartamento, torre, conjunto o indicaciones" error={errors.line2} className="sm:col-span-2" hint="Opcional: horario de entrega, portería, a quién dejarla.">
            <input className={inputCls(errors.line2)} {...register("line2")} />
          </Field>
          <Field label="Ciudad *" error={errors.cityId}>
            <select className={inputCls(errors.cityId)} {...register("cityId", { required: "Elija la ciudad" })}>
              <option value="">Seleccione…</option>
              {sortedCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Celular de contacto *" error={errors.phone} hint="Para coordinar la entrega.">
            <Controller name="phone" control={control}
              rules={{ validate: (v) => (!v.trim() ? "Escriba su celular" : isValidPhone(v) || "Número incompleto") }}
              render={({ field }) => (
                <PhoneInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} invalid={!!errors.phone}
                  selectClassName={inputCls(errors.phone)} inputClassName={inputCls(errors.phone)} />
              )} />
          </Field>
        </div>
        <button type="submit" disabled={save.isPending}
          className="w-full rounded-lg bg-black py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:bg-slate-400">
          {save.isPending ? "Guardando…" : d.confirmedAt ? "Guardar cambios" : "Confirmar dirección"}
        </button>
        <p className="text-center text-xs text-slate-500">¿Dudas sobre su entrega? Escríbanos al WhatsApp {WHATSAPP}.</p>
      </form>
    </main>
  );
}
