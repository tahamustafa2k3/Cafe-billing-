import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { useBillingStore, type MenuItem } from "@/lib/billing-store";
import { computeTotals, formatRs, lineAmount, parseMoney } from "@/lib/money";
import { Button, Field, IconButton, Input } from "@/components/ui";

type ViewLine = {
  item: MenuItem;
  qty: number;
};

export function TicketPanel({
  lines,
  showBack,
  onBack,
}: {
  lines: ViewLine[];
  showBack: boolean;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const discount = useBillingStore((state) => state.discount);
  const taxPercent = useBillingStore((state) => state.taxPercent);
  const note = useBillingStore((state) => state.note);
  const bumpQty = useBillingStore((state) => state.bumpQty);
  const setDiscount = useBillingStore((state) => state.setDiscount);
  const setTaxPercent = useBillingStore((state) => state.setTaxPercent);
  const setNote = useBillingStore((state) => state.setNote);
  const clearCart = useBillingStore((state) => state.clearCart);
  const [discountText, setDiscountText] = useState(() => (discount > 0 ? String(discount) : ""));
  const [taxText, setTaxText] = useState(() => (taxPercent > 0 ? String(taxPercent) : ""));
  const [confirmClear, setConfirmClear] = useState(false);

  const totals = computeTotals(
    lines.map((line) => ({ price: line.item.price, qty: line.qty })),
    discount,
    taxPercent,
  );
  const discountInvalid = discountText.trim() !== "" && parseMoney(discountText) === null;
  const taxInvalid = taxText.trim() !== "" && parseMoney(taxText) === null;
  const typedDiscount = parseMoney(discountText);

  function onCreate() {
    if (lines.length === 0 || discountInvalid || taxInvalid) return;
    const id = useBillingStore.getState().createBill();
    if (!id) return;
    void navigate({ to: "/bills/$billId", params: { billId: id } });
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-4" aria-label="Current bill">
      <div className="mb-4 flex items-center justify-between gap-3">
        {showBack ? (
          <button type="button" className="press inline-flex h-11 items-center gap-1 md:hidden" onClick={onBack}>
            <ChevronLeft className="size-5" aria-hidden="true" />
            Menu
          </button>
        ) : (
          <h2 className="text-lg font-medium">This bill</h2>
        )}
        {lines.length > 0 ? (
          confirmClear ? (
            <button type="button" className="text-sm text-muted" onClick={() => setConfirmClear(false)}>
              Keep items
            </button>
          ) : (
            <button type="button" className="text-sm text-muted" onClick={() => setConfirmClear(true)}>
              Clear
            </button>
          )
        ) : null}
      </div>

      {confirmClear ? (
        <div className="mb-4 flex flex-col gap-3 rounded-sm bg-danger-soft p-3">
          <p className="text-sm">Clear every item from this bill? Nothing is saved yet.</p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                clearCart();
                setDiscountText("");
                setTaxText(useBillingStore.getState().taxPercent > 0 ? String(useBillingStore.getState().taxPercent) : "");
                setConfirmClear(false);
              }}
            >
              Clear bill
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmClear(false)}>
              Keep
            </Button>
          </div>
        </div>
      ) : null}

      {lines.length === 0 ? (
        <p className="text-sm text-muted">Nothing selected yet. Add dishes from the menu. Prices are only the ones you saved in Admin.</p>
      ) : (
        <>
          <ul className="m-0 list-none p-0">
            {lines.map(({ item, qty }) => (
              <li key={item.id} className="flex items-center gap-2 border-b border-line py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-sm text-muted tabular-nums">
                    {qty} × {formatRs(item.price)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums">{formatRs(lineAmount(item.price, qty))}</p>
                <div className="flex items-center">
                  <IconButton label={`Remove one ${item.name}`} onClick={() => bumpQty(item.id, -1)}>
                    <Minus className="size-4" aria-hidden="true" />
                  </IconButton>
                  <span className="w-7 text-center text-sm font-medium tabular-nums">{qty}</span>
                  <IconButton label={`Add one ${item.name}`} onClick={() => bumpQty(item.id, 1)}>
                    <Plus className="size-4" aria-hidden="true" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-4">
            <Field label="Discount (Rs)" error={discountInvalid ? "Enter a rupee amount, or leave it blank." : undefined}>
              <Input
                id="discount"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={discountText}
                aria-invalid={discountInvalid}
                onChange={(event) => {
                  const raw = event.target.value;
                  setDiscountText(raw);
                  if (raw.trim() === "") {
                    setDiscount(0);
                    return;
                  }
                  const parsed = parseMoney(raw);
                  if (parsed !== null) setDiscount(parsed);
                }}
              />
            </Field>
            <Field
              label="GST %"
              hint="Leave blank if you do not charge GST."
              error={taxInvalid ? "Enter a percent from 0 to 100." : undefined}
            >
              <Input
                id="gst"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0"
                value={taxText}
                aria-invalid={taxInvalid}
                onChange={(event) => {
                  const raw = event.target.value;
                  setTaxText(raw);
                  if (raw.trim() === "") {
                    setTaxPercent(0);
                    return;
                  }
                  const parsed = parseMoney(raw);
                  if (parsed !== null) setTaxPercent(parsed);
                }}
              />
            </Field>
            {typedDiscount !== null && typedDiscount > totals.subtotal && totals.subtotal > 0 ? (
              <p className="text-sm text-muted">Discount is capped at the subtotal.</p>
            ) : null}
            <Field label="Note" hint="Table, server, or anything that should print.">
              <Input
                id="bill-note"
                autoComplete="off"
                maxLength={120}
                placeholder="Table 4"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="tabular-nums">{formatRs(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 ? (
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted">Discount</span>
                <span className="tabular-nums">− {formatRs(totals.discount)}</span>
              </div>
            ) : null}
            {totals.tax > 0 ? (
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted">GST {totals.taxPercent}%</span>
                <span className="tabular-nums">{formatRs(totals.tax)}</span>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-3 pt-1">
              <span className="font-medium">Total</span>
              <span className="font-display text-2xl tabular-nums" aria-live="polite">
                {formatRs(totals.total)}
              </span>
            </div>
          </div>

          <Button type="button" className="mt-4 w-full" disabled={discountInvalid || taxInvalid} onClick={onCreate}>
            Create bill
          </Button>
        </>
      )}
    </section>
  );
}
