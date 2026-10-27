export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return null;
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return round2(value);
}

export function formatRs(value: number) {
  const amount = Number.isFinite(value) ? round2(value) : 0;
  const fraction = Math.abs(amount - Math.trunc(amount)) > 0 ? 2 : 0;
  const formatted = new Intl.NumberFormat("en-PK", {
    minimumFractionDigits: fraction,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs ${formatted}`;
}

export function formatBillNo(number: number) {
  return String(number).padStart(4, "0");
}

export function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function lineAmount(price: number, qty: number) {
  return round2(price * qty);
}

export function computeTotals(
  lines: { price: number; qty: number }[],
  discount: number,
  taxPercent: number,
) {
  const subtotal = round2(lines.reduce((sum, line) => sum + lineAmount(line.price, line.qty), 0));
  const discountApplied = round2(Math.min(Math.max(discount, 0), subtotal));
  const taxable = round2(subtotal - discountApplied);
  const percent = Math.min(100, Math.max(0, taxPercent));
  const tax = round2((taxable * percent) / 100);
  const total = round2(taxable + tax);
  return { subtotal, discount: discountApplied, taxPercent: percent, tax, total };
}
