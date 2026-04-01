import type { KanbanState } from "./types";

export interface StorageAdapter {
  load(): KanbanState | null;
  save(state: KanbanState): void;
}

const STORAGE_KEY = "kanban-state";

export const localStorageAdapter: StorageAdapter = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as KanbanState) : null;
    } catch {
      return null;
    }
  },
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // quota exceeded or unavailable
    }
  },
};
