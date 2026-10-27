import { useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { buttonClass, Input } from "@/components/ui";
import { useBillingStore } from "@/lib/billing-store";
import { cn } from "@/lib/cn";
import { formatBillNo, formatRs, formatWhen } from "@/lib/money";

export const Route = createFileRoute("/bills")({ component: BillsLayout });

function BillsLayout() {
  const detail = useRouterState({
    select: (state) => /^\/bills\/[^/]+/.test(state.location.pathname),
  });
  return (
    <AppShell>
      {detail ? null : <BillsList />}
      <Outlet />
    </AppShell>
  );
}

function BillsList() {
  const bills = useBillingStore((state) => state.bills);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return bills;
    return bills.filter((bill) => {
      const hay = [
        formatBillNo(bill.number),
        String(bill.number),
        bill.note,
        ...bill.lines.map((line) => line.name),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [bills, query]);

  return (
    <main data-ready="true" className="pad-nav px-4 pt-4 md:px-6 md:pt-6">
        <div className="safe-top">
          <h1 className="font-display text-2xl">Bills</h1>
          <p className="mt-1 text-sm text-muted">Saved on this phone. Open one to print it again.</p>
        </div>

        {bills.length === 0 ? (
          <div className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-medium">No bills yet</h2>
            <p className="mt-2 text-sm text-muted">Create a bill from the counter. It will show up here for reprinting.</p>
            <Link to="/" className={cn(buttonClass("primary"), "mt-5 w-full")}>
              New bill
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search number, dish, or note"
                aria-label="Search saved bills"
                autoComplete="off"
              />
            </div>
            {filtered.length === 0 ? (
              <p className="mt-6 text-sm text-muted">No bills match that search.</p>
            ) : (
              <ul className="mt-3 m-0 list-none rounded-xl border border-line bg-surface p-0">
                {filtered.map((bill) => {
                  const count = bill.lines.reduce((sum, line) => sum + line.qty, 0);
                  return (
                    <li key={bill.id} className="border-b border-line last:border-b-0">
                      <Link
                        to="/bills/$billId"
                        params={{ billId: bill.id }}
                        className="flex items-center justify-between gap-3 px-4 py-4"
                      >
                        <span className="min-w-0">
                          <span className="block font-medium tabular-nums">#{formatBillNo(bill.number)}</span>
                          <span className="mt-1 block truncate text-sm text-muted">
                            {formatWhen(bill.createdAt)} · {count} {count === 1 ? "item" : "items"}
                          </span>
                        </span>
                        <span className="shrink-0 font-medium tabular-nums">{formatRs(bill.total)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>
  );
}
