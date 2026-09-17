import type {
  ActiveBet,
  DieFace,
  PipFace,
  RelicInstance,
  RollResult,
  RoundModifierId,
  ShooterState,
} from './types';
import { resolveRoll } from './bets';
import { randInt } from './rng';

const ALL_PIPS: PipFace[] = [1, 2, 3, 4, 5, 6];

function combinations(lists: PipFace[][]): PipFace[][] {
  return lists.reduce<PipFace[][]>((acc, list) => acc.flatMap((prefix) => list.map((v) => [...prefix, v])), [[]]);
}

/** Rolls every equipped die (2 at Ante 1-2, 3 at Ante 3-5, 4 at Ante 6+) and
 * totals the TRUE sum of all of them — 2-12 with 2 dice, 3-18 with 3, 4-24
 * with 4, not a best-two-of-N pretending to stay inside 2-12. Faces that
 * come up Wild resolve to whichever pip value nets the player the best
 * outcome given their currently active bets, evaluated by brute-forcing
 * all candidate combinations (cheap: at most 1296 for 4 dice). Ties are
 * broken randomly for visual variety. */
export function rollDice(
  faces: DieFace[],
  activeBets: ActiveBet[],
  shooter: ShooterState,
  relics: RelicInstance[],
  modifier: RoundModifierId | undefined,
  rng: () => number,
): RollResult {
  const candidateLists = faces.map((f) => (f === 'wild' ? ALL_PIPS : [f as PipFace]));

  let bestScore = -Infinity;
  let bestRolls: RollResult[] = [];

  for (const values of combinations(candidateLists)) {
    const total = values.reduce((sum, v) => sum + v, 0);
    const roll: RollResult = { dice: values, total };
    const { resolutions } = resolveRoll(activeBets, roll, shooter, relics, modifier);
    const score = resolutions.reduce((sum, r) => sum + r.payout, 0);
    if (score > bestScore) {
      bestScore = score;
      bestRolls = [roll];
    } else if (score === bestScore) {
      bestRolls.push(roll);
    }
  }

  return bestRolls[randInt(rng, 0, bestRolls.length - 1)];
}
