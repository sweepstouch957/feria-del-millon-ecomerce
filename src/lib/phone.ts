// Teléfonos con indicativo: Colombia por defecto; Latinoamérica, España y EE. UU.
// Se guardan en formato internacional sin espacios ("+573001234567"); el backend
// (toE164 en tickets-svc) ya entiende ese formato para WhatsApp.

/** Indicativo + largo del número nacional [mín, máx]. Colombia primero; luego alfabético. */
export const PHONE_COUNTRIES = [
  { iso: "CO", name: "Colombia", dial: "57", len: [10, 10] },
  { iso: "AR", name: "Argentina", dial: "54", len: [10, 11] },
  { iso: "BO", name: "Bolivia", dial: "591", len: [8, 8] },
  { iso: "BR", name: "Brasil", dial: "55", len: [10, 11] },
  { iso: "CL", name: "Chile", dial: "56", len: [9, 9] },
  { iso: "CR", name: "Costa Rica", dial: "506", len: [8, 8] },
  { iso: "CU", name: "Cuba", dial: "53", len: [8, 8] },
  { iso: "EC", name: "Ecuador", dial: "593", len: [9, 9] },
  { iso: "SV", name: "El Salvador", dial: "503", len: [8, 8] },
  { iso: "ES", name: "España", dial: "34", len: [9, 9] },
  { iso: "US", name: "Estados Unidos", dial: "1", len: [10, 10] },
  { iso: "GT", name: "Guatemala", dial: "502", len: [8, 8] },
  { iso: "HN", name: "Honduras", dial: "504", len: [8, 8] },
  { iso: "MX", name: "México", dial: "52", len: [10, 10] },
  { iso: "NI", name: "Nicaragua", dial: "505", len: [8, 8] },
  { iso: "PA", name: "Panamá", dial: "507", len: [8, 8] },
  { iso: "PY", name: "Paraguay", dial: "595", len: [9, 9] },
  { iso: "PE", name: "Perú", dial: "51", len: [9, 9] },
  { iso: "PR", name: "Puerto Rico", dial: "1", len: [10, 10] },
  { iso: "DO", name: "República Dominicana", dial: "1", len: [10, 10] },
  { iso: "UY", name: "Uruguay", dial: "598", len: [8, 8] },
  { iso: "VE", name: "Venezuela", dial: "58", len: [10, 10] },
] as const;

export type PhoneCountry = (typeof PHONE_COUNTRIES)[number];
const CO = PHONE_COUNTRIES[0];
// Indicativo más largo primero: +593 no debe leerse como +59…
const BY_DIAL = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);

export const flagOf = (iso: string) => String.fromCodePoint(...[...iso].map((c) => 0x1f1a5 + c.charCodeAt(0)));

/** "+573001234567" → país + número nacional. Sin "+" (datos viejos: "300 123 4567") = Colombia.
 *  `prefer` desempata los que comparten indicativo (+1: EE. UU., Puerto Rico, Rep. Dominicana). */
export function parsePhone(value: string, prefer?: PhoneCountry): { country: PhoneCountry; national: string } {
  const s = String(value || "").trim();
  const digits = s.replace(/\D/g, "");
  if (!s.startsWith("+")) {
    // Datos viejos guardados como "573001234567": se quita el 57.
    const d = digits.length === 12 && digits.startsWith("57") ? digits.slice(2) : digits;
    return { country: prefer ?? CO, national: d.slice(0, (prefer ?? CO).len[1]) };
  }
  if (prefer && digits.startsWith(prefer.dial)) return { country: prefer, national: digits.slice(prefer.dial.length) };
  const c = BY_DIAL.find((x) => digits.startsWith(x.dial)) ?? CO;
  return { country: c, national: digits.slice(c.dial.length) };
}

/** Número internacional ("" si no hay dígitos), recortado al largo máximo del país. */
export const toPhoneValue = (c: PhoneCountry, digits: string) =>
  digits ? `+${c.dial}${digits.replace(/\D/g, "").slice(0, c.len[1])}` : "";

/** Válido si el número nacional tiene el largo de su país (Colombia: 10 dígitos). */
export function isValidPhone(value: string): boolean {
  const { country, national } = parsePhone(value);
  return national.length >= country.len[0] && national.length <= country.len[1];
}

/** "3001234567" → "300 123 4567"; otros largos, de a tres. */
export const groupPhone = (d: string) =>
  d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d.replace(/(\d{3})(?=\d)/g, "$1 ");
