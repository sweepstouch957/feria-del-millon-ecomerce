"use client";

import { FormEvent, ChangeEvent, type ReactNode } from "react";
import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { EYEBROW, mix } from "./checkoutTheme";

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
  cities: CityOption[];
  loadingCities: boolean;
  isProcessing: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  register: UseFormRegister<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
};

export const FORM_CSS = `
  .fdm-f { display: flex; flex-direction: column; gap: 30px; }
  .fdm-f-sec { display: flex; flex-direction: column; gap: 22px; }
  .fdm-f-h { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; padding-bottom: 10px; border-bottom: 1px solid ${mix(12)}; }
  .fdm-f-h > span { flex: 1 1 100%; }
  @media (min-width: 720px) { .fdm-f-h > span { flex: 0 1 auto; } }
  .fdm-f-h h2 { margin: 0; font-weight: 300; font-size: clamp(20px,2.2vw,26px); letter-spacing: -0.01em; }
  .fdm-f-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%,210px), 1fr)); gap: 22px 28px; }
  .fdm-f-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .fdm-f-field label { font-weight: 500; font-size: 9.5px; letter-spacing: .16em; text-transform: uppercase; opacity: .65; }
  .fdm-f-field input, .fdm-f-field select, .fdm-f-field textarea {
    width: 100%; background: transparent; border: 0; border-bottom: 1px solid ${mix(25)}; border-radius: 0;
    color: inherit; font: inherit; font-size: 16px; padding: 4px 0 9px; outline: none; transition: border-color .3s ease;
  }
  .fdm-f-field select { appearance: none; -webkit-appearance: none; background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%); background-position: calc(100% - 12px) 55%, calc(100% - 7px) 55%; background-size: 5px 5px; background-repeat: no-repeat; padding-right: 24px; cursor: pointer; }
  .fdm-f-field select option { color: #0B0B0A; background: #fff; }
  .fdm-f-field textarea { resize: vertical; min-height: 64px; }
  .fdm-f-field input:focus, .fdm-f-field select:focus, .fdm-f-field textarea:focus { border-color: var(--acc); }
  .fdm-f-field input::placeholder, .fdm-f-field textarea::placeholder { color: ${mix(35)}; }
  .fdm-f-field input:disabled, .fdm-f-field select:disabled { opacity: .5; }
  .fdm-f-field.is-error input, .fdm-f-field.is-error select { border-color: #C0392B; }
  .fdm-f-err { font-size: 12.5px; color: #C0392B; }
  .fdm-f-hint { font-size: 12.5px; opacity: .6; }
  .fdm-f-btn { display: inline-flex; align-items: center; justify-content: center; height: 52px; padding: 0 30px; border-radius: 999px; border: 1px solid var(--fg); background: var(--fg); color: var(--bg); font-family: inherit; font-weight: 500; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; cursor: pointer; transition: all .3s ease; width: 100%; }
  .fdm-f-btn:hover:not(:disabled) { background: var(--acc); border-color: var(--acc); color: #0B0B0A; }
  .fdm-f-btn:disabled { opacity: .35; cursor: not-allowed; }
  .fdm-f-btn.is-ghost { background: transparent; color: var(--fg); }
  .fdm-f-btn.is-ghost:hover:not(:disabled) { background: var(--fg); color: var(--bg); border-color: var(--fg); }
  .fdm-f-actions { display: flex; flex-wrap: wrap; gap: 12px; }
  .fdm-f-actions .fdm-f-btn { width: auto; flex: 1 1 200px; }
  @media (max-width: 600px) { .fdm-f-actions .fdm-f-btn { flex-basis: 100%; } }
`;

function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`fdm-f-field${error ? " is-error" : ""}${className ? ` ${className}` : ""}`}>
      <label>{label}</label>
      {children}
      {error ? <span className="fdm-f-err">{error}</span> : hint ? <span className="fdm-f-hint">{hint}</span> : null}
    </div>
  );
}

