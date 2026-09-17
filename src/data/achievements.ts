import type { RollOutcome, RunState } from '../game/types';

export type UnlockKind = 'skin' | 'dice' | 'trophy';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  tier: 1 | 2;
  unlockKind: UnlockKind;
  unlockId?: string; // skin id or dice id, when unlockKind isn't 'trophy'
  unlockLabel: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Tier 1 — starter achievements, cleared in a normal first run or two.
  {
    id: 'first_round',
    name: 'Break-In',
    description: 'Clear a round for the first time.',
    tier: 1,
    unlockKind: 'skin',
    unlockId: 'midnight',
    unlockLabel: 'Midnight Felt table skin',
  },
  {
    id: 'ante_four',
    name: 'High Roller',
    description: 'Reach Ante 4 in a single run.',
    tier: 1,
    unlockKind: 'dice',
    unlockId: 'ruby',
    unlockLabel: 'Ruby dice color',
  },
  {
    id: 'boss_slayer',
    name: 'Boss Slayer',
    description: 'Clear a Boss Round.',
    tier: 1,
    unlockKind: 'dice',
    unlockId: 'obsidian',
    unlockLabel: 'Obsidian dice color',
  },
  {
    id: 'quick_draw',
    name: 'Quick Draw',
    description: 'Use Cash Out Now three times in one run.',
    tier: 1,
    unlockKind: 'skin',
    unlockId: 'neon',
    unlockLabel: 'Neon Vegas table skin',
  },
  {
    id: 'horn_hunter',
    name: 'Horn Hunter',
    description: 'Win a Horn bet (2, 3, 11, or 12).',
    tier: 1,
    unlockKind: 'trophy',
    unlockLabel: 'Bragging rights',
  },
  {
    id: 'house_beater',
    name: 'House Beater',
    description: 'Beat the house: clear all 8 antes in one run.',
    tier: 1,
    unlockKind: 'trophy',
    unlockLabel: 'Bragging rights',
  },

  // Tier 2 — genuinely hard, meant to take real skill or a well-built run.
  {
    id: 'final_table',
    name: 'Final Table',
    description: 'Reach Ante 8 in a single run.',
    tier: 2,
    unlockKind: 'skin',
    unlockId: 'emerald',
    unlockLabel: 'Emerald Table skin',
  },
  {
    id: 'whale',
    name: 'Whale',
    description: 'Reach a $5,000 bankroll at any point in a run.',
    tier: 2,
    unlockKind: 'dice',
    unlockId: 'sapphire',
    unlockLabel: 'Sapphire dice color',
  },
  {
    id: 'the_hard_way',
    name: 'The Hard Way',
    description: 'Win a Hard Way bet (all dice landing on the same number).',
    tier: 2,
    unlockKind: 'trophy',
    unlockLabel: 'Bragging rights',
  },
  {
    id: 'jackpot',
    name: 'Jackpot',
    description: 'Win $500 or more in profit from a single roll.',
    tier: 2,
    unlockKind: 'dice',
    unlockId: 'jade',
    unlockLabel: 'Jade dice color',
  },
  {
    id: 'fully_loaded',
    name: 'Fully Loaded',
    description: 'Own 5 relics at the same time.',
    tier: 2,
    unlockKind: 'skin',
    unlockId: 'royal-purple',
    unlockLabel: 'Royal Purple table skin',
  },
  {
    id: 'purist',
    name: 'Purist',
    description: 'Beat the house without ever buying a single relic.',
    tier: 2,
    unlockKind: 'trophy',
    unlockLabel: 'Bragging rights',
  },
];

const ACHIEVEMENT_BY_ID = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export function getAchievementDef(id: string): AchievementDef | undefined {
  return ACHIEVEMENT_BY_ID.get(id);
}

/** Checks which not-yet-unlocked achievements just became true, given the
 * run state before and after a roll/round transition or shop purchase.
 * `prevRun` still reflects the round that was just being played (its
 * currentRound is the one that was just cleared, if any). */
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
  if (Math.max(prevRun.ante, nextRun.ante) >= 8) unlock('final_table');
  if (nextRun.cashOutCount >= 3) unlock('quick_draw');
  if (Math.max(prevRun.bankroll, nextRun.bankroll) >= 5000) unlock('whale');
  if (nextRun.relics.length >= nextRun.relicSlots) unlock('fully_loaded');

  if (nextRun.phase === 'victory') {
    unlock('house_beater');
    if (nextRun.relics.length === 0) unlock('purist');
  }

  if (outcome) {
    const wonHorn = outcome.resolutions.some(
      (r) => r.result === 'win' && (r.kind === 'horn2' || r.kind === 'horn3' || r.kind === 'horn11' || r.kind === 'horn12'),
    );
    if (wonHorn) unlock('horn_hunter');

    const wonHard = outcome.resolutions.some(
      (r) => r.result === 'win' && (r.kind === 'hard4' || r.kind === 'hard6' || r.kind === 'hard8' || r.kind === 'hard10'),
    );
    if (wonHard) unlock('the_hard_way');

    if (outcome.netChange >= 500) unlock('jackpot');
  }

  return newlyUnlocked;
}
