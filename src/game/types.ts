// Core data model for Crapslatro: a Balatro-style roguelike built on craps.

export type PipFace = 1 | 2 | 3 | 4 | 5 | 6;

/** A die face is either a fixed pip value, or Wild (auto-resolves to whatever
 * value best helps the player's currently active bets when rolled). */
export type DieFace = PipFace | 'wild';

export interface DieDef {
  id: string;
  name: string;
  description: string;
  faces: [DieFace, DieFace, DieFace, DieFace, DieFace, DieFace];
  /** Shop price when this die is offered for purchase. */
  price: number;
  rarity: Rarity;
}

/** An owned copy of a die in the player's dice bag. Multiple copies of the
 * same DieDef can be owned; each gets its own instance id. */
export interface DiceInstance {
  instanceId: string;
  defId: string;
}

export type Rarity = 'common' | 'uncommon' | 'rare';

export type BetKind =
  | 'pass'
  | 'dontPass'
  | 'come'
  | 'dontCome'
  | 'field'
  | 'place4'
  | 'place5'
  | 'place6'
  | 'place8'
  | 'place9'
  | 'place10'
  | 'hard4'
  | 'hard6'
  | 'hard8'
  | 'hard10'
  | 'anyCraps'
  | 'anySeven'
  | 'horn2'
  | 'horn3'
  | 'horn11'
  | 'horn12';

/** A bet the player has chips on. Come/Don't Come bets carry a `point`
 * once they migrate off the come-line onto a number. */
export interface ActiveBet {
  id: string;
  kind: BetKind;
  amount: number;
  /** Set once a come/don't-come bet establishes its own point number. */
  point?: number;
}

export type ShooterPhase = 'comeOut' | 'point';

export interface ShooterState {
  phase: ShooterPhase;
  point: number | null;
}

export interface RollResult {
  /** Every physical die rolled this turn (2 through Ante 2, 3 from Ante 3, 4 from Ante 6). */
  dice: number[];
  /** The true sum of every physical die — 2-12 with 2 dice, 3-18 with 3,
   * 4-24 with 4. A hard-way bet wins when all of `dice` are equal. */
  total: number;
}

/** Outcome of resolving all active bets against a single dice roll. */
export interface RollOutcome {
  roll: RollResult;
  resolutions: BetResolution[];
  netChange: number;
  phaseBefore: ShooterState;
  phaseAfter: ShooterState;
}

export interface BetResolution {
  betId: string;
  kind: BetKind;
  amount: number;
  result: 'win' | 'lose' | 'push' | 'stillWorking';
  payout: number;
  /** Come/Don't Come bets that just established a point stay on the table. */
  movedToPoint?: number;
}

export interface RelicDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  price: number;
  /** Multiplies a bet's base payout odds before chips are awarded. Applied
   * in relic-list order, so multiple owned relics compound multiplicatively. */
  modifyPayoutMultiplier?: (kind: BetKind, base: number) => number;
  /** Flat bonus chips awarded whenever this bet kind wins. */
  bonusOnWin?: (kind: BetKind) => number;
  /** Extra rolls granted at the start of a round. */
  bonusRolls?: number;
  /** One-time bankroll bonus granted the moment this relic is acquired. */
  bonusOnAcquire?: number;
  /** Flat (or run-scaled) bankroll delta applied every single roll,
   * regardless of what bets are on the table or how the roll resolves. */
  bonusPerRoll?: (run: RunState) => number;
  /** Adjusts a round's target before it starts (e.g. x0.75 for -25%). */
  modifyTarget?: (baseTarget: number, run: RunState) => number;
  /** Transforms the dice/total of every roll AFTER it lands, before bets
   * are resolved against it — the "change rolls after the fact" hook.
   * Must keep `total` equal to the sum of `dice`. */
  modifyRoll?: (roll: RollResult, run: RunState, rng: () => number) => RollResult;
  /** If true, this relic instance can absorb one round-ending bust,
   * turning it into a clear instead (consumed — see `RelicInstance.used`). */
  consumesOnBust?: boolean;
}

export interface RelicInstance {
  instanceId: string;
  defId: string;
  /** Set once a one-time/consumable relic effect (e.g. consumesOnBust) has
   * been spent; the relic stays equipped but its consumable effect is gone. */
  used?: boolean;
}

export type RoundKind = 'comeOut' | 'point' | 'boss';

export interface RoundDef {
  ante: number;
  roundIndex: number; // 0,1,2 within the ante
  kind: RoundKind;
  target: number;
  rollLimit: number;
  modifier?: RoundModifierId;
}

/** A randomly-assigned rule change for a single round, always present on
 * boss rounds and increasingly likely on regular rounds as the ante
 * climbs. Restrictive modifiers force players to adapt their strategy
 * (and stop any one dice/bet combo from steamrolling every round). */
export type RoundModifierId =
  | 'coldTable' // all payouts -25%
  | 'hotDice' // all payouts +25%
  | 'noSevens' // Any Seven bet disabled
  | 'shortRolls' // rollLimit -3
  | 'fieldFreeze' // Field bet disabled
  | 'lineOnly' // only Pass/Don't Pass/Come/Don't Come pay
  | 'numbersOnly' // only Place bets pay
  | 'insideNumbers' // only Place 5/6/8/9 pay
  | 'outsideNumbers' // only Place 4/10 and Field pay
  | 'propsOnly' // only Horn/Hard Ways/Any Craps/Any Seven pay
  | 'highStakes' // minimum bet doubled
  | 'evenOnly' // wins only count on an even total — odd numbers don't pay (or lose) anything
  | 'chipBurn'; // every 3rd roll, the house takes a cut of whatever's still on the table

export type GamePhase = 'run' | 'rolling' | 'shop' | 'gameOver' | 'victory';

export interface RunState {
  seed: number;
  ante: number;
  roundIndex: number;
  bankroll: number;
  roundStartBankroll: number;
  comps: number;
  cashOutCount: number;
  rollsRemaining: number;
  /** Rolls taken so far in the current round (1-indexed after a roll
   * completes) — drives periodic-effect modifiers like chipBurn. */
  rollsThisRound: number;
  currentRound: RoundDef;
  shooter: ShooterState;
  activeBets: ActiveBet[];
  dicePool: DiceInstance[];
  loadout: string[]; // instanceIds of equipped dice — grows automatically with ante (see diceCountForAnte)
  relics: RelicInstance[];
  relicSlots: number;
  phase: GamePhase;
  history: RollOutcome[];
  lastRunSummary?: RunSummary;
}

export interface RunSummary {
  won: boolean;
  anteReached: number;
  roundReached: number;
  finalBankroll: number;
}

export interface ShopOffer {
  id: string;
  type: 'relic' | 'die';
  refId: string; // RelicDef.id or DieDef.id
  price: number;
}

export interface ShopState {
  offers: ShopOffer[];
  rerollCost: number;
}
