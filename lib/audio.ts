// All game sound is synthesized with the Web Audio API: no audio files.
// iOS only allows audio after a user gesture, so every input handler calls unlockAudio().

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted: boolean | null = null;

function mutedNow(): boolean {
  if (muted === null) {
    try {
      muted = localStorage.getItem("monster-garage-muted") === "1";
    } catch {
      muted = false;
    }
  }
  return muted;
}

export function isMuted(): boolean {
  return typeof window === "undefined" ? false : mutedNow();
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem("monster-garage-muted", m ? "1" : "0");
  } catch {
    // persistence is best-effort
  }
  if (ctx && master) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.02);
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = mutedNow() ? 0 : 0.5;
    master.connect(ctx.destination);
  }
  // iOS moves a running context to "interrupted" after Siri/alarms/app switches
  // and does not reliably auto-resume, so recover from any non-running state.
  if (ctx.state !== "running") void ctx.resume();
}

function tone(
  type: OscillatorType,
  freq: number,
  dur: number,
  vol: number,
  opts?: { slideTo?: number; delay?: number }
) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + (opts?.delay ?? 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (opts?.slideTo) osc.frequency.exponentialRampToValueAtTime(opts.slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

let noiseBuf: AudioBuffer | null = null;

function noiseBurst(dur: number, filterFrom: number, vol: number, filterTo = 120, delay = 0) {
  if (!ctx || !master) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t0 = ctx.currentTime + delay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(filterFrom, t0);
  filter.frequency.exponentialRampToValueAtTime(filterTo, t0 + dur);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(t0);
  src.stop(t0 + dur);
}

export function pop() {
  tone("triangle", 520, 0.09, 0.5, { slideTo: 880 });
}

export function honk() {
  tone("square", 330, 0.28, 0.2);
  tone("square", 415, 0.28, 0.2);
}

export function crunch() {
  noiseBurst(0.22, 900, 0.55);
  tone("sine", 130, 0.18, 0.6, { slideTo: 50 });
}

export function sparkle() {
  [880, 1100, 1320, 1760].forEach((f, i) =>
    tone("triangle", f, 0.13, 0.3, { delay: i * 0.06 })
  );
}

export function fanfare() {
  [523, 659, 784, 1046].forEach((f, i) =>
    tone("square", f, i === 3 ? 0.4 : 0.16, 0.22, { delay: i * 0.12 })
  );
}

export function whoosh() {
  noiseBurst(0.55, 2600, 0.4, 300);
  tone("sawtooth", 140, 0.5, 0.18, { slideTo: 420 });
}

// --- truck voices: every body honks differently ---

export function airhorn() {
  [233, 311, 466].forEach((f) => tone("square", f, 0.55, 0.13));
}

export function beepbeep() {
  tone("square", 660, 0.09, 0.3);
  tone("square", 660, 0.09, 0.3, { delay: 0.15 });
}

export function siren() {
  tone("triangle", 660, 0.42, 0.32, { slideTo: 440 });
  tone("triangle", 440, 0.42, 0.32, { delay: 0.45, slideTo: 660 });
}

export function roar() {
  tone("sawtooth", 150, 0.7, 0.5, { slideTo: 55 });
  tone("sawtooth", 76, 0.7, 0.35, { slideTo: 30 });
  noiseBurst(0.6, 700, 0.3, 200);
}

export function voice(body: string) {
  switch (body) {
    case "van":
      airhorn();
      break;
    case "bug":
      beepbeep();
      break;
    case "fire":
      siren();
      break;
    case "rex":
      roar();
      break;
    default:
      honk();
  }
}

// --- drive-scene effects ---

/** Frightened little squeaks from the cars when the horn blasts. */
export function squeaks() {
  for (let i = 0; i < 3; i++) {
    tone("sine", 880 + Math.random() * 520, 0.09, 0.2, {
      delay: Math.random() * 0.28,
      slideTo: 1500,
    });
  }
}

export function splat() {
  noiseBurst(0.3, 600, 0.6);
  tone("sine", 190, 0.22, 0.5, { slideTo: 55 });
  [0.2, 0.32, 0.45].forEach((d, i) =>
    tone("sine", 520 - i * 90, 0.07, 0.18, { delay: d, slideTo: 300 })
  );
}

export function scrub() {
  [0, 0.18, 0.36, 0.54].forEach((d) => noiseBurst(0.13, 1500, 0.22, 500, d));
}

export function washDone() {
  sparkle();
  tone("triangle", 1046, 0.16, 0.25, { delay: 0.3 });
  tone("triangle", 1318, 0.3, 0.25, { delay: 0.44 });
}

export function punt() {
  noiseBurst(0.12, 1800, 0.5, 400);
  tone("square", 180, 0.18, 0.5, { slideTo: 70 });
}

export function boingP(pitch: number) {
  tone("sine", pitch, 0.16, 0.32, { slideTo: pitch * 1.55 });
}

/** Dull little "not yet" thunk (turbo still charging). */
export function denied() {
  tone("triangle", 150, 0.09, 0.22, { slideTo: 110 });
}

/** Springy takeoff boing for the jump button. */
export function jump() {
  tone("sine", 240, 0.2, 0.4, { slideTo: 560 });
  noiseBurst(0.07, 1200, 0.18, 500);
}

export function slam(big: boolean) {
  if (big) {
    tone("sine", 64, 0.45, 0.9, { slideTo: 24 });
    tone("sine", 130, 0.2, 0.45, { slideTo: 50 });
    noiseBurst(0.4, 380, 0.8);
  } else {
    tone("sine", 85, 0.25, 0.6, { slideTo: 32 });
    noiseBurst(0.18, 480, 0.45);
  }
}

/** Rising blip for rapid crush chains; pitch climbs with the combo count. */
export function comboBlip(n: number) {
  const f = 540 * Math.pow(1.16, Math.min(n, 8));
  tone("triangle", f, 0.09, 0.3, { slideTo: f * 1.3, delay: 0.05 });
}

export function cheer() {
  [392, 523, 659, 784].forEach((f, i) => {
    tone("square", f, 0.1, 0.16, { delay: i * 0.07 });
    tone("square", f * 1.013, 0.1, 0.12, { delay: i * 0.07 });
  });
}

/** Happy rescued-car chirps. */
export function chirps() {
  [523, 659, 880].forEach((f, i) =>
    tone("sine", f, 0.11, 0.3, { delay: i * 0.13, slideTo: f * 1.25 })
  );
}

// --- airtime slide whistle (persistent, pitch follows vertical velocity) ---

let whistle: { osc: OscillatorNode; gain: GainNode } | null = null;

export function whistleStart() {
  if (!ctx || !master || whistle) return;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = 520;
  const gain = ctx.createGain();
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(master);
  osc.start();
  gain.gain.setTargetAtTime(0.15, ctx.currentTime, 0.05);
  whistle = { osc, gain };
}

export function whistleSet(vy: number) {
  if (!ctx || !whistle) return;
  const f = 520 + Math.max(-450, Math.min(450, -vy)) * 0.9;
  whistle.osc.frequency.setTargetAtTime(Math.max(180, f), ctx.currentTime, 0.06);
}

export function whistleStop() {
  if (!ctx || !whistle) return;
  const w = whistle;
  whistle = null;
  w.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
  setTimeout(() => {
    try {
      w.osc.stop();
    } catch {
      // already stopped
    }
  }, 300);
}

let engine: { osc: OscillatorNode; lfo: OscillatorNode; gain: GainNode } | null = null;

export function engineStart() {
  if (!ctx || !master || engine) return;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.value = 48;
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 11;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 6;
  lfo.connect(lfoGain).connect(osc.frequency);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 340;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  osc.connect(filter).connect(gain).connect(master);
  osc.start();
  lfo.start();
  engine = { osc, lfo, gain };
}

export function engineSet(ratio: number, turbo: boolean) {
  if (!ctx || !engine) return;
  const t = ctx.currentTime;
  engine.osc.frequency.setTargetAtTime(45 + ratio * 70 + (turbo ? 45 : 0), t, 0.08);
  engine.gain.gain.setTargetAtTime(Math.min(ratio, 1.2) * 0.15 + (turbo ? 0.05 : 0), t, 0.1);
}

export function engineStop() {
  if (!ctx || !engine) return;
  const e = engine;
  engine = null;
  e.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  setTimeout(() => {
    try {
      e.osc.stop();
      e.lfo.stop();
    } catch {
      // already stopped
    }
  }, 400);
}
