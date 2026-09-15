import { create } from 'zustand';
import type { BetKind, RollResult, RunState, ShopOffer, ShopState } from '../game/types';
import { createInitialRun } from '../game/run';
import { mulberry32, makeSeed } from '../game/rng';
import { buyOffer, placeBet, removeBet, removeBetsOfKind, rollOnce, setLoadout, startNextRound } from '../game/engine';
import { generateShop } from '../game/shop';
import { playDiceRoll, playLose, playNeutral, playWin, primeAudio } from '../game/sound';

const ROLL_ANIMATION_MS = 950;

interface GameStore {
  run: RunState;
  rng: () => number;
  shop: ShopState | null;
  isRolling: boolean;
  pendingRoll: RollResult | null; // the roll dice are animating toward
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
    isRolling: false,
    pendingRoll: null,

    placeBet: (kind, amount) => set((s) => ({ run: placeBet(s.run, kind, amount) })),

    removeBet: (betId) => set((s) => ({ run: removeBet(s.run, betId) })),

    removeBetsOfKind: (kind) => set((s) => ({ run: removeBetsOfKind(s.run, kind) })),

    roll: () => {
      const { run, rng, isRolling } = get();
      if (isRolling || run.phase !== 'run' || run.rollsRemaining <= 0) return;

      primeAudio();
      playDiceRoll();

      const { run: next, outcome } = rollOnce(run, rng);
      set({ isRolling: true, pendingRoll: outcome.roll });

      setTimeout(() => {
        if (outcome.netChange > 0) playWin();
        else if (outcome.netChange < 0) playLose();
        else playNeutral();

        const shop = next.phase === 'shop' ? generateShop(next, get().rng) : null;
        set({ run: next, shop, isRolling: false, pendingRoll: null });
      }, ROLL_ANIMATION_MS);
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
      set({ run: fresh.run, rng: fresh.rng, shop: null, isRolling: false, pendingRoll: null });
    },
  };
});
