# Crapslatro

A Balatro-style roguelike deckbuilder — but instead of scoring poker hands, you're working a craps table.

## The loop

- Each **round** gives you a limited number of dice rolls to net a target amount of winnings before the rolls run out.
- Place bets (Pass Line, Field, Place, Hard Ways, Come/Don't Come, one-roll props) each turn, then roll.
- Hit the round's target and you move to the **shop**; fall short and the run ends.
- The shop sells **Relics** (passive modifiers to payouts and odds) and **custom Dice** (reweighted or Wild-faced dice you add to your Dice Bag and equip in pairs) to build out your run.
- Survive escalating antes — each with a Boss Shooter round that changes the table's rules — to beat the house.

## Tech

React + TypeScript + Vite, with the game engine (dice, bet resolution, shooter state machine, run/shop progression) written as pure, unit-testable functions in `src/game/`, independent of the UI in `src/components/`.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run lint     # run oxlint
```

The layout is responsive and designed to play on both mobile and desktop browsers.
