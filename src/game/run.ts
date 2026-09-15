import type { BossEffectId, DiceInstance, RoundDef, RoundKind, RunState } from './types';
import { randInt } from './rng';

export const ANTE_COUNT = 8;
export const ROUNDS_PER_ANTE = 3;
export const BASE_ROLL_LIMIT = 12;
export const STARTING_BANKROLL = 500;
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
