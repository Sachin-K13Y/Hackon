import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product } from '../types';

// ── User Profile ──────────────────────────────────────────────────────────────
export type Profession = 'student' | 'software_engineer' | 'homemaker' | 'business_owner' | 'doctor' | 'teacher';
export type DietaryPref = 'vegetarian' | 'non-vegetarian' | 'vegan';
export type BudgetLevel = 'low' | 'medium' | 'high';

export interface UserProfile {
  profession: Profession;
  family_size: number;
  adults: number;
  children: number;
  dietary_pref: DietaryPref;
  budget_level: BudgetLevel;
  location_type: 'apartment' | 'house' | 'pg';
}

// ── Order History ─────────────────────────────────────────────────────────────
export interface HistoryEntry {
  product_id: string;
  product_name: string;
  category: string;
  days_ago: number;
  quantity: number;
  ordered_at: number; // timestamp in ms
}

const DEFAULT_PROFILE: UserProfile = {
  profession: 'software_engineer',
  family_size: 2,
  adults: 2,
  children: 0,
  dietary_pref: 'vegetarian',
  budget_level: 'medium',
  location_type: 'apartment',
};

// ── Profile-based static history templates (15-day simulation) ───────────────
// These are product names that map to real DB entries (used in seedProfileHistory)
export const PROFILE_HISTORY_TEMPLATES: Record<Profession, Array<{ name: string; category: string; days_ago: number; qty: number }>> = {
  software_engineer: [
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 1, qty: 2 },
    { name: 'Tata Tea Premium', category: 'beverages', days_ago: 1, qty: 1 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 3, qty: 2 },
    { name: 'Maggi Masala Noodles', category: 'snacks', days_ago: 4, qty: 3 },
    { name: 'Farm Eggs (Brown)', category: 'dairy', days_ago: 5, qty: 1 },
    { name: 'Tata Tea Premium', category: 'beverages', days_ago: 5, qty: 1 },
    { name: 'Onions (Red)', category: 'vegetables', days_ago: 6, qty: 1 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 7, qty: 2 },
    { name: 'Fortune Sunflower Oil', category: 'staples', days_ago: 8, qty: 1 },
    { name: 'Aashirvaad Whole Wheat Atta', category: 'staples', days_ago: 10, qty: 1 },
    { name: 'Lay\'s Magic Masala', category: 'snacks', days_ago: 11, qty: 2 },
    { name: 'Tata Salt (Iodised)', category: 'staples', days_ago: 14, qty: 1 },
  ],
  homemaker: [
    { name: 'Onions (Red)', category: 'vegetables', days_ago: 1, qty: 2 },
    { name: 'Fresh Tomatoes', category: 'vegetables', days_ago: 1, qty: 1 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 2, qty: 2 },
    { name: 'Organic Spinach', category: 'vegetables', days_ago: 3, qty: 1 },
    { name: 'Toor Dal (Arhar)', category: 'staples', days_ago: 4, qty: 1 },
    { name: 'Aashirvaad Whole Wheat Atta', category: 'staples', days_ago: 5, qty: 2 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 5, qty: 2 },
    { name: 'Garlic (Peeled)', category: 'vegetables', days_ago: 6, qty: 1 },
    { name: 'Ginger (Fresh)', category: 'vegetables', days_ago: 7, qty: 1 },
    { name: 'Tata Salt (Iodised)', category: 'staples', days_ago: 8, qty: 1 },
    { name: 'Govardhan Ghee', category: 'dairy', days_ago: 10, qty: 1 },
    { name: 'Cumin Seeds (Jeera)', category: 'staples', days_ago: 12, qty: 1 },
  ],
  student: [
    { name: 'Maggi Masala Noodles', category: 'snacks', days_ago: 1, qty: 3 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 2, qty: 1 },
    { name: 'Lay\'s Magic Masala', category: 'snacks', days_ago: 3, qty: 2 },
    { name: 'Nescafé Classic Instant Coffee', category: 'beverages', days_ago: 3, qty: 1 },
    { name: 'Parle-G Glucose Biscuits', category: 'snacks', days_ago: 5, qty: 2 },
    { name: 'Maggi Masala Noodles', category: 'snacks', days_ago: 6, qty: 2 },
    { name: 'Tata Tea Premium', category: 'beverages', days_ago: 7, qty: 1 },
    { name: 'Farm Eggs (Brown)', category: 'dairy', days_ago: 9, qty: 1 },
    { name: 'Kurkure Masala Munch', category: 'snacks', days_ago: 10, qty: 2 },
    { name: 'Sugar (S30 Crystalline)', category: 'staples', days_ago: 12, qty: 1 },
  ],
  business_owner: [
    { name: 'Nescafé Classic Instant Coffee', category: 'beverages', days_ago: 1, qty: 2 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 1, qty: 2 },
    { name: 'Farm Eggs (Brown)', category: 'dairy', days_ago: 3, qty: 2 },
    { name: 'Amul Butter (Salted)', category: 'dairy', days_ago: 4, qty: 1 },
    { name: 'Britannia Cheese Slices', category: 'dairy', days_ago: 5, qty: 1 },
    { name: 'Nescafé Classic Instant Coffee', category: 'beverages', days_ago: 6, qty: 1 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 7, qty: 2 },
    { name: 'Fortune Sunflower Oil', category: 'staples', days_ago: 9, qty: 1 },
    { name: 'Onions (Red)', category: 'vegetables', days_ago: 11, qty: 1 },
    { name: 'Tata Salt (Iodised)', category: 'staples', days_ago: 14, qty: 1 },
  ],
  doctor: [
    { name: 'Organic Spinach', category: 'vegetables', days_ago: 1, qty: 2 },
    { name: 'Farm Eggs (Brown)', category: 'dairy', days_ago: 2, qty: 1 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 2, qty: 1 },
    { name: 'Carrot (Orange)', category: 'vegetables', days_ago: 3, qty: 1 },
    { name: 'Red Apples (Shimla)', category: 'fruits', days_ago: 4, qty: 1 },
    { name: 'Bananas (Robusta)', category: 'fruits', days_ago: 5, qty: 1 },
    { name: 'Idhayam Sesame (Gingelly) Oil', category: 'staples', days_ago: 7, qty: 1 },
    { name: 'Toor Dal (Arhar)', category: 'staples', days_ago: 8, qty: 1 },
    { name: 'Organic Spinach', category: 'vegetables', days_ago: 8, qty: 1 },
    { name: 'Tata Salt (Iodised)', category: 'staples', days_ago: 10, qty: 1 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 11, qty: 1 },
    { name: 'Green Peas (Fresh)', category: 'vegetables', days_ago: 14, qty: 1 },
  ],
  teacher: [
    { name: 'Aashirvaad Whole Wheat Atta', category: 'staples', days_ago: 2, qty: 1 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 2, qty: 2 },
    { name: 'Tata Tea Premium', category: 'beverages', days_ago: 3, qty: 1 },
    { name: 'Onions (Red)', category: 'vegetables', days_ago: 4, qty: 1 },
    { name: 'Fresh Tomatoes', category: 'vegetables', days_ago: 5, qty: 1 },
    { name: 'Toor Dal (Arhar)', category: 'staples', days_ago: 6, qty: 1 },
    { name: 'Amul Full Cream Milk', category: 'dairy', days_ago: 7, qty: 2 },
    { name: 'Parle-G Glucose Biscuits', category: 'snacks', days_ago: 8, qty: 1 },
    { name: 'Tata Salt (Iodised)', category: 'staples', days_ago: 10, qty: 1 },
    { name: 'Cumin Seeds (Jeera)', category: 'staples', days_ago: 12, qty: 1 },
  ],
};