export function CheckoutPersonalForm({ cities, loadingCities, isProcessing, onSubmit, register, errors }: Props) {
  // ───────────────────────────────────────────────────────────────
  // Helpers de máscara (vanilla)
  // ───────────────────────────────────────────────────────────────
  const formatColombiaPhone = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("57")) digits = digits.slice(2);
    digits = digits.slice(0, 10);
    let formatted = "+57";
    if (digits.length > 0) formatted += " " + digits.slice(0, 3);
    if (digits.length > 3) formatted += " " + digits.slice(3, 6);
    if (digits.length > 6) formatted += " " + digits.slice(6, 10);
    return formatted;
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>, originalOnChange: (event: ChangeEvent<HTMLInputElement>) => void) => {
    e.target.value = formatColombiaPhone(e.target.value);
    originalOnChange(e);
  };

  const handleZipChange = (e: ChangeEvent<HTMLInputElement>, originalOnChange: (event: ChangeEvent<HTMLInputElement>) => void) => {
    e.target.value = e.target.value.replace(/\D/g, "");
    originalOnChange(e);
  };

  const phoneReg = register("phone", {
    required: "El teléfono es obligatorio",
    validate: (value) => {
      const digits = value.replace(/\D/g, "");
      const after57 = digits.startsWith("57") ? digits.slice(2) : digits;
      return after57.length === 10 || "Ingresa un número colombiano válido (+57 y 10 dígitos)";
    },
  });

  const zipReg = register("zipCode", {
    pattern: { value: /^\d*$/, message: "El código postal solo puede contener números" },
  });

  const err = (k: keyof CheckoutFormData) => errors[k]?.message as string | undefined;

  return (
    <form onSubmit={onSubmit} className="fdm-f" noValidate>
      <style>{FORM_CSS}</style>

      <section className="fdm-f-sec">
        <div className="fdm-f-h">
          <h2>Quién compra</h2>
          <span style={{ fontSize: 13, opacity: 0.6, marginLeft: "auto" }}>Sin cuenta ni contraseña.</span>
        </div>
        <div className="fdm-f-row">
          <Field label="Nombre" error={err("firstName")}>
            <input {...register("firstName", { required: "El nombre es obligatorio" })} placeholder="Tu nombre" disabled={isProcessing} autoComplete="given-name" />
          </Field>
          <Field label="Apellido" error={err("lastName")}>
            <input {...register("lastName", { required: "El apellido es obligatorio" })} placeholder="Tu apellido" disabled={isProcessing} autoComplete="family-name" />
          </Field>
        </div>
        <div className="fdm-f-row">
          <Field label="Correo" error={err("email")} hint="Ahí llega la confirmación de compra.">
            <input
              type="email"
              {...register("email", {
                required: "El correo es obligatorio",
                pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Ingresa un correo válido" },
              })}
              placeholder="tu@correo.com"
              disabled={isProcessing}
              autoComplete="email"
            />
          </Field>
          <Field label="Celular" error={err("phone")}>
            <input type="tel" placeholder="+57 300 123 4567" inputMode="tel" disabled={isProcessing} {...phoneReg} onChange={(e) => handlePhoneChange(e, phoneReg.onChange)} autoComplete="tel" />
          </Field>
        </div>
      </section>

      <section className="fdm-f-sec">
        <div className="fdm-f-h">
          <h2>Entrega</h2>
          <span style={{ fontSize: 13, opacity: 0.6, marginLeft: "auto" }}>El artista coordina la entrega con estos datos.</span>
        </div>
        <Field label="Dirección completa" error={err("address")}>
          <input {...register("address", { required: "La dirección completa es obligatoria" })} placeholder="Ej: Calle 93 # 11-26, apto 502, edificio, barrio"disabled={isProcessing} autoComplete="street-address" />
        </Field>
        <div className="fdm-f-row">
          <Field label="Ciudad" error={err("cityId")}>
            <select {...register("cityId", { required: "Selecciona la ciudad de entrega" })} disabled={loadingCities || isProcessing}>
              <option value="">{loadingCities ? "Cargando ciudades…" : "Selecciona"}</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Departamento" error={err("state")}>
            <input {...register("state", { required: "El departamento es obligatorio" })} placeholder="Cundinamarca" disabled={isProcessing} autoComplete="address-level1" />
          </Field>
          <Field label="Código postal" error={err("zipCode")} hint="Opcional">
            <input {...zipReg} placeholder="110111" inputMode="numeric" disabled={isProcessing} onChange={(e) => handleZipChange(e, zipReg.onChange)} autoComplete="postal-code" />
          </Field>
        </div>
        <Field label="Notas para la entrega" hint="Opcional: horarios, portería, referencias.">
          <textarea {...register("notes")} rows={2} disabled={isProcessing} placeholder="Ej.: entregar en portería después de las 2 p.m." />
        </Field>
      </section>

      <button type="submit" className="fdm-f-btn" disabled={isProcessing}>
        {isProcessing ? "Guardando…" : "Continuar al pago"}
      </button>
    </form>
  );
}
