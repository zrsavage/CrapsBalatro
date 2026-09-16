import type { ActiveBet, BetKind } from '../game/types';

function Chip({ amount, sub, onClick }: { amount: number; sub?: string; onClick?: () => void }) {
  return (
    <button className="tv-chip" onClick={onClick} disabled={!onClick} type="button">
      <span className="tv-chip-amount">${amount}</span>
      {sub && <span className="tv-chip-sub">{sub}</span>}
    </button>
  );
}

function Zone({
  className,
  label,
  kind,
  totals,
  onClear,
}: {
  className: string;
  label: string;
  kind: BetKind;
  totals: Map<BetKind, number>;
  onClear: (kind: BetKind) => void;
}) {
  const amount = totals.get(kind) ?? 0;
  return (
    <div className={`tv-zone ${className}${amount > 0 ? ' tv-zone-active' : ''}`}>
      <span className="tv-zone-label">{label}</span>
      {amount > 0 && <Chip amount={amount} onClick={() => onClear(kind)} />}
    </div>
  );
}

/** A visual centerpiece companion to the dice: a felt-styled table diagram
 * (SVG shape + gradient) that lights up with a chip wherever the player
 * has money down. Tapping a chip picks that bet back up, mirroring the
 * clear (x) affordance in the button grid below. */
export function TableView({
  activeBets,
  onClear,
}: {
  activeBets: ActiveBet[];
  onClear: (kind: BetKind) => void;
}) {
  const totals = new Map<BetKind, number>();
  for (const bet of activeBets) {
    totals.set(bet.kind, (totals.get(bet.kind) ?? 0) + bet.amount);
  }
  const comeBets = activeBets.filter((b) => b.kind === 'come' || b.kind === 'dontCome');
  const comeOn = comeBets.filter((b) => b.kind === 'come');
  const dontComeOn = comeBets.filter((b) => b.kind === 'dontCome');

  return (
    <div className="panel table-view-panel">
      <div className="table-view">
        <svg className="tv-felt" viewBox="0 0 320 430" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <radialGradient id="tvFeltGrad" cx="50%" cy="30%" r="80%">
              <stop offset="0%" stopColor="var(--table-felt)" />
              <stop offset="100%" stopColor="var(--table-felt-dark)" />
            </radialGradient>
          </defs>
          <rect x="5" y="5" width="310" height="420" rx="34" ry="34" fill="url(#tvFeltGrad)" stroke="var(--gold)" strokeWidth="4" />
          <rect
            x="15"
            y="15"
            width="290"
            height="400"
            rx="26"
            ry="26"
            fill="none"
            stroke="var(--gold-dim)"
            strokeWidth="1.5"
            strokeDasharray="2 4"
            opacity="0.6"
          />
        </svg>

        <div className="tv-overlay">
          <div className="tv-band">
            <span className="tv-band-title">Horn</span>
            <div className="tv-row">
              <Zone className="tv-cell" label="2" kind="horn2" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="3" kind="horn3" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="11" kind="horn11" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="12" kind="horn12" totals={totals} onClear={onClear} />
            </div>
          </div>

          <div className="tv-band">
            <div className="tv-row">
              <Zone className="tv-cell tv-cell-wide" label="Any Craps" kind="anyCraps" totals={totals} onClear={onClear} />
              <Zone className="tv-cell tv-cell-wide" label="Any Seven" kind="anySeven" totals={totals} onClear={onClear} />
            </div>
          </div>

          <div className="tv-band">
            <span className="tv-band-title">Hard Ways</span>
            <div className="tv-row">
              <Zone className="tv-cell" label="H4" kind="hard4" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="H6" kind="hard6" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="H8" kind="hard8" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="H10" kind="hard10" totals={totals} onClear={onClear} />
            </div>
          </div>

          <div className="tv-band">
            <div className="tv-row">
              <Zone className="tv-cell tv-cell-field" label="Field" kind="field" totals={totals} onClear={onClear} />
            </div>
          </div>

          <div className="tv-band">
            <span className="tv-band-title">Place</span>
            <div className="tv-row">
              <Zone className="tv-cell" label="4" kind="place4" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="5" kind="place5" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="6" kind="place6" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="8" kind="place8" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="9" kind="place9" totals={totals} onClear={onClear} />
              <Zone className="tv-cell" label="10" kind="place10" totals={totals} onClear={onClear} />
            </div>
          </div>

          <div className="tv-band">
            <div className="tv-row">
              <div className="tv-zone tv-cell tv-cell-wide">
                <span className="tv-zone-label">Come</span>
                {comeOn.map((b) => (
                  <Chip key={b.id} amount={b.amount} sub={b.point !== undefined ? `on ${b.point}` : 'coming'} />
                ))}
              </div>
              <div className="tv-zone tv-cell">
                <span className="tv-zone-label">Don't Come</span>
                {dontComeOn.map((b) => (
                  <Chip key={b.id} amount={b.amount} sub={b.point !== undefined ? `on ${b.point}` : 'coming'} />
                ))}
              </div>
            </div>
          </div>

          <div className="tv-band tv-band-line">
            <div className="tv-row">
              <Zone className="tv-cell tv-cell-wide tv-cell-pass" label="Pass Line" kind="pass" totals={totals} onClear={onClear} />
              <Zone className="tv-cell tv-cell-pass" label="Don't Pass" kind="dontPass" totals={totals} onClear={onClear} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
