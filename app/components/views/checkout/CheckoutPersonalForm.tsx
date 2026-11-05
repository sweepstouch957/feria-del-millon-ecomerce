"use client";

import { FormEvent, ChangeEvent, type ReactNode } from "react";
import { Controller, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { EYEBROW, mix } from "./checkoutTheme";
import PhoneInput, { isValidPhone } from "@components/PhoneInput";

/* Datos del comprador, sistema editorial v2: campos subrayados (la línea se
   vuelve verde al enfocar), etiquetas en versalitas, una columna en el
   teléfono. Sin cuenta: lo que se pide aquí es lo que el artista necesita
   para entregar la obra. */

type CityOption = {
  id: string;
  name: string;
};

export type CheckoutFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentNumber: string;
  address: string;
  cityId: string;
  state: string;
  zipCode: string;
  country: string;
  notes: string;
};

type Props = {
  /** 1 = datos personales, 2 = entrega. Una sección a la vez: menos scroll en celular. */
  part: 1 | 2;
  onBack?: () => void;
  cities: CityOption[];
  loadingCities: boolean;
  isProcessing: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  register: UseFormRegister<CheckoutFormData>;
  control: Control<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
};

/* Campos en caja (no subrayados): se ven y se tocan mejor en celular.
   16px de letra para que iPhone no haga zoom al enfocar. */
export const FORM_CSS = `
  .fdm-f { display: flex; flex-direction: column; gap: 18px; }
  .fdm-f-sec { display: flex; flex-direction: column; gap: 18px; padding: clamp(18px,2.4vw,26px); background: var(--card); border: 1px solid var(--line); border-radius: 16px; }
  .fdm-f-h { display: flex; align-items: center; gap: 12px; }
  .fdm-f-h .fdm-f-n { flex: none; width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; background: var(--inv); color: var(--invfg); font-size: 13px; font-weight: 600; }
  .fdm-f-h h2 { margin: 0; font-weight: 600; font-size: clamp(18px,1.8vw,21px); letter-spacing: -0.015em; }
  .fdm-f-h p { margin: 2px 0 0; font-size: 13px; color: var(--fg3); }
  .fdm-f-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%,210px), 1fr)); gap: 16px 18px; }
  @media (max-width: 600px) { .fdm-f-row { grid-template-columns: minmax(0,1fr); } }
  .fdm-f-field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
  .fdm-f-field label { font-weight: 500; font-size: 13px; color: var(--fg2); }
  .fdm-f-field label .req { color: var(--acc); margin-left: 2px; }
  .fdm-f-field input, .fdm-f-field select, .fdm-f-field textarea {
    width: 100%; min-height: 50px; background: var(--bg); border: 1px solid var(--line2); border-radius: 12px;
    color: inherit; font: inherit; font-size: 16px; padding: 0 14px; outline: none;
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  .fdm-f-field select { appearance: none; -webkit-appearance: none; background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%); background-position: calc(100% - 18px) 52%, calc(100% - 13px) 52%; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 34px; cursor: pointer; }
  .fdm-f-field select option { color: #0B0B0A; background: #fff; }
  .fdm-f-field textarea { resize: vertical; min-height: 84px; padding: 12px 14px; line-height: 1.5; }
  .fdm-f-field input:focus, .fdm-f-field select:focus, .fdm-f-field textarea:focus { border-color: var(--acc); box-shadow: 0 0 0 3px color-mix(in srgb, var(--acc) 22%, transparent); }
  .fdm-f-field input::placeholder, .fdm-f-field textarea::placeholder { color: ${mix(38)}; }
  .fdm-f-field input:disabled, .fdm-f-field select:disabled { opacity: .55; }
  .fdm-f-field.is-error input, .fdm-f-field.is-error select { border-color: #C0392B; box-shadow: 0 0 0 3px rgba(192,57,43,.14); }
  .fdm-f-err { font-size: 12.5px; color: #C0392B; }
  .fdm-f-hint { font-size: 12.5px; color: var(--fg3); }
  .fdm-f-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 52px; padding: 0 26px; border-radius: 14px; border: 1px solid var(--acc); background: var(--acc); color: #0B0B0A; font-family: inherit; font-weight: 600; font-size: 15px; cursor: pointer; transition: background .25s ease, opacity .25s ease; width: 100%; }
  .fdm-f-btn:hover:not(:disabled) { background: #2E8A58; border-color: #2E8A58; }
  .fdm-f-btn:disabled { opacity: .45; cursor: not-allowed; }
  .fdm-f-note { margin: 0; font-size: 12.5px; color: var(--fg3); text-align: center; }
  .fdm-f-back { background: none; border: 0; padding: 6px; color: var(--fg3); font: inherit; font-size: 14px; cursor: pointer; align-self: center; }
  .fdm-f-back:hover { color: var(--acc); }
`;

