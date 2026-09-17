import type { ActiveBet, BetKind } from '../game/types';
import { getTierTable, numberForKind } from '../game/diceTiers';

const VB_W = 300;
const VB_H = 272;

interface Spot {
  kind: BetKind;
  x: number;
  y: number;
  size?: number;
  chipDy?: number;
}

// Coordinates approximate one lane of a real craps layout, read top
// (far end, proposition/horn bets) to bottom (the curved rail where Pass
// Line sits, closest to the shooter).
const SPOTS: Spot[] = [
  { kind: 'horn2', x: 52, y: 24 },
  { kind: 'horn3', x: 100, y: 24 },
  { kind: 'horn11', x: 200, y: 24 },
  { kind: 'horn12', x: 248, y: 24 },
  { kind: 'anyCraps', x: 95, y: 43, size: 7, chipDy: 19 },
  { kind: 'anySeven', x: 205, y: 43, size: 7, chipDy: 19 },
  { kind: 'hard4', x: 58, y: 78 },
  { kind: 'hard6', x: 119, y: 78 },
  { kind: 'hard8', x: 181, y: 78 },
  { kind: 'hard10', x: 242, y: 78 },
  { kind: 'field', x: 150, y: 112, size: 11 },
  { kind: 'place4', x: 40, y: 150 },
  { kind: 'place5', x: 84, y: 150 },
  { kind: 'place6', x: 128, y: 150 },
  { kind: 'place8', x: 172, y: 150 },
  { kind: 'place9', x: 216, y: 150 },
  { kind: 'place10', x: 260, y: 150 },
  { kind: 'come', x: 110, y: 190, size: 11, chipDy: 16 },
  { kind: 'dontCome', x: 240, y: 190, size: 6.5, chipDy: 16 },
  { kind: 'dontPass', x: 150, y: 232, size: 6.5, chipDy: 8 },
  { kind: 'pass', x: 150, y: 254, size: 9.5, chipDy: 10 },
];

const STATIC_SPOT_LABELS: Partial<Record<BetKind, string>> = {
  anyCraps: 'ANY CRAPS',
  anySeven: 'ANY SEVEN',
  field: 'FIELD',
  come: 'COME',
  dontCome: "DON'T COME",
  dontPass: "DON'T PASS BAR",
  pass: 'PASS LINE',
};

/** The number (or "H"-prefixed number) printed on a felt spot — dynamic
 * because place/hard/horn numbers shift with dice count once the board
 * isn't pinned to the classic 2-12 range anymore. */
function spotLabel(kind: BetKind, diceCount: number): string {
  const staticLabel = STATIC_SPOT_LABELS[kind];
  if (staticLabel) return staticLabel;
  const num = numberForKind(getTierTable(diceCount), kind);
  return kind.startsWith('hard') ? `H${num}` : String(num);
}

function pct(v: number, of: number): string {
  return `${(v / of) * 100}%`;
}

/** A small, purely visual reference diagram of a craps table — not an
 * input surface. Everything printed on the felt (lines, numbers, labels)
 * is drawn in SVG; the only overlay is a chip marker wherever the player
 * currently has money down, tappable to pick that bet back up. */
export function TableView({
  activeBets,
  diceCount,
  onClear,
}: {
  activeBets: ActiveBet[];
  diceCount: number;
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
              {spotLabel(s.kind, diceCount)}
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
                aria-label={`Pick up ${spotLabel(s.kind, diceCount)} bet`}
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
