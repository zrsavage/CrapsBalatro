import type { RelicInstance, RunState, ShopOffer, ShopState } from './types';
import { RELIC_CATALOG } from '../data/relics';
import { DICE_CATALOG } from '../data/dice';
import { randInt } from './rng';

const RELIC_OFFER_COUNT = 3;
const DIE_OFFER_COUNT = 2;

let offerCounter = 0;
function nextOfferId(): string {
  offerCounter += 1;
  return `offer-${offerCounter}`;
}

export function generateShop(run: RunState, rng: () => number): ShopState {
  const ownedRelicIds = new Set(run.relics.map((r) => r.defId));
  const availableRelics = RELIC_CATALOG.filter((r) => !ownedRelicIds.has(r.id));

  const relicOffers: ShopOffer[] = [];
  const pool = [...availableRelics];
  for (let i = 0; i < RELIC_OFFER_COUNT && pool.length > 0; i++) {
    const idx = randInt(rng, 0, pool.length - 1);
    const def = pool.splice(idx, 1)[0];
    relicOffers.push({ id: nextOfferId(), type: 'relic', refId: def.id, price: def.price });
  }

  const purchasableDice = DICE_CATALOG.filter((d) => d.id !== 'standard');
  const dieOffers: ShopOffer[] = [];
  for (let i = 0; i < DIE_OFFER_COUNT; i++) {
    const def = purchasableDice[randInt(rng, 0, purchasableDice.length - 1)];
    dieOffers.push({ id: nextOfferId(), type: 'die', refId: def.id, price: def.price });
  }

  return {
    offers: [...relicOffers, ...dieOffers],
    rerollCost: 5 + run.ante * 2,
  };
}

export function canAfford(run: RunState, price: number): boolean {
  return run.bankroll >= price;
}

export function makeRelicInstance(defId: string): RelicInstance {
  return { instanceId: `relic-${defId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, defId };
}
