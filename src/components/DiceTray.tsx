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
  const diceCount = pendingRoll?.dice.length ?? last?.roll.dice.length ?? run.loadout.length;
  const restingDice: number[] = last?.roll.dice ?? Array(diceCount).fill(1);
  const [displayDice, setDisplayDice] = useState<number[]>(restingDice);

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
      setDisplayDice(pendingRoll.dice.map(() => 1 + Math.floor(Math.random() * 6)));
    }, SPIN_TICK_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {diceCount > 2 && <div className="dice-hint">Best two of three count toward your total.</div>}
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
