"use client";

import { create } from "zustand";
import type { Placement } from "@/types/canvas";

const MAX_HISTORY = 50;

interface HistoryState {
  past: Placement[][];
  future: Placement[][];
  _isRestoring: boolean;

  pushState: (placements: Placement[]) => void;
  undo: () => Placement[] | null;
  redo: () => Placement[] | null;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],
  _isRestoring: false,

  pushState: (placements) => {
    if (get()._isRestoring) return;
    // Skip history for large sets — cloning 200+ placements per action is expensive
    if (placements.length > 200) return;
    set((state) => {
      const snapshot = placements.map((p) => ({ ...p }));
      const newPast = [...state.past, snapshot];
      if (newPast.length > MAX_HISTORY) {
        newPast.shift();
      }
      return { past: newPast, future: [] };
    });
  },

  undo: () => {
    const { past } = get();
    if (past.length === 0) return null;

    const newPast = [...past];
    const entry = newPast.pop()!;

    set({ past: newPast, _isRestoring: true });
    return entry;
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;

    const newFuture = [...future];
    const entry = newFuture.pop()!;

    set({ future: newFuture, _isRestoring: true });
    return entry;
  },

  clear: () => set({ past: [], future: [] }),
}));
