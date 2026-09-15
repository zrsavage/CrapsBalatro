import { create } from 'zustand';
import { DEFAULT_DICE_COLOR, DEFAULT_SKIN } from '../data/cosmetics';

const STORAGE_KEY = 'crapsbalatro-cosmetics-v1';

interface PersistedShape {
  unlocked: string[];
  skin: string;
  dice: string;
}

function loadPersisted(): PersistedShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlocked: [], skin: DEFAULT_SKIN, dice: DEFAULT_DICE_COLOR };
    const parsed = JSON.parse(raw);
    return {
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : [],
      skin: typeof parsed.skin === 'string' ? parsed.skin : DEFAULT_SKIN,
      dice: typeof parsed.dice === 'string' ? parsed.dice : DEFAULT_DICE_COLOR,
    };
  } catch {
    return { unlocked: [], skin: DEFAULT_SKIN, dice: DEFAULT_DICE_COLOR };
  }
}

function savePersisted(state: PersistedShape): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // per-viewer convenience only; fine to silently drop if storage is unavailable
  }
}

interface CosmeticsStore {
  unlockedAchievements: string[];
  selectedSkin: string;
  selectedDice: string;
  lastUnlocked: string[]; // most recent unlock batch, for a toast/announcement
  unlockAchievements: (ids: string[]) => void;
  selectSkin: (id: string) => void;
  selectDice: (id: string) => void;
  dismissUnlockToast: () => void;
}

export const useCosmeticsStore = create<CosmeticsStore>((set, get) => {
  const initial = loadPersisted();
  return {
    unlockedAchievements: initial.unlocked,
    selectedSkin: initial.skin,
    selectedDice: initial.dice,
    lastUnlocked: [],

    unlockAchievements: (ids) => {
      if (ids.length === 0) return;
      const { unlockedAchievements, selectedSkin, selectedDice } = get();
      const merged = Array.from(new Set([...unlockedAchievements, ...ids]));
      savePersisted({ unlocked: merged, skin: selectedSkin, dice: selectedDice });
      set({ unlockedAchievements: merged, lastUnlocked: ids });
    },

    selectSkin: (id) => {
      const { unlockedAchievements, selectedDice } = get();
      savePersisted({ unlocked: unlockedAchievements, skin: id, dice: selectedDice });
      set({ selectedSkin: id });
    },

    selectDice: (id) => {
      const { unlockedAchievements, selectedSkin } = get();
      savePersisted({ unlocked: unlockedAchievements, skin: selectedSkin, dice: id });
      set({ selectedDice: id });
    },

    dismissUnlockToast: () => set({ lastUnlocked: [] }),
  };
});
