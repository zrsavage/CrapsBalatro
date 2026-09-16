import type { RelicDef } from '../game/types';

export const RELIC_CATALOG: RelicDef[] = [
  {
    id: 'iron_cross',
    name: 'Iron Cross',
    description: 'Place 6 and Place 8 pay an extra 15%.',
    rarity: 'common',
    price: 5,
    modifyPayoutMultiplier: (kind, base) => (kind === 'place6' || kind === 'place8' ? base * 1.15 : base),
  },
  {
    id: 'corner_hustler',
    name: 'Corner Hustler',
    description: 'Place 4 and Place 10 pay an extra 20%.',
    rarity: 'common',
    price: 5,
    modifyPayoutMultiplier: (kind, base) => (kind === 'place4' || kind === 'place10' ? base * 1.2 : base),
  },
  {
    id: 'hard_head',
    name: 'Hard Head',
    description: 'All Hard Way bets pay double.',
    rarity: 'uncommon',
    price: 7,
    modifyPayoutMultiplier: (kind, base) =>
      kind === 'hard4' || kind === 'hard6' || kind === 'hard8' || kind === 'hard10' ? base * 2 : base,
  },
  {
    id: 'devils_advocate',
    name: "Devil's Advocate",
    description: "Don't Pass and Don't Come pay an extra 25%.",
    rarity: 'common',
    price: 6,
    modifyPayoutMultiplier: (kind, base) => (kind === 'dontPass' || kind === 'dontCome' ? base * 1.25 : base),
  },
  {
    id: 'seven_sense',
    name: 'Seven Sense',
    description: 'Any Seven pays an extra 50%.',
    rarity: 'uncommon',
    price: 6,
    modifyPayoutMultiplier: (kind, base) => (kind === 'anySeven' ? base * 1.5 : base),
  },
  {
    id: 'snake_eyes_charm',
    name: 'Snake Eyes Charm',
    description: 'Any Craps pays an extra 30%.',
    rarity: 'common',
    price: 5,
    modifyPayoutMultiplier: (kind, base) => (kind === 'anyCraps' ? base * 1.3 : base),
  },
  {
    id: 'field_general',
    name: 'Field General',
    description: 'Field bets pay an extra 25%.',
    rarity: 'uncommon',
    price: 7,
    modifyPayoutMultiplier: (kind, base) => (kind === 'field' ? base * 1.25 : base),
  },
  {
    id: 'hot_shooter',
    name: 'Hot Shooter',
    description: 'Pass Line and Come bets pay an extra 20%.',
    rarity: 'common',
    price: 6,
    modifyPayoutMultiplier: (kind, base) => (kind === 'pass' || kind === 'come' ? base * 1.2 : base),
  },
  {
    id: 'lucky_seven',
    name: 'Lucky Seven',
    description: 'Winning an Any Seven bet also pays a flat +$5 bonus.',
    rarity: 'rare',
    price: 9,
    bonusOnWin: (kind) => (kind === 'anySeven' ? 5 : 0),
  },
  {
    id: 'extra_innings',
    name: 'Extra Innings',
    description: 'Start each round with 2 additional rolls.',
    rarity: 'rare',
    price: 10,
    bonusRolls: 2,
  },
  {
    id: 'stacked_bankroll',
    name: 'Stacked Bankroll',
    description: 'Gain $100 bankroll immediately when acquired.',
    rarity: 'uncommon',
    price: 8,
    bonusOnAcquire: 100,
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Every bet kind pays an extra 10%.',
    rarity: 'rare',
    price: 12,
    modifyPayoutMultiplier: (_kind, base) => base * 1.1,
  },
  {
    id: 'place_specialist',
    name: 'Place Specialist',
    description: 'Place 5 and Place 9 pay an extra 20%.',
    rarity: 'common',
    price: 5,
    modifyPayoutMultiplier: (kind, base) => (kind === 'place5' || kind === 'place9' ? base * 1.2 : base),
  },
  {
    id: 'grinder',
    name: 'Grinder',
    description: 'Winning any Place bet also pays a flat +$3 bonus.',
    rarity: 'uncommon',
    price: 7,
    bonusOnWin: (kind) =>
      kind === 'place4' || kind === 'place5' || kind === 'place6' || kind === 'place8' || kind === 'place9' || kind === 'place10'
        ? 3
        : 0,
  },
  {
    id: 'marathon_shooter',
    name: 'Marathon Shooter',
    description: 'Start each round with 1 additional roll.',
    rarity: 'common',
    price: 6,
    bonusRolls: 1,
  },
  {
    id: 'boxcar_horn',
    name: 'Boxcar Horn',
    description: 'Horn 2 and Horn 12 pay an extra 20%.',
    rarity: 'uncommon',
    price: 7,
    modifyPayoutMultiplier: (kind, base) => (kind === 'horn2' || kind === 'horn12' ? base * 1.2 : base),
  },
  {
    id: 'yo_eleven',
    name: 'Yo Eleven',
    description: 'Horn 3 and Horn 11 pay an extra 20%.',
    rarity: 'uncommon',
    price: 7,
    modifyPayoutMultiplier: (kind, base) => (kind === 'horn3' || kind === 'horn11' ? base * 1.2 : base),
  },
  {
    id: 'horn_dog',
    name: 'Horn Dog',
    description: 'Winning any Horn bet also pays a flat +$4 bonus.',
    rarity: 'rare',
    price: 10,
    bonusOnWin: (kind) => (kind === 'horn2' || kind === 'horn3' || kind === 'horn11' || kind === 'horn12' ? 4 : 0),
  },
  {
    id: 'third_wheel',
    name: 'Third Wheel',
    description: 'Adds a third die to every roll for the rest of the run. Your total is the best two of the three.',
    rarity: 'rare',
    price: 22,
    addsThirdDie: true,
  },
];

const RELIC_BY_ID = new Map(RELIC_CATALOG.map((r) => [r.id, r]));

export function getRelicDef(id: string): RelicDef | undefined {
  return RELIC_BY_ID.get(id);
}
