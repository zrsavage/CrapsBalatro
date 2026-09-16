import { useEffect, useState } from 'react';
import { useGameStore } from '../state/store';
import type { RunState } from '../game/types';
import { Die } from './Die';
import { BET_LABELS } from '../game/bets';

const SPIN_TICK_MS = 90;

export function DiceTray({ run, onRoll }: { run: RunState; onRoll: () => void }) {
  const isRolling = useGameStore((s) => s.isRolling);
  const pendingRoll = useGameStore((s) => s.pendingRoll);
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
      {diceCount > 2 && <div className="dice-hint">Best two of {diceCount} count toward your total.</div>}
      <button className="roll-btn" onClick={onRoll} disabled={!canRoll}>
        {isRolling ? 'Rolling…' : run.rollsRemaining > 0 ? `Roll (${run.rollsRemaining} left)` : 'No Rolls Left'}
      </button>
      {last && !isRolling && (
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
