import type { DieDef } from '../game/types';

export const DICE_CATALOG: DieDef[] = [
  {
    id: 'standard',
    name: 'Standard Die',
    description: 'A regular six-sided die: 1-2-3-4-5-6.',
    faces: [1, 2, 3, 4, 5, 6],
    price: 0,
    rarity: 'common',
  },
  {
    id: 'lucky_sevens',
    name: 'Lucky Sevens Die',
    description: 'Faces weighted toward 5 and 6 to help hit sevens and the field.',
    faces: [3, 4, 5, 5, 6, 6],
    price: 6,
    rarity: 'common',
  },
  {
    id: 'low_roller',
    name: 'Low Roller Die',
    description: 'Faces weighted toward 1 and 2, great for Don’t bets and craps numbers.',
    faces: [1, 1, 2, 2, 3, 4],
    price: 6,
    rarity: 'common',
  },
  {
    id: 'point_maker',
    name: 'Point Maker Die',
    description: 'Faces weighted toward 4, 5, and 6 to help make points.',
    faces: [2, 3, 4, 5, 5, 6],
    price: 7,
    rarity: 'uncommon',
  },
  {
    id: 'hard_way',
    name: 'Hard Way Die',
    description: 'Duplicated middle faces make pairing with itself more likely across rolls.',
    faces: [2, 2, 3, 4, 5, 5],
    price: 7,
    rarity: 'uncommon',
  },
  {
    id: 'wildcard',
    name: 'Wildcard Die',
    description: 'One face is Wild: it always resolves to whatever value helps your bets most.',
    faces: [1, 2, 3, 4, 6, 'wild'],
    price: 12,
    rarity: 'rare',
  },
  {
    id: 'boxcars',
    name: 'Boxcars Die',
    description: 'Favors 6, good for Field and Place 6/8.',
    faces: [2, 3, 4, 5, 6, 6],
    price: 8,
    rarity: 'uncommon',
  },
  {
    id: 'snake_eyes',
    name: 'Snake Eyes Die',
    description: 'Favors 1, good for Any Craps and Don’t bets.',
    faces: [1, 1, 2, 3, 4, 5],
    price: 8,
    rarity: 'uncommon',
  },

  // --- Legendary dice: not in the normal shop rotation, unlocked by achievement ---
  {
    id: 'twin_wild',
    name: 'Twin Wild Die',
    description: 'LEGENDARY: TWO Wild faces — resolves to whatever helps your bets most, twice as often.',
    faces: [2, 3, 4, 5, 'wild', 'wild'],
    price: 26,
    rarity: 'rare',
    locked: true,
  },
  {
    id: 'devils_snake_eyes',
    name: "Devil's Snake Eyes Die",
    description: 'LEGENDARY: all-or-nothing — three faces of 1, three faces of 6, nothing in between.',
    faces: [1, 1, 1, 6, 6, 6],
    price: 20,
    rarity: 'rare',
    locked: true,
  },
  {
    id: 'fortune_seeker',
    name: 'Fortune Seeker Die',
    description: "LEGENDARY: a Wild face plus faces weighted toward the big numbers — built for chasing the highest tier's targets.",
    faces: [4, 5, 6, 6, 'wild', 'wild'],
    price: 30,
    rarity: 'rare',
    locked: true,
  },
];

const DICE_BY_ID = new Map(DICE_CATALOG.map((d) => [d.id, d]));

export function getDieDef(id: string): DieDef | undefined {
  return DICE_BY_ID.get(id);
}
