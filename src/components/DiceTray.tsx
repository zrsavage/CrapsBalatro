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
  const restingDice: [number, number] = last?.roll.dice ?? [1, 1];
  const [displayDice, setDisplayDice] = useState<[number, number]>(restingDice);

  useEffect(() => {
    if (!isRolling || !pendingRoll) {
      setDisplayDice(restingDice);
      return;
    }
    let ticks = 0;
    const totalTicks = 8;
    const interval = setInterval(() => {
      ticks += 1;
      if (ticks >= totalTicks) {
        setDisplayDice(pendingRoll.dice);
        clearInterval(interval);
        return;
      }
      setDisplayDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
    }, SPIN_TICK_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRolling, pendingRoll]);

  const canRoll = run.phase === 'run' && run.rollsRemaining > 0 && !isRolling;

  return (
    <div className="panel dice-tray">
      <div className="dice-row">
        <Die value={displayDice[0]} rolling={isRolling} />
        <Die value={displayDice[1]} rolling={isRolling} />
        <div className="dice-total">{last || isRolling ? displayDice[0] + displayDice[1] : '–'}</div>
      </div>
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
