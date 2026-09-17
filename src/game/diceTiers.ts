import type { BetKind } from './types';

/** Once the board grows past 2 dice, this is genuinely no longer classic
 * craps: every roll is the TRUE sum of all physical dice (3-18 with 3 dice,
 * 4-24 with 4), not "best two of N" pretending to stay inside 2-12. Every
 * bet's target numbers and payout odds are recomputed per dice count from
 * the real combinatorics of that many d6s, generalizing the same shape
 * classic craps uses for 2 dice (a modal "natural", a paired near-extreme
 * "natural", three craps numbers at the bottom/top, and place/hard/horn
 * numbers built outward from there) rather than keeping 2-12 pinned in
 * place while dice keep getting added. */

export interface PlaceSlot {
  kind: BetKind;
  number: number;
}

export interface DiceTierTable {
  diceCount: number;
  min: number;
  max: number;
  /** The modal sum — plays the role of "7": come-out natural win, seven-out
   * trigger during the point phase, and the Any Seven bet's target. */
  natural1: number;
  /** Second come-out natural win — plays the role of "11" (one below max). */
  natural2: number;
  /** Instant come-out/come losers for Pass, winners for Don't Pass. */
  craps: [number, number, number];
  /** The 6 point numbers closest to natural1, mapped to place4..place10 in
   * ascending value order (matching the classic kind-naming convention;
   * the kind name is now a rank slot, not a literal number). */
  place: PlaceSlot[];
  /** All-dice-equal numbers [2x,3x,4x,5x the dice count], mapped to
   * hard4/hard6/hard8/hard10 in ascending value order. */
  hard: PlaceSlot[];
  /** The four extreme numbers [min, min+1, natural2, max], mapped to
   * horn2/horn3/horn11/horn12 in ascending value order. */
  horn: PlaceSlot[];
  /** Field-bet-covered sums, sized so total field win probability lands
   * near the classic ~44.4%, whatever the dice count. */
  field: Set<number>;
  /** Exact P(sum = s) for standard (non-wild) dice, s in [min, max]. */
  probabilities: Map<number, number>;
}

function enumerateSumCounts(diceCount: number): Map<number, number> {
  const counts = new Map<number, number>();
  const faces = [1, 2, 3, 4, 5, 6];
  const totalsSoFar: number[] = [0];
  let current = totalsSoFar;
  for (let d = 0; d < diceCount; d++) {
    const next: number[] = [];
    for (const partial of current) {
      for (const f of faces) next.push(partial + f);
    }
    current = next;
  }
  for (const s of current) counts.set(s, (counts.get(s) ?? 0) + 1);
  return counts;
}

function buildPlaceSlots(numbers: number[], kinds: BetKind[]): PlaceSlot[] {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted.map((number, i) => ({ kind: kinds[i], number }));
}

const PLACE_KINDS: BetKind[] = ['place4', 'place5', 'place6', 'place8', 'place9', 'place10'];
const HARD_KINDS: BetKind[] = ['hard4', 'hard6', 'hard8', 'hard10'];
const HORN_KINDS: BetKind[] = ['horn2', 'horn3', 'horn11', 'horn12'];

const FIELD_TARGET_WIN_PROB = 16 / 36; // matches classic 2d6 field exactly (sums 2,3,4,9,10,11,12)

