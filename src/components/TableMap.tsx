import type { ActiveBet, BetKind } from '../game/types';

function Cell({ kind, label, totals }: { kind: BetKind; label: string; totals: Map<BetKind, number> }) {
  const amount = totals.get(kind) ?? 0;
  return (
    <div className={`map-cell${amount > 0 ? ' map-cell-active' : ''}`}>
      <span className="map-cell-label">{label}</span>
      {amount > 0 && <span className="map-chip">${amount}</span>}
    </div>
  );
}

/** A compact, non-interactive diagram of a craps table layout that lights
 * up with a chip marker wherever the player currently has money down, so
 * bets are easy to place at a glance the way they would be on a real felt. */
export function TableMap({ activeBets }: { activeBets: ActiveBet[] }) {
  const totals = new Map<BetKind, number>();
  for (const bet of activeBets) {
    totals.set(bet.kind, (totals.get(bet.kind) ?? 0) + bet.amount);
  }
  const comeBets = activeBets.filter((b) => b.kind === 'come' || b.kind === 'dontCome');

  return (
    <div className="table-map">
      <div className="map-group">
        <span className="map-group-title">Horn</span>
        <div className="map-row">
          <Cell kind="horn2" label="2" totals={totals} />
          <Cell kind="horn3" label="3" totals={totals} />
          <Cell kind="horn11" label="11" totals={totals} />
          <Cell kind="horn12" label="12" totals={totals} />
        </div>
      </div>

      <div className="map-group">
        <span className="map-group-title">One Roll</span>
        <div className="map-row">
          <Cell kind="anyCraps" label="Any Craps" totals={totals} />
          <Cell kind="anySeven" label="Any Seven" totals={totals} />
        </div>
      </div>

      <div className="map-group">
        <span className="map-group-title">Hard Ways</span>
        <div className="map-row">
          <Cell kind="hard4" label="H4" totals={totals} />
          <Cell kind="hard6" label="H6" totals={totals} />
          <Cell kind="hard8" label="H8" totals={totals} />
          <Cell kind="hard10" label="H10" totals={totals} />
        </div>
      </div>

      <div className="map-group">
        <div className="map-row">
          <Cell kind="field" label="Field" totals={totals} />
        </div>
      </div>

      <div className="map-group">
        <span className="map-group-title">Place</span>
        <div className="map-row">
          <Cell kind="place4" label="4" totals={totals} />
          <Cell kind="place5" label="5" totals={totals} />
          <Cell kind="place6" label="6" totals={totals} />
          <Cell kind="place8" label="8" totals={totals} />
          <Cell kind="place9" label="9" totals={totals} />
          <Cell kind="place10" label="10" totals={totals} />
        </div>
      </div>

      <div className="map-group">
        <div className="map-row">
          <div className="map-cell map-cell-wide">
            <span className="map-cell-label">Come</span>
            {comeBets
              .filter((b) => b.kind === 'come')
              .map((b) => (
                <span className="map-chip" key={b.id}>
                  ${b.amount}
                  {b.point !== undefined ? ` on ${b.point}` : ''}
                </span>
              ))}
          </div>
          <div className="map-cell">
            <span className="map-cell-label">Don't Come</span>
            {comeBets
              .filter((b) => b.kind === 'dontCome')
              .map((b) => (
                <span className="map-chip" key={b.id}>
                  ${b.amount}
                  {b.point !== undefined ? ` on ${b.point}` : ''}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div className="map-group">
        <div className="map-row">
          <Cell kind="pass" label="Pass Line" totals={totals} />
          <Cell kind="dontPass" label="Don't Pass" totals={totals} />
        </div>
      </div>
    </div>
  );
}
