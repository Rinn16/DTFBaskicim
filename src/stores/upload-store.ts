"use client";

import { create } from "zustand";

export interface UploadingFile {
  id: string;
  fileName: string;
  progress: number; // 0-100
}

interface UploadState {
  files: UploadingFile[];
  addFile: (file: UploadingFile) => void;
  updateProgress: (id: string, progress: number) => void;
  removeFile: (id: string) => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  files: [],
  addFile: (file) =>
    set((state) => ({ files: [...state.files, file] })),
  updateProgress: (id, progress) =>
    set((state) => ({
      files: state.files.map((f) => (f.id === id ? { ...f, progress } : f)),
    })),
  removeFile: (id) =>
    set((state) => ({ files: state.files.filter((f) => f.id !== id) })),
}));
