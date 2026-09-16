import type { RunSummary } from '../game/types';
import { getAchievementDef } from '../data/achievements';

export function EndScreen({
  summary,
  runAchievements,
  onRestart,
}: {
  summary: RunSummary;
  runAchievements: string[];
  onRestart: () => void;
}) {
  return (
    <div className="panel end-screen">
      <h2 className={summary.won ? 'end-title win' : 'end-title lose'}>
        {summary.won ? 'You beat the house!' : 'The house wins this run'}
      </h2>
      <p>
        Reached Ante {summary.anteReached}, Round {summary.roundReached}
      </p>
      <p>Final bankroll: ${summary.finalBankroll}</p>

      {runAchievements.length > 0 && (
        <div className="run-achievements">
          <span className="cosmetics-section-title">Achievements Earned This Run</span>
          <ul className="achievement-list">
            {runAchievements.map((id) => {
              const def = getAchievementDef(id);
              if (!def) return null;
              return (
                <li key={id} className="achievement-done">
                  <span className="achievement-icon">🏆</span>
                  <span className="achievement-body">
                    <span className="achievement-name">{def.name}</span>
                    <span className="achievement-desc">{def.description}</span>
                    <span className="achievement-reward">Unlocked: {def.unlockLabel}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <button className="roll-btn" onClick={onRestart}>
        Start New Run
      </button>
    </div>
  );
}
