"use client";

import { useEffect, useState } from "react";
import { PHONE_COUNTRIES, flagOf, groupPhone, parsePhone, toPhoneValue, type PhoneCountry } from "@lib/phone";

export { isValidPhone } from "@lib/phone";

type Props = {
  /** Número internacional sin espacios: "+573001234567" ("" si está vacío). */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
  /** Contenedor (por defecto: fila con el país a la izquierda). */
  className?: string;
  style?: React.CSSProperties;
  selectClassName?: string;
  selectStyle?: React.CSSProperties;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
};

/** Teléfono con país (Colombia por defecto; Latinoamérica, España y EE. UU.).
 *  Son un <select> y un <input> nativos: cada formulario los pinta con su propio CSS. */
export default function PhoneInput({
  value, onChange, onBlur, id, disabled, placeholder, invalid,
  className, style, selectClassName, selectStyle, inputClassName, inputStyle,
}: Props) {
  const [country, setCountry] = useState<PhoneCountry>(() => parsePhone(value).country);
  const { national } = parsePhone(value, country);

  // Si el formulario carga un número guardado de otro país, el selector lo sigue.
  useEffect(() => {
    if (value?.startsWith("+")) setCountry((c) => parsePhone(value, c).country);
  }, [value]);

  const onType = (raw: string) => {
    // Pegaron el número completo ("+34 612 345 678"): se toma el país de ahí.
    if (raw.trim().startsWith("+")) {
      const p = parsePhone(raw.replace(/[^\d+]/g, ""));
      setCountry(p.country);
      return onChange(toPhoneValue(p.country, p.national));
    }
    onChange(toPhoneValue(country, raw));
  };

  return (
    <div className={className} style={{ display: "flex", gap: 10, alignItems: "stretch", minWidth: 0, ...style }}>
      <select
        aria-label="País del teléfono"
        className={selectClassName}
        disabled={disabled}
        value={country.iso}
        onChange={(e) => {
          const c = PHONE_COUNTRIES.find((x) => x.iso === e.target.value) ?? PHONE_COUNTRIES[0];
          setCountry(c);
          onChange(toPhoneValue(c, national));
        }}
        onBlur={onBlur}
        style={{ width: 104, flex: "0 0 104px", ...selectStyle }}
      >
        {PHONE_COUNTRIES.map((c) => (
          // Cerrado se ve corto ("🇨🇴 +57"); abierto, con el nombre del país.
          // Colores fijos: con el select transparente, el tema oscuro dejaba la lista blanco sobre blanco.
          <option key={c.iso} value={c.iso} style={{ color: "#0B0B0A", background: "#fff" }}>
            {c.iso === country.iso ? `${flagOf(c.iso)} +${c.dial}` : `${flagOf(c.iso)} ${c.name} (+${c.dial})`}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        className={inputClassName}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        placeholder={placeholder ?? (country.iso === "CO" ? "300 123 4567" : "Número")}
        value={groupPhone(national)}
        onChange={(e) => onType(e.target.value)}
        onBlur={onBlur}
        style={{ flex: "1 1 auto", minWidth: 0, ...inputStyle }}
      />
    </div>
  );
}
