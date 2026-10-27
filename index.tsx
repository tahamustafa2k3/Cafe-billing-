import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TicketPanel } from "@/components/ticket-panel";
import { buttonClass, IconButton, Input } from "@/components/ui";
import { useBillingStore, type MenuItem } from "@/lib/billing-store";
import { cn } from "@/lib/cn";
import { computeTotals, formatRs } from "@/lib/money";

export const Route = createFileRoute("/")({ component: BillScreen });

function BillScreen() {
  const items = useBillingStore((state) => state.items);
  const cart = useBillingStore((state) => state.cart);
  const discount = useBillingStore((state) => state.discount);
  const taxPercent = useBillingStore((state) => state.taxPercent);
  const bumpQty = useBillingStore((state) => state.bumpQty);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [review, setReview] = useState(false);

  const lines = useMemo(() => {
    return cart.flatMap((line) => {
      const item = items.find((entry) => entry.id === line.itemId);
      if (!item) return [];
      return [{ item, qty: line.qty }];
    });
  }, [cart, items]);

  const totals = computeTotals(
    lines.map((line) => ({ price: line.item.price, qty: line.qty })),
    discount,
    taxPercent,
  );

  if (items.length === 0) {
    return (
      <AppShell>
        <main data-ready="true" className="pad-nav mx-auto w-full max-w-lg px-4 pt-4 md:pt-10">
          <div className="safe-top">
            <h1 className="font-display text-2xl">Bill</h1>
            <p className="mt-1 text-sm text-muted">Pick dishes, then create the cash memo.</p>
          </div>
          <div className="mt-6 rounded-xl border border-line bg-surface p-5">
            <h2 className="text-lg font-medium">The menu is empty</h2>
            <p className="mt-2 text-sm text-muted">
              Nothing is preloaded. Add dishes and prices in Admin, then come back here to bill them.
            </p>
            <Link to="/menu" className={cn(buttonClass("primary"), "mt-5 w-full")}>
              Go to Admin
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div
        data-ready="true"
        className={cn(
          "md:grid md:grid-cols-[minmax(0,1fr)_24rem] md:items-start md:gap-8 md:px-6 md:pt-6",
          lines.length > 0 && !review ? "pad-nav-dock" : "pad-nav",
        )}
      >
        <section className={cn("min-w-0", review && "max-md:hidden")}>
          <div className="sticky-tools safe-top bg-bg px-4 pb-3 md:static md:bg-transparent md:px-0">
            <div className="pt-4 md:pt-0">
              <h1 className="font-display text-2xl">Bill</h1>
              <p className="mt-1 text-sm text-muted">Pick dishes, then create the cash memo.</p>
            </div>
            <div className="relative mt-4">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <Input
                className="pl-11"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the menu"
                aria-label="Search the menu"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="px-4 md:px-0">
            <MenuPicker
              items={items}
              lines={lines}
              query={query}
              category={category}
              onCategory={setCategory}
              onQty={bumpQty}
            />
          </div>
        </section>

        <aside className={cn("ticket-sticky min-w-0 px-4 pt-4 md:px-0 md:pt-0", !review && "max-md:hidden")}>
          <TicketPanel lines={lines} showBack={review} onBack={() => setReview(false)} />
        </aside>
      </div>

      {!review && lines.length > 0 ? (
        <div className="dock no-print">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="text-sm text-muted">
                {lines.reduce((sum, line) => sum + line.qty, 0)} on the bill · subtotal
              </p>
              <p className="text-xl font-medium tabular-nums">{formatRs(totals.subtotal)}</p>
            </div>
            <button type="button" className={buttonClass("primary")} onClick={() => setReview(true)}>
              Review
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function MenuPicker({
  items,
  lines,
  query,
  category,
  onCategory,
  onQty,
}: {
  items: MenuItem[];
  lines: { item: MenuItem; qty: number }[];
  query: string;
  category: string;
  onCategory: (value: string) => void;
  onQty: (id: string, delta: number) => void;
}) {
  const named = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const value = item.category.trim();
      if (value) set.add(value);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  const hasBlank = items.some((item) => !item.category.trim());
  const showChips = named.length > 1 || (named.length >= 1 && hasBlank);
  const chips = ["All", ...named, ...(hasBlank && named.length > 0 ? ["Other"] : [])];
  const activeCategory = chips.includes(category) ? category : "All";

  const filtered = items.filter((item) => {
    const cat = item.category.trim();
    if (activeCategory === "Other" && cat) return false;
    if (activeCategory !== "All" && activeCategory !== "Other" && cat !== activeCategory) return false;
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return item.name.toLowerCase().includes(needle) || cat.toLowerCase().includes(needle);
  });

  const groups = groupItems(filtered);
  const showHeadings = groups.length > 1 || (groups[0] && groups[0][0] !== "Menu");
  const qtyOf = (id: string) => lines.find((line) => line.item.id === id)?.qty ?? 0;

  return (
    <div className="mt-4">
      {showChips ? (
        <div className="chip-row pb-3" role="tablist" aria-label="Categories">
          {chips.map((chip) => {
            const selected = chip === activeCategory;
            return (
              <button
                key={chip}
                type="button"
                role="tab"
                aria-selected={selected}
                className={cn(
                  "press h-10 shrink-0 rounded-sm px-3 text-sm",
                  selected ? "bg-fg font-medium text-surface" : "border border-line bg-surface text-fg",
                )}
                onClick={() => onCategory(chip)}
              >
                {chip}
              </button>
            );
          })}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="py-8 text-sm text-muted">No dishes match that search.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map(([label, group]) => (
            <section key={label}>
              {showHeadings ? <h2 className="mb-1 text-sm font-medium text-muted">{label}</h2> : null}
              <ul className="m-0 list-none rounded-xl border border-line bg-surface p-0">
                {group.map((item) => {
                  const qty = qtyOf(item.id);
                  return (
                    <li key={item.id} className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-b-0">
                      <div className="min-w-0 flex-1 py-1">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-sm text-muted tabular-nums">{formatRs(item.price)}</p>
                      </div>
                      {qty > 0 ? (
                        <div className="flex items-center">
                          <IconButton label={`Remove one ${item.name}`} onClick={() => onQty(item.id, -1)}>
                            <Minus className="size-4" aria-hidden="true" />
                          </IconButton>
                          <span className="w-8 text-center font-medium tabular-nums">{qty}</span>
                          <IconButton label={`Add one ${item.name}`} onClick={() => onQty(item.id, 1)}>
                            <Plus className="size-4" aria-hidden="true" />
                          </IconButton>
                        </div>
                      ) : (
                        <IconButton
                          label={`Add ${item.name}`}
                          className="border-transparent bg-fg text-surface"
                          onClick={() => onQty(item.id, 1)}
                        >
                          <Plus className="size-4" aria-hidden="true" />
                        </IconButton>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupItems(items: MenuItem[]) {
  const groups = new Map<string, MenuItem[]>();
  for (const item of items) {
    const key = item.category.trim() || "Menu";
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}
