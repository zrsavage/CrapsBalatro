import type { RunState } from '../game/types';
import { getDieDef } from '../data/dice';
import { effectiveDiceCount } from '../game/engine';
import { DieFaces } from './DieFaces';

export function DiceBag({
  run,
  onSetLoadout,
}: {
  run: RunState;
  onSetLoadout: (ids: string[]) => void;
}) {
  const slots = effectiveDiceCount(run);

  const toggle = (instanceId: string) => {
    if (run.loadout.includes(instanceId)) return; // already equipped, ignore
    // drop the oldest-equipped die, add the newly picked one
    onSetLoadout([...run.loadout.slice(1), instanceId]);
  };

  return (
    <div className="panel dice-bag">
      <span className="dice-bag-title">Dice Bag (equip {slots})</span>
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
              <DieFaces faces={def.faces} />
              {equipped && <span className="equipped-tag">Equipped</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
