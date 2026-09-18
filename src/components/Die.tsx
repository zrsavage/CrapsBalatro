const PIP_LAYOUTS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

export function Die({ value, rolling, landed }: { value: number; rolling?: boolean; landed?: boolean }) {
  const pips = PIP_LAYOUTS[value] ?? [];
  return (
    <div className={`die${rolling ? ' die-rolling' : ''}${landed ? ' die-landed' : ''}`}>
      <div className="die-face">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className={pips.includes(i) ? 'pip' : 'pip pip-empty'} />
        ))}
      </div>
    </div>
  );
}
