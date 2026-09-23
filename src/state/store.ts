import { create } from 'zustand';
import type { BetKind, RollOutcome, RollResult, RoundChoice, RunState, ShopOffer, ShopState } from '../game/types';
import { createInitialRun, createPracticeRun, PRACTICE_BANKROLL, PRACTICE_ROLLS } from '../game/run';
import { mulberry32, makeSeed } from '../game/rng';
import {
  beginRoundSelect,
  buyOffer,
  confirmRoundChoice,
  endRoundEarly,
  placeBet,
  removeBet,
  removeBetsOfKind,
  rollOnce,
  setLoadout,
} from '../game/engine';
import { generateShop } from '../game/shop';
import { playDiceRoll, playLose, playNeutral, playWin, primeAudio } from '../game/sound';
import { ACHIEVEMENTS, checkAchievements } from '../data/achievements';
import { useCosmeticsStore } from './cosmeticsStore';
import { useStatsStore } from './statsStore';

/** Records a completed run (win or bust) into the persisted stats history,
 * the moment its phase transitions away from 'run' into a terminal state. */
function trackRunEnd(prevRun: RunState, nextRun: RunState): void {
  if (prevRun.phase !== 'run') return;
  if (nextRun.phase !== 'gameOver' && nextRun.phase !== 'victory') return;
  if (!nextRun.lastRunSummary) return;
  useStatsStore.getState().recordRun({ ...nextRun.lastRunSummary, seed: nextRun.seed, endedAt: Date.now() });
}

/** DieDef ids unlocked via achievement, derived from the cosmetics store's
 * persisted unlock list — used to open up the legendary dice in the shop
 * pool once their achievement is earned. */
function unlockedDieDefIds(): Set<string> {
  const unlocked = useCosmeticsStore.getState().unlockedAchievements;
  const ids = unlocked
    .map((id) => ACHIEVEMENTS.find((a) => a.id === id))
    .filter((a) => a?.unlockKind === 'dieDef')
    .map((a) => a!.unlockId!);
  return new Set(ids);
}

export const ROLL_ANIMATION_MS = 950;
const HIGH_STAKES_FRACTION = 0.5;

/** Doubles the roll animation's length when the player has more than half
 * their total money (bankroll + whatever's currently wagered) riding on
 * this one roll — a longer, more tense build-up for the rolls that
 * actually matter. */
function rollDurationFor(run: RunState): number {
  const atRisk = run.activeBets.reduce((sum, b) => sum + b.amount, 0);
  const totalMoney = run.bankroll + atRisk;
  const highStakes = totalMoney > 0 && atRisk > totalMoney * HIGH_STAKES_FRACTION;
  return highStakes ? ROLL_ANIMATION_MS * 2 : ROLL_ANIMATION_MS;
}

export type Screen = 'menu' | 'game' | 'practice' | 'options' | 'stats';

interface GameStore {
  run: RunState;
  rng: () => number;
  shop: ShopState | null;
  isRolling: boolean;
  pendingRoll: RollResult | null; // the roll dice are animating toward
  rollDurationMs: number; // how long the current/last roll's animation takes — doubled on high-stakes rolls
  runAchievements: string[]; // achievements earned during the current run, revealed on the EndScreen
  screen: Screen; // top-level UI screen — the main menu, the active game, or the practice sandbox
  placeBet: (kind: BetKind, amount: number) => void;
  removeBet: (betId: string) => void;
  removeBetsOfKind: (kind: BetKind) => void;
  roll: () => void;
  cashOutRound: () => void;
  enterShopIfNeeded: () => void;
  buy: (offer: ShopOffer) => void;
  rerollShop: () => void;
  setLoadout: (ids: string[]) => void;
  continueToNextRound: () => void;
  chooseRound: (choice: RoundChoice) => void;
  restartRun: () => void;
  startSeededRun: (seed: number) => void;
  enterGame: () => void;
  goToMenu: () => void;
  goToOptions: () => void;
  goToStats: () => void;

  // Practice sandbox — a completely separate run so trying out a dice tier
  // never touches the player's real progress or achievements.
  practiceRun: RunState | null;
  practiceRng: (() => number) | null;
  practiceIsRolling: boolean;
  practicePendingRoll: RollResult | null;
  startPractice: (diceCount: number) => void;
  exitPractice: () => void;
  practicePlaceBet: (kind: BetKind, amount: number) => void;
  practiceRemoveBetsOfKind: (kind: BetKind) => void;
  practiceRoll: () => void;
}

function freshRun(seed: number = makeSeed()): { run: RunState; rng: () => number } {
  const rng = mulberry32(seed);
  return { run: createInitialRun(seed, rng), rng };
}

/** Unlocks any newly-earned achievements (persisted immediately) and folds
 * their ids into this run's running tally, to be revealed together once
 * the run ends instead of interrupting play with a toast. */
function trackAchievements(
  prevRun: RunState,
  nextRun: RunState,
  outcome: RollOutcome | undefined,
  runAchievements: string[],
): string[] {
  const unlocked = checkAchievements(prevRun, nextRun, outcome, new Set(useCosmeticsStore.getState().unlockedAchievements));
  if (unlocked.length === 0) return runAchievements;
  useCosmeticsStore.getState().unlockAchievements(unlocked);
  return Array.from(new Set([...runAchievements, ...unlocked]));
}

