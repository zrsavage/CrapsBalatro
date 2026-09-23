import { create } from 'zustand';

const STORAGE_KEY = 'crapsbalatro-stats-v1';
const MAX_RECORDS = 50;

export interface RunRecord {
  won: boolean;
  anteReached: number;
  roundReached: number;
  finalBankroll: number;
  seed: number;
  endedAt: number;
}

function loadPersisted(): RunRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePersisted(records: RunRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // per-viewer convenience only; fine to silently drop if storage is unavailable
  }
}

interface StatsStore {
  records: RunRecord[];
  recordRun: (record: RunRecord) => void;
}

export const useStatsStore = create<StatsStore>((set, get) => ({
  records: loadPersisted(),

  recordRun: (record) => {
    const next = [record, ...get().records].slice(0, MAX_RECORDS);
    savePersisted(next);
    set({ records: next });
  },
}));
