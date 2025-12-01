export type DirectoryEntryType = "folder" | "file";

export interface DirectoryEntry {
  id: string;
  name: string;
  type: DirectoryEntryType;
  path: string;
  size?: number;
  modified?: string;
}

const STORAGE_KEY = "corelogic_directory_entries_v1";
let cache: DirectoryEntry[] = [];
const listeners = new Set<(entries: DirectoryEntry[]) => void>();

const loadFromStorage = (): DirectoryEntry[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn("[DirectoryStore] Failed to load cached entries", error);
    return [];
  }
};

const persistEntries = (entries: DirectoryEntry[]) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn("[DirectoryStore] Failed to persist entries", error);
  }
};

if (typeof window !== "undefined") {
  cache = loadFromStorage();
}

export const getDirectoryEntries = (): DirectoryEntry[] => {
  if (!cache.length && typeof window !== "undefined") {
    cache = loadFromStorage();
  }
  return cache;
};

export const updateDirectoryEntries = (entries: DirectoryEntry[]): void => {
  cache = entries;
  persistEntries(entries);
  listeners.forEach((listener) => listener(entries));
};

export const subscribeDirectoryEntries = (
  listener: (entries: DirectoryEntry[]) => void
): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const createId = (path?: string) => {
  if (path) return path;
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `dir-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const addDirectoryEntry = (entry: Omit<DirectoryEntry, "id">): DirectoryEntry => {
  const nextEntry: DirectoryEntry = { ...entry, id: createId(entry.path) };
  const next = [...cache.filter((item) => item.id !== nextEntry.id), nextEntry];
  updateDirectoryEntries(next);
  return nextEntry;
};

export const clearDirectoryEntries = (): void => {
  cache = [];
  persistEntries(cache);
  listeners.forEach((listener) => listener(cache));
};
