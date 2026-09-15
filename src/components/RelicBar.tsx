import type { RunState } from '../game/types';
import { getRelicDef } from '../data/relics';

export function RelicBar({ run }: { run: RunState }) {
  return (
    <div className="panel relic-bar">
      <span className="relic-bar-title">
        Relics ({run.relics.length}/{run.relicSlots})
      </span>
      <div className="relic-list">
        {run.relics.length === 0 && <span className="relic-empty">No relics yet</span>}
        {run.relics.map((inst) => {
          const def = getRelicDef(inst.defId);
          if (!def) return null;
          return (
            <div className={`relic-chip rarity-${def.rarity}`} key={inst.instanceId} title={def.description}>
              {def.name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
