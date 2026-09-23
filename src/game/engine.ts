import type {
  ActiveBet,
  BetKind,
  DieFace,
  RollOutcome,
  RoundChoice,
  RunState,
  ShopOffer,
} from './types';
import { isBetAllowedNow, resolveRoll } from './bets';
import { rollDice } from './dice';
import { getDieDef } from '../data/dice';
import { getRelicDef } from '../data/relics';
import { getModifierDef } from '../data/modifiers';
import { buildRoundChoices, compsForClearingRound, diceCountForAnte, nextRoundCoords, RELIC_SLOTS } from './run';

export const MIN_BET = 5;
/** A single spot can never carry more than this fraction of the round's
 * target — a table limit, in effect. Without it, one lucky roll on a big
 * enough chip can clear an entire round (or a boss round) outright,
 * which is exactly what made early rounds feel over in 1-2 rolls: a
 * single $50-100 pass-line bet already dwarfs a $40-68 target. Capping
 * bet size relative to target (rather than in flat dollars) keeps the
 * same ratio — and the same multi-roll pacing — at every ante. */
const MAX_BET_TARGET_FRACTION = 0.4;

let betCounter = 0;
function nextBetId(): string {
  betCounter += 1;
  return `bet-${betCounter}`;
}

export function minBetFor(run: RunState): number {
  const mult = getModifierDef(run.currentRound.modifier)?.minBetMultiplier ?? 1;
  return MIN_BET * mult;
}

/** The most a single spot (summed across every bet already staked on that
 * kind) may carry this round. */
export function maxBetFor(run: RunState): number {
  return Math.max(minBetFor(run), Math.round(run.currentRound.target * MAX_BET_TARGET_FRACTION));
}

export function placeBet(run: RunState, kind: BetKind, amount: number): RunState {
  if (amount < minBetFor(run)) return run;
  if (amount > run.bankroll) return run;
  if (!isBetAllowedNow(kind, run.shooter, run.currentRound.modifier)) return run;
  if (run.rollsRemaining <= 0 || run.phase !== 'run') return run;
  const alreadyOnKind = run.activeBets.filter((b) => b.kind === kind).reduce((sum, b) => sum + b.amount, 0);
  if (alreadyOnKind + amount > maxBetFor(run)) return run;

  const bet: ActiveBet = { id: nextBetId(), kind, amount };
  return {
    ...run,
    bankroll: run.bankroll - amount,
    activeBets: [...run.activeBets, bet],
  };
}

function canRemoveBet(bet: ActiveBet, run: RunState): boolean {
  if (bet.kind === 'pass' || bet.kind === 'dontPass') {
    return run.shooter.phase === 'comeOut';
  }
  if (bet.kind === 'come' || bet.kind === 'dontCome') {
    return bet.point === undefined;
  }
  return true;
}

export function removeBet(run: RunState, betId: string): RunState {
  const bet = run.activeBets.find((b) => b.id === betId);
  if (!bet || !canRemoveBet(bet, run)) return run;
  return {
    ...run,
    bankroll: run.bankroll + bet.amount,
    activeBets: run.activeBets.filter((b) => b.id !== betId),
  };
}

export function removeBetsOfKind(run: RunState, kind: BetKind): RunState {
  let refund = 0;
  const remaining = run.activeBets.filter((b) => {
    if (b.kind !== kind || !canRemoveBet(b, run)) return true;
    refund += b.amount;
    return false;
  });
  if (refund === 0) return run;
  return { ...run, bankroll: run.bankroll + refund, activeBets: remaining };
}

/** Rolls the dice, resolves all active bets, updates bankroll/shooter/bet
 * list, decrements rolls remaining, and settles the round if this was the
 * last roll. Returns the updated run plus a record of what happened. */
