import type { RunState } from '../game/types';
import { ACHIEVEMENTS } from '../data/achievements';
import { DICE_COLORS, SKINS } from '../data/cosmetics';
import { useCosmeticsStore } from '../state/cosmeticsStore';

export function MainMenu({
  run,
  onPlay,
  onNewRun,
}: {
  run: RunState;
  onPlay: () => void;
  onNewRun: () => void;
}) {
  const unlocked = useCosmeticsStore((s) => s.unlockedAchievements);
  const selectedSkin = useCosmeticsStore((s) => s.selectedSkin);
  const selectedDice = useCosmeticsStore((s) => s.selectedDice);
  const selectSkin = useCosmeticsStore((s) => s.selectSkin);
  const selectDice = useCosmeticsStore((s) => s.selectDice);

  const unlockedSkinIds = new Set([
    'casino-gold',
    ...unlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.unlockId).filter(Boolean),
  ]);
  const unlockedDiceIds = new Set([
    'ivory',
    ...unlocked.map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.unlockId).filter(Boolean),
  ]);

  const inProgress = run.history.length > 0 || run.ante > 1 || run.phase !== 'run';
  const playLabel =
    run.phase === 'gameOver' || run.phase === 'victory' ? 'View Results' : inProgress ? 'Resume Run' : 'Play';

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
      </div>

      <div className="panel main-menu-section">
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
      </div>

      <div className="panel main-menu-section">
        <span className="cosmetics-section-title">
          Achievements ({unlocked.length}/{ACHIEVEMENTS.length})
        </span>
        <span className="cosmetics-section-title">Starter</span>
        <ul className="achievement-list">
          {ACHIEVEMENTS.filter((a) => a.tier === 1).map((a) => {
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

        <span className="cosmetics-section-title">Hard</span>
        <ul className="achievement-list">
          {ACHIEVEMENTS.filter((a) => a.tier === 2).map((a) => {
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

      <div className="panel main-menu-section main-menu-options-placeholder">
        <span className="cosmetics-section-title">Options</span>
        <p>More settings — sound, difficulty, and beyond — will land here in a future update.</p>
      </div>
    </div>
  );
}