export const useGameStore = create<GameStore>((set, get) => {
  const initial = freshRun();
  return {
    run: initial.run,
    rng: initial.rng,
    shop: null,
    isRolling: false,
    pendingRoll: null,
    rollDurationMs: ROLL_ANIMATION_MS,
    runAchievements: [],
    screen: 'menu',

    placeBet: (kind, amount) => set((s) => ({ run: placeBet(s.run, kind, amount) })),

    removeBet: (betId) => set((s) => ({ run: removeBet(s.run, betId) })),

    removeBetsOfKind: (kind) => set((s) => ({ run: removeBetsOfKind(s.run, kind) })),

    roll: () => {
      const { run, rng, isRolling } = get();
      if (isRolling || run.phase !== 'run' || run.rollsRemaining <= 0) return;

      primeAudio();
      playDiceRoll();

      const duration = rollDurationFor(run);
      const { run: next, outcome } = rollOnce(run, rng);
      set({ isRolling: true, pendingRoll: outcome.roll, rollDurationMs: duration });

      setTimeout(() => {
        if (outcome.netChange > 0) playWin();
        else if (outcome.netChange < 0) playLose();
        else playNeutral();

        const shop = next.phase === 'shop' ? generateShop(next, get().rng, unlockedDieDefIds()) : null;
        const runAchievements = trackAchievements(run, next, outcome, get().runAchievements);
        trackRunEnd(run, next);
        set({ run: next, shop, isRolling: false, pendingRoll: null, runAchievements });
      }, duration);
    },

    cashOutRound: () => {
      const { run, rng, isRolling } = get();
      if (isRolling) return;
      const next = endRoundEarly(run);
      if (next === run) return;
      playWin();
      const shop = next.phase === 'shop' ? generateShop(next, rng, unlockedDieDefIds()) : null;
      const runAchievements = trackAchievements(run, next, undefined, get().runAchievements);
      trackRunEnd(run, next);
      set({ run: next, shop, runAchievements });
    },

    enterShopIfNeeded: () => {
      const { run, rng, shop } = get();
      if (run.phase === 'shop' && !shop) {
        set({ shop: generateShop(run, rng, unlockedDieDefIds()) });
      }
    },

    buy: (offer) => {
      const { run } = get();
      const next = buyOffer(run, offer);
      if (next === run) return;
      const runAchievements = trackAchievements(run, next, undefined, get().runAchievements);
      set((s) => ({
        run: next,
        shop: s.shop ? { ...s.shop, offers: s.shop.offers.filter((o) => o.id !== offer.id) } : null,
        runAchievements,
      }));
    },

    rerollShop: () => {
      const { run, rng, shop } = get();
      if (!shop || run.comps < shop.rerollCost) return;
      const next = { ...run, comps: run.comps - shop.rerollCost };
      set({ run: next, shop: generateShop(next, rng, unlockedDieDefIds()) });
    },

    setLoadout: (ids) => set((s) => ({ run: setLoadout(s.run, ids) })),

    continueToNextRound: () => {
      const { run, rng } = get();
      set({ run: beginRoundSelect(run, rng), shop: null });
    },

    chooseRound: (choice) => {
      const { run } = get();
      set({ run: confirmRoundChoice(run, choice) });
    },

    restartRun: () => {
      const fresh = freshRun();
      set({ run: fresh.run, rng: fresh.rng, shop: null, isRolling: false, pendingRoll: null, runAchievements: [] });
    },

    startSeededRun: (seed) => {
      const fresh = freshRun(seed);
      set({
        run: fresh.run,
        rng: fresh.rng,
        shop: null,
        isRolling: false,
        pendingRoll: null,
        runAchievements: [],
        screen: 'game',
      });
    },

    enterGame: () => set({ screen: 'game' }),
    goToMenu: () => set({ screen: 'menu' }),
    goToOptions: () => set({ screen: 'options' }),
    goToStats: () => set({ screen: 'stats' }),

    practiceRun: null,
    practiceRng: null,
    practiceIsRolling: false,
    practicePendingRoll: null,

    startPractice: (diceCount) => {
      const seed = makeSeed();
      set({
        practiceRun: createPracticeRun(diceCount, seed),
        practiceRng: mulberry32(seed),
        practiceIsRolling: false,
        practicePendingRoll: null,
        screen: 'practice',
      });
    },

    exitPractice: () => set({ screen: 'menu', practiceRun: null, practiceRng: null }),

    practicePlaceBet: (kind, amount) =>
      set((s) => {
        if (!s.practiceRun) return {};
        const next = placeBet(s.practiceRun, kind, amount);
        return { practiceRun: { ...next, bankroll: PRACTICE_BANKROLL } };
      }),

    practiceRemoveBetsOfKind: (kind) =>
      set((s) => {
        if (!s.practiceRun) return {};
        const next = removeBetsOfKind(s.practiceRun, kind);
        return { practiceRun: { ...next, bankroll: PRACTICE_BANKROLL } };
      }),

    practiceRoll: () => {
      const { practiceRun, practiceRng, practiceIsRolling } = get();
      if (!practiceRun || !practiceRng || practiceIsRolling) return;

      primeAudio();
      playDiceRoll();

      const { run: next, outcome } = rollOnce(practiceRun, practiceRng);
      set({ practiceIsRolling: true, practicePendingRoll: outcome.roll });

      setTimeout(() => {
        if (outcome.netChange > 0) playWin();
        else if (outcome.netChange < 0) playLose();
        else playNeutral();

        // Never actually run out — always topped back up, no round to clear or fail.
        const topped: RunState = {
          ...next,
          bankroll: PRACTICE_BANKROLL,
          roundStartBankroll: PRACTICE_BANKROLL,
          rollsRemaining: PRACTICE_ROLLS,
          phase: 'run',
        };
        set({ practiceRun: topped, practiceIsRolling: false, practicePendingRoll: null });
      }, ROLL_ANIMATION_MS);
    },
  };
});
