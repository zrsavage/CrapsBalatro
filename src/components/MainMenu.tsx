import { useState } from 'react';
import type { RunState } from '../game/types';
import { dailySeedForToday, hashStringToSeed } from '../game/rng';

export function MainMenu({
  run,
  onPlay,
  onNewRun,
  onOptions,
  onStartSeeded,
  onStats,
}: {
  run: RunState;
  onPlay: () => void;
  onNewRun: () => void;
  onOptions: () => void;
  onStartSeeded: (seed: number) => void;
  onStats: () => void;
}) {
  const inProgress = run.history.length > 0 || run.ante > 1 || run.phase !== 'run';
  const playLabel =
    run.phase === 'gameOver' || run.phase === 'victory' ? 'View Results' : inProgress ? 'Resume Run' : 'Play';
  const [seedInput, setSeedInput] = useState('');

  const startCustomSeed = () => {
    const trimmed = seedInput.trim();
    if (!trimmed) return;
    const asNumber = /^\d+$/.test(trimmed) ? Number(trimmed) >>> 0 : hashStringToSeed(trimmed);
    onStartSeeded(asNumber);
  };

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
        <button className="secondary-btn menu-stats-btn" onClick={onStats}>
          📊 Stats
        </button>
      </div>

      <div className="panel main-menu-section">
        <span className="cosmetics-section-title">Seeded Runs</span>
        <p className="practice-menu-desc">
          Play a specific starting seed — for a fair race against a friend, or to try the same run again.
        </p>
        <div className="practice-menu-row">
          <button className="secondary-btn" onClick={() => onStartSeeded(dailySeedForToday())}>
            🗓 Daily Challenge
          </button>
        </div>
        <div className="seed-entry-row">
          <input
            className="seed-entry-input"
            type="text"
            placeholder="Enter a seed or code..."
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && startCustomSeed()}
          />
          <button className="secondary-btn" disabled={!seedInput.trim()} onClick={startCustomSeed}>
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