export function rollOnce(run: RunState, rng: () => number): { run: RunState; outcome: RollOutcome } {
  const diceDefs = run.loadout.map((instanceId) => {
    const inst = run.dicePool.find((d) => d.instanceId === instanceId);
    return getDieDef(inst?.defId ?? 'standard') ?? getDieDef('standard')!;
  });
  const faces: DieFace[] = diceDefs.map((def) => pickFace(def.faces, rng));

  let roll = rollDice(faces, run.activeBets, run.shooter, run.relics, run.currentRound.modifier, rng);
  for (const inst of run.relics) {
    const def = getRelicDef(inst.defId);
    if (def?.modifyRoll) roll = def.modifyRoll(roll, run, rng);
  }

  const { resolutions, shooterAfter } = resolveRoll(
    run.activeBets,
    roll,
    run.shooter,
    run.relics,
    run.currentRound.modifier,
  );

  let bankroll = run.bankroll;
  const remainingBets: ActiveBet[] = [];
  for (const bet of run.activeBets) {
    const res = resolutions.find((r) => r.betId === bet.id);
    if (!res) {
      remainingBets.push(bet); // untouched this roll
      continue;
    }
    if (res.result === 'win' || res.result === 'push') {
      bankroll += res.payout;
    }
    if (res.result === 'stillWorking') {
      remainingBets.push(res.movedToPoint !== undefined ? { ...bet, point: res.movedToPoint } : bet);
    }
    // 'lose' bets are simply dropped; their stake was already deducted at placement.
  }

  for (const inst of run.relics) {
    const def = getRelicDef(inst.defId);
    if (def?.bonusPerRoll) bankroll += def.bonusPerRoll(run);
  }

  const rollsThisRound = run.rollsThisRound + 1;
  const taxDef = getModifierDef(run.currentRound.modifier)?.periodicTax;
  if (taxDef && rollsThisRound % taxDef.everyNRolls === 0) {
    const onTable = remainingBets.reduce((sum, b) => sum + b.amount, 0);
    bankroll = Math.max(0, bankroll - Math.round(onTable * taxDef.fraction));
  }

  const netChange = resolutions.reduce((sum, r) => {
    if (r.result === 'win') return sum + (r.payout - r.amount);
    if (r.result === 'lose') return sum - r.amount;
    return sum;
  }, 0);

  const outcome: RollOutcome = {
    roll,
    resolutions,
    netChange,
    phaseBefore: run.shooter,
    phaseAfter: shooterAfter,
  };

  let next: RunState = {
    ...run,
    bankroll,
    activeBets: remainingBets,
    shooter: shooterAfter,
    rollsRemaining: run.rollsRemaining - 1,
    rollsThisRound,
    history: [...run.history, outcome],
  };

  if (next.rollsRemaining <= 0) {
    next = settleRoundEnd(next);
  }

  return { run: next, outcome };
}

function pickFace(faces: readonly DieFace[], rng: () => number): DieFace {
  const idx = Math.floor(rng() * faces.length);
  return faces[Math.min(idx, faces.length - 1)];
}

function finalizeSuccess(run: RunState): RunState {
  const nextCoords = nextRoundCoords(run.ante, run.roundIndex);
  if (!nextCoords) {
    return {
      ...run,
      phase: 'victory',
      lastRunSummary: {
        won: true,
        anteReached: run.ante,
        roundReached: run.roundIndex + 1,
        finalBankroll: run.bankroll,
      },
    };
  }
  return { ...run, phase: 'shop' };
}

function settleRoundEnd(run: RunState): RunState {
  // Refund any bets still working when the round ends; they don't carry over.
  const refund = run.activeBets.reduce((sum, b) => sum + b.amount, 0);
  const bankroll = run.bankroll + refund;
  const roundScore = bankroll - run.roundStartBankroll;
  const hitTarget = roundScore >= run.currentRound.target;

  const cleared: RunState = {
    ...run,
    bankroll,
    activeBets: [],
  };

  if (!hitTarget) {
    const saveIndex = cleared.relics.findIndex((inst) => !inst.used && getRelicDef(inst.defId)?.consumesOnBust);
    if (saveIndex !== -1) {
      const relics = [...cleared.relics];
      relics[saveIndex] = { ...relics[saveIndex], used: true };
      const comps = cleared.comps + compsForClearingRound(run.ante, run.currentRound.rewardMultiplier);
      return finalizeSuccess({ ...cleared, relics, comps });
    }
    return {
      ...cleared,
      phase: 'gameOver',
      lastRunSummary: {
        won: false,
        anteReached: run.ante,
        roundReached: run.roundIndex + 1,
        finalBankroll: bankroll,
      },
    };
  }

  const comps = cleared.comps + compsForClearingRound(run.ante, run.currentRound.rewardMultiplier);
  return finalizeSuccess({ ...cleared, comps });
}

/** Bonus paid per unused roll when the player voluntarily cashes out of a
 * round they've already cleared, instead of risking further swings. */
export function earlyCashOutBonusPerRoll(run: RunState): number {
  return 5 + run.ante * 3;
}

export function canEndRoundEarly(run: RunState): boolean {
  if (run.phase !== 'run' || run.rollsRemaining <= 0) return false;
  const roundScore = run.bankroll - run.roundStartBankroll;
  return roundScore >= run.currentRound.target;
}

