import type { ActiveBet, BetKind } from '../game/types';

const VB_W = 300;
const VB_H = 272;

interface Spot {
  kind: BetKind;
  label: string;
  x: number;
  y: number;
  size?: number;
  chipDy?: number;
}

// Coordinates approximate one lane of a real craps layout, read top
// (far end, proposition/horn bets) to bottom (the curved rail where Pass
// Line sits, closest to the shooter).
const SPOTS: Spot[] = [
  { kind: 'horn2', label: '2', x: 52, y: 24 },
  { kind: 'horn3', label: '3', x: 100, y: 24 },
  { kind: 'horn11', label: '11', x: 200, y: 24 },
  { kind: 'horn12', label: '12', x: 248, y: 24 },
  { kind: 'anyCraps', label: 'ANY CRAPS', x: 95, y: 43, size: 7, chipDy: 19 },
  { kind: 'anySeven', label: 'ANY SEVEN', x: 205, y: 43, size: 7, chipDy: 19 },
  { kind: 'hard4', label: 'H4', x: 58, y: 78 },
  { kind: 'hard6', label: 'H6', x: 119, y: 78 },
  { kind: 'hard8', label: 'H8', x: 181, y: 78 },
  { kind: 'hard10', label: 'H10', x: 242, y: 78 },
  { kind: 'field', label: 'FIELD', x: 150, y: 112, size: 11 },
  { kind: 'place4', label: '4', x: 40, y: 150 },
  { kind: 'place5', label: '5', x: 84, y: 150 },
  { kind: 'place6', label: '6', x: 128, y: 150 },
  { kind: 'place8', label: '8', x: 172, y: 150 },
  { kind: 'place9', label: '9', x: 216, y: 150 },
  { kind: 'place10', label: '10', x: 260, y: 150 },
  { kind: 'come', label: 'COME', x: 110, y: 190, size: 11, chipDy: 16 },
  { kind: 'dontCome', label: "DON'T COME", x: 240, y: 190, size: 6.5, chipDy: 16 },
  { kind: 'dontPass', label: "DON'T PASS BAR", x: 150, y: 232, size: 6.5, chipDy: 8 },
  { kind: 'pass', label: 'PASS LINE', x: 150, y: 254, size: 9.5, chipDy: 10 },
];

function pct(v: number, of: number): string {
  return `${(v / of) * 100}%`;
}

/** A small, purely visual reference diagram of a craps table — not an
 * input surface. Everything printed on the felt (lines, numbers, labels)
 * is drawn in SVG; the only overlay is a chip marker wherever the player
 * currently has money down, tappable to pick that bet back up. */
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

  return (
    <div className="panel table-view-panel">
      <span className="table-view-title">Table</span>
      <div className="table-view">
        <svg className="tv-felt" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="tvFeltGrad" cx="50%" cy="25%" r="85%">
              <stop offset="0%" stopColor="var(--table-felt)" />
              <stop offset="100%" stopColor="var(--table-felt-dark)" />
            </radialGradient>
          </defs>

          <rect x="4" y="4" width={VB_W - 8} height={VB_H - 8} rx="26" ry="26" fill="url(#tvFeltGrad)" stroke="var(--gold)" strokeWidth="3" />

          {/* printed divider lines between bet zones, not boxed buttons */}
          <line x1="16" y1="58" x2={VB_W - 16} y2="58" className="tv-line" />
          <line x1="16" y1="96" x2={VB_W - 16} y2="96" className="tv-line" />
          <line x1="16" y1="130" x2={VB_W - 16} y2="130" className="tv-line" />
          <line x1="16" y1="168" x2={VB_W - 16} y2="168" className="tv-line" />
          <line x1="16" y1="212" x2={VB_W - 16} y2="212" className="tv-line" />
          <line x1="16" y1="240" x2={VB_W - 16} y2="240" className="tv-line" />
          <path d={`M 16 240 Q ${VB_W / 2} 268 ${VB_W - 16} 240`} className="tv-line" fill="none" />
          <line x1="170" y1="168" x2="170" y2="212" className="tv-line" />

          <text x={VB_W / 2} y="14" className="tv-svg-caption">
            HORN · HARD WAYS
          </text>
          <text x={VB_W / 2} y="140" className="tv-svg-caption">
            PLACE TO WIN
          </text>

          {SPOTS.map((s) => (
            <text key={s.kind} x={s.x} y={s.y} textAnchor="middle" className="tv-svg-label" style={{ fontSize: s.size ?? 13 }}>
              {s.label}
            </text>
          ))}
        </svg>

        <div className="tv-chip-layer">
          {SPOTS.filter((s) => (totals.get(s.kind) ?? 0) > 0).map((s) => {
            const amount = totals.get(s.kind) ?? 0;
            return (
              <button
                key={s.kind}
                className="tv-chip"
                style={{ left: pct(s.x, VB_W), top: pct(s.y + (s.chipDy ?? 14), VB_H) }}
                onClick={() => onClear(s.kind)}
                aria-label={`Pick up ${s.label} bet`}
              >
                ${amount}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
