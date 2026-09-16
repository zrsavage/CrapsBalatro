import { useEffect, useState } from 'react';
import type { BetKind, RunState } from '../game/types';
import { BASE_ODDS, BET_LABELS, isBetAllowedNow } from '../game/bets';
import { chipDenominations } from '../game/run';
import { useGameStore } from '../state/store';

function oddsLabel(kind: BetKind): string {
  const [num, den] = BASE_ODDS[kind];
  return `${num}:${den}`;
}

const SIMPLE_ROWS: { title: string; kinds: BetKind[] }[] = [
  { title: 'Line', kinds: ['pass', 'dontPass'] },
  { title: 'Field', kinds: ['field'] },
  { title: 'Place', kinds: ['place4', 'place5', 'place6', 'place8', 'place9', 'place10'] },
  { title: 'Hard Ways', kinds: ['hard4', 'hard6', 'hard8', 'hard10'] },
  { title: 'One Roll', kinds: ['anyCraps', 'anySeven'] },
  { title: 'Horn', kinds: ['horn2', 'horn3', 'horn11', 'horn12'] },
];

export function BettingTable({
  run,
  onPlace,
  onClearKind,
}: {
  run: RunState;
  onPlace: (kind: BetKind, amount: number) => void;
  onClearKind: (kind: BetKind) => void;
}) {
  const chipAmounts = chipDenominations(run.ante);
  const [chip, setChip] = useState(chipAmounts[1]);
  useEffect(() => {
    setChip(chipDenominations(run.ante)[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.ante]);
  const isRolling = useGameStore((s) => s.isRolling);
  const disabled = run.phase !== 'run' || run.rollsRemaining <= 0 || isRolling;

  const totalsByKind = new Map<BetKind, number>();
  for (const bet of run.activeBets) {
    totalsByKind.set(bet.kind, (totalsByKind.get(bet.kind) ?? 0) + bet.amount);
  }

  const comeBets = run.activeBets.filter((b) => b.kind === 'come' || b.kind === 'dontCome');

  return (
    <div className="panel betting-table">
      <div className="chip-selector">
        {chipAmounts.map((amt) => (
          <button
            key={amt}
            className={`chip${chip === amt ? ' chip-selected' : ''}`}
            onClick={() => setChip(amt)}
          >
            ${amt}
          </button>
        ))}
        <span className="chip-hint">Tap a spot to bet ${chip}. Bankroll: ${run.bankroll}</span>
      </div>

      {SIMPLE_ROWS.map((row) => (
        <div className="bet-row" key={row.title}>
          <span className="bet-row-title">{row.title}</span>
          <div className="bet-spots">
            {row.kinds.map((kind) => (
              <BetSpot
                key={kind}
                label={BET_LABELS[kind]}
                odds={oddsLabel(kind)}
                amount={totalsByKind.get(kind) ?? 0}
                allowed={!disabled && isBetAllowedNow(kind, run.shooter) && chip <= run.bankroll}
                clearAllowed={!isRolling}
                onAdd={() => onPlace(kind, chip)}
                onClear={() => onClearKind(kind)}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="bet-row">
        <span className="bet-row-title">Come</span>
        <div className="bet-spots">
          <button
            className="bet-spot bet-spot-action"
            disabled={disabled || !isBetAllowedNow('come', run.shooter) || chip > run.bankroll}
            onClick={() => onPlace('come', chip)}
          >
            + Come
          </button>
          <button
            className="bet-spot bet-spot-action"
            disabled={disabled || !isBetAllowedNow('dontCome', run.shooter) || chip > run.bankroll}
            onClick={() => onPlace('dontCome', chip)}
          >
            + Don't Come
          </button>
        </div>
      </div>

      {comeBets.length > 0 && (
        <ul className="working-bets">
          {comeBets.map((b) => (
            <li key={b.id}>
              {BET_LABELS[b.kind]} ${b.amount} {b.point !== undefined ? `on ${b.point}` : '(coming)'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BetSpot({
  label,
  odds,
  amount,
  allowed,
  clearAllowed,
  onAdd,
  onClear,
}: {
  label: string;
  odds: string;
  amount: number;
  allowed: boolean;
  clearAllowed: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  return (
    <div className={`bet-spot${amount > 0 ? ' bet-spot-active' : ''}`}>
      <button className="bet-spot-main" disabled={!allowed} onClick={onAdd}>
        {label}
        <span className="bet-spot-odds">{odds}</span>
        {amount > 0 && <span className="bet-spot-amount">${amount}</span>}
      </button>
      {amount > 0 && clearAllowed && (
        <button className="bet-spot-clear" onClick={onClear} aria-label={`Clear ${label}`}>
          ×
        </button>
      )}
    </div>
  );
}
