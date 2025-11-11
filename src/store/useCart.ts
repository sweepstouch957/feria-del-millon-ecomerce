import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type CartItem = {
  id: string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (artwork: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQty: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (artwork, qty = 1) => {
        const items = [...get().items];
        const i = items.findIndex((it) => it.id === artwork.id);
        if (i >= 0)
          items[i] = { ...items[i], quantity: items[i].quantity + qty };
        else items.push({ ...artwork, quantity: qty });
        set({ items });
      },
      updateQty: (id, quantity) => {
        if (quantity <= 0) return get().remove(id);
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },
      remove: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((a, i) => a + i.quantity, 0),
      subtotal: () =>
        get().items.reduce((a, i) => a + (i.price ?? 0) * i.quantity, 0),
    }),
    {
      name: "cart",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

export default useCart;
