import type {
  ActiveBet,
  BetKind,
  DieFace,
  RollOutcome,
  RunState,
  ShopOffer,
} from './types';
import { isBetAllowedNow, resolveRoll } from './bets';
import { rollDice } from './dice';
import { getDieDef } from '../data/dice';
import { getRelicDef } from '../data/relics';
import { buildRoundDef, compsForClearingRound, nextRoundCoords, RELIC_SLOTS } from './run';

export const MIN_BET = 5;

let betCounter = 0;
function nextBetId(): string {
  betCounter += 1;
  return `bet-${betCounter}`;
}

export function placeBet(run: RunState, kind: BetKind, amount: number): RunState {
  if (amount < MIN_BET) return run;
  if (amount > run.bankroll) return run;
  if (!isBetAllowedNow(kind, run.shooter)) return run;
  if (run.rollsRemaining <= 0 || run.phase !== 'run') return run;

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
  const faces: [DieFace, DieFace] = [
    pickFace(diceDefs[0].faces, rng),
    pickFace(diceDefs[1].faces, rng),
  ];

  const roll = rollDice(faces, run.activeBets, run.shooter, run.relics, run.currentRound.bossEffect, rng);
  const { resolutions, shooterAfter } = resolveRoll(
    run.activeBets,
    roll,
    run.shooter,
    run.relics,
    run.currentRound.bossEffect,
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

  const comps = cleared.comps + compsForClearingRound(run.ante);
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
    comps: run.comps + compsForClearingRound(run.ante) + bonusComps,
    cashOutCount: run.cashOutCount + 1,
    activeBets: [],
    rollsRemaining: 0,
  };
  return finalizeSuccess(cleared);
}

/** Called when the player leaves the shop to start the next round. */
export function startNextRound(run: RunState, rng: () => number): RunState {
  const nextCoords = nextRoundCoords(run.ante, run.roundIndex);
  if (!nextCoords) return run;
  const round = buildRoundDef(nextCoords.ante, nextCoords.roundIndex, rng);

  let bonusRolls = 0;
  for (const inst of run.relics) {
    const def = getRelicDef(inst.defId);
    if (def?.bonusRolls) bonusRolls += def.bonusRolls;
  }

  return {
    ...run,
    ante: nextCoords.ante,
    roundIndex: nextCoords.roundIndex,
    currentRound: round,
    roundStartBankroll: run.bankroll,
    rollsRemaining: round.rollLimit + bonusRolls,
    shooter: { phase: 'comeOut', point: null },
    activeBets: [],
    phase: 'run',
  };
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

export function setLoadout(run: RunState, instanceIds: [string, string]): RunState {
  const valid = instanceIds.every((id) => run.dicePool.some((d) => d.instanceId === id));
  if (!valid) return run;
  return { ...run, loadout: instanceIds };
}

export { RELIC_SLOTS };
