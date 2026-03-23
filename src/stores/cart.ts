import { defineStore } from "pinia";

/** Cart item kept lightweight and serializable */
export interface CartItem {
  id: number;
  title: string;
  price: number;
  image: string;
  qty: number;
}

/** Coupon model */
export type CouponType = "percent" | "flat";
export interface Coupon {
  code: string;
  type: CouponType;          // "percent" | "flat"
  value: number;             // percent=0..100, flat in INR
  minSubtotal?: number;      // min subtotal to be eligible
  maxDiscount?: number;      // cap the discount amount
  expiresAt?: string;        // ISO date
  label?: string;            // UX label
}

/** Versioned LocalStorage */
const STORAGE_KEY = "cart:v2"; // bump when schema changes
const DEFAULT_TAX_RATE = 0.18; // 18% GST, change per your need

// You can also fetch these from backend
const COUPONS: Coupon[] = [
  { code: "WELCOME10", type: "percent", value: 10, minSubtotal: 500, maxDiscount: 300, label: "10% off (max ₹300)" },
  { code: "FLAT100",   type: "flat",    value: 100, minSubtotal: 399, label: "Flat ₹100 off" },
  { code: "BIG20",     type: "percent", value: 20, minSubtotal: 1999, maxDiscount: 600, label: "20% off (max ₹600)" },
];

function isExpired(c?: string) {
  if (!c) return false;
  const ts = Date.parse(c);
  return Number.isFinite(ts) ? Date.now() > ts : false;
}

export const useCartStore = defineStore("cart", {
  state: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // basic migration/guards
        const items: CartItem[] = Array.isArray(parsed.items)
          ? parsed.items.map((i: any) => ({
              id: Number(i.id),
              title: String(i.title ?? ""),
              price: Number(i.price) || 0,
              image: String(i.image ?? ""),
              qty: Math.max(1, Number(i.qty) || 1),
            }))
          : [];
        const coupon: Coupon | null = parsed.coupon ?? null;
        const taxRate = Number.isFinite(parsed.taxRate) ? parsed.taxRate : DEFAULT_TAX_RATE;
        return { items, coupon, taxRate };
      } catch {
        /* ignore; fall through to defaults */
      }
    }
    return {
      items: [] as CartItem[],
      coupon: null as Coupon | null,
      taxRate: DEFAULT_TAX_RATE,
    };
  },

  getters: {
    count: (s) => s.items.reduce((n, it) => n + (Number.isFinite(it.qty) ? it.qty : 0), 0),

    subtotal: (s) =>
      s.items.reduce((sum, it) => {
        const qty = Number.isFinite(it.qty) ? it.qty : 0;
        const price = Number.isFinite(it.price) ? it.price : 0;
        return sum + qty * price;
      }, 0),

    /** Calculate discount from applied coupon */
    discount(): number {
      const sub = this.subtotal;
      const c = this.coupon;
      if (!c) return 0;
      if (c.minSubtotal && sub < c.minSubtotal) return 0;
      if (c.expiresAt && isExpired(c.expiresAt)) return 0;

      let d = 0;
      if (c.type === "percent") d = (sub * c.value) / 100;
      else if (c.type === "flat") d = c.value;

      if (c.maxDiscount && d > c.maxDiscount) d = c.maxDiscount;
      d = Math.max(0, Math.min(sub, d)); // clamp 0..subtotal
      return d;
    },

    /** Tax is applied on (subtotal - discount) */
    taxable(): number {
      const t = this.subtotal - this.discount;
      return Math.max(0, t);
    },

    tax(): number {
      return Math.max(0, this.taxable * this.taxRate);
    },

    total(): number {
      // Without shipping on cart (add shipping here if needed)
      return Math.max(0, this.taxable + this.tax);
    },

    byId: (s) => (id: number) => s.items.find((i) => i.id === id),

    /** For showing coupon catalog (optional) */
    availableCoupons: () => COUPONS,
  },

  actions: {
    persist() {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items: this.items,
          coupon: this.coupon,
          taxRate: this.taxRate,
        })
      );
    },

    add(item: Omit<CartItem, "qty">, qty: number = 1) {
      const safeQty = Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1;
      const existing = this.items.find((i) => i.id === item.id);
      if (existing) {
        const next = (Number.isFinite(existing.qty) ? existing.qty : 0) + safeQty;
        existing.qty = Math.max(1, Math.floor(next));
      } else {
        this.items.push({ ...item, qty: safeQty });
      }
      this.persist();
    },

    updateQty(id: number, qty: number) {
      const n = Number(qty);
      const safe = Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
      const it = this.items.find((i) => i.id === id);
      if (it) {
        it.qty = safe;
        this.persist();
      }
    },

    remove(id: number) {
      this.items = this.items.filter((i) => i.id !== id);
      this.persist();
    },

    clear() {
      this.items = [];
      this.coupon = null;
      this.persist();
    },

    setTaxRate(rate: number) {
      const r = Number(rate);
      this.taxRate = r >= 0 ? r : this.taxRate;
      this.persist();
    },

    /** Try apply coupon by code (case‑insensitive) */
    applyCoupon(code: string): { ok: boolean; message?: string } {
      const normalized = code.trim().toUpperCase();
      const c = COUPONS.find((x) => x.code.toUpperCase() === normalized);
      if (!c) return { ok: false, message: "Invalid coupon" };

      if (c.expiresAt && isExpired(c.expiresAt)) {
        return { ok: false, message: "Coupon expired" };
      }
      if (c.minSubtotal && this.subtotal < c.minSubtotal) {
        return {
          ok: false,
          message: `Requires minimum subtotal ₹${c.minSubtotal}`,
        };
      }
      // looks good
      this.coupon = c;
      this.persist();
      return { ok: true };
    },

    removeCoupon() {
      this.coupon = null;
      this.persist();
    },
  },
});