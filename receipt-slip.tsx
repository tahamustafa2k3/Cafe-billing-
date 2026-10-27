import type { SavedBill } from "@/lib/billing-store";
import { formatBillNo, formatRs, formatWhen, lineAmount } from "@/lib/money";

export function ReceiptSlip({ bill }: { bill: SavedBill }) {
  const name = bill.restaurantName.trim() || "Restaurant";
  return (
    <article className="receipt-slip mx-auto w-full max-w-sm border border-line bg-surface px-5 py-6">
      <header className="text-center">
        <h1 className="font-display text-2xl">{name}</h1>
        {bill.address ? <p className="mt-2 text-sm whitespace-pre-line text-muted">{bill.address}</p> : null}
        {bill.phone ? <p className="text-sm text-muted">{bill.phone}</p> : null}
        <p className="mt-4 text-sm font-medium">Cash memo</p>
      </header>
      <hr className="rule" />
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted">Bill no.</span>
          <span className="font-medium tabular-nums">{formatBillNo(bill.number)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted">When</span>
          <span className="text-right tabular-nums">{formatWhen(bill.createdAt)}</span>
        </div>
        {bill.note ? (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-muted">Note</span>
            <span className="text-right">{bill.note}</span>
          </div>
        ) : null}
      </div>
      <hr className="rule" />
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {bill.lines.map((line, index) => (
          <li key={`${line.name}-${index}`}>
            <p className="font-medium">{line.name}</p>
            <div className="mt-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted tabular-nums">
                {line.qty} × {formatRs(line.price)}
              </span>
              <span className="tabular-nums">{formatRs(lineAmount(line.price, line.qty))}</span>
            </div>
          </li>
        ))}
      </ul>
      <hr className="rule" />
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted">Subtotal</span>
          <span className="tabular-nums">{formatRs(bill.subtotal)}</span>
        </div>
        {bill.discount > 0 ? (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-muted">Discount</span>
            <span className="tabular-nums">− {formatRs(bill.discount)}</span>
          </div>
        ) : null}
        {bill.tax > 0 ? (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-muted">GST {bill.taxPercent}%</span>
            <span className="tabular-nums">{formatRs(bill.tax)}</span>
          </div>
        ) : null}
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <span className="font-medium">Total</span>
          <span className="font-display text-2xl tabular-nums">{formatRs(bill.total)}</span>
        </div>
      </div>
      <p className="mt-6 text-center font-display text-lg">{bill.footer.trim() || "Shukriya"}</p>
    </article>
  );
}
