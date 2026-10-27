import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button, Field, Input, TextArea } from "@/components/ui";
import { useBillingStore, type MenuItem } from "@/lib/billing-store";
import { formatRs, parseMoney } from "@/lib/money";

export const Route = createFileRoute("/menu")({ component: AdminScreen });

function AdminScreen() {
  const items = useBillingStore((state) => state.items);
  const profile = useBillingStore((state) => state.profile);
  const setProfile = useBillingStore((state) => state.setProfile);
  const addItem = useBillingStore((state) => state.addItem);
  const [more, setMore] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  const [taxText, setTaxText] = useState<string | null>(null);
  const taxShown = taxText ?? (profile.defaultTax > 0 ? String(profile.defaultTax) : "");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const value = item.category.trim();
      if (value) set.add(value);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [items]);

  function onAdd(event: FormEvent) {
    event.preventDefault();
    const parsed = parseMoney(price);
    if (!name.trim() || parsed === null) {
      setError("Enter a dish name and a price of zero or more.");
      return;
    }
    const saved = addItem({ name, price: parsed, category });
    if (!saved) {
      setError("That dish could not be saved.");
      return;
    }
    setName("");
    setPrice("");
    setCategory("");
    setError("");
  }

  return (
    <AppShell>
      <main data-ready="true" className="pad-nav px-4 pt-4 md:px-6 md:pt-6">
        <div className="safe-top">
          <h1 className="font-display text-2xl">Admin</h1>
          <p className="mt-1 text-sm text-muted">Add dishes and update prices. The menu starts empty.</p>
        </div>

        <section className="mt-6 rounded-xl border border-line bg-surface p-4">
          <Field label="Restaurant name" hint="Prints at the top of every bill.">
            <Input
              id="restaurant-name"
              autoComplete="organization"
              maxLength={80}
              placeholder="Your restaurant"
              value={profile.restaurantName}
              onChange={(event) => setProfile({ restaurantName: event.target.value })}
            />
          </Field>
          <button type="button" className="mt-3 text-sm font-medium" onClick={() => setMore((open) => !open)}>
            {more ? "Hide bill details" : "Phone, address, GST"}
          </button>
          {more ? (
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Phone">
                <Input
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={40}
                  value={profile.phone}
                  onChange={(event) => setProfile({ phone: event.target.value })}
                />
              </Field>
              <Field label="Address">
                <TextArea
                  maxLength={160}
                  value={profile.address}
                  onChange={(event) => setProfile({ address: event.target.value })}
                />
              </Field>
              <Field label="Closing line" hint="Shown at the bottom of the printed bill.">
                <Input
                  maxLength={80}
                  value={profile.footer}
                  onChange={(event) => setProfile({ footer: event.target.value })}
                />
              </Field>
              <Field label="Default GST %" hint="Applied to the next new bill. Use 0 if you do not charge GST.">
                <Input
                  inputMode="decimal"
                  value={taxShown}
                  placeholder="0"
                  onChange={(event) => {
                    const raw = event.target.value;
                    setTaxText(raw);
                    if (raw.trim() === "") {
                      setProfile({ defaultTax: 0 });
                      return;
                    }
                    const parsed = parseMoney(raw);
                    if (parsed !== null) setProfile({ defaultTax: parsed });
                  }}
                />
              </Field>
            </div>
          ) : null}
        </section>

        <section className="mt-6 rounded-xl border border-line bg-surface p-4">
          <h2 className="text-lg font-medium">Add a dish</h2>
          <form className="mt-4 flex flex-col gap-4" onSubmit={onAdd}>
            <Field label="Name">
              <Input
                id="item-name"
                autoComplete="off"
                maxLength={80}
                placeholder="Chicken karahi"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (Rs)">
                <Input
                  id="item-price"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                />
              </Field>
              <Field label="Category">
                <Input
                  id="item-category"
                  autoComplete="off"
                  maxLength={40}
                  placeholder="Optional"
                  list="menu-categories"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                />
              </Field>
            </div>
            <datalist id="menu-categories">
              {categories.map((entry) => (
                <option key={entry} value={entry} />
              ))}
            </datalist>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit">Add to menu</Button>
          </form>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-medium">Current prices</h2>
          <p className="mt-1 text-sm text-muted">
            {items.length === 0
              ? "No prices yet. A saved bill keeps the price from the moment you created it."
              : `${items.length} ${items.length === 1 ? "dish" : "dishes"}. A price change does not rewrite old bills.`}
          </p>
          {items.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line-strong px-4 py-8 text-center">
              <p className="font-medium">Menu database is empty</p>
              <p className="mt-1 text-sm text-muted">Add the first dish above. No sample items are included.</p>
            </div>
          ) : (
            <ul className="mt-4 m-0 list-none rounded-xl border border-line bg-surface p-0">
              {items.map((item) => (
                <MenuRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </AppShell>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  const updateItem = useBillingStore((state) => state.updateItem);
  const removeItem = useBillingStore((state) => state.removeItem);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));
  const [category, setCategory] = useState(item.category);
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  function openEditor() {
    setName(item.name);
    setPrice(String(item.price));
    setCategory(item.category);
    setError("");
    setConfirmRemove(false);
    setOpen(true);
  }

  function onSave(event: FormEvent) {
    event.preventDefault();
    const parsed = parseMoney(price);
    if (!name.trim() || parsed === null) {
      setError("Name and a valid price are required.");
      return;
    }
    const saved = updateItem(item.id, { name, price: parsed, category });
    if (!saved) {
      setError("Could not update this price.");
      return;
    }
    setOpen(false);
  }

  if (!open) {
    return (
      <li className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{item.name}</p>
          <p className="text-sm text-muted tabular-nums">
            {formatRs(item.price)}
            {item.category.trim() ? ` · ${item.category.trim()}` : ""}
          </p>
        </div>
        <Button variant="secondary" className="shrink-0 px-3" onClick={openEditor} aria-label={`Update price of ${item.name}`}>
          Update
        </Button>
      </li>
    );
  }

  return (
    <li className="border-b border-line px-4 py-4 last:border-b-0">
      <form className="flex flex-col gap-4" onSubmit={onSave}>
        <Field label="Name">
          <Input autoComplete="off" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (Rs)">
            <Input
              autoFocus
              inputMode="decimal"
              autoComplete="off"
              aria-label={`New price for ${item.name}`}
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </Field>
          <Field label="Category">
            <Input
              autoComplete="off"
              maxLength={40}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </Field>
        </div>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            Save price
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </form>
      <div className="mt-4">
        {confirmRemove ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm">Remove this dish from the menu? Bills already saved stay as they were.</p>
            <div className="flex gap-2">
              <Button variant="danger" className="flex-1" onClick={() => removeItem(item.id)}>
                Remove
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmRemove(false)}>
                Keep
              </Button>
            </div>
          </div>
        ) : (
          <button type="button" className="text-sm text-danger" onClick={() => setConfirmRemove(true)}>
            Remove from menu
          </button>
        )}
      </div>
    </li>
  );
}
