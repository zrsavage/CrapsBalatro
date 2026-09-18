import { useEffect, useState } from 'react';
import type { RollResult, RunState } from '../game/types';
import { Die } from './Die';
import { getBetLabel } from '../game/bets';
import { getTierTable } from '../game/diceTiers';

const SPIN_TICK_MS = 90;

export function DiceTray({
  run,
  isRolling,
  pendingRoll,
  onRoll,
}: {
  run: RunState;
  isRolling: boolean;
  pendingRoll: RollResult | null;
  onRoll: () => void;
}) {
  const last = run.history[run.history.length - 1];
  // The current loadout is the source of truth for dice count — it can
  // change (ante escalation) between rounds before a new roll happens, so
  // a stale `last` roll from a smaller/larger board must never override it.
  const diceCount = run.loadout.length;
  const restingDice: number[] =
    last && last.roll.dice.length === diceCount ? last.roll.dice : Array(diceCount).fill(1);
  const [animatedDice, setAnimatedDice] = useState<number[] | null>(null);
  const displayDice = isRolling ? (animatedDice ?? restingDice) : restingDice;

  useEffect(() => {
    if (!isRolling || !pendingRoll) return; // nothing to animate right now
    let ticks = 0;
    const totalTicks = 8;
    const interval = setInterval(() => {
      ticks += 1;
      if (ticks >= totalTicks) {
        setAnimatedDice(pendingRoll.dice);
        clearInterval(interval);
        return;
      }
      setAnimatedDice(pendingRoll.dice.map(() => 1 + Math.floor(Math.random() * 6)));
    }, SPIN_TICK_MS);
    return () => clearInterval(interval);
  }, [isRolling, pendingRoll]);

  const canRoll = run.phase === 'run' && run.rollsRemaining > 0 && !isRolling;
  const shownTotal = isRolling ? pendingRoll?.total : last?.roll.total;

  return (
    <div className="panel dice-tray">
      <div className="dice-row">
        {displayDice.map((v, i) => (
          <Die key={i} value={v} rolling={isRolling} />
        ))}
        <div className="dice-total">{shownTotal ?? '–'}</div>
      </div>
      {diceCount > 2 && (
        <div className="dice-hint">
          All {diceCount} dice count toward your total ({getTierTable(diceCount).min}-{getTierTable(diceCount).max}).
        </div>
      )}
      <button className="roll-btn" onClick={onRoll} disabled={!canRoll}>
        {isRolling
          ? 'Rolling…'
          : run.rollsRemaining >= 99999
          ? 'Roll (∞)'
          : run.rollsRemaining > 0
          ? `Roll (${run.rollsRemaining} left)`
          : 'No Rolls Left'}
      </button>
      {last && !isRolling && (
        <ul className="roll-feed">
          {last.resolutions.length === 0 && <li className="feed-neutral">No bets resolved.</li>}
          {last.resolutions.map((r, i) => (
            <li key={i} className={`feed-${r.result}`}>
              {getBetLabel(r.kind, last.roll.dice.length)}{' '}
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
