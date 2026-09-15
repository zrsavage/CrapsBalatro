import type { RunState } from '../game/types';
import { getDieDef } from '../data/dice';

function faceLabel(face: number | 'wild'): string {
  return face === 'wild' ? '★' : String(face);
}

export function DiceBag({
  run,
  onSetLoadout,
}: {
  run: RunState;
  onSetLoadout: (ids: [string, string]) => void;
}) {
  const toggle = (instanceId: string) => {
    const [a, b] = run.loadout;
    if (instanceId === a || instanceId === b) return; // already equipped, ignore
    onSetLoadout([b, instanceId]); // swap out the older slot
  };

  return (
    <div className="panel dice-bag">
      <span className="dice-bag-title">Dice Bag (equip 2)</span>
      <div className="dice-bag-list">
        {run.dicePool.map((inst) => {
          const def = getDieDef(inst.defId);
          if (!def) return null;
          const equipped = run.loadout.includes(inst.instanceId);
          return (
            <button
              key={inst.instanceId}
              className={`dice-bag-item rarity-${def.rarity}${equipped ? ' equipped' : ''}`}
              onClick={() => toggle(inst.instanceId)}
              title={def.description}
            >
              <span className="dice-bag-name">{def.name}</span>
              <span className="dice-bag-faces">{def.faces.map(faceLabel).join(' ')}</span>
              {equipped && <span className="equipped-tag">Equipped</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
