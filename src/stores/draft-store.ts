"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DesignDraftData } from "@/types/canvas";

export interface DraftSummary {
  id: string;
  name: string;
  imageCount: number;
  placementCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DraftItem {
  id: string;
  name: string;
  data: DesignDraftData;
  createdAt: string;
  updatedAt: string;
}

interface DraftState {
  guestDrafts: DraftItem[];
  memberDraftList: DraftSummary[];
  isLoading: boolean;
  _hasHydrated: boolean;

  // Guest
  saveGuestDraft: (draft: DraftItem) => void;
  updateGuestDraft: (id: string, draft: Partial<DraftItem>) => void;
  deleteGuestDraft: (id: string) => void;
  getGuestDraft: (id: string) => DraftItem | undefined;

  // Member
  fetchMemberDrafts: () => Promise<void>;
  saveMemberDraft: (name: string, data: DesignDraftData) => Promise<string>;
  updateMemberDraft: (id: string, name: string, data: DesignDraftData) => Promise<void>;
  deleteMemberDraft: (id: string) => Promise<void>;
  loadMemberDraft: (id: string) => Promise<DraftItem | null>;

  // Common
  getDraftList: (isAuthenticated: boolean) => DraftSummary[];
}

function guestDraftToSummary(d: DraftItem): DraftSummary {
  return {
    id: d.id,
    name: d.name,
    imageCount: d.data.uploadedImages.length,
    placementCount: d.data.placements.length,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      guestDrafts: [],
      memberDraftList: [],
      isLoading: false,
      _hasHydrated: false,

      // Guest operations
      saveGuestDraft: (draft) => {
        set((state) => ({
          guestDrafts: [...state.guestDrafts, draft],
        }));
      },

      updateGuestDraft: (id, updates) => {
        set((state) => ({
          guestDrafts: state.guestDrafts.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        }));
      },

      deleteGuestDraft: (id) => {
        set((state) => ({
          guestDrafts: state.guestDrafts.filter((d) => d.id !== id),
        }));
      },

      getGuestDraft: (id) => {
        return get().guestDrafts.find((d) => d.id === id);
      },

      // Member operations
      fetchMemberDrafts: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/designs/drafts");
          if (res.ok) {
            const data = await res.json();
            const drafts: DraftSummary[] = data.drafts.map((d: Record<string, unknown>) => ({
              id: d.id as string,
              name: d.name as string,
              imageCount: (d.imageCount as number) || 0,
              placementCount: (d.placementCount as number) || 0,
              createdAt: d.createdAt as string,
              updatedAt: d.updatedAt as string,
            }));
            set({ memberDraftList: drafts });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      saveMemberDraft: async (name, data) => {
        set({ isLoading: true });
        try {
          const res = await fetch("/api/designs/drafts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, data }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Taslak kaydedilemedi");
          }
          const result = await res.json();
          await get().fetchMemberDrafts();
          return result.draft.id as string;
        } finally {
          set({ isLoading: false });
        }
      },

      updateMemberDraft: async (id, name, data) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`/api/designs/drafts/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, data }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Taslak güncellenemedi");
          }
          await get().fetchMemberDrafts();
        } finally {
          set({ isLoading: false });
        }
      },

      deleteMemberDraft: async (id) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`/api/designs/drafts/${id}`, { method: "DELETE" });
          if (res.ok) {
            set((state) => ({
              memberDraftList: state.memberDraftList.filter((d) => d.id !== id),
            }));
          }
        } finally {
          set({ isLoading: false });
        }
      },

      loadMemberDraft: async (id) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`/api/designs/drafts/${id}`);
          if (!res.ok) return null;
          const result = await res.json();
          const d = result.draft;
          return {
            id: d.id,
            name: d.name,
            data: d.data as DesignDraftData,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          };
        } finally {
          set({ isLoading: false });
        }
      },

      getDraftList: (isAuthenticated) => {
        const state = get();
        if (isAuthenticated) return state.memberDraftList;
        return state.guestDrafts.map(guestDraftToSummary);
      },
    }),
    {
      name: "dtf-design-drafts",
      partialize: (state) => ({ guestDrafts: state.guestDrafts }),
      onRehydrateStorage: () => () => {
        useDraftStore.setState({ _hasHydrated: true });
      },
    }
  )
);
