import type { RunState } from '../game/types';

export function MainMenu({
  run,
  onPlay,
  onNewRun,
  onOptions,
}: {
  run: RunState;
  onPlay: () => void;
  onNewRun: () => void;
  onOptions: () => void;
}) {
  const inProgress = run.history.length > 0 || run.ante > 1 || run.phase !== 'run';
  const playLabel =
    run.phase === 'gameOver' || run.phase === 'victory' ? 'View Results' : inProgress ? 'Resume Run' : 'Play';

  return (
    <div className="main-menu">
      <div className="panel main-menu-hero">
        <h1>🎲 Crapslatro</h1>
        <div className="subtitle">Beat the House, 1 roll at a time.</div>
        <button className="roll-btn menu-play-btn" onClick={onPlay}>
          {playLabel}
        </button>
        {inProgress && run.phase !== 'gameOver' && run.phase !== 'victory' && (
          <button className="secondary-btn menu-new-run-btn" onClick={onNewRun}>
            Start a New Run Instead
          </button>
        )}
        <button className="secondary-btn menu-options-btn" onClick={onOptions}>
          ⚙ Options
        </button>
      </div>
    </div>
  );
}
