import type { RunState } from '../game/types';
import { BOSS_EFFECT_LABELS } from '../game/run';

const ROUND_NAMES = ['Come Out', 'Point', 'Boss Shooter'];

export function Hud({ run }: { run: RunState }) {
  const roundScore = run.bankroll - run.roundStartBankroll;
  const pct = Math.max(0, Math.min(100, (roundScore / run.currentRound.target) * 100));

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
      </div>
      <div className="hud-target">
        <div className="hud-target-label">
          <span>
            Round Score: <strong>${roundScore}</strong> / ${run.currentRound.target}
          </span>
          <span>{run.shooter.phase === 'comeOut' ? 'Come Out Roll' : `Point is ${run.shooter.point}`}</span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {run.currentRound.bossEffect && (
        <div className="boss-banner">⚠ {BOSS_EFFECT_LABELS[run.currentRound.bossEffect]}</div>
      )}
    </div>
  );
}
