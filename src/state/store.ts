import { create } from 'zustand';
import type { BetKind, RunState, ShopOffer, ShopState } from '../game/types';
import { createInitialRun } from '../game/run';
import { mulberry32, makeSeed } from '../game/rng';
import { buyOffer, placeBet, removeBet, removeBetsOfKind, rollOnce, setLoadout, startNextRound } from '../game/engine';
import { generateShop } from '../game/shop';

interface GameStore {
  run: RunState;
  rng: () => number;
  shop: ShopState | null;
  lastRollFlash: number; // increments each roll, lets UI trigger dice animations
  placeBet: (kind: BetKind, amount: number) => void;
  removeBet: (betId: string) => void;
  removeBetsOfKind: (kind: BetKind) => void;
  roll: () => void;
  enterShopIfNeeded: () => void;
  buy: (offer: ShopOffer) => void;
  rerollShop: () => void;
  setLoadout: (ids: [string, string]) => void;
  continueToNextRound: () => void;
  restartRun: () => void;
}

function freshRun(): { run: RunState; rng: () => number } {
  const seed = makeSeed();
  const rng = mulberry32(seed);
  return { run: createInitialRun(seed, rng), rng };
}

export const useGameStore = create<GameStore>((set, get) => {
  const initial = freshRun();
  return {
    run: initial.run,
    rng: initial.rng,
    shop: null,
    lastRollFlash: 0,

    placeBet: (kind, amount) => set((s) => ({ run: placeBet(s.run, kind, amount) })),

    removeBet: (betId) => set((s) => ({ run: removeBet(s.run, betId) })),

    removeBetsOfKind: (kind) => set((s) => ({ run: removeBetsOfKind(s.run, kind) })),

    roll: () => {
      const { run, rng } = get();
      if (run.phase !== 'run' || run.rollsRemaining <= 0) return;
      const { run: next } = rollOnce(run, rng);
      const shop = next.phase === 'shop' ? generateShop(next, rng) : null;
      set((s) => ({ run: next, shop, lastRollFlash: s.lastRollFlash + 1 }));
    },

    enterShopIfNeeded: () => {
      const { run, rng, shop } = get();
      if (run.phase === 'shop' && !shop) {
        set({ shop: generateShop(run, rng) });
      }
    },

    buy: (offer) => {
      const { run } = get();
      const next = buyOffer(run, offer);
      if (next === run) return;
      set((s) => ({
        run: next,
        shop: s.shop ? { ...s.shop, offers: s.shop.offers.filter((o) => o.id !== offer.id) } : null,
      }));
    },

    rerollShop: () => {
      const { run, rng, shop } = get();
      if (!shop || run.bankroll < shop.rerollCost) return;
      const next = { ...run, bankroll: run.bankroll - shop.rerollCost };
      set({ run: next, shop: generateShop(next, rng) });
    },

    setLoadout: (ids) => set((s) => ({ run: setLoadout(s.run, ids) })),

    continueToNextRound: () => {
      const { run, rng } = get();
      set({ run: startNextRound(run, rng), shop: null });
    },

    restartRun: () => {
      const fresh = freshRun();
      set({ run: fresh.run, rng: fresh.rng, shop: null, lastRollFlash: 0 });
    },
  };
});
