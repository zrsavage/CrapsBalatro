import type { DieFace } from '../game/types';

export function DieFaces({ faces }: { faces: readonly DieFace[] }) {
  return (
    <div className="die-faces-row">
      {faces.map((face, i) => (
        <span key={i} className={`die-face-badge${face === 'wild' ? ' die-face-badge-wild' : ''}`}>
          {face === 'wild' ? '★' : face}
        </span>
      ))}
    </div>
  );
}
