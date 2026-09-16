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
import { EndScreen } from './components/EndScreen';
import { MainMenu } from './components/MainMenu';

function App() {
  const run = useGameStore((s) => s.run);
  const shop = useGameStore((s) => s.shop);
  const runAchievements = useGameStore((s) => s.runAchievements);
  const screen = useGameStore((s) => s.screen);
  const placeBet = useGameStore((s) => s.placeBet);
  const removeBetsOfKind = useGameStore((s) => s.removeBetsOfKind);
  const roll = useGameStore((s) => s.roll);
  const cashOutRound = useGameStore((s) => s.cashOutRound);
  const buy = useGameStore((s) => s.buy);
  const rerollShop = useGameStore((s) => s.rerollShop);
  const setLoadout = useGameStore((s) => s.setLoadout);
  const continueToNextRound = useGameStore((s) => s.continueToNextRound);
  const restartRun = useGameStore((s) => s.restartRun);
  const enterGame = useGameStore((s) => s.enterGame);
  const goToMenu = useGameStore((s) => s.goToMenu);

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
        <MainMenu run={run} onPlay={enterGame} onNewRun={() => { restartRun(); enterGame(); }} />
      </div>
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

      {(run.phase === 'run' || run.phase === 'rolling') && (
        <>
          <Hud run={run} onCashOut={cashOutRound} />
          <DiceTray run={run} onRoll={roll} />
          <TableView activeBets={run.activeBets} onClear={removeBetsOfKind} />
          <BettingTable run={run} onPlace={placeBet} onClearKind={removeBetsOfKind} />
          <RelicBar run={run} />
          <DiceBag run={run} onSetLoadout={setLoadout} />
        </>
      )}
    </div>
  );
}

export default App;