// ── Store ─────────────────────────────────────────────────────────────────────
interface CartStore {
  items: CartItem[];
  profile: UserProfile;
  orderHistory: HistoryEntry[];

  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
  mrpTotal: () => number;
  savings: () => number;

  updateProfile: (patch: Partial<UserProfile>) => void;
  seedProfileHistory: (profession: Profession) => void;

  // Called on checkout — records cart items to history
  commitCartToHistory: () => void;
  // Seed with demo history for hackathon demo
  seedDemoHistory: (products: Product[]) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      profile: DEFAULT_PROFILE,
      orderHistory: [],

      addToCart: (product) => {
        set((state) => {
          const existing = state.items.find((i) => i.product._id === product._id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.product._id !== productId) }));
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.product._id === productId ? { ...i, quantity: qty } : i)),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: () => get().items.reduce((acc, i) => acc + i.product.price * i.quantity, 0),
      mrpTotal: () => get().items.reduce((acc, i) => acc + i.product.mrp * i.quantity, 0),
      savings: () => get().mrpTotal() - get().subtotal(),

      updateProfile: (patch) => {
        const current = get().profile;
        const next = { ...current, ...patch };
        set({ profile: next });
        // Auto-seed history whenever profession changes
        if (patch.profession && patch.profession !== current.profession) {
          get().seedProfileHistory(patch.profession);
        }
      },

      seedProfileHistory: (profession) => {
        const now = Date.now();
        const dayMs = 1000 * 60 * 60 * 24;
        const template = PROFILE_HISTORY_TEMPLATES[profession] ?? PROFILE_HISTORY_TEMPLATES.software_engineer;
        const entries: HistoryEntry[] = template.map((t) => ({
          product_id: `static_${t.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          product_name: t.name,
          category: t.category,
          days_ago: t.days_ago,
          quantity: t.qty,
          ordered_at: now - t.days_ago * dayMs,
        }));
        set({ orderHistory: entries });
      },

      commitCartToHistory: () => {
        const now = Date.now();
        const newEntries: HistoryEntry[] = get().items.map((item) => ({
          product_id: item.product._id,
          product_name: item.product.name,
          category: item.product.category,
          days_ago: 0,
          quantity: item.quantity,
          ordered_at: now,
        }));

        set((state) => {
          // Merge new entries; update days_ago for existing ones
          const updated = state.orderHistory.map((h) => ({
            ...h,
            days_ago: Math.floor((now - h.ordered_at) / (1000 * 60 * 60 * 24)),
          }));
          // Keep only last 15 days
          const filtered = updated.filter((h) => h.days_ago <= 15);
          return { orderHistory: [...newEntries, ...filtered].slice(0, 50) };
        });
      },

      seedDemoHistory: (products) => {
        const now = Date.now();
        const dayMs = 1000 * 60 * 60 * 24;
        const entries: HistoryEntry[] = products.slice(0, 12).map((p, i) => ({
          product_id: p._id,
          product_name: p.name,
          category: p.category,
          days_ago: [1, 1, 3, 3, 5, 6, 7, 8, 10, 11, 12, 14][i] ?? i + 1,
          quantity: [2, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1][i] ?? 1,
          ordered_at: now - ([1, 1, 3, 3, 5, 6, 7, 8, 10, 11, 12, 14][i] ?? i + 1) * dayMs,
        }));
        set({ orderHistory: entries });
      },
    }),
    { name: 'amazon-now-cart' }
  )
);
