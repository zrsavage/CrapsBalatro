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
import { getTierOdds, getTierTable, numberForKind, type DiceTierTable } from './diceTiers';

const STATIC_LABELS: Partial<Record<BetKind, string>> = {
  pass: 'Pass Line',
  dontPass: "Don't Pass",
  come: 'Come',
  dontCome: "Don't Come",
  field: 'Field',
  anyCraps: 'Any Craps',
  anySeven: 'Any Seven',
};

/** Bet-spot label for the given dice count — place/hard/horn kinds embed a
 * number that shifts per tier (e.g. "Place 6" at 2 dice might be "Place 9"
 * at 3 dice), so these can't be static strings once the board isn't
 * pinned to 2-12 anymore. */
export function getBetLabel(kind: BetKind, diceCount: number): string {
  const staticLabel = STATIC_LABELS[kind];
  if (staticLabel) return staticLabel;
  const table = getTierTable(diceCount);
  const num = numberForKind(table, kind);
  if (kind.startsWith('hard')) return `Hard ${num}`;
  if (kind.startsWith('horn')) return `Horn ${num}`;
  return `Place ${num}`;
}

/** Whether a number that would trigger a win/lose/push is "live" this round
 * — false when a modifier like evenOnly requires the other parity, in
 * which case that specific number is inert (the bet just keeps waiting). */
function numberIsLive(total: number, modifier: RoundModifierId | undefined): boolean {
  const def = getModifierDef(modifier);
  if (!def?.requiredParity) return true;
  return def.requiredParity === 'even' ? total % 2 === 0 : total % 2 !== 0;
}

