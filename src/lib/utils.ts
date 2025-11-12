import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const toSelectItems = <T>(
  data: T[] | undefined,
  label: (x: T) => string,
  value: (x: T) => string
) => (data ?? []).map((x) => ({ label: label(x), value: value(x) }));
export const formatMoney = (value?: number, currency = "COP") => `${currency} ${new Intl.NumberFormat("es-CO").format(value ?? 0)}`;

export function mergeImages(primary?: string, list?: string[]) {
  const fromArray = Array.isArray(list) ? list : [];
  const fromSingle = primary ? [primary] : [];
  const merged = [...fromArray, ...fromSingle]
    .map((u) => (typeof u === "string" ? u.trim() : u))
    .filter(Boolean) as string[];

  return merged.length ? merged : ["/placeholder.png"];
}
