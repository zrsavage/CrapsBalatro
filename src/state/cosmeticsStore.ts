import { create } from 'zustand';
import { DEFAULT_DICE_COLOR, DEFAULT_SKIN } from '../data/cosmetics';

const STORAGE_KEY = 'crapsbalatro-cosmetics-v1';

interface PersistedShape {
  unlocked: string[];
  skin: string;
  dice: string;
  discoveredRelics: string[];
}

function loadPersisted(): PersistedShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { unlocked: [], skin: DEFAULT_SKIN, dice: DEFAULT_DICE_COLOR, discoveredRelics: [] };
    const parsed = JSON.parse(raw);
    return {
      unlocked: Array.isArray(parsed.unlocked) ? parsed.unlocked : [],
      skin: typeof parsed.skin === 'string' ? parsed.skin : DEFAULT_SKIN,
      dice: typeof parsed.dice === 'string' ? parsed.dice : DEFAULT_DICE_COLOR,
      discoveredRelics: Array.isArray(parsed.discoveredRelics) ? parsed.discoveredRelics : [],
    };
  } catch {
    return { unlocked: [], skin: DEFAULT_SKIN, dice: DEFAULT_DICE_COLOR, discoveredRelics: [] };
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
  discoveredRelics: string[];
  unlockAchievements: (ids: string[]) => void;
  selectSkin: (id: string) => void;
  selectDice: (id: string) => void;
  discoverRelics: (defIds: string[]) => void;
}

/** Achievements unlock (and persist) the moment they're earned, but the
 * game store tracks which ones were newly unlocked THIS run separately so
 * the UI can wait until the run ends to reveal them (see runAchievements
 * in state/store.ts) rather than popping a toast mid-play. */
export const useCosmeticsStore = create<CosmeticsStore>((set, get) => {
  const initial = loadPersisted();
  return {
    unlockedAchievements: initial.unlocked,
    selectedSkin: initial.skin,
    selectedDice: initial.dice,
    discoveredRelics: initial.discoveredRelics,

    unlockAchievements: (ids) => {
      if (ids.length === 0) return;
      const { unlockedAchievements, selectedSkin, selectedDice, discoveredRelics } = get();
      const merged = Array.from(new Set([...unlockedAchievements, ...ids]));
      savePersisted({ unlocked: merged, skin: selectedSkin, dice: selectedDice, discoveredRelics });
      set({ unlockedAchievements: merged });
    },

    selectSkin: (id) => {
      const { unlockedAchievements, selectedDice, discoveredRelics } = get();
      savePersisted({ unlocked: unlockedAchievements, skin: id, dice: selectedDice, discoveredRelics });
      set({ selectedSkin: id });
    },

    selectDice: (id) => {
      const { unlockedAchievements, selectedSkin, discoveredRelics } = get();
      savePersisted({ unlocked: unlockedAchievements, skin: selectedSkin, dice: id, discoveredRelics });
      set({ selectedDice: id });
    },

    discoverRelics: (defIds) => {
      if (defIds.length === 0) return;
      const { unlockedAchievements, selectedSkin, selectedDice, discoveredRelics } = get();
      const merged = Array.from(new Set([...discoveredRelics, ...defIds]));
      if (merged.length === discoveredRelics.length) return;
      savePersisted({ unlocked: unlockedAchievements, skin: selectedSkin, dice: selectedDice, discoveredRelics: merged });
      set({ discoveredRelics: merged });
    },
  };
});
