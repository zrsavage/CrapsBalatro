import { useEffect, useRef, useState } from 'react';

const DURATION_MS = 450;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/** Eases a displayed number toward `value` whenever it changes, instead of
 * snapping — makes bankroll/score swings read as something happening
 * rather than a static label flipping. Jumps straight to the new value on
 * first mount (nothing to animate from yet). */
export function useCountUp(value: number): number {
  const [displayed, setDisplayed] = useState(value);
  const displayedRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    const from = displayedRef.current;
    if (from === value) return undefined;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      const eased = easeOutCubic(t);
      const next = Math.round(from + (value - from) * eased);
      displayedRef.current = next;
      setDisplayed(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return displayed;
}
