import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Boot } from "@/components/app-shell";
import { ReceiptSlip } from "@/components/receipt-slip";
import { Button } from "@/components/ui";
import { billPlainText } from "@/lib/bill-text";
import { useBillingStore } from "@/lib/billing-store";
import { formatBillNo } from "@/lib/money";
import { useStoreReady } from "@/lib/use-store-ready";

export const Route = createFileRoute("/bills/$billId")({ component: BillDetail });

function BillDetail() {
  const { billId } = Route.useParams();
  const navigate = useNavigate();
  const ready = useStoreReady();
  const bill = useBillingStore((state) => state.bills.find((entry) => entry.id === billId));
  const removeBill = useBillingStore((state) => state.removeBill);
  const [confirm, setConfirm] = useState(false);

  if (!ready) return <Boot />;

  if (!bill) {
    return (
      <main className="pad-nav px-4 pt-6">
        <h1 className="font-display text-2xl">Bill not found</h1>
        <p className="mt-2 text-sm text-muted">It is not saved on this phone.</p>
        <Link to="/bills" className="mt-4 inline-flex h-12 items-center font-medium">
          Back to bills
        </Link>
      </main>
    );
  }

  async function share() {
    if (!bill) return;
    const text = billPlainText(bill);
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `Bill #${formatBillNo(bill.number)}`,
          text,
        });
        return;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast("Bill copied. Paste it into WhatsApp or a note.");
    } catch {
      toast("Could not share this bill from the browser.");
    }
  }

  return (
    <>
      <main data-ready="true" className="pad-nav-dock px-4 pt-2 md:px-6 md:pt-6">
        <div className="no-print safe-top mb-4 flex items-center justify-between gap-3">
          <Link to="/bills" className="press inline-flex h-12 items-center gap-1">
            <ChevronLeft className="size-5" aria-hidden="true" />
            Bills
          </Link>
          <div className="hidden gap-2 md:flex">
            <Button type="button" onClick={() => window.print()}>
              <Printer className="size-5" aria-hidden="true" />
              Print bill
            </Button>
            <Button type="button" variant="secondary" onClick={() => void share()}>
              <Share2 className="size-5" aria-hidden="true" />
              Share
            </Button>
          </div>
        </div>

        <ReceiptSlip bill={bill} />

        <div className="no-print mx-auto mt-6 w-full max-w-sm">
          {confirm ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm">Delete bill #{formatBillNo(bill.number)} from this phone? This cannot be undone.</p>
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    removeBill(bill.id);
                    void navigate({ to: "/bills" });
                  }}
                >
                  Delete
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setConfirm(false)}>
                  Keep
                </Button>
              </div>
            </div>
          ) : (
            <button type="button" className="text-sm text-danger" onClick={() => setConfirm(true)}>
              Delete this bill
            </button>
          )}
        </div>
      </main>

      <div className="dock no-print">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <Button type="button" className="flex-1" onClick={() => window.print()}>
            <Printer className="size-5" aria-hidden="true" />
            Print bill
          </Button>
          <Button type="button" variant="secondary" className="w-12 shrink-0 px-0" aria-label="Share bill" onClick={() => void share()}>
            <Share2 className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </>
  );
}
