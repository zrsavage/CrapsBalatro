import type { RollOutcome, RunState } from '../game/types';

export type UnlockKind = 'skin' | 'dice' | 'trophy';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  unlockKind: UnlockKind;
  unlockId?: string; // skin id or dice id, when unlockKind isn't 'trophy'
  unlockLabel: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_round',
    name: 'Break-In',
    description: 'Clear a round for the first time.',
    unlockKind: 'skin',
    unlockId: 'midnight',
    unlockLabel: 'Midnight Felt table skin',
  },
  {
    id: 'ante_four',
    name: 'High Roller',
    description: 'Reach Ante 4 in a single run.',
    unlockKind: 'dice',
    unlockId: 'ruby',
    unlockLabel: 'Ruby dice color',
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Clear a Boss Round.',
    unlockKind: 'dice',
    unlockId: 'obsidian',
    unlockLabel: 'Obsidian dice color',
  },
  {
    id: 'quick_draw',
    name: 'Quick Draw',
    description: 'Use Cash Out Now three times in one run.',
    unlockKind: 'skin',
    unlockId: 'neon',
    unlockLabel: 'Neon Vegas table skin',
  },
  {
    id: 'horn_hunter',
    name: 'Horn Hunter',
    description: 'Win a Horn bet (2, 3, 11, or 12).',
    unlockKind: 'trophy',
    unlockLabel: 'Bragging rights',
  },
  {
    id: 'house_beater',
    name: 'House Beater',
    description: 'Beat the house: clear all 8 antes in one run.',
    unlockKind: 'trophy',
    unlockLabel: 'Bragging rights',
  },
];

const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_BY_ID.get(id);
}

/** Checks which not-yet-unlocked achievements just became true, given the
 * run state before and after a roll/round transition. `prevRun` still
 * reflects the round that was just being played (its currentRound is the
 * one that was just cleared, if any). */
export function checkAchievements(
  prevRun: RunState,
  nextRun: RunState,
  outcome: RollOutcome | undefined,
  alreadyUnlocked: Set<string>,
): string[] {
  const newlyUnlocked: string[] = [];
  const unlock = (id: string) => {
    if (!alreadyUnlocked.has(id) && !newlyUnlocked.includes(id)) newlyUnlocked.push(id);
  };

  const clearedRound = prevRun.phase === 'run' && (nextRun.phase === 'shop' || nextRun.phase === 'victory');

  if (clearedRound) {
    unlock('first_round');
    if (prevRun.currentRound.roundIndex === 2) unlock('boss_slayer');
  }

  if (Math.max(prevRun.ante, nextRun.ante) >= 4) unlock('ante_four');
  if (nextRun.cashOutCount >= 3) unlock('quick_draw');
  if (nextRun.phase === 'victory') unlock('house_beater');

  if (outcome) {
    const wonHorn = outcome.resolutions.some(
      (r) => r.result === 'win' && (r.kind === 'horn2' || r.kind === 'horn3' || r.kind === 'horn11' || r.kind === 'horn12'),
    );
    if (wonHorn) unlock('horn_hunter');
  }

  return newlyUnlocked;
}
