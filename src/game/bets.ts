import type {
  ActiveBet,
  BetKind,
  BetResolution,
  RollResult,
  RoundModifierId,
  ShooterState,
  RelicInstance,
} from './types';
import { getRelicDef } from '../data/relics';
import { getModifierDef, isKindAllowedByModifier } from '../data/modifiers';

/** Base payout odds as [profit numerator, wager denominator]. A $den bet
 * that wins profits $num (stake is also returned). */
export const BASE_ODDS: Record<BetKind, [number, number]> = {
  pass: [1, 1],
  dontPass: [1, 1],
  come: [1, 1],
  dontCome: [1, 1],
  field: [1, 1], // special-cased: 2x on 2, 3x on 12
  place4: [9, 5],
  place10: [9, 5],
  place5: [7, 5],
  place9: [7, 5],
  place6: [7, 6],
  place8: [7, 6],
  hard4: [7, 1],
  hard10: [7, 1],
  hard6: [9, 1],
  hard8: [9, 1],
  anyCraps: [5, 1],
  anySeven: [4, 1],
  horn2: [12, 1],
  horn12: [12, 1],
  horn3: [12, 1],
  horn11: [12, 1],
};

export const BET_LABELS: Record<BetKind, string> = {
  pass: 'Pass Line',
  dontPass: "Don't Pass",
  come: 'Come',
  dontCome: "Don't Come",
  field: 'Field',
  place4: 'Place 4',
  place5: 'Place 5',
  place6: 'Place 6',
  place8: 'Place 8',
  place9: 'Place 9',
  place10: 'Place 10',
  hard4: 'Hard 4',
  hard6: 'Hard 6',
  hard8: 'Hard 8',
  hard10: 'Hard 10',
  anyCraps: 'Any Craps',
  anySeven: 'Any Seven',
  horn2: 'Horn 2',
  horn3: 'Horn 3',
  horn11: 'Horn 11',
  horn12: 'Horn 12',
};

const HORN_NUMBER: Partial<Record<BetKind, number>> = {
  horn2: 2,
  horn3: 3,
  horn11: 11,
  horn12: 12,
};

const PLACE_NUMBER: Partial<Record<BetKind, number>> = {
  place4: 4,
  place5: 5,
  place6: 6,
  place8: 8,
  place9: 9,
  place10: 10,
};

const HARD_NUMBER: Partial<Record<BetKind, number>> = {
  hard4: 4,
  hard6: 6,
  hard8: 8,
  hard10: 10,
};

function computePayout(
  kind: BetKind,
  amount: number,
  roll: { total: number },
  relics: RelicInstance[],
  modifier: RoundModifierId | undefined,
): number {
  let [num, den] = BASE_ODDS[kind];
  if (kind === 'field') {
    if (roll.total === 2) [num, den] = [2, 1];
    else if (roll.total === 12) [num, den] = [3, 1];
  }
  let profit = (amount * num) / den;
  for (const inst of relics) {
    const def = getRelicDef(inst.defId);
    if (def?.modifyPayoutMultiplier) {
      profit = def.modifyPayoutMultiplier(kind, profit);
    }
    if (def?.bonusOnWin) {
      profit += def.bonusOnWin(kind);
    }
  }
  const modDef = getModifierDef(modifier);
  if (modDef?.payoutMultiplier) {
    profit *= modDef.payoutMultiplier;
  }
  return Math.round(profit);
}

/** Resolves every active bet against a single roll, given the shooter phase
 * BEFORE this roll. Returns resolutions plus the new shooter state. Bets
 * that are still in play (unresolved) are left untouched by the caller. */
export function resolveRoll(
  bets: ActiveBet[],
  roll: RollResult,
  shooterBefore: ShooterState,
  relics: RelicInstance[],
  modifier: RoundModifierId | undefined,
): { resolutions: BetResolution[]; shooterAfter: ShooterState } {
  const { total } = roll;
  const isHardRoll = roll.countedDice[0] === roll.countedDice[1];
  let shooter: ShooterState = { ...shooterBefore };
  const resolutions: BetResolution[] = [];

  const lineResolution = resolveLineBets(bets, total, shooterBefore, relics, modifier);
  resolutions.push(...lineResolution.resolutions);
  shooter = lineResolution.shooterAfter;

  for (const bet of bets) {
    if (bet.kind === 'pass' || bet.kind === 'dontPass' || bet.kind === 'come' || bet.kind === 'dontCome') {
      continue; // handled above
    }
    if (!isKindAllowedByModifier(bet.kind, modifier)) continue;
    const res = resolveProp(bet, total, isHardRoll, shooterBefore, relics, modifier);
    if (res) resolutions.push(res);
  }

  return { resolutions, shooterAfter: shooter };
}

