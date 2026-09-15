import { useState } from 'react';
import { ACHIEVEMENTS } from '../data/achievements';
import { DICE_COLORS, SKINS } from '../data/cosmetics';
import { useCosmeticsStore } from '../state/cosmeticsStore';

export function CosmeticsPanel() {
  const [open, setOpen] = useState(false);
  const unlocked = useCosmeticsStore((s) => s.unlockedAchievements);
  const selectedSkin = useCosmeticsStore((s) => s.selectedSkin);
  const selectedDice = useCosmeticsStore((s) => s.selectedDice);
  const selectSkin = useCosmeticsStore((s) => s.selectSkin);
  const selectDice = useCosmeticsStore((s) => s.selectDice);

  const unlockedSkinIds = new Set(['casino-gold', ...unlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.unlockId).filter(Boolean)]);
  const unlockedDiceIds = new Set(['ivory', ...unlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.unlockId).filter(Boolean)]);

  return (
    <>
      <button className="cosmetics-toggle" onClick={() => setOpen(true)}>
        🏆 Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
      </button>
      {open && (
        <div className="cosmetics-overlay" onClick={() => setOpen(false)}>
          <div className="panel cosmetics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cosmetics-header">
              <h2>Achievements &amp; Cosmetics</h2>
              <button className="cosmetics-close" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>

            <span className="cosmetics-section-title">Table Skin</span>
            <div className="swatch-row">
              {SKINS.map((skin) => {
                const isUnlocked = unlockedSkinIds.has(skin.id);
                return (
                  <button
                    key={skin.id}
                    className={`swatch${selectedSkin === skin.id ? ' swatch-selected' : ''}${!isUnlocked ? ' swatch-locked' : ''}`}
                    disabled={!isUnlocked}
                    onClick={() => selectSkin(skin.id)}
                    style={{ background: skin.swatch[0], borderColor: skin.swatch[1] }}
                    title={isUnlocked ? skin.name : `${skin.name} (locked)`}
                  >
                    <span style={{ color: skin.swatch[1] }}>{isUnlocked ? skin.name : '🔒'}</span>
                  </button>
                );
              })}
            </div>

            <span className="cosmetics-section-title">Dice Color</span>
            <div className="swatch-row">
              {DICE_COLORS.map((dc) => {
                const isUnlocked = unlockedDiceIds.has(dc.id);
                return (
                  <button
                    key={dc.id}
                    className={`swatch${selectedDice === dc.id ? ' swatch-selected' : ''}${!isUnlocked ? ' swatch-locked' : ''}`}
                    disabled={!isUnlocked}
                    onClick={() => selectDice(dc.id)}
                    style={{ background: dc.swatch[0], borderColor: dc.swatch[1] }}
                    title={isUnlocked ? dc.name : `${dc.name} (locked)`}
                  >
                    <span style={{ color: dc.swatch[1] }}>{isUnlocked ? dc.name : '🔒'}</span>
                  </button>
                );
              })}
            </div>

            <span className="cosmetics-section-title">Achievements</span>
            <ul className="achievement-list">
              {ACHIEVEMENTS.map((a) => {
                const done = unlocked.includes(a.id);
                return (
                  <li key={a.id} className={done ? 'achievement-done' : 'achievement-locked'}>
                    <span className="achievement-icon">{done ? '✅' : '🔒'}</span>
                    <span className="achievement-body">
                      <span className="achievement-name">{a.name}</span>
                      <span className="achievement-desc">{a.description}</span>
                      <span className="achievement-reward">Unlocks: {a.unlockLabel}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