/** Lets the player bank their win now rather than keep rolling with the
 * target already met, rewarding the choice with a bonus for each roll
 * left unused. */
export function endRoundEarly(run: RunState): RunState {
  if (!canEndRoundEarly(run)) return run;
  const refund = run.activeBets.reduce((sum, b) => sum + b.amount, 0);
  const bonus = run.rollsRemaining * earlyCashOutBonusPerRoll(run);
  const bonusComps = Math.ceil(run.rollsRemaining / 2);
  const cleared: RunState = {
    ...run,
    bankroll: run.bankroll + refund + bonus,
    comps: run.comps + compsForClearingRound(run.ante, run.currentRound.rewardMultiplier) + bonusComps,
    cashOutCount: run.cashOutCount + 1,
    activeBets: [],
    rollsRemaining: 0,
  };
  return finalizeSuccess(cleared);
}

/** Called when the player leaves the shop. Builds the round choice(s) for
 * what comes next (a real choice for a regular round, a single preview
 * card for a forced boss round) and parks the run in 'roundSelect' until
 * the player commits via confirmRoundChoice. */
export function beginRoundSelect(run: RunState, rng: () => number): RunState {
  const nextCoords = nextRoundCoords(run.ante, run.roundIndex);
  if (!nextCoords) return run;
  const roundChoices = buildRoundChoices(nextCoords.ante, nextCoords.roundIndex, rng);
  return { ...run, phase: 'roundSelect', roundChoices };
}

/** Commits to one of the round choices offered by beginRoundSelect and
 * actually starts it. Also grows the dice pool/loadout automatically when
 * the new ante's dice count exceeds what's currently equipped, so the
 * board gets bigger at Ante 3 and Ante 6 without any purchase required. */
export function confirmRoundChoice(run: RunState, choice: RoundChoice): RunState {
  if (run.phase !== 'roundSelect' || !run.roundChoices?.some((c) => c.id === choice.id)) return run;
  let round = choice.round;

  let bonusRolls = 0;
  let adjustedTarget = round.target;
  for (const inst of run.relics) {
    const def = getRelicDef(inst.defId);
    if (def?.bonusRolls) bonusRolls += def.bonusRolls;
    if (def?.modifyTarget) adjustedTarget = def.modifyTarget(adjustedTarget, run);
  }
  if (adjustedTarget !== round.target) {
    round = { ...round, target: Math.max(1, Math.round(adjustedTarget)) };
  }

  let dicePool = run.dicePool;
  let loadout = run.loadout;
  const requiredDice = diceCountForAnte(round.ante);
  while (loadout.length < requiredDice) {
    const newDie = { instanceId: `die-standard-auto-${round.ante}-${loadout.length}`, defId: 'standard' };
    dicePool = [...dicePool, newDie];
    loadout = [...loadout, newDie.instanceId];
  }

  return {
    ...run,
    ante: round.ante,
    roundIndex: round.roundIndex,
    currentRound: round,
    roundStartBankroll: run.bankroll,
    rollsRemaining: round.rollLimit + bonusRolls,
    rollsThisRound: 0,
    shooter: { phase: 'comeOut', point: null },
    activeBets: [],
    dicePool,
    loadout,
    phase: 'run',
    roundChoices: undefined,
  };
}

/** How many dice the player rolls each turn — grows automatically with
 * ante (see `diceCountForAnte`). */
export function effectiveDiceCount(run: RunState): number {
  return diceCountForAnte(run.ante);
}

export function buyOffer(run: RunState, offer: ShopOffer): RunState {
  if (run.comps < offer.price) return run;
  if (offer.type === 'relic') {
    if (run.relics.length >= run.relicSlots) return run;
    const instance = { instanceId: `relic-${offer.refId}-${Date.now()}`, defId: offer.refId };
    const def = getRelicDef(offer.refId);
    const bonus = def?.bonusOnAcquire ?? 0;
    return {
      ...run,
      comps: run.comps - offer.price,
      bankroll: run.bankroll + bonus,
      relics: [...run.relics, instance],
    };
  }
  const instance = { instanceId: `die-${offer.refId}-${Date.now()}`, defId: offer.refId };
  return { ...run, comps: run.comps - offer.price, dicePool: [...run.dicePool, instance] };
}

export function setLoadout(run: RunState, instanceIds: string[]): RunState {
  const count = effectiveDiceCount(run);
  if (instanceIds.length !== count) return run;
  const valid = instanceIds.every((id) => run.dicePool.some((d) => d.instanceId === id));
  if (!valid) return run;
  return { ...run, loadout: instanceIds };
}

export { RELIC_SLOTS };
