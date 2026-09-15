import type { RunState, ShopOffer, ShopState } from '../game/types';
import { getRelicDef } from '../data/relics';
import { getDieDef } from '../data/dice';
import { DiceBag } from './DiceBag';
import { DieFaces } from './DieFaces';

export function Shop({
  run,
  shop,
  onBuy,
  onReroll,
  onSetLoadout,
  onContinue,
}: {
  run: RunState;
  shop: ShopState;
  onBuy: (offer: ShopOffer) => void;
  onReroll: () => void;
  onSetLoadout: (ids: [string, string]) => void;
  onContinue: () => void;
}) {
  return (
    <div className="panel shop">
      <h2 className="shop-title">Shop — Ante {run.ante}</h2>
      <p className="shop-bankroll">
        <span className="comp-points">{run.comps} CP</span> to spend · Bankroll: ${run.bankroll}
      </p>

      <div className="shop-offers">
        {shop.offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} run={run} onBuy={onBuy} />
        ))}
      </div>

      <div className="shop-actions">
        <button className="secondary-btn" onClick={onReroll} disabled={run.comps < shop.rerollCost}>
          Reroll ({shop.rerollCost} CP)
        </button>
      </div>

      <DiceBag run={run} onSetLoadout={onSetLoadout} />

      <button className="roll-btn" onClick={onContinue}>
        Continue to Next Round
      </button>
    </div>
  );
}

function OfferCard({
  offer,
  run,
  onBuy,
}: {
  offer: ShopOffer;
  run: RunState;
  onBuy: (offer: ShopOffer) => void;
}) {
  const relicDef = offer.type === 'relic' ? getRelicDef(offer.refId) : undefined;
  const dieDef = offer.type === 'die' ? getDieDef(offer.refId) : undefined;
  const name = relicDef?.name ?? dieDef?.name ?? offer.refId;
  const desc = relicDef?.description ?? dieDef?.description ?? '';
  const rarity = relicDef?.rarity ?? dieDef?.rarity ?? 'common';
  const relicsFull = offer.type === 'relic' && run.relics.length >= run.relicSlots;
  const canAfford = run.comps >= offer.price;

  return (
    <div className={`offer-card rarity-${rarity}`}>
      <div className="offer-type">{offer.type === 'relic' ? 'Relic' : 'Die'}</div>
      <div className="offer-name">{name}</div>
      {dieDef && <DieFaces faces={dieDef.faces} />}
      <div className="offer-desc">{desc}</div>
      <button className="offer-buy" disabled={!canAfford || relicsFull} onClick={() => onBuy(offer)}>
        {relicsFull ? 'Slots Full' : `Buy ${offer.price} CP`}
      </button>
    </div>
  );
}