function computePayout(
  kind: BetKind,
  amount: number,
  roll: { total: number },
  relics: RelicInstance[],
  modifier: RoundModifierId | undefined,
  table: DiceTierTable,
): number {
  const odds = getTierOdds(table.diceCount);
  let [num, den] = odds[kind];
  if (kind === 'field') {
    if (roll.total === table.min) [num, den] = [2, 1];
    else if (roll.total === table.max) [num, den] = [3, 1];
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
  const table = getTierTable(roll.dice.length);
  const isHardRoll = roll.dice.every((d) => d === roll.dice[0]);
  let shooter: ShooterState = { ...shooterBefore };
  const resolutions: BetResolution[] = [];

  const lineResolution = resolveLineBets(bets, total, shooterBefore, relics, modifier, table);
  resolutions.push(...lineResolution.resolutions);
  shooter = lineResolution.shooterAfter;

  for (const bet of bets) {
    if (bet.kind === 'pass' || bet.kind === 'dontPass' || bet.kind === 'come' || bet.kind === 'dontCome') {
      continue; // handled above
    }
    if (!isKindAllowedByModifier(bet.kind, modifier)) continue;
    const res = resolveProp(bet, total, isHardRoll, shooterBefore, relics, modifier, table);
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
  table: DiceTierTable,
): { resolutions: BetResolution[]; shooterAfter: ShooterState } {
  const resolutions: BetResolution[] = [];
  let phase = shooter.phase;
  let point = shooter.point;
  const sevenedOut = phase === 'point' && total === table.natural1;
  const pointMade = phase === 'point' && point !== null && total === point;

  for (const bet of bets) {
    if (!isKindAllowedByModifier(bet.kind, modifier)) continue;
    if (bet.kind === 'pass' || bet.kind === 'dontPass') {
      resolutions.push(...resolveMainLine(bet, total, shooter, relics, modifier, table));
    } else if (bet.kind === 'come' || bet.kind === 'dontCome') {
      resolutions.push(...resolveComeLine(bet, total, shooter, relics, modifier, table));
    }
  }

  const decidingNumbers = [...table.craps, table.natural1, table.natural2];
  if (phase === 'comeOut') {
    if (!decidingNumbers.includes(total)) {
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
  table: DiceTierTable,
): BetResolution[] {
  const isPass = bet.kind === 'pass';
  const barred = table.craps[2]; // the top extreme pushes Don't Pass instead of winning it
  const live = numberIsLive(total, modifier);
  if (shooter.phase === 'comeOut') {
    if (live && (total === table.natural1 || total === table.natural2)) {
      return [isPass ? win(bet, total, relics, modifier, table) : lose(bet)];
    }
    if (live && (total === table.craps[0] || total === table.craps[1])) {
      return [isPass ? lose(bet) : win(bet, total, relics, modifier, table)];
    }
    if (live && total === barred) {
      return isPass ? [lose(bet)] : [push(bet)];
    }
    return [];
  }
  // point phase
  if (live && shooter.point !== null && total === shooter.point) {
    return [isPass ? win(bet, total, relics, modifier, table) : lose(bet)];
  }
  if (live && total === table.natural1) {
    return [isPass ? lose(bet) : win(bet, total, relics, modifier, table)];
  }
  return [];
}

function resolveComeLine(
  bet: ActiveBet,
  total: number,
  _shooter: ShooterState,
  relics: RelicInstance[],
  modifier: RoundModifierId | undefined,
  table: DiceTierTable,
): BetResolution[] {
  const isCome = bet.kind === 'come';
  const barred = table.craps[2];
  const live = numberIsLive(total, modifier);
  if (bet.point === undefined) {
    // acts like its own come-out roll. Whether a total is a natural/craps/
    // barred number is fixed regardless of parity (never becomes a point,
    // same as the shared shooter phase below) — only whether it actually
    // resolves win/lose/push is parity-gated.
    if (total === table.natural1 || total === table.natural2) {
      return live ? [isCome ? win(bet, total, relics, modifier, table) : lose(bet)] : [];
    }
    if (total === table.craps[0] || total === table.craps[1]) {
      return live ? [isCome ? lose(bet) : win(bet, total, relics, modifier, table)] : [];
    }
    if (total === barred) {
      return live ? (isCome ? [lose(bet)] : [push(bet)]) : [];
    }
    // any other total becomes this come bet's own point.
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
  if (live && total === bet.point) {
    return [isCome ? win(bet, total, relics, modifier, table) : lose(bet)];
  }
  if (live && total === table.natural1) {
    return [isCome ? lose(bet) : win(bet, total, relics, modifier, table)];
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
  table: DiceTierTable,
): BetResolution | null {
  const live = numberIsLive(total, modifier);

  if (bet.kind === 'field') {
    const roll = { total };
    if (table.field.has(total) && live) {
      return {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'win',
        payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier, table),
      };
    }
    return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
  }

  const placeNum = numberForKind(table, bet.kind);

  if (bet.kind.startsWith('place')) {
    if (shooter.phase !== 'point') return null; // place bets only work with a point established
    if (total === table.natural1) {
      return live ? { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 } : null;
    }
    if (total === placeNum && live) {
      const roll = { total };
      return {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'win',
        payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier, table),
      };
    }
    return null;
  }

  if (bet.kind.startsWith('hard')) {
    if (total === table.natural1) {
      return live ? { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 } : null;
    }
    if (total === placeNum) {
      const roll = { total };
      if (isHardRoll && live) {
        return {
          betId: bet.id,
          kind: bet.kind,
          amount: bet.amount,
          result: 'win',
          payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier, table),
        };
      }
      return live ? { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 } : null;
    }
    return null;
  }

  if (bet.kind === 'anyCraps') {
    if (table.craps.includes(total) && live) {
      const roll = { total };
      return {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'win',
        payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier, table),
      };
    }
    return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
  }

  if (bet.kind.startsWith('horn')) {
    if (total === placeNum && live) {
      const roll = { total };
      return {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'win',
        payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier, table),
      };
    }
    return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
  }

  if (bet.kind === 'anySeven') {
    if (total === table.natural1 && live) {
      const roll = { total };
      return {
        betId: bet.id,
        kind: bet.kind,
        amount: bet.amount,
        result: 'win',
        payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier, table),
      };
    }
    return { betId: bet.id, kind: bet.kind, amount: bet.amount, result: 'lose', payout: 0 };
  }

  return null;
}

function win(
  bet: ActiveBet,
  total: number,
  relics: RelicInstance[],
  modifier: RoundModifierId | undefined,
  table: DiceTierTable,
): BetResolution {
  const roll = { total };
  return {
    betId: bet.id,
    kind: bet.kind,
    amount: bet.amount,
    result: 'win',
    payout: bet.amount + computePayout(bet.kind, bet.amount, roll, relics, modifier, table),
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
