import type { RunState } from '../game/types';
import { BOSS_EFFECT_LABELS } from '../game/run';
import { canEndRoundEarly, earlyCashOutBonusPerRoll } from '../game/engine';

const ROUND_NAMES = ['Round 1 of 3', 'Round 2 of 3', 'Boss Round'];

export function Hud({ run, onCashOut }: { run: RunState; onCashOut: () => void }) {
  const roundScore = run.bankroll - run.roundStartBankroll;
  const target = run.currentRound.target;
  const canCashOut = canEndRoundEarly(run);
  const cashOutBonus = run.rollsRemaining * earlyCashOutBonusPerRoll(run);

  const rightPct = Math.max(0, Math.min(100, (roundScore / target) * 100));
  const lossBasis = Math.max(1, run.roundStartBankroll);
  const leftPct = roundScore < 0 ? Math.max(0, Math.min(100, (-roundScore / lossBasis) * 100)) : 0;

  return (
    <div className="panel hud">
      <div className="hud-row">
        <div className="hud-stat">
          <span className="hud-label">Ante</span>
          <span className="hud-value">{run.ante} / 8</span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Round</span>
          <span className="hud-value">{ROUND_NAMES[run.roundIndex]}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Rolls Left</span>
          <span className="hud-value">{run.rollsRemaining}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Bankroll</span>
          <span className="hud-value gold">${run.bankroll}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Comps</span>
          <span className="hud-value comp-points">{run.comps}</span>
        </div>
      </div>

      {run.shooter.phase === 'point' ? (
        <div className="point-callout">
          <span className="point-callout-text">Point is on — need</span>
          <span className="point-callout-number">{run.shooter.point}</span>
          <span className="point-callout-text">to win Pass / lose Don't Pass</span>
        </div>
      ) : (
        <div className="point-callout point-callout-comeout">Come-Out Roll — 7 or 11 wins Pass, 2/3/12 loses it</div>
      )}

      <div className="hud-target">
        <div className="hud-target-label">
          <span>Bust: $0</span>
          <span>
            Net: <strong className={roundScore < 0 ? 'negative' : undefined}>${roundScore}</strong>
          </span>
          <span>Goal: ${target}</span>
        </div>
        <div className="dual-gauge-track">
          <div className="dual-gauge-half dual-gauge-left">
            <div className="dual-gauge-fill dual-gauge-fill-lose" style={{ width: `${leftPct}%` }} />
          </div>
          <div className="dual-gauge-center-tick" />
          <div className="dual-gauge-half dual-gauge-right">
            <div className="dual-gauge-fill dual-gauge-fill-win" style={{ width: `${rightPct}%` }} />
          </div>
        </div>
      </div>

      {canCashOut && (
        <button className="cash-out-btn" onClick={onCashOut}>
          Cash Out Now — bank the win +${cashOutBonus} bonus
        </button>
      )}
      {run.currentRound.bossEffect && (
        <div className="boss-banner">⚠ {BOSS_EFFECT_LABELS[run.currentRound.bossEffect]}</div>
      )}
    </div>
  );
}
