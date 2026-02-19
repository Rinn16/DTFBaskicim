"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GangSheetLayout, GangSheetItem } from "@/types/canvas";

export interface CartItemData {
  id: string;
  layout: GangSheetLayout;
  items: GangSheetItem[];
  totalMeters: number;
  createdAt: string;
}

interface CartState {
  guestItems: CartItemData[];
  memberItems: CartItemData[];
  isLoading: boolean;

  // Misafir islemleri (localStorage)
  addGuestItem: (layout: GangSheetLayout, items: GangSheetItem[], totalMeters: number) => void;
  removeGuestItem: (id: string) => void;
  clearGuestCart: () => void;

  // Uye islemleri (API)
  fetchMemberCart: () => Promise<void>;
  addMemberItem: (layout: GangSheetLayout, items: GangSheetItem[], totalMeters: number) => Promise<void>;
  removeMemberItem: (id: string) => Promise<void>;

  // Ortak
  getCartItems: (isAuthenticated: boolean) => CartItemData[];
  getCartCount: (isAuthenticated: boolean) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      guestItems: [],
      memberItems: [],
      isLoading: false,

      addGuestItem: (layout, items, totalMeters) => {
        const newItem: CartItemData = {
          id: crypto.randomUUID(),
          layout,
          items,
          totalMeters,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ guestItems: [...state.guestItems, newItem] }));
      },

      removeGuestItem: (id) => {
        set((state) => ({ guestItems: state.guestItems.filter((i) => i.id !== id) }));
      },

      clearGuestCart: () => set({ guestItems: [] }),

      fetchMemberCart: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/cart");
          if (res.ok) {
            const data = await res.json();
            set({ memberItems: data.items });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      addMemberItem: async (layout, items, totalMeters) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ layout, items, totalMeters }),
          });
          if (res.ok) {
            await get().fetchMemberCart();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      removeMemberItem: async (id) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`/api/cart/${id}`, { method: "DELETE" });
          if (res.ok) {
            set((state) => ({ memberItems: state.memberItems.filter((i) => i.id !== id) }));
          }
        } finally {
          set({ isLoading: false });
        }
      },

      getCartItems: (isAuthenticated) => {
        const state = get();
        return isAuthenticated ? state.memberItems : state.guestItems;
      },

      getCartCount: (isAuthenticated) => {
        const state = get();
        return isAuthenticated ? state.memberItems.length : state.guestItems.length;
      },
    }),
    {
      name: "dtf-guest-cart",
      partialize: (state) => ({ guestItems: state.guestItems }),
    }
  )
);
