import type { RelicDef } from '../game/types';
import { getTierTable } from '../game/diceTiers';

export const RELIC_CATALOG: RelicDef[] = [
  {
    id: 'golden_touch',
    name: 'Golden Touch',
    description: 'Every bet kind pays DOUBLE.',
    rarity: 'rare',
    price: 32,
    modifyPayoutMultiplier: (_kind, base) => base * 2,
  },
  {
    id: 'iron_fist',
    name: 'Iron Fist',
    description: 'All Hard Way bets pay TRIPLE.',
    rarity: 'rare',
    price: 18,
    modifyPayoutMultiplier: (kind, base) =>
      kind === 'hard4' || kind === 'hard6' || kind === 'hard8' || kind === 'hard10' ? base * 3 : base,
  },
  {
    id: 'horn_of_plenty',
    name: 'Horn of Plenty',
    description: 'Horn bets pay an extra 150%, and winning one also pays a flat +$15 bonus.',
    rarity: 'rare',
    price: 16,
    modifyPayoutMultiplier: (kind, base) =>
      kind === 'horn2' || kind === 'horn3' || kind === 'horn11' || kind === 'horn12' ? base * 2.5 : base,
    bonusOnWin: (kind) => (kind === 'horn2' || kind === 'horn3' || kind === 'horn11' || kind === 'horn12' ? 15 : 0),
  },
  {
    id: 'snake_eyes_insurance',
    name: 'Snake Eyes Insurance',
    description: 'Any Craps pays 4x.',
    rarity: 'uncommon',
    price: 14,
    modifyPayoutMultiplier: (kind, base) => (kind === 'anyCraps' ? base * 4 : base),
  },
  {
    id: 'seven_heaven',
    name: 'Seven Heaven',
    description: 'Any Seven pays an extra 150%, and winning it also pays a flat +$10 bonus.',
    rarity: 'uncommon',
    price: 12,
    modifyPayoutMultiplier: (kind, base) => (kind === 'anySeven' ? base * 2.5 : base),
    bonusOnWin: (kind) => (kind === 'anySeven' ? 10 : 0),
  },
  {
    id: 'place_perfection',
    name: 'Place Perfection',
    description: 'All Place bets pay an extra 75%.',
    rarity: 'rare',
    price: 16,
    modifyPayoutMultiplier: (kind, base) => (kind.startsWith('place') ? base * 1.75 : base),
  },
  {
    id: 'field_marshal',
    name: 'Field Marshal',
    description: 'Field bets pay DOUBLE.',
    rarity: 'uncommon',
    price: 10,
    modifyPayoutMultiplier: (kind, base) => (kind === 'field' ? base * 2 : base),
  },
  {
    id: 'devils_bargain',
    name: "Devil's Bargain",
    description: "Don't Pass and Don't Come pay DOUBLE.",
    rarity: 'uncommon',
    price: 9,
    modifyPayoutMultiplier: (kind, base) => (kind === 'dontPass' || kind === 'dontCome' ? base * 2 : base),
  },
  {
    id: 'hot_streak',
    name: 'Hot Streak',
    description: 'Pass Line and Come bets pay an extra 50%.',
    rarity: 'common',
    price: 8,
    modifyPayoutMultiplier: (kind, base) => (kind === 'pass' || kind === 'come' ? base * 1.5 : base),
  },
  {
    id: 'house_money',
    name: 'House Money',
    description: 'Gain a flat +$15 every roll, win or lose.',
    rarity: 'uncommon',
    price: 10,
    bonusPerRoll: () => 15,
  },
  {
    id: 'compound_interest',
    name: 'Compound Interest',
    description: 'Gain 2% of your current bankroll every roll — the richer you get, the faster it grows.',
    rarity: 'rare',
    price: 20,
    bonusPerRoll: (run) => Math.round(run.bankroll * 0.02),
  },
  {
    id: 'easy_target',
    name: 'Easy Target',
    description: "Every round's target is 25% lower.",
    rarity: 'rare',
    price: 18,
    modifyTarget: (target) => target * 0.75,
  },
  {
    id: 'marathon_runner',
    name: 'Marathon Runner',
    description: 'Start each round with 5 additional rolls.',
    rarity: 'uncommon',
    price: 10,
    bonusRolls: 5,
  },
  {
    id: 'second_wind',
    name: 'Second Wind',
    description: 'Start each round with 3 additional rolls, and the target is 10% lower.',
    rarity: 'rare',
    price: 16,
    bonusRolls: 3,
    modifyTarget: (target) => target * 0.9,
  },
  {
    id: 'loaded_dice',
    name: 'Loaded Dice',
    description: 'Your lowest physical die is always forced to a 6, every roll.',
    rarity: 'rare',
    price: 15,
    modifyRoll: (roll) => {
      const dice = [...roll.dice];
      let minIdx = 0;
      for (let i = 1; i < dice.length; i++) if (dice[i] < dice[minIdx]) minIdx = i;
      if (dice[minIdx] === 6) return roll;
      dice[minIdx] = 6;
      return { dice, total: dice.reduce((sum, v) => sum + v, 0) };
    },
  },
  {
    id: 'lucky_nudge',
    name: 'Lucky Nudge',
    description: '25% chance each roll to bump your lowest die up by one pip.',
    rarity: 'uncommon',
    price: 9,
    modifyRoll: (roll, _run, rng) => {
      if (rng() >= 0.25) return roll;
      const dice = [...roll.dice];
      let minIdx = -1;
      for (let i = 0; i < dice.length; i++) {
        if (dice[i] < 6 && (minIdx === -1 || dice[i] < dice[minIdx])) minIdx = i;
      }
      if (minIdx === -1) return roll;
      dice[minIdx] += 1;
      return { dice, total: dice.reduce((sum, v) => sum + v, 0) };
    },
  },
  {
    id: 'second_chance',
    name: 'Second Chance',
    description: '25% chance to completely reroll the dice whenever they would seven-out or crap out.',
    rarity: 'rare',
    price: 20,
    modifyRoll: (roll, run, rng) => {
      const table = getTierTable(roll.dice.length);
      const wouldSevenOut = run.shooter.phase === 'point' && roll.total === table.natural1;
      const wouldCrapOut = run.shooter.phase === 'comeOut' && table.craps.includes(roll.total);
      if (!wouldSevenOut && !wouldCrapOut) return roll;
      if (rng() >= 0.25) return roll;
      const dice = roll.dice.map(() => 1 + Math.floor(rng() * 6));
      return { dice, total: dice.reduce((sum, v) => sum + v, 0) };
    },
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: "Once, if a round would bust, this relic saves it instead — the round counts as cleared. Consumed on use.",
    rarity: 'rare',
    price: 30,
    consumesOnBust: true,
  },
  {
    id: 'whale_bait',
    name: 'Whale Bait',
    description: 'Gain $300 bankroll immediately when acquired.',
    rarity: 'uncommon',
    price: 10,
    bonusOnAcquire: 300,
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Every bet kind pays an extra 50%.',
    rarity: 'rare',
    price: 22,
    modifyPayoutMultiplier: (_kind, base) => base * 1.5,
  },

  // --- Synergy relics: their power depends on how you're already playing ---
  {
    id: 'defiant_streak',
    name: 'Defiant Streak',
    description: "Whenever the round has an active modifier, every bet pays an extra 50% — plain rounds get nothing extra.",
    rarity: 'rare',
    price: 18,
    modifyPayoutMultiplier: (_kind, base, modifier) => (modifier ? base * 1.5 : base),
  },
  {
    id: 'collectors_edge',
    name: "Collector's Edge",
    description: 'Gain +$3 every roll for each relic you own (including this one) — the more relics, the more it pays.',
    rarity: 'uncommon',
    price: 11,
    bonusPerRoll: (run) => run.relics.length * 3,
  },
  {
    id: 'underdog_fire',
    name: "Underdog's Fire",
    description: "While you're still behind this round's target, gain a flat bonus every roll to help you catch up.",
    rarity: 'uncommon',
    price: 9,
    bonusPerRoll: (run) => (run.bankroll - run.roundStartBankroll < run.currentRound.target ? 6 + run.ante : 0),
  },

  // --- Curse relics: a real drawback, for a much bigger upside ---
  {
    id: 'blood_money',
    name: 'Blood Money',
    description: 'CURSE: every bet kind pays MORE THAN DOUBLE (2.2x) — but you bleed chips every single roll, win or lose.',
    rarity: 'rare',
    price: 13,
    curse: true,
    modifyPayoutMultiplier: (_kind, base) => base * 2.2,
    bonusPerRoll: (run) => -(4 + run.ante),
  },
  {
    id: 'greedy_pact',
    name: 'Greedy Pact',
    description: "CURSE: every round's target is 25% higher — but every bet kind pays an extra 60%.",
    rarity: 'rare',
    price: 12,
    curse: true,
    modifyTarget: (target) => target * 1.25,
    modifyPayoutMultiplier: (_kind, base) => base * 1.6,
  },
  {
    id: 'unstable_core',
    name: 'Unstable Core',
    description: 'CURSE: $250 cash the moment you take it — but every roll has a 15% chance to completely reroll the dice out from under you.',
    rarity: 'uncommon',
    price: 7,
    curse: true,
    bonusOnAcquire: 250,
    modifyRoll: (roll, _run, rng) => {
      if (rng() >= 0.15) return roll;
      const dice = roll.dice.map(() => 1 + Math.floor(rng() * 6));
      return { dice, total: dice.reduce((sum, v) => sum + v, 0) };
    },
  },
];

const RELIC_BY_ID = new Map(RELIC_CATALOG.map((r) => [r.id, r]));

export function getRelicDef(id: string): RelicDef | undefined {
  return RELIC_BY_ID.get(id);
}