function Field({ label, error, hint, children, className, required }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string; required?: boolean }) {
  return (
    <div className={`fdm-f-field${error ? " is-error" : ""}${className ? ` ${className}` : ""}`}>
      <label>
        {label}
        {required && <span className="req" aria-hidden>*</span>}
      </label>
      {children}
      {error ? <span className="fdm-f-err">{error}</span> : hint ? <span className="fdm-f-hint">{hint}</span> : null}
    </div>
  );
}

export function CheckoutPersonalForm({ part, onBack, cities, loadingCities, isProcessing, onSubmit, register, control, errors }: Props) {
  const handleZipChange = (e: ChangeEvent<HTMLInputElement>, originalOnChange: (event: ChangeEvent<HTMLInputElement>) => void) => {
    e.target.value = e.target.value.replace(/\D/g, "");
    originalOnChange(e);
  };

  const zipReg = register("zipCode", {
    pattern: { value: /^\d*$/, message: "El código postal solo puede contener números" },
  });

  const err = (k: keyof CheckoutFormData) => errors[k]?.message as string | undefined;

  return (
    <form onSubmit={onSubmit} className="fdm-f" noValidate>
      <style>{FORM_CSS}</style>

      {part === 1 && <section className="fdm-f-sec">
        <div className="fdm-f-h">
          <span className="fdm-f-n">1</span>
          <div>
            <h2>Datos personales</h2>
            <p>Sin cuenta ni contraseña.</p>
          </div>
        </div>
        <div className="fdm-f-row">
          <Field label="Nombre" error={err("firstName")} required>
            <input {...register("firstName", { required: "El nombre es obligatorio" })} placeholder="Tu nombre" disabled={isProcessing} autoComplete="given-name" enterKeyHint="next" />
          </Field>
          <Field label="Apellido" error={err("lastName")} required>
            <input {...register("lastName", { required: "El apellido es obligatorio" })} placeholder="Tu apellido" disabled={isProcessing} autoComplete="family-name" enterKeyHint="next" />
          </Field>
        </div>
        <div className="fdm-f-row">
          <Field label="Correo" error={err("email")} hint="Ahí llega la confirmación de compra." required>
            <input
              type="email"
              inputMode="email"
              enterKeyHint="next"
              {...register("email", {
                required: "El correo es obligatorio",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo válido" },
              })}
              placeholder="tu@correo.com"
              disabled={isProcessing}
              autoComplete="email"
            />
          </Field>
          <Field label="Celular" error={err("phone")} required>
            <Controller
              name="phone"
              control={control}
              rules={{
                required: "El teléfono es obligatorio",
                validate: (v) => isValidPhone(v) || "Número incompleto para el país elegido",
              }}
              render={({ field }) => (
                <PhoneInput value={field.value} onChange={field.onChange} onBlur={field.onBlur} disabled={isProcessing} />
              )}
            />
          </Field>
        </div>
      </section>}

      {part === 2 && <section className="fdm-f-sec">
        <div className="fdm-f-h">
          <span className="fdm-f-n">2</span>
          <div>
            <h2>Entrega</h2>
            <p>El artista coordina la entrega con estos datos.</p>
          </div>
        </div>
        <Field label="Dirección completa" error={err("address")} required>
          <input {...register("address", { required: "La dirección completa es obligatoria" })} placeholder="Ej: Calle 93 # 11-26, apto 502, edificio, barrio" disabled={isProcessing} autoComplete="street-address" enterKeyHint="next" />
        </Field>
        <div className="fdm-f-row">
          <Field label="Ciudad" error={err("cityId")} required>
            <select {...register("cityId", { required: "Selecciona la ciudad de entrega" })} disabled={loadingCities || isProcessing}>
              <option value="">{loadingCities ? "Cargando ciudades…" : "Selecciona"}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Departamento" error={err("state")} required>
            <input {...register("state", { required: "El departamento es obligatorio" })} placeholder="Cundinamarca" disabled={isProcessing} autoComplete="address-level1" />
          </Field>
          <Field label="Código postal" error={err("zipCode")} hint="Opcional">
            <input {...zipReg} placeholder="110111" inputMode="numeric" disabled={isProcessing} onChange={(e) => handleZipChange(e, zipReg.onChange)} autoComplete="postal-code" />
          </Field>
        </div>
        <Field label="Notas para la entrega" hint="Opcional: horarios, portería, referencias.">
          <textarea {...register("notes")} rows={2} disabled={isProcessing} placeholder="Ej.: entregar en portería después de las 2 p.m." />
        </Field>
      </section>}

      <button type="submit" className="fdm-f-btn" disabled={isProcessing}>
        {isProcessing ? "Guardando…" : part === 1 ? "Continuar a la entrega →" : "Continuar al pago →"}
      </button>
      {part === 2 && onBack && (
        <button type="button" className="fdm-f-back" onClick={onBack} disabled={isProcessing}>
          ← Volver a datos personales
        </button>
      )}
      <p className="fdm-f-note">Tus datos se guardan en este equipo por si recargas la página.</p>
    </form>
  );
}
