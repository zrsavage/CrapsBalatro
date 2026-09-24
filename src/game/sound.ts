// Small synthesized sound effects via WebAudio — no audio assets to ship.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/** Must be called from within a user gesture handler (e.g. a click) so
 * mobile browsers allow audio to play for the rest of the session. */
export function primeAudio(): void {
  getCtx();
}

function tone(freq: number, startOffset: number, duration: number, type: OscillatorType, peakGain: number): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.connect(gain);
  gain.connect(c.destination);
  const t0 = c.currentTime + startOffset;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function click(startOffset: number, duration = 0.05, peakGain = 0.3): void {
  const c = getCtx();
  if (!c) return;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1800 + Math.random() * 1600;
  filter.Q.value = 0.9;
  const gain = c.createGain();
  gain.gain.value = peakGain;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  src.start(c.currentTime + startOffset);
}

/** A short dice-rattle: a burst of clicks synced to roll the spin animation. */
export function playDiceRoll(): void {
  const clickCount = 8;
  for (let i = 0; i < clickCount; i++) {
    click(i * 0.085 + Math.random() * 0.02, 0.045, 0.28);
  }
}

export function playWin(): void {
  tone(523.25, 0, 0.12, 'triangle', 0.22); // C5
  tone(659.25, 0.09, 0.12, 'triangle', 0.22); // E5
  tone(783.99, 0.18, 0.24, 'triangle', 0.26); // G5
}

export function playLose(): void {
  tone(220, 0, 0.22, 'sawtooth', 0.14);
  tone(164.81, 0.12, 0.3, 'sawtooth', 0.13);
}

export function playNeutral(): void {
  tone(392, 0, 0.14, 'sine', 0.12);
}

/** A light confirm blip for committing to a round choice at the roundSelect
 * screen — distinct from a win/lose roll result, just an acknowledgment. */
export function playChoice(): void {
  tone(440, 0, 0.08, 'triangle', 0.16);
  tone(587.33, 0.06, 0.1, 'triangle', 0.16);
}

/** A bright two-note chime for a normal shop purchase (relic or die). */
export function playPurchase(): void {
  tone(659.25, 0, 0.09, 'sine', 0.18);
  tone(880, 0.07, 0.14, 'sine', 0.2);
}

/** A dissonant sting for acquiring a curse relic — a close, clashing
 * interval instead of a clean chord, so it reads as a real bargain rather
 * than an ordinary purchase. */
export function playCurse(): void {
  tone(220, 0, 0.28, 'sawtooth', 0.16);
  tone(233.08, 0, 0.28, 'sawtooth', 0.14); // a minor second above — deliberately clashes
  tone(146.83, 0.14, 0.3, 'sawtooth', 0.12);
}
