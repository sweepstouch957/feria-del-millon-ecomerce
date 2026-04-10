"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { LabeledInput } from "./views/tickets/TicketAtoms";

type Props = {
  /** Solo los 10 dígitos, ej: "3128236822" */
  value: string;
  /** Devuelve siempre los 10 dígitos limpios */
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
};

export function ColombianPhoneInput({
  value,
  onChange,
  label = "Teléfono (opcional)",
  placeholder = "+57 312 000 0000",
}: Props) {
  const [displayValue, setDisplayValue] = useState(formatDisplay(value));

  // Si el padre resetea el valor, sincronizamos el display
  useEffect(() => {
    setDisplayValue(formatDisplay(value));
  }, [value]);

  const handleChange = (raw: string) => {
    // raw = lo que el usuario escribió en el input
    const digits = extractDigits(raw); // "3128236822"
    setDisplayValue(formatDisplay(digits)); // "+57 312 823 6822"
    onChange(digits);
  };

  return (
    <LabeledInput
      label={label}
      placeholder={placeholder}
      icon={<Phone className="size-4 text-slate-500" />}
      type="tel"
      value={displayValue}
      onChange={handleChange}
    />
  );
}

/** De cualquier string → solo 10 dígitos colombianos sin prefijo +57 */
function extractDigits(str: string): string {
  const digits = str.replace(/\D/g, ""); // quitamos todo lo que no es número
  const withoutCountry = digits.startsWith("57") ? digits.slice(2) : digits;
  return withoutCountry.slice(0, 10); // máx 10 dígitos
}

/** De "3128236822" → "+57 312 823 6822" */
function formatDisplay(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (!digits) return "+57 ";

  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 10);

  if (digits.length <= 3) return `+57 ${p1}`;
  if (digits.length <= 6) return `+57 ${p1} ${p2}`;
  return `+57 ${p1} ${p2} ${p3}`;
}
