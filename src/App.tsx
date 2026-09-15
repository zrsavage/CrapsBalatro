import { useEffect } from 'react';
import { useGameStore } from './state/store';
import { useCosmeticsStore } from './state/cosmeticsStore';
import { Hud } from './components/Hud';
import { DiceTray } from './components/DiceTray';
import { BettingTable } from './components/BettingTable';
import { RelicBar } from './components/RelicBar';
import { DiceBag } from './components/DiceBag';
import { Shop } from './components/Shop';
import { EndScreen } from './components/EndScreen';
import { CosmeticsPanel } from './components/CosmeticsPanel';
import { UnlockToast } from './components/UnlockToast';

function App() {
  const run = useGameStore((s) => s.run);
  const shop = useGameStore((s) => s.shop);
  const placeBet = useGameStore((s) => s.placeBet);
  const removeBetsOfKind = useGameStore((s) => s.removeBetsOfKind);
  const roll = useGameStore((s) => s.roll);
  const cashOutRound = useGameStore((s) => s.cashOutRound);
  const buy = useGameStore((s) => s.buy);
  const rerollShop = useGameStore((s) => s.rerollShop);
  const setLoadout = useGameStore((s) => s.setLoadout);
  const continueToNextRound = useGameStore((s) => s.continueToNextRound);
  const restartRun = useGameStore((s) => s.restartRun);

  const selectedSkin = useCosmeticsStore((s) => s.selectedSkin);
  const selectedDice = useCosmeticsStore((s) => s.selectedDice);

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', selectedSkin);
  }, [selectedSkin]);

  useEffect(() => {
    document.documentElement.setAttribute('data-dice', selectedDice);
  }, [selectedDice]);

  return (
    <div className="app">
      <div className="title-bar">
        <h1>🎲 CrapsBalatro</h1>
        <div className="subtitle">Beat the house, ante after ante.</div>
        <CosmeticsPanel />
      </div>

      <UnlockToast />

      {(run.phase === 'gameOver' || run.phase === 'victory') && run.lastRunSummary && (
        <EndScreen summary={run.lastRunSummary} onRestart={restartRun} />
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
          <BettingTable run={run} onPlace={placeBet} onClearKind={removeBetsOfKind} />
          <RelicBar run={run} />
          <DiceBag run={run} onSetLoadout={setLoadout} />
        </>
      )}
    </div>
  );
}

export default App;
