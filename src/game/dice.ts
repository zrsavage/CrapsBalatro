import type {
  ActiveBet,
  BossEffectId,
  DieFace,
  PipFace,
  RelicInstance,
  RollResult,
  ShooterState,
} from './types';
import { resolveRoll } from './bets';
import { randInt } from './rng';

const ALL_PIPS: PipFace[] = [1, 2, 3, 4, 5, 6];

function rollFace(face: DieFace, resolveWild: () => PipFace): PipFace {
  if (face === 'wild') return resolveWild();
  return face;
}

/** Rolls two dice whose faces may include Wild. A physically-rolled Wild
 * face resolves to whichever pip value nets the player the best outcome
 * given their currently active bets, evaluated by brute-forcing all
 * candidate combinations (cheap: at most 36). */
export function rollDice(
  faces: [DieFace, DieFace],
  activeBets: ActiveBet[],
  shooter: ShooterState,
  relics: RelicInstance[],
  bossEffect: BossEffectId | undefined,
  rng: () => number,
): RollResult {
  const [faceA, faceB] = faces;
  const wildA = faceA === 'wild';
  const wildB = faceB === 'wild';

  if (!wildA && !wildB) {
    return { dice: [faceA as PipFace, faceB as PipFace], total: (faceA as PipFace) + (faceB as PipFace) };
  }

  const candidatesA = wildA ? ALL_PIPS : [faceA as PipFace];
  const candidatesB = wildB ? ALL_PIPS : [faceB as PipFace];

  let best: RollResult | null = null;
  let bestScore = -Infinity;
  for (const a of candidatesA) {
    for (const b of candidatesB) {
      const roll: RollResult = { dice: [a, b], total: a + b };
      const { resolutions } = resolveRoll(activeBets, roll, shooter, relics, bossEffect);
      const score = resolutions.reduce((sum, r) => sum + r.payout, 0);
      if (score > bestScore) {
        bestScore = score;
        best = roll;
      }
    }
  }

  if (best) return best;
  // No active bets to optimize for; pick randomly.
  const a = rollFace(faceA, () => randInt(rng, 1, 6) as PipFace);
  const b = rollFace(faceB, () => randInt(rng, 1, 6) as PipFace);
  return { dice: [a, b], total: a + b };
}
