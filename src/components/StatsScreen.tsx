import { useStatsStore } from '../state/statsStore';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function StatsScreen({ onBack }: { onBack: () => void }) {
  const records = useStatsStore((s) => s.records);

  const totalRuns = records.length;
  const wins = records.filter((r) => r.won).length;
  const winRate = totalRuns > 0 ? Math.round((wins / totalRuns) * 100) : 0;
  const bestAnte = records.reduce((max, r) => Math.max(max, r.anteReached), 0);
  const bestBankroll = records.reduce((max, r) => Math.max(max, r.finalBankroll), 0);

  return (
    <div className="main-menu">
      <div className="panel main-menu-hero">
        <h1>📊 Stats</h1>
        <button className="secondary-btn menu-back-btn" onClick={onBack}>
          ← Back to Menu
        </button>
      </div>

      <div className="panel main-menu-section">
        <span className="cosmetics-section-title">Career Totals</span>
        <div className="stats-summary-grid">
          <div className="stats-summary-cell">
            <span className="hud-label">Runs Played</span>
            <span className="hud-value">{totalRuns}</span>
          </div>
          <div className="stats-summary-cell">
            <span className="hud-label">Win Rate</span>
            <span className="hud-value">{winRate}%</span>
          </div>
          <div className="stats-summary-cell">
            <span className="hud-label">Best Ante</span>
            <span className="hud-value">{bestAnte || '—'}</span>
          </div>
          <div className="stats-summary-cell">
            <span className="hud-label">Best Bankroll</span>
            <span className="hud-value gold">${bestBankroll}</span>
          </div>
        </div>
      </div>

      <div className="panel main-menu-section">
        <span className="cosmetics-section-title">Recent Runs</span>
        {totalRuns === 0 ? (
          <p className="practice-menu-desc">No completed runs yet — finish a run (win or bust) to see it here.</p>
        ) : (
          <ul className="run-history-list">
            {records.map((r, i) => (
              <li key={i} className={r.won ? 'run-history-win' : 'run-history-loss'}>
                <span className="run-history-result">{r.won ? '🏆 Won' : '💀 Busted'}</span>
                <span>Ante {r.anteReached}, Round {r.roundReached}</span>
                <span>${r.finalBankroll}</span>
                <span className="run-history-date">{formatDate(r.endedAt)}</span>
                <span className="run-history-seed" title="Run seed">
                  #{r.seed}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
