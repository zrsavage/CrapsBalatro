// Deterministic PRNG so runs can be seeded/replayed and rolls are testable.

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function makeSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}

/** FNV-1a 32-bit string hash — turns any text (a shared code, a date string)
 * into a deterministic seed, so seeded/daily runs don't require players to
 * type raw numbers. */
export function hashStringToSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Today's date (UTC) as a stable seed — every player who starts a Daily
 * Challenge on the same calendar day gets the same starting seed, so the
 * run's shop/dice RNG stream lines up (their own bet/choice decisions are
 * still their own, same as any seeded roguelike daily). */
export function dailySeedForToday(): number {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  return hashStringToSeed(`crapslatro-daily-${today}`);
}
