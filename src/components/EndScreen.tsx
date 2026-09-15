import type { RunSummary } from '../game/types';

export function EndScreen({ summary, onRestart }: { summary: RunSummary; onRestart: () => void }) {
  return (
    <div className="panel end-screen">
      <h2 className={summary.won ? 'end-title win' : 'end-title lose'}>
        {summary.won ? 'You beat the house!' : 'The house wins this run'}
      </h2>
      <p>
        Reached Ante {summary.anteReached}, Round {summary.roundReached}
      </p>
      <p>Final bankroll: ${summary.finalBankroll}</p>
      <button className="roll-btn" onClick={onRestart}>
        Start New Run
      </button>
    </div>
  );
}
