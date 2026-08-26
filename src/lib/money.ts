// src/lib/money.ts — formateo de moneda COP (única fuente de verdad).
// Reemplaza las ~17 copias sueltas de Intl.NumberFormat("es-CO", ...) del repo.

export function formatCOP(
  amount?: number | null,
  opts?: { code?: boolean; currency?: string }
): string {
  const currency = opts?.currency || "COP";
  const n = Number(amount ?? 0);
  try {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency,
      currencyDisplay: opts?.code ? "code" : "symbol",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${n.toLocaleString("es-CO")}`;
  }
}