function buildTierTable(diceCount: number): DiceTierTable {
  const min = diceCount;
  const max = diceCount * 6;
  const counts = enumerateSumCounts(diceCount);
  const totalOutcomes = Math.pow(6, diceCount);
  const probabilities = new Map<number, number>();
  for (const [sum, count] of counts) probabilities.set(sum, count / totalOutcomes);

  let natural1 = min;
  let bestCount = -1;
  for (let s = min; s <= max; s++) {
    const c = counts.get(s) ?? 0;
    if (c > bestCount) {
      bestCount = c;
      natural1 = s;
    }
  }
  const natural2 = max - 1;
  const craps: [number, number, number] = [min, min + 1, max];

  const excluded = new Set<number>([natural1, natural2, ...craps]);
  const pointNumbers: number[] = [];
  for (let s = min; s <= max; s++) if (!excluded.has(s)) pointNumbers.push(s);
  pointNumbers.sort((a, b) => Math.abs(a - natural1) - Math.abs(b - natural1));
  const placeNumbers = pointNumbers.slice(0, 6);

  const hardNumbers = [2, 3, 4, 5].map((m) => m * diceCount);

  const hornNumbers = [min, min + 1, natural2, max];

  const allSums: number[] = [];
  for (let s = min; s <= max; s++) allSums.push(s);
  // Greedily exclude the highest-probability sums from the center outward
  // (mirroring classic craps, which excludes {5,6,7,8} from the field) —
  // at each step keep excluding as long as it gets remaining field
  // probability closer to the classic ~44.4% target, whatever the dice
  // count's discrete probability chunks allow.
  const byProbDesc = [...allSums].sort((a, b) => (probabilities.get(b) ?? 0) - (probabilities.get(a) ?? 0));
  const excludedFromField = new Set<number>();
  let remaining = 1;
  let bestDiff = Math.abs(remaining - FIELD_TARGET_WIN_PROB);
  for (const s of byProbDesc) {
    const p = probabilities.get(s) ?? 0;
    const nextRemaining = remaining - p;
    const nextDiff = Math.abs(nextRemaining - FIELD_TARGET_WIN_PROB);
    if (nextDiff < bestDiff) {
      excludedFromField.add(s);
      remaining = nextRemaining;
      bestDiff = nextDiff;
    } else {
      break;
    }
  }
  const field = new Set(allSums.filter((s) => !excludedFromField.has(s)));

  return {
    diceCount,
    min,
    max,
    natural1,
    natural2,
    craps,
    place: buildPlaceSlots(placeNumbers, PLACE_KINDS),
    hard: buildPlaceSlots(hardNumbers, HARD_KINDS),
    horn: buildPlaceSlots(hornNumbers, HORN_KINDS),
    field,
    probabilities,
  };
}

const TIER_CACHE = new Map<number, DiceTierTable>();

export function getTierTable(diceCount: number): DiceTierTable {
  let table = TIER_CACHE.get(diceCount);
  if (!table) {
    table = buildTierTable(diceCount);
    TIER_CACHE.set(diceCount, table);
  }
  return table;
}

export function numberForKind(table: DiceTierTable, kind: BetKind): number | undefined {
  return (
    table.place.find((p) => p.kind === kind)?.number ??
    table.hard.find((p) => p.kind === kind)?.number ??
    table.horn.find((p) => p.kind === kind)?.number
  );
}

/** The original, hand-tuned 2-dice odds table (unchanged from before this
 * dice-tier rework — preserved exactly rather than re-derived, since it's
 * already shipped and balance-tested). 3 and 4 dice compute fresh odds
 * below instead of trying to hit these same numbers. */
