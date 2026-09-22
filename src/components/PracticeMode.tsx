import type { BetKind, RollResult, RunState } from '../game/types';
import { getTierTable } from '../game/diceTiers';
import { DiceTray } from './DiceTray';
import { TableView } from './TableView';
import { BettingTable } from './BettingTable';
import { ROLL_ANIMATION_MS } from '../state/store';

export function PracticeMode({
  run,
  isRolling,
  pendingRoll,
  onPlace,
  onClearKind,
  onRoll,
  onExit,
}: {
  run: RunState;
  isRolling: boolean;
  pendingRoll: RollResult | null;
  onPlace: (kind: BetKind, amount: number) => void;
  onClearKind: (kind: BetKind) => void;
  onRoll: () => void;
  onExit: () => void;
}) {
  const diceCount = run.loadout.length;
  const table = getTierTable(diceCount);

  return (
    <div className="app">
      <div className="panel practice-banner">
        <span className="practice-banner-title">🎲 Practice Mode — {diceCount} Dice</span>
        <span className="practice-banner-sub">
          Unlimited bankroll, no losses. Just get a feel for the {table.min}-{table.max} range.
        </span>
        <button className="secondary-btn" onClick={onExit}>
          Exit to Menu
        </button>
      </div>

      <DiceTray run={run} isRolling={isRolling} pendingRoll={pendingRoll} rollDurationMs={ROLL_ANIMATION_MS} onRoll={onRoll} />
      <TableView activeBets={run.activeBets} diceCount={diceCount} onClear={onClearKind} />
      <BettingTable run={run} isRolling={isRolling} onPlace={onPlace} onClearKind={onClearKind} />
    </div>
  );
}
