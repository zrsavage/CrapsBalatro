import type { BetKind, RoundModifierId } from '../game/types';

const LINE_KINDS: BetKind[] = ['pass', 'dontPass', 'come', 'dontCome'];
const PLACE_KINDS: BetKind[] = ['place4', 'place5', 'place6', 'place8', 'place9', 'place10'];
const INSIDE_KINDS: BetKind[] = ['place5', 'place6', 'place8', 'place9'];
const OUTSIDE_KINDS: BetKind[] = ['place4', 'place10', 'field'];
const PROP_KINDS: BetKind[] = ['horn2', 'horn3', 'horn11', 'horn12', 'hard4', 'hard6', 'hard8', 'hard10', 'anyCraps', 'anySeven'];

export interface ModifierDef {
  id: RoundModifierId;
  label: string;
  /** If set, only these bet kinds may be placed or pay out this round. */
  allowedKinds?: BetKind[];
  /** If set, these specific bet kinds are disabled (on top of whatever allowedKinds permits). */
  disabledKinds?: BetKind[];
  payoutMultiplier?: number;
  rollLimitDelta?: number;
  minBetMultiplier?: number;
}

export const MODIFIERS: ModifierDef[] = [
  { id: 'coldTable', label: 'Cold Table: all payouts -25%', payoutMultiplier: 0.75 },
  { id: 'hotDice', label: 'Hot Dice: all payouts +25%', payoutMultiplier: 1.25 },
  { id: 'noSevens', label: "No Sevens: Any Seven bet disabled", disabledKinds: ['anySeven'] },
  { id: 'shortRolls', label: 'Short Rolls: 3 fewer rolls this round', rollLimitDelta: -3 },
  { id: 'fieldFreeze', label: 'Field Freeze: Field bet disabled', disabledKinds: ['field'] },
  { id: 'lineOnly', label: "Line Only: only Pass/Don't Pass/Come/Don't Come pay", allowedKinds: LINE_KINDS },
  { id: 'numbersOnly', label: 'Numbers Only: only Place bets pay', allowedKinds: PLACE_KINDS },
  { id: 'insideNumbers', label: 'Inside Numbers: only the 4 central Place bets pay', allowedKinds: INSIDE_KINDS },
  { id: 'outsideNumbers', label: 'Outside Numbers: only the longest-odds Place bets and Field pay', allowedKinds: OUTSIDE_KINDS },
  { id: 'propsOnly', label: 'Proposition Night: only Horn/Hard Ways/one-roll props pay', allowedKinds: PROP_KINDS },
  { id: 'highStakes', label: 'High Stakes: minimum bet doubled', minBetMultiplier: 2 },
];

const MODIFIER_BY_ID = new Map(MODIFIERS.map((m) => [m.id, m]));

export function getModifierDef(id: RoundModifierId | undefined): ModifierDef | undefined {
  return id ? MODIFIER_BY_ID.get(id) : undefined;
}

export function isKindAllowedByModifier(kind: BetKind, id: RoundModifierId | undefined): boolean {
  const def = getModifierDef(id);
  if (!def) return true;
  if (def.allowedKinds && !def.allowedKinds.includes(kind)) return false;
  if (def.disabledKinds && def.disabledKinds.includes(kind)) return false;
  return true;
}
