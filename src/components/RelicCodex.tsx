import { RELIC_CATALOG } from '../data/relics';
import { useCosmeticsStore } from '../state/cosmeticsStore';

export function RelicCodex({ onBack }: { onBack: () => void }) {
  const discovered = useCosmeticsStore((s) => s.discoveredRelics);
  const discoveredSet = new Set(discovered);
  const found = RELIC_CATALOG.filter((r) => discoveredSet.has(r.id)).length;

  return (
    <div className="main-menu">
      <div className="panel main-menu-hero">
        <h1>📖 Relic Codex</h1>
        <button className="secondary-btn menu-back-btn" onClick={onBack}>
          ← Back to Menu
        </button>
      </div>

      <div className="panel main-menu-section">
        <span className="cosmetics-section-title">
          Discovered ({found}/{RELIC_CATALOG.length})
        </span>
        <p className="practice-menu-desc">Buy a relic once and it's revealed here for good — a running record of everything you've found.</p>
        <ul className="relic-codex-list">
          {RELIC_CATALOG.map((r) => {
            const isKnown = discoveredSet.has(r.id);
            return (
              <li
                key={r.id}
                className={`relic-codex-entry rarity-${r.rarity}${isKnown ? '' : ' relic-codex-unknown'}${isKnown && r.curse ? ' relic-chip-curse' : ''}`}
              >
                {isKnown ? (
                  <>
                    <span className="relic-codex-name">
                      {r.curse && <span className="curse-badge">CURSE</span>}
                      {r.name}
                    </span>
                    <span className="relic-codex-desc">{r.description}</span>
                  </>
                ) : (
                  <>
                    <span className="relic-codex-name">🔒 ???</span>
                    <span className="relic-codex-desc">A {r.rarity} relic — not yet discovered.</span>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
