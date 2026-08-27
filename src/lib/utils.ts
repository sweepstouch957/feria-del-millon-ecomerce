import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatCOP } from "./money";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatMoney = (value?: number, currency = "COP") => formatCOP(value, { code: true, currency });

/** El backend guarda `images` como [{ src, alt, role, order }], `image` como string. */
export function pickSrc(u: any): string {
  if (typeof u === "string") return u.trim();
  return String(u?.src ?? u?.url ?? "").trim();
}

export function mergeImages(primary?: string, list?: any[]) {
  const fromArray = Array.isArray(list) ? list : [];
  const fromSingle = primary ? [primary] : [];
  const merged = [...fromArray, ...fromSingle].map(pickSrc).filter(Boolean);

  return merged.length ? merged : ["/placeholder.png"];
}
