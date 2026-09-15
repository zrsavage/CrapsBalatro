import type { BossEffectId, DiceInstance, RoundDef, RoundKind, RunState } from './types';
import { randInt } from './rng';

export const ANTE_COUNT = 8;
export const ROUNDS_PER_ANTE = 3;
export const BASE_ROLL_LIMIT = 18;
export const STARTING_BANKROLL = 500;
export const STARTING_COMPS = 15;
export const BASE_TARGET = 40;
export const RELIC_SLOTS = 5;

const BOSS_EFFECTS: BossEffectId[] = ['coldTable', 'noSevens', 'shortRolls', 'fieldFreeze'];

export const BOSS_EFFECT_LABELS: Record<BossEffectId, string> = {
  coldTable: 'Cold Table: all payouts -25%',
  noSevens: "No Sevens: Any Seven bet is disabled",
  shortRolls: 'Short Rolls: 3 fewer rolls this round',
  fieldFreeze: 'Field Freeze: Field bet is disabled',
};

function roundKindFor(roundIndex: number): RoundKind {
  if (roundIndex === 0) return 'comeOut';
  if (roundIndex === 1) return 'point';
  return 'boss';
}

function anteMultiplier(ante: number): number {
  return Math.pow(1.35, ante - 1);
}

const ROUND_MULTIPLIER = [1, 1.3, 1.7];

export function buildRoundDef(ante: number, roundIndex: number, rng: () => number): RoundDef {
  const kind = roundKindFor(roundIndex);
  const target = Math.round(BASE_TARGET * anteMultiplier(ante) * ROUND_MULTIPLIER[roundIndex]);
  let rollLimit = BASE_ROLL_LIMIT;
  let bossEffect: BossEffectId | undefined;
  if (kind === 'boss') {
    bossEffect = BOSS_EFFECTS[randInt(rng, 0, BOSS_EFFECTS.length - 1)];
    if (bossEffect === 'shortRolls') rollLimit -= 3;
  }
  return { ante, roundIndex, kind, target, rollLimit, bossEffect };
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