const TWO_DICE_ODDS: Record<BetKind, [number, number]> = {
  pass: [1, 1],
  dontPass: [1, 1],
  come: [1, 1],
  dontCome: [1, 1],
  field: [1, 1], // special-cased: 2x on min, 3x on max
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

// Edge factors applied to fair (zero-house-edge) odds — chosen so the
// diceCount === 2 tier's computed values land close to the shipped
// TWO_DICE_ODDS shape (place bets closer to the natural get a smaller
// cut, further ones a bigger cut, etc), then reused unchanged at 3/4 dice.
const PLACE_EDGE_BY_RANK = [0.9722, 0.9722, 0.9333, 0.9333, 0.9, 0.9]; // nearest pair, middle pair, farthest pair
const HARD_EDGE_BY_RANK = [0.875, 0.9, 0.9, 0.875]; // ascending value: outer, inner, inner, outer
const ANY_CRAPS_EDGE = 0.625;
const ANY_SEVEN_EDGE = 0.8;
const HORN_EDGE = 0.7;
const DECIMAL_PRECISION = 100; // odds stored as num/100 : 1 for non-2-dice tiers

// True fair odds on an all-dice-equal hard way (or an extreme horn number)
// explode with dice count — at 4 dice, hitting all four the same is a
// 1-in-1296 shot, so "fair" would pay 200+ : 1 and turn one lucky roll
// into a run-ending jackpot. Cap these lottery-style props per tier so
// payouts still climb with dice count (matching the lower-odds/
// higher-payout shape everywhere else) without single-roll swings big
// enough to trivialize the round target.
const HARD_WAY_MAX_BY_DICE: Partial<Record<number, number>> = { 3: 20, 4: 30 };
const HORN_MAX_BY_DICE: Partial<Record<number, number>> = { 3: 18, 4: 26 };
const ANY_CRAPS_MAX_BY_DICE: Partial<Record<number, number>> = { 3: 8, 4: 10 };

function fairOddsOneRoll(p: number): number {
  return (1 - p) / p;
}

function toOddsPair(ratio: number): [number, number] {
  return [Math.max(1, Math.round(ratio * DECIMAL_PRECISION)), DECIMAL_PRECISION];
}

function buildTierOdds(table: DiceTierTable): Record<BetKind, [number, number]> {
  if (table.diceCount === 2) return TWO_DICE_ODDS;

  const p = (s: number) => table.probabilities.get(s) ?? 0;
  const odds = {} as Record<BetKind, [number, number]>;
  odds.pass = [1, 1];
  odds.dontPass = [1, 1];
  odds.come = [1, 1];
  odds.dontCome = [1, 1];
  odds.field = [1, 1];

  // Place bets: conditional odds of hitting the number before natural1,
  // rank-ordered by distance from natural1 (nearest pair gets the smallest
  // house cut, same shape as classic craps).
  const placeByDistance = [...table.place].sort(
    (a, b) => Math.abs(a.number - table.natural1) - Math.abs(b.number - table.natural1),
  );
  placeByDistance.forEach((slot, i) => {
    const pWin = p(slot.number);
    const pLose = p(table.natural1);
    const fair = pLose / pWin;
    odds[slot.kind] = toOddsPair(fair * PLACE_EDGE_BY_RANK[i]);
  });

  // Hard ways: conditional odds of the all-equal combo before either the
  // "easy" way to make that same number, or natural1. True odds explode
  // with dice count (1-in-1296 at 4 dice), so cap the payout per tier.
  const hardCap = HARD_WAY_MAX_BY_DICE[table.diceCount] ?? Infinity;
  table.hard.forEach((slot, i) => {
    const pHard = 1 / Math.pow(6, table.diceCount); // exactly one all-equal combo
    const pEasy = p(slot.number) - pHard;
    const pSeven = p(table.natural1);
    const fair = (pEasy + pSeven) / pHard;
    odds[slot.kind] = toOddsPair(Math.min(fair * HARD_EDGE_BY_RANK[i], hardCap));
  });

  // Any Craps / Any Seven: plain one-roll odds against the craps set / natural1.
  const anyCrapsCap = ANY_CRAPS_MAX_BY_DICE[table.diceCount] ?? Infinity;
  const pCraps = table.craps.reduce((sum, n) => sum + p(n), 0);
  odds.anyCraps = toOddsPair(Math.min(fairOddsOneRoll(pCraps) * ANY_CRAPS_EDGE, anyCrapsCap));
  odds.anySeven = toOddsPair(fairOddsOneRoll(p(table.natural1)) * ANY_SEVEN_EDGE);

  // Horn: uniform payout across all four extreme numbers, based on the
  // LEAST rare of the four (keeps any single extreme number from paying
  // disproportionately, the same anti-exploit shape as the shipped 2-dice
  // table's flat 12:1 across horn2/3/11/12), capped per tier for the same
  // reason as hard ways above.
  const hornCap = HORN_MAX_BY_DICE[table.diceCount] ?? Infinity;
  const leastRareHornProb = Math.max(...table.horn.map((slot) => p(slot.number)));
  const hornPair = toOddsPair(Math.min(fairOddsOneRoll(leastRareHornProb) * HORN_EDGE, hornCap));
  for (const slot of table.horn) odds[slot.kind] = hornPair;

  return odds;
}

const ODDS_CACHE = new Map<number, Record<BetKind, [number, number]>>();

export function getTierOdds(diceCount: number): Record<BetKind, [number, number]> {
  let odds = ODDS_CACHE.get(diceCount);
  if (!odds) {
    odds = buildTierOdds(getTierTable(diceCount));
    ODDS_CACHE.set(diceCount, odds);
  }
  return odds;
}
