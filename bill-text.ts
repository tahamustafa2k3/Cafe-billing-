import type { SavedBill } from "@/lib/billing-store";
import { formatBillNo, formatRs, formatWhen, lineAmount } from "@/lib/money";

export function billPlainText(bill: SavedBill) {
  const head = [bill.restaurantName || "Restaurant", bill.address, bill.phone].filter(Boolean).join("\n");
  const itemLines = bill.lines
    .map((line) => `${line.name}  ${line.qty} × ${formatRs(line.price)}  =  ${formatRs(lineAmount(line.price, line.qty))}`)
    .join("\n");
  const totals = [`Subtotal  ${formatRs(bill.subtotal)}`];
  if (bill.discount > 0) totals.push(`Discount  ${formatRs(bill.discount)}`);
  if (bill.tax > 0) totals.push(`GST ${bill.taxPercent}%  ${formatRs(bill.tax)}`);
  totals.push(`Total  ${formatRs(bill.total)}`);
  const meta = [`Bill #${formatBillNo(bill.number)}`, formatWhen(bill.createdAt), bill.note].filter(Boolean).join("\n");

  return [head, meta, itemLines, totals.join("\n"), bill.footer || "Shukriya"].filter(Boolean).join("\n\n");
}
