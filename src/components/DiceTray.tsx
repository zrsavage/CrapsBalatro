import type { RunState } from '../game/types';
import { Die } from './Die';
import { BET_LABELS } from '../game/bets';

export function DiceTray({
  run,
  onRoll,
  rollFlash,
}: {
  run: RunState;
  onRoll: () => void;
  rollFlash: number;
}) {
  const last = run.history[run.history.length - 1];
  const dice = last?.roll.dice ?? [1, 1];
  const canRoll = run.phase === 'run' && run.rollsRemaining > 0;

  return (
    <div className="panel dice-tray">
      <div className="dice-row">
        <Die key={`a-${rollFlash}`} value={dice[0]} rolling={rollFlash > 0} />
        <Die key={`b-${rollFlash}`} value={dice[1]} rolling={rollFlash > 0} />
        <div className="dice-total">{last ? last.roll.total : '–'}</div>
      </div>
      <button className="roll-btn" onClick={onRoll} disabled={!canRoll}>
        {canRoll ? `Roll (${run.rollsRemaining} left)` : 'No Rolls Left'}
      </button>
      {last && (
        <ul className="roll-feed">
          {last.resolutions.length === 0 && <li className="feed-neutral">No bets resolved.</li>}
          {last.resolutions.map((r, i) => (
            <li key={i} className={`feed-${r.result}`}>
              {BET_LABELS[r.kind]}{' '}
              {r.result === 'win'
                ? `won $${r.payout - r.amount}`
                : r.result === 'lose'
                ? `lost $${r.amount}`
                : r.result === 'push'
                ? 'pushed'
                : r.movedToPoint
                ? `now on ${r.movedToPoint}`
                : 'still working'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
