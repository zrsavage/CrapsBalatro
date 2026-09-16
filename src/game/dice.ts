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

/** Sums the two dice that count toward the total: both, when there are
 * only two, or the best two of three (lowest dropped) with a third die
 * in play. */
function bestTwoSum(values: PipFace[]): { countedDice: [number, number]; total: number } {
  if (values.length <= 2) {
    const [a, b] = values;
    return { countedDice: [a, b], total: a + b };
  }
  const [, x, y] = [...values].sort((a, b) => a - b);
  return { countedDice: [x, y], total: x + y };
}

function combinations(lists: PipFace[][]): PipFace[][] {
  return lists.reduce<PipFace[][]>((acc, list) => acc.flatMap((prefix) => list.map((v) => [...prefix, v])), [[]]);
}

/** Rolls every equipped die (2, or 3 with the Third Wheel relic). Faces
 * that come up Wild resolve to whichever pip value nets the player the
 * best outcome given their currently active bets, evaluated by
 * brute-forcing all candidate combinations (cheap: at most 216 for 3
 * dice). Ties are broken randomly for visual variety. */
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
    const { countedDice, total } = bestTwoSum(values);
    const roll: RollResult = { dice: values, countedDice, total };
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
