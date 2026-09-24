import { useEffect } from 'react';
import { useGameStore } from './state/store';
import { useCosmeticsStore } from './state/cosmeticsStore';
import { Hud } from './components/Hud';
import { DiceTray } from './components/DiceTray';
import { TableView } from './components/TableView';
import { BettingTable } from './components/BettingTable';
import { RelicBar } from './components/RelicBar';
import { DiceBag } from './components/DiceBag';
import { Shop } from './components/Shop';
import { RoundSelect } from './components/RoundSelect';
import { EndScreen } from './components/EndScreen';
import { MainMenu } from './components/MainMenu';
import { OptionsMenu } from './components/OptionsMenu';
import { StatsScreen } from './components/StatsScreen';
import { RelicCodex } from './components/RelicCodex';
import { PracticeMode } from './components/PracticeMode';
import { effectiveDiceCount } from './game/engine';

function App() {
  const run = useGameStore((s) => s.run);
  const shop = useGameStore((s) => s.shop);
  const runAchievements = useGameStore((s) => s.runAchievements);
  const screen = useGameStore((s) => s.screen);
  const isRolling = useGameStore((s) => s.isRolling);
  const pendingRoll = useGameStore((s) => s.pendingRoll);
  const rollDurationMs = useGameStore((s) => s.rollDurationMs);
  const placeBet = useGameStore((s) => s.placeBet);
  const removeBetsOfKind = useGameStore((s) => s.removeBetsOfKind);
  const roll = useGameStore((s) => s.roll);
  const cashOutRound = useGameStore((s) => s.cashOutRound);
  const buy = useGameStore((s) => s.buy);
  const rerollShop = useGameStore((s) => s.rerollShop);
  const setLoadout = useGameStore((s) => s.setLoadout);
  const continueToNextRound = useGameStore((s) => s.continueToNextRound);
  const chooseRound = useGameStore((s) => s.chooseRound);
  const restartRun = useGameStore((s) => s.restartRun);
  const startSeededRun = useGameStore((s) => s.startSeededRun);
  const enterGame = useGameStore((s) => s.enterGame);
  const goToMenu = useGameStore((s) => s.goToMenu);
  const goToOptions = useGameStore((s) => s.goToOptions);
  const goToStats = useGameStore((s) => s.goToStats);
  const goToRelicCodex = useGameStore((s) => s.goToRelicCodex);
  const startPractice = useGameStore((s) => s.startPractice);
  const exitPractice = useGameStore((s) => s.exitPractice);
  const practiceRun = useGameStore((s) => s.practiceRun);
  const practiceIsRolling = useGameStore((s) => s.practiceIsRolling);
  const practicePendingRoll = useGameStore((s) => s.practicePendingRoll);
  const practicePlaceBet = useGameStore((s) => s.practicePlaceBet);
  const practiceRemoveBetsOfKind = useGameStore((s) => s.practiceRemoveBetsOfKind);
  const practiceRoll = useGameStore((s) => s.practiceRoll);

  const selectedSkin = useCosmeticsStore((s) => s.selectedSkin);
  const selectedDice = useCosmeticsStore((s) => s.selectedDice);

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', selectedSkin);
  }, [selectedSkin]);

  useEffect(() => {
    document.documentElement.setAttribute('data-dice', selectedDice);
  }, [selectedDice]);

  if (screen === 'menu') {
    return (
      <div className="app">
        <MainMenu
          run={run}
          onPlay={enterGame}
          onNewRun={() => {
            restartRun();
            enterGame();
          }}
          onOptions={goToOptions}
          onStartSeeded={startSeededRun}
          onStats={goToStats}
          onRelicCodex={goToRelicCodex}
        />
      </div>
    );
  }

  if (screen === 'options') {
    return (
      <div className="app">
        <OptionsMenu onBack={goToMenu} onPractice={startPractice} />
      </div>
    );
  }

  if (screen === 'stats') {
    return (
      <div className="app">
        <StatsScreen onBack={goToMenu} />
      </div>
    );
  }

  if (screen === 'relicCodex') {
    return (
      <div className="app">
        <RelicCodex onBack={goToMenu} />
      </div>
    );
  }

  if (screen === 'practice' && practiceRun) {
    return (
      <PracticeMode
        run={practiceRun}
        isRolling={practiceIsRolling}
        pendingRoll={practicePendingRoll}
        onPlace={practicePlaceBet}
        onClearKind={practiceRemoveBetsOfKind}
        onRoll={practiceRoll}
        onExit={exitPractice}
      />
    );
  }

  return (
    <div className="app">
      <div className="title-bar">
        <h1>🎲 Crapslatro</h1>
        <div className="subtitle">Beat the House, 1 roll at a time.</div>
        <button className="menu-toggle" onClick={goToMenu}>
          ☰ Menu
        </button>
      </div>

      {(run.phase === 'gameOver' || run.phase === 'victory') && run.lastRunSummary && (
        <EndScreen
          summary={run.lastRunSummary}
          runAchievements={runAchievements}
          onRestart={restartRun}
          onMainMenu={goToMenu}
        />
      )}

      {run.phase === 'shop' && shop && (
        <Shop
          run={run}
          shop={shop}
          onBuy={buy}
          onReroll={rerollShop}
          onSetLoadout={setLoadout}
          onContinue={continueToNextRound}
        />
      )}

      {run.phase === 'roundSelect' && <RoundSelect run={run} onChoose={chooseRound} />}

      {(run.phase === 'run' || run.phase === 'rolling') && (
        <>
          <Hud run={run} onCashOut={cashOutRound} />
          <DiceTray run={run} isRolling={isRolling} pendingRoll={pendingRoll} rollDurationMs={rollDurationMs} onRoll={roll} />
          <TableView activeBets={run.activeBets} diceCount={effectiveDiceCount(run)} onClear={removeBetsOfKind} />
          <BettingTable run={run} isRolling={isRolling} onPlace={placeBet} onClearKind={removeBetsOfKind} />
          <RelicBar run={run} />
          <DiceBag run={run} onSetLoadout={setLoadout} />
        </>
      )}
    </div>
  );
}

export default App;
