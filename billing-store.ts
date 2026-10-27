import { create } from "zustand";
import { persist } from "zustand/middleware";
import { computeTotals, round2 } from "@/lib/money";

export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
};

export type CartLine = {
  itemId: string;
  qty: number;
};

export type BillLine = {
  name: string;
  category: string;
  price: number;
  qty: number;
};

export type Profile = {
  restaurantName: string;
  phone: string;
  address: string;
  footer: string;
  defaultTax: number;
};

export type SavedBill = {
  id: string;
  number: number;
  createdAt: string;
  restaurantName: string;
  phone: string;
  address: string;
  footer: string;
  lines: BillLine[];
  discount: number;
  taxPercent: number;
  note: string;
  subtotal: number;
  tax: number;
  total: number;
};

type BillingState = {
  profile: Profile;
  items: MenuItem[];
  cart: CartLine[];
  discount: number;
  taxPercent: number;
  note: string;
  nextNumber: number;
  bills: SavedBill[];
  setProfile: (patch: Partial<Profile>) => void;
  addItem: (input: { name: string; price: number; category: string }) => boolean;
  updateItem: (id: string, patch: Partial<Pick<MenuItem, "name" | "price" | "category">>) => boolean;
  removeItem: (id: string) => void;
  setQty: (itemId: string, qty: number) => void;
  bumpQty: (itemId: string, delta: number) => void;
  setDiscount: (amount: number) => void;
  setTaxPercent: (percent: number) => void;
  setNote: (note: string) => void;
  clearCart: () => void;
  createBill: () => string | null;
  removeBill: (id: string) => void;
};

const emptyProfile: Profile = {
  restaurantName: "",
  phone: "",
  address: "",
  footer: "Shukriya",
  defaultTax: 0,
};

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanName(value: string, max: number) {
  return value.trim().slice(0, max);
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      profile: emptyProfile,
      items: [],
      cart: [],
      discount: 0,
      taxPercent: 0,
      note: "",
      nextNumber: 1,
      bills: [],
      setProfile: (patch) =>
        set((state) => {
          const profile: Profile = { ...state.profile, ...patch };
          if (patch.restaurantName !== undefined) profile.restaurantName = patch.restaurantName.slice(0, 80);
          if (patch.phone !== undefined) profile.phone = patch.phone.slice(0, 40);
          if (patch.address !== undefined) profile.address = patch.address.slice(0, 160);
          if (patch.footer !== undefined) profile.footer = patch.footer.slice(0, 80);
          if (patch.defaultTax !== undefined) {
            profile.defaultTax = round2(Math.min(100, Math.max(0, patch.defaultTax)));
          }
          const taxPercent =
            state.cart.length === 0 && patch.defaultTax !== undefined ? profile.defaultTax : state.taxPercent;
          return { profile, taxPercent };
        }),
      addItem: ({ name, price, category }) => {
        const cleaned = cleanName(name, 80);
        if (!cleaned || !Number.isFinite(price) || price < 0) return false;
        const item: MenuItem = {
          id: uid(),
          name: cleaned,
          price: round2(price),
          category: cleanName(category, 40),
        };
        set((state) => ({ items: [item, ...state.items] }));
        return true;
      },
      updateItem: (id, patch) => {
        let saved = false;
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const next: MenuItem = { ...item };
            if (patch.name !== undefined) next.name = cleanName(patch.name, 80);
            if (patch.category !== undefined) next.category = cleanName(patch.category, 40);
            if (patch.price !== undefined) {
              if (!Number.isFinite(patch.price) || patch.price < 0) return item;
              next.price = round2(patch.price);
            }
            if (!next.name) return item;
            saved = true;
            return next;
          }),
        }));
        return saved;
      },
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          cart: state.cart.filter((line) => line.itemId !== id),
        })),
      setQty: (itemId, qty) =>
        set((state) => {
          if (!state.items.some((item) => item.id === itemId)) return state;
          const nextQty = Math.max(0, Math.min(99, Math.round(qty)));
          if (nextQty === 0) {
            return { cart: state.cart.filter((line) => line.itemId !== itemId) };
          }
          const exists = state.cart.some((line) => line.itemId === itemId);
          return {
            cart: exists
              ? state.cart.map((line) => (line.itemId === itemId ? { ...line, qty: nextQty } : line))
              : [...state.cart, { itemId, qty: nextQty }],
          };
        }),
      bumpQty: (itemId, delta) => {
        const current = get().cart.find((line) => line.itemId === itemId)?.qty ?? 0;
        get().setQty(itemId, current + delta);
      },
      setDiscount: (amount) =>
        set({ discount: Number.isFinite(amount) ? round2(Math.max(0, amount)) : 0 }),
      setTaxPercent: (percent) =>
        set({
          taxPercent: Number.isFinite(percent) ? round2(Math.min(100, Math.max(0, percent))) : 0,
        }),
      setNote: (note) => set({ note: note.slice(0, 120) }),
      clearCart: () =>
        set((state) => ({
          cart: [],
          discount: 0,
          note: "",
          taxPercent: state.profile.defaultTax,
        })),
      createBill: () => {
        const state = get();
        const lines: BillLine[] = state.cart.flatMap((line) => {
          const item = state.items.find((entry) => entry.id === line.itemId);
          if (!item || line.qty <= 0) return [];
          return [
            {
              name: item.name,
              category: item.category,
              price: item.price,
              qty: line.qty,
            },
          ];
        });
        if (lines.length === 0) return null;
        const totals = computeTotals(lines, state.discount, state.taxPercent);
        const bill: SavedBill = {
          id: uid(),
          number: state.nextNumber,
          createdAt: new Date().toISOString(),
          restaurantName: state.profile.restaurantName.trim(),
          phone: state.profile.phone.trim(),
          address: state.profile.address.trim(),
          footer: state.profile.footer.trim(),
          lines,
          discount: totals.discount,
          taxPercent: totals.taxPercent,
          note: state.note.trim(),
          subtotal: totals.subtotal,
          tax: totals.tax,
          total: totals.total,
        };
        set({
          bills: [bill, ...state.bills].slice(0, 300),
          nextNumber: state.nextNumber + 1,
          cart: [],
          discount: 0,
          note: "",
          taxPercent: state.profile.defaultTax,
        });
        return bill.id;
      },
      removeBill: (id) => set((state) => ({ bills: state.bills.filter((bill) => bill.id !== id) })),
    }),
    {
      name: "hisab-pk-billing-v1",
      version: 1,
    },
  ),
);
