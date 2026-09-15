import { getAchievementDef } from '../data/achievements';
import { useCosmeticsStore } from '../state/cosmeticsStore';

export function UnlockToast() {
  const lastUnlocked = useCosmeticsStore((s) => s.lastUnlocked);
  const dismiss = useCosmeticsStore((s) => s.dismissUnlockToast);

  if (lastUnlocked.length === 0) return null;

  return (
    <div className="unlock-toast">
      {lastUnlocked.map((id) => {
        const def = getAchievementDef(id);
        if (!def) return null;
        return (
          <div key={id} className="unlock-toast-item">
            🏆 Achievement unlocked: <strong>{def.name}</strong> — {def.unlockLabel}
          </div>
        );
      })}
      <button className="unlock-toast-close" onClick={dismiss}>
        Dismiss
      </button>
    </div>
  );
}