function resolveLineBets(
  bets: ActiveBet[],
  total: number,
  shooter: ShooterState,
  relics: RelicInstance[],
  modifier: RoundModifierId | undefined,
): { resolutions: BetResolution[]; shooterAfter: ShooterState } {
  const resolutions: BetResolution[] = [];
  let phase = shooter.phase;
  let point = shooter.point;
  const sevenedOut = phase === 'point' && total === 7;
  const pointMade = phase === 'point' && point !== null && total === point;

  for (const bet of bets) {
    if (!isKindAllowedByModifier(bet.kind, modifier)) continue;
    if (bet.kind === 'pass' || bet.kind === 'dontPass') {
      resolutions.push(...resolveMainLine(bet, total, shooter, relics, modifier));
    } else if (bet.kind === 'come' || bet.kind === 'dontCome') {
      resolutions.push(...resolveComeLine(bet, total, shooter, relics, modifier));
    }
  }

  if (phase === 'comeOut') {
    if (![2, 3, 7, 11, 12].includes(total)) {
      phase = 'point';
      point = total;
    }
  } else if (sevenedOut || pointMade) {
    phase = 'comeOut';
    point = null;
  }

  return { resolutions, shooterAfter: { phase, point } };
}

function resolveMainLine(
  bet: ActiveBet,
  total: number,
  shooter: ShooterState,
  relics: RelicInstance[],
  modifier: RoundModifierId | undefined,
): BetResolution[] {
  const isPass = bet.kind === 'pass';
  if (shooter.phase === 'comeOut') {
    if (total === 7 || total === 11) {
      return [isPass ? win(bet, total, relics, modifier) : lose(bet)];
    }
    if (total === 2 || total === 3) {
      return [isPass ? lose(bet) : win(bet, total, relics, modifier)];
    }
    if (total === 12) {
      return isPass ? [lose(bet)] : [push(bet)];
    }
    return [];
  }
  // point phase
  if (shooter.point !== null && total === shooter.point) {
    return [isPass ? win(bet, total, relics, modifier) : lose(bet)];
  }
  if (total === 7) {
    return [isPass ? lose(bet) : win(bet, total, relics, modifier)];
  }
  return [];
}

function resolveComeLine(
  bet: ActiveBet,
  total: number,
  _shooter: ShooterState,
  relics: RelicInstance[],
  modifier: RoundModifierId | undefined,
): BetResolution[] {
  const isCome = bet.kind === 'come';
  if (bet.point === undefined) {
    // acts like its own come-out roll
    if (total === 7 || total === 11) return [isCome ? win(bet, total, relics, modifier) : lose(bet)];
    if (total === 2 || total === 3) return [isCome ? lose(bet) : win(bet, total, relics, modifier)];
    if (total === 12) return isCome ? [lose(bet)] : [push(bet)];
    return [
      {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'stillWorking',
        payout: 0,
        movedToPoint: total,
      },
    ];
  }
  // established point for this come bet
  if (total === bet.point) {
    return [isCome ? win(bet, total, relics, modifier) : lose(bet)];
  }
  if (total === 7) {
    return [isCome ? lose(bet) : win(bet, total, relics, modifier)];
  }
  return [];
}

function resolveProp(
  bet: ActiveBet,
  total: number,
  isHardRoll: boolean,
  shooter: ShooterState,
  relics: RelicInstance[],
  modifier: RoundModifierId | undefined,
): BetResolution | null {
  if (bet.kind === 'field') {
    const roll = { total };
    if ([2, 3, 4, 9, 10, 11, 12].includes(total)) {
      return {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'win',
        payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier),
      };
    }
    return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
  }

  const placeNum = PLACE_NUMBER[bet.kind];
  if (placeNum !== undefined) {
    if (shooter.phase !== 'point') return null; // place bets only work with a point established
    if (total === 7) {
      return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
    }
    if (total === placeNum) {
      const roll = { total };
      return {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'win',
        payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier),
      };
    }
    return null;
  }

  const hardNum = HARD_NUMBER[bet.kind];
  if (hardNum !== undefined) {
    if (total === 7) {
      return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
    }
    if (total === hardNum) {
      const roll = { total };
      if (isHardRoll) {
        return {
          betId: bet.id,
          kind: bet.kind,
          amount: bet.amount,
          result: 'win',
          payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier),
        };
      }
      return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
    }
    return null;
  }

  if (bet.kind === 'anyCraps') {
    if ([2, 3, 12].includes(total)) {
      const roll = { total };
      return {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'win',
        payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier),
      };
    }
    return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
  }

  const hornNum = HORN_NUMBER[bet.kind];
  if (hornNum !== undefined) {
    if (total === hornNum) {
      const roll = { total };
      return {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'win',
        payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier),
      };
    }
    return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
  }

  if (bet.kind === 'anySeven') {
    if (total === 7) {
      const roll = { total };
      return {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'win',
        payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier),
      };
    }
    return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
  }

  return null;
}

function win(bet: ActiveBet, total: number, relics: RelicInstance[], modifier: RoundModifierId | undefined): BetResolution {
  const roll = { total };
  return {
    betId: bet.id,
    kind: bet.kind,
    amount: bet.amount,
    result: 'win',
    payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier),
  };
}

function lose(bet: ActiveBet): BetResolution {
  return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
}

function push(bet: ActiveBet): BetResolution {
  return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'push', payout: bet.amount };
}

/** Bet kinds allowed to be placed given the current shooter phase and round modifier. */
export function isBetAllowedNow(kind: BetKind, shooter: ShooterState, modifier: RoundModifierId | undefined): boolean {
  if (!isKindAllowedByModifier(kind, modifier)) return false;
  if (kind === 'pass' || kind === 'dontPass') return shooter.phase === 'comeOut';
  if (kind === 'come' || kind === 'dontCome') return shooter.phase === 'point';
  return true;
}
