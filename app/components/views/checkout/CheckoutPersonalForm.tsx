"use client";

import { FormEvent, ChangeEvent } from "react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import type { UseFormRegister, FieldErrors } from "react-hook-form";

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

export function CheckoutPersonalForm({
  cities,
  loadingCities,
  isProcessing,
  onSubmit,
  register,
  errors,
}: Props) {
  // ───────────────────────────────────────────────────────────────
  // Helpers de máscara (vanilla)
  // ───────────────────────────────────────────────────────────────
  const formatColombiaPhone = (value: string) => {
    // Solo dígitos
    let digits = value.replace(/\D/g, "");

    // Forzamos prefijo 57
    if (digits.startsWith("57")) {
      digits = digits.slice(2);
    }

    // Máximo 10 dígitos después del 57
    digits = digits.slice(0, 10);

    let formatted = "+57";

    if (digits.length > 0) {
      formatted += " " + digits.slice(0, 3);
    }
    if (digits.length > 3) {
      formatted += " " + digits.slice(3, 6);
    }
    if (digits.length > 6) {
      formatted += " " + digits.slice(6, 10);
    }

    return formatted;
  };

  const handlePhoneChange = (
    e: ChangeEvent<HTMLInputElement>,
    originalOnChange: (event: ChangeEvent<HTMLInputElement>) => void
  ) => {
    const formatted = formatColombiaPhone(e.target.value);
    e.target.value = formatted;
    originalOnChange(e);
  };

  const handleZipChange = (
    e: ChangeEvent<HTMLInputElement>,
    originalOnChange: (event: ChangeEvent<HTMLInputElement>) => void
  ) => {
    // Solo números
    const onlyDigits = e.target.value.replace(/\D/g, "");
    e.target.value = onlyDigits;
    originalOnChange(e);
  };

  // Registrations separados para poder interceptar onChange
  const phoneReg = register("phone", {
    required: "El teléfono es obligatorio",
    validate: (value) => {
      // Validar que tenga al menos algo tipo +57 300 XXX XXXX
      const digits = value.replace(/\D/g, "");
      const after57 = digits.startsWith("57") ? digits.slice(2) : digits;
      return (
        after57.length === 10 ||
        "Ingresa un número colombiano válido (+57 y 10 dígitos)"
      );
    },
  });

  const zipReg = register("zipCode", {
    pattern: {
      value: /^\d*$/, // solo números o vacío
      message: "El código postal solo puede contener números",
    },
  });

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white/80 backdrop-blur rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8"
    >
      <h2 className="text-xl font-semibold tracking-tight mb-6">
        Información Personal
      </h2>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre *
          </label>
          <Input
            {...register("firstName", {
              required: "El nombre es obligatorio",
            })}
            placeholder="Tu nombre"
            disabled={isProcessing}
            className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-600">
              {errors.firstName.message as string}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Apellido *
          </label>
          <Input
            {...register("lastName", {
              required: "El apellido es obligatorio",
            })}
            placeholder="Tu apellido"
            disabled={isProcessing}
            className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-600">
              {errors.lastName.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Identidad (CC / NIT) *
          </label>
          <Input
            {...register("documentNumber", {
              required: "El documento es obligatorio",
              validate: (value) =>
                /^\d{6,10}(-\d)?$/.test(value.trim()) ||
                "Ingresa un documento colombiano válido (6 a 10 dígitos, opcional guion y dígito verificador).",
            })}
            placeholder="Ej: 123456789 o 123456789-1"
            inputMode="numeric"
            disabled={isProcessing}
            className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
          />
          {errors.documentNumber && (
            <p className="mt-1 text-xs text-red-600">
              {errors.documentNumber.message as string}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <Input
            type="email"
            {...register("email", {
              required: "El email es obligatorio",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Ingresa un email válido",
              },
            })}
            placeholder="tu@email.com"
            disabled={isProcessing}
            className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">
              {errors.email.message as string}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <Input
            type="tel"
            placeholder="+57 300 123 4567"
            inputMode="tel"
            disabled={isProcessing}
            {...phoneReg}
            onChange={(e) => handlePhoneChange(e, phoneReg.onChange)}
            className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
          />
          {errors.phone && (
            <p className="mt-1 text-xs text-red-600">
              {errors.phone.message as string}
            </p>
          )}
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-4 mt-8">Dirección de Envío</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dirección *
        </label>
        <Input
          {...register("address", {
            required: "La dirección es obligatoria",
          })}
          placeholder="Calle, carrera, número"
          disabled={isProcessing}
          className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
        />
        {errors.address && (
          <p className="mt-1 text-xs text-red-600">
            {errors.address.message as string}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ciudad de entrega *
          </label>
          <select
            {...register("cityId", {
              required: "Selecciona una ciudad de entrega",
            })}
            disabled={loadingCities || isProcessing}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
          >
            <option value="">
              {loadingCities
                ? "Cargando ciudades..."
                : "Selecciona una ciudad"}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
          {errors.cityId && (
            <p className="mt-1 text-xs text-red-600">
              {errors.cityId.message as string}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Departamento *
          </label>
          <Input
            {...register("state", {
              required: "El departamento es obligatorio",
            })}
            placeholder="Departamento"
            disabled={isProcessing}
            className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
          />
          {errors.state && (
            <p className="mt-1 text-xs text-red-600">
              {errors.state.message as string}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Código Postal
          </label>
          <Input
            {...zipReg}
            placeholder="110111"
            inputMode="numeric"
            disabled={isProcessing}
            onChange={(e) => handleZipChange(e, zipReg.onChange)}
            className="focus-visible:ring-2 focus-visible:ring-blue-600/30 focus-visible:border-blue-600"
          />
          {errors.zipCode && (
            <p className="mt-1 text-xs text-red-600">
              {errors.zipCode.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notas adicionales (opcional)
        </label>
        <textarea
          {...register("notes")}
          rows={3}
          disabled={isProcessing}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          placeholder="Instrucciones especiales de entrega..."
        />
      </div>

      <Button
        type="submit"
        className="w-full transition-all hover:brightness-[0.98] active:scale-[0.99]"
        size="lg"
        disabled={isProcessing}
      >
        {isProcessing ? "Procesando..." : "Continuar al Pago"}
      </Button>
    </form>
  );
}
