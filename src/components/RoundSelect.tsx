import type { RoundChoice, RunState } from '../game/types';
import { getModifierDef } from '../data/modifiers';

const KIND_LABEL: Record<string, string> = {
  comeOut: 'Come-Out Round',
  point: 'Point Round',
  boss: 'Boss Round',
};

export function RoundSelect({
  run,
  onChoose,
}: {
  run: RunState;
  onChoose: (choice: RoundChoice) => void;
}) {
  const choices = run.roundChoices ?? [];
  const isBoss = choices.length === 1 && choices[0].round.kind === 'boss';

  return (
    <div className="panel round-select">
      <h2 className="round-select-title">{isBoss ? '⚠ Boss Round Ahead' : `Ante ${run.ante} — Choose Your Round`}</h2>
      {!isBoss && <p className="round-select-sub">Pick a target, then commit — you'll see the round rules before you bet a chip.</p>}

      <div className="round-select-cards">
        {choices.map((choice) => {
          const modDef = getModifierDef(choice.round.modifier);
          return (
            <div key={choice.id} className={`round-choice-card${choice.id === 'highStakes' ? ' round-choice-risky' : ''}`}>
              <div className="round-choice-kind">{KIND_LABEL[choice.round.kind]}</div>
              <div className="round-choice-label">{choice.label}</div>
              <div className="round-choice-stats">
                <span>Target: <strong>${choice.round.target}</strong></span>
                <span>Rolls: <strong>{choice.round.rollLimit}</strong></span>
              </div>
              {modDef && <div className="round-choice-modifier">{modDef.label}</div>}
              <p className="round-choice-blurb">{choice.blurb}</p>
              <button className="roll-btn" onClick={() => onChoose(choice)}>
                {isBoss ? 'Begin Boss Round' : `Play ${choice.label}`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
