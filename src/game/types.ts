// Core data model for CrapsBalatro: a Balatro-style roguelike built on craps.

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
  dice: [number, number];
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

export type RelicHookContext = {
  run: RunState;
};

export interface RelicDef {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  price: number;
  /** Multiplies a bet's base payout odds before chips are awarded. */
  modifyPayoutMultiplier?: (kind: BetKind, base: number) => number;
  /** Flat bonus chips awarded whenever this bet kind wins. */
  bonusOnWin?: (kind: BetKind) => number;
  /** Extra rolls granted at the start of a round. */
  bonusRolls?: number;
  /** One-time bankroll bonus granted the moment this relic is acquired. */
  bonusOnAcquire?: number;
  /** Called once when a new round begins. */
  onRoundStart?: (ctx: RelicHookContext) => void;
}

export interface RelicInstance {
  instanceId: string;
  defId: string;
}

export type RoundKind = 'comeOut' | 'point' | 'boss';

export interface RoundDef {
  ante: number;
  roundIndex: number; // 0,1,2 within the ante
  kind: RoundKind;
  target: number;
  rollLimit: number;
  bossEffect?: BossEffectId;
}

export type BossEffectId =
  | 'coldTable' // all payouts -25%
  | 'noSevens' // anySeven bet disabled
  | 'shortRolls' // rollLimit -3
  | 'fieldFreeze'; // field bet disabled

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
  currentRound: RoundDef;
  shooter: ShooterState;
  activeBets: ActiveBet[];
  dicePool: DiceInstance[];
  loadout: [string, string]; // instanceIds of equipped dice
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
