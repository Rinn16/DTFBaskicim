/**
 * IndexedDB-backed storage for zustand persist middleware.
 *
 * Advantages over localStorage:
 * - ~50 MB+ quota (vs ~5 MB for localStorage)
 * - Stores structured clones — no JSON.stringify/parse overhead
 * - Auto-migrates existing localStorage data on first load
 */
import type { PersistStorage, StorageValue } from "zustand/middleware";

const DB_NAME = "dtf-persist";
const STORE_NAME = "kv";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Migrate from localStorage to IndexedDB (one-time). */
async function migrateFromLocalStorage<S>(name: string): Promise<StorageValue<S> | null> {
  try {
    const raw = localStorage.getItem(name);
    if (!raw) return null;
    const value = JSON.parse(raw) as StorageValue<S>;
    await idbSet(name, value);
    localStorage.removeItem(name);
    return value;
  } catch {
    return null;
  }
}

/**
 * Direct IDB storage — writes immediately.
 * Good for stores that change infrequently (e.g. cart).
 */
export function createIDBStorage<S>(): PersistStorage<S> {
  return {
    getItem: async (name: string) => {
      try {
        const val = await idbGet<StorageValue<S>>(name);
        if (val) return val;
        return migrateFromLocalStorage<S>(name);
      } catch {
        return null;
      }
    },
    setItem: async (name: string, value: StorageValue<S>) => {
      try {
        await idbSet(name, value);
      } catch {
        // IDB write failed — non-critical, don't crash
      }
    },
    removeItem: async (name: string) => {
      try {
        await idbDelete(name);
      } catch {
        // non-critical
      }
    },
  };
}

/**
 * IDB storage with idle-callback debounce.
 * Coalesces rapid set() calls and defers writes to idle time.
 * Good for stores that change frequently (e.g. canvas state).
 */
export function createIdleIDBStorage<S>(): PersistStorage<S> {
  let pendingHandle: number | null = null;
  let pending: { key: string; value: StorageValue<S> } | null = null;

  const schedule =
    typeof requestIdleCallback !== "undefined"
      ? (fn: () => void) => requestIdleCallback(fn, { timeout: 200 })
      : (fn: () => void) => window.setTimeout(fn, 0);

  const cancel =
    typeof cancelIdleCallback !== "undefined"
      ? (id: number) => cancelIdleCallback(id)
      : (id: number) => clearTimeout(id);

  return {
    getItem: async (name: string) => {
      try {
        const val = await idbGet<StorageValue<S>>(name);
        if (val) return val;
        return migrateFromLocalStorage<S>(name);
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: StorageValue<S>) => {
      pending = { key: name, value };
      if (pendingHandle !== null) cancel(pendingHandle);
      pendingHandle = schedule(() => {
        if (pending) {
          idbSet(pending.key, pending.value).catch(() => {});
        }
        pending = null;
        pendingHandle = null;
      }) as number;
    },
    removeItem: async (name: string) => {
      if (pendingHandle !== null) cancel(pendingHandle);
      pending = null;
      try {
        await idbDelete(name);
      } catch {
        // non-critical
      }
    },
  };
}
