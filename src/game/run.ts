import type { DiceInstance, RoundDef, RoundKind, RunState } from './types';
import { randInt } from './rng';
import { getModifierDef, MODIFIERS } from '../data/modifiers';

export const ANTE_COUNT = 8;
export const ROUNDS_PER_ANTE = 3;
export const BASE_ROLL_LIMIT = 18;
export const STARTING_BANKROLL = 500;
export const STARTING_COMPS = 15;
export const BASE_TARGET = 40;
export const RELIC_SLOTS = 5;
const MIN_ROLL_LIMIT = 6;

/** Probability a non-boss round also gets a random modifier, rising with
 * ante so early rounds stay simple and late rounds keep players on their
 * toes. Boss rounds always get one. */
function modifierChance(ante: number): number {
  return Math.min(0.6, 0.1 + ante * 0.06);
}

/** How many physical dice the player rolls each turn — the board grows as
 * the ante climbs: 2 dice through Ante 2, 3 from Ante 3, 4 from Ante 6. */
export function diceCountForAnte(ante: number): number {
  if (ante >= 6) return 4;
  if (ante >= 3) return 3;
  return 2;
}

function roundKindFor(roundIndex: number): RoundKind {
  if (roundIndex === 0) return 'comeOut';
  if (roundIndex === 1) return 'point';
  return 'boss';
}

function anteMultiplier(ante: number): number {
  return Math.pow(1.35, ante - 1);
}

/** Extra target growth right where the dice pool grows (Ante 3, Ante 6):
 * an extra physical die is a free power spike for the player (best-two-of-N
 * only ever helps), so the target needs to jump harder there too, on top
 * of its normal exponential climb, or those antes go slack. */
function diceGrowthBonus(ante: number): number {
  if (ante >= 6) return 1.35;
  if (ante >= 3) return 1.15;
  return 1;
}

/** Round-target growth rate — steeper than the chip/bankroll scale above
 * so the run keeps getting harder rather than flattening out once chip
 * sizes and dice count have both scaled up with it. */
function targetMultiplier(ante: number): number {
  return Math.pow(1.45, ante - 1) * diceGrowthBonus(ante);
}

const ROUND_MULTIPLIER = [1, 1.3, 1.7];

export function buildRoundDef(ante: number, roundIndex: number, rng: () => number): RoundDef {
  const kind = roundKindFor(roundIndex);
  const target = Math.round(BASE_TARGET * targetMultiplier(ante) * ROUND_MULTIPLIER[roundIndex]);

  let modifier = undefined as RoundDef['modifier'];
  if (kind === 'boss' || rng() < modifierChance(ante)) {
    modifier = MODIFIERS[randInt(rng, 0, MODIFIERS.length - 1)].id;
  }

  const delta = getModifierDef(modifier)?.rollLimitDelta ?? 0;
  const rollLimit = Math.max(MIN_ROLL_LIMIT, BASE_ROLL_LIMIT + delta);

  return { ante, roundIndex, kind, target, rollLimit, modifier };
}

export function createInitialRun(seed: number, rng: () => number): RunState {
  const round = buildRoundDef(1, 0, rng);
  const dieA: DiceInstance = { instanceId: 'die-1', defId: 'standard' };
  const dieB: DiceInstance = { instanceId: 'die-2', defId: 'standard' };
  return {
    seed,
    ante: 1,
    roundIndex: 0,
    bankroll: STARTING_BANKROLL,
    roundStartBankroll: STARTING_BANKROLL,
    comps: STARTING_COMPS,
    cashOutCount: 0,
    rollsRemaining: round.rollLimit,
    currentRound: round,
    shooter: { phase: 'comeOut', point: null },
    activeBets: [],
    dicePool: [dieA, dieB],
    loadout: [dieA.instanceId, dieB.instanceId],
    relics: [],
    relicSlots: RELIC_SLOTS,
    phase: 'run',
    history: [],
  };
}

export const PRACTICE_BANKROLL = 999999;
export const PRACTICE_ROLLS = 999999;

/** A representative ante to seed chip denominations off of, so practice
 * betting feels proportional to the dice tier being practiced. */
function representativeAnteFor(diceCount: number): number {
  if (diceCount >= 4) return 6;
  if (diceCount === 3) return 3;
  return 1;
}

/** A sandbox run for trying out a dice tier with no stakes: bankroll and
 * rolls are effectively infinite and there's no round target to clear or
 * fail, so the engine's normal shop/gameOver transitions never fire. Kept
 * entirely separate from the player's real run (own store slice, no
 * achievement tracking) so practicing never touches actual progress. */
export function createPracticeRun(diceCount: number, seed: number): RunState {
  const ante = representativeAnteFor(diceCount);
  const dice: DiceInstance[] = Array.from({ length: diceCount }, (_, i) => ({
    instanceId: `practice-die-${i}`,
    defId: 'standard',
  }));
  return {
    seed,
    ante,
    roundIndex: 0,
    bankroll: PRACTICE_BANKROLL,
    roundStartBankroll: PRACTICE_BANKROLL,
    comps: 0,
    cashOutCount: 0,
    rollsRemaining: PRACTICE_ROLLS,
    currentRound: { ante, roundIndex: 0, kind: 'comeOut', target: 0, rollLimit: PRACTICE_ROLLS, modifier: undefined },
    shooter: { phase: 'comeOut', point: null },
    activeBets: [],
    dicePool: dice,
    loadout: dice.map((d) => d.instanceId),
    relics: [],
    relicSlots: 0,
    phase: 'run',
    history: [],
  };
}

function roundToNiceChip(n: number): number {
  if (n < 50) return Math.max(5, Math.round(n / 5) * 5);
  if (n < 500) return Math.round(n / 25) * 25;
  if (n < 2000) return Math.round(n / 50) * 50;
  return Math.round(n / 100) * 100;
}

/** Chip presets for the betting table, scaled up each ante so denominations
 * stay relevant as targets and bankrolls grow instead of staying pinned to
 * the $5-$100 range for the whole run. */
export function chipDenominations(ante: number): number[] {
  const scale = anteMultiplier(ante);
  return [5, 10, 25, 50, 100].map((base) => roundToNiceChip(base * scale));
}

/** Comp Points awarded for clearing a round, independent of bankroll swings
 * (mirrors Balatro's separation of chips scored vs. shop money). */
export function compsForClearingRound(ante: number): number {
  return 3 + ante;
}

/** Returns the (ante, roundIndex) that follows the given round, or null if
 * the run has been fully cleared (victory). */
export function nextRoundCoords(ante: number, roundIndex: number): { ante: number; roundIndex: number } | null {
  if (roundIndex + 1 < ROUNDS_PER_ANTE) {
    return { ante, roundIndex: roundIndex + 1 };
  }
  if (ante + 1 <= ANTE_COUNT) {
    return { ante: ante + 1, roundIndex: 0 };
  }
  return null;
}
