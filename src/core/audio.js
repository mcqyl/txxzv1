const MASTER_GAIN = 0.55;
const STEP_MIN_MS = 90;
const MESSAGE_MIN_MS = 180;

let ctx = null;
let master = null;
let noiseBuffer = null;
let enabled = true;
let bound = false;
let lastStepAt = 0;
let lastMessageAt = 0;
let stepFlip = 0;

function ensure() {
  if (!enabled || typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ctx.destination);
    noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = last * 0.72 + (Math.random() * 2 - 1) * 0.28;
      data[i] = last;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function bindUnlock() {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  const unlock = () => {
    ensure();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
    window.removeEventListener('touchstart', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('touchstart', unlock, true);
}

function tone({
  freq = 440,
  type = 'sine',
  dur = 0.14,
  gain = 0.04,
  slide = null,
  delay = 0,
  attack = 0.008
} = {}) {
  const audio = ensure();
  if (!audio) return;
  const t0 = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, freq), t0);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + Math.min(attack, dur * 0.5));
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  amp.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noise({
  dur = 0.12,
  gain = 0.02,
  freq = 900,
  filter = 'bandpass',
  delay = 0
} = {}) {
  const audio = ensure();
  if (!audio || !noiseBuffer) return;
  const t0 = audio.currentTime + delay;
  const src = audio.createBufferSource();
  const band = audio.createBiquadFilter();
  const amp = audio.createGain();
  src.buffer = noiseBuffer;
  band.type = filter;
  band.frequency.value = freq;
  band.Q.value = filter === 'bandpass' ? 1.1 : 0.7;
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(band);
  band.connect(amp);
  amp.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.03);
}

function arp(freqs, { step = 0.085, dur = 0.24, gain = 0.03, type = 'triangle', delay = 0 } = {}) {
  freqs.forEach((freq, i) => tone({ freq, dur, gain, type, delay: delay + i * step }));
}

const effects = {
  click() {
    tone({ freq: 660, slide: 520, dur: 0.055, gain: 0.03, type: 'triangle' });
  },
  open() {
    tone({ freq: 523.25, dur: 0.11, gain: 0.035, type: 'triangle' });
    tone({ freq: 783.99, dur: 0.18, gain: 0.028, type: 'triangle', delay: 0.055 });
  },
  close() {
    tone({ freq: 620, slide: 415, dur: 0.1, gain: 0.026, type: 'triangle' });
  },
  chat() {
    tone({ freq: 880, dur: 0.05, gain: 0.025, type: 'square' });
    tone({ freq: 1174.66, dur: 0.09, gain: 0.022, type: 'sine', delay: 0.045 });
  },
  message() {
    const now = performance.now();
    if (now - lastMessageAt < MESSAGE_MIN_MS) return;
    lastMessageAt = now;
    tone({ freq: 740, dur: 0.075, gain: 0.02, type: 'sine' });
    tone({ freq: 987.77, dur: 0.12, gain: 0.016, type: 'sine', delay: 0.06 });
  },
  error() {
    tone({ freq: 233, slide: 165, dur: 0.16, gain: 0.028, type: 'sawtooth' });
    noise({ dur: 0.08, gain: 0.008, freq: 420, filter: 'lowpass', delay: 0.02 });
  },
  invite() {
    arp([659.25, 830.61, 987.77], { step: 0.09, dur: 0.26, gain: 0.03 });
  },
  accept() {
    arp([523.25, 659.25, 783.99, 1046.5], { step: 0.075, dur: 0.22, gain: 0.028 });
  },
  join() {
    arp([392, 523.25, 659.25], { step: 0.1, dur: 0.24, gain: 0.026 });
  },
  leave() {
    arp([523.25, 392], { step: 0.11, dur: 0.22, gain: 0.024 });
  },
  reward() {
    arp([523.25, 659.25, 783.99, 1046.5], { step: 0.09, dur: 0.3, gain: 0.028 });
  },
  level() {
    arp([392, 523.25, 659.25, 783.99, 1046.5], { step: 0.08, dur: 0.34, gain: 0.03 });
    tone({ freq: 1567.98, dur: 0.5, gain: 0.016, type: 'sine', delay: 0.42 });
  },
  coin() {
    tone({ freq: 1318.51, dur: 0.07, gain: 0.022, type: 'square' });
    tone({ freq: 1975.53, dur: 0.16, gain: 0.018, type: 'sine', delay: 0.05 });
  },
  step() {
    const now = performance.now();
    if (now - lastStepAt < STEP_MIN_MS) return;
    lastStepAt = now;
    stepFlip = 1 - stepFlip;
    noise({
      dur: 0.07,
      gain: 0.014,
      freq: stepFlip ? 760 : 620,
      filter: 'bandpass'
    });
    if (stepFlip) tone({ freq: 118, dur: 0.045, gain: 0.012, type: 'sine' });
  },
  sit() {
    noise({ dur: 0.16, gain: 0.016, freq: 640, filter: 'bandpass' });
    tone({ freq: 146.83, slide: 98, dur: 0.16, gain: 0.026, type: 'sine' });
  },
  stand() {
    noise({ dur: 0.1, gain: 0.014, freq: 940, filter: 'bandpass' });
    tone({ freq: 196, slide: 261.63, dur: 0.1, gain: 0.016, type: 'triangle' });
  },
  interact() {
    tone({ freq: 392, dur: 0.06, gain: 0.024, type: 'triangle' });
    noise({ dur: 0.05, gain: 0.008, freq: 1300, delay: 0.01 });
  },
  flavor() {
    tone({ freq: 587.33, dur: 0.1, gain: 0.02, type: 'sine' });
    tone({ freq: 880, dur: 0.16, gain: 0.015, type: 'sine', delay: 0.08 });
  },
  door() {
    noise({ dur: 0.2, gain: 0.012, freq: 460, filter: 'lowpass' });
    tone({ freq: 196, slide: 261.63, dur: 0.2, gain: 0.022, type: 'sine' });
    tone({ freq: 523.25, dur: 0.1, gain: 0.012, type: 'triangle', delay: 0.12 });
  },
  place() {
    tone({ freq: 110, slide: 82, dur: 0.12, gain: 0.034, type: 'sine' });
    noise({ dur: 0.09, gain: 0.014, freq: 520, filter: 'lowpass' });
  },
  remove() {
    noise({ dur: 0.14, gain: 0.014, freq: 1100, filter: 'bandpass' });
    tone({ freq: 440, slide: 660, dur: 0.1, gain: 0.014, type: 'triangle' });
  },
  tick() {
    tone({ freq: 980, dur: 0.035, gain: 0.018, type: 'square' });
  },
  lamp() {
    tone({ freq: 1244.51, dur: 0.04, gain: 0.02, type: 'square' });
    noise({ dur: 0.04, gain: 0.006, freq: 2200 });
  },
  night() {
    arp([392, 493.88, 587.33], { step: 0.16, dur: 0.5, gain: 0.02, type: 'sine' });
    tone({ freq: 196, dur: 0.9, gain: 0.014, type: 'sine', delay: 0.18 });
  },
  dawn() {
    arp([523.25, 659.25, 783.99, 1046.5], { step: 0.13, dur: 0.42, gain: 0.018, type: 'sine' });
  },
  dusk() {
    arp([493.88, 392, 329.63], { step: 0.15, dur: 0.4, gain: 0.018, type: 'triangle' });
  },
  fire() {
    noise({ dur: 0.22, gain: 0.016, freq: 320, filter: 'lowpass' });
    tone({ freq: 98, slide: 73, dur: 0.2, gain: 0.02, type: 'sine' });
    tone({ freq: 196, dur: 0.07, gain: 0.012, type: 'triangle', delay: 0.1 });
  },
  music() {
    arp([523.25, 659.25, 783.99, 1046.5], { step: 0.11, dur: 0.34, gain: 0.02, type: 'sine' });
    tone({ freq: 196, dur: 0.5, gain: 0.012, type: 'triangle', delay: 0.05 });
  },
  splash() {
    noise({ dur: 0.26, gain: 0.02, freq: 780, filter: 'bandpass' });
    tone({ freq: 233, slide: 139, dur: 0.2, gain: 0.016, type: 'sine' });
    noise({ dur: 0.12, gain: 0.008, freq: 1600, filter: 'highpass', delay: 0.08 });
  },
  bite() {
    tone({ freq: 880, dur: 0.05, gain: 0.03, type: 'square' });
    tone({ freq: 1174.66, dur: 0.12, gain: 0.024, type: 'triangle', delay: 0.06 });
    noise({ dur: 0.08, gain: 0.012, freq: 1500, delay: 0.02 });
  }
};

function play(name) {
  if (!enabled) return;
  const effect = effects[name];
  if (!effect) return;
  bindUnlock();
  try {
    effect();
  } catch {
    /* audio is decoration only */
  }
}

export const sfx = {
  setEnabled(value) {
    enabled = Boolean(value);
    if (enabled) bindUnlock();
    if (master) master.gain.value = enabled ? MASTER_GAIN : 0;
  },
  get enabled() {
    return enabled;
  },
  play,
  click: () => play('click'),
  open: () => play('open'),
  close: () => play('close'),
  chat: () => play('chat'),
  message: () => play('message'),
  error: () => play('error'),
  invite: () => play('invite'),
  accept: () => play('accept'),
  join: () => play('join'),
  leave: () => play('leave'),
  reward: () => play('reward'),
  level: () => play('level'),
  coin: () => play('coin'),
  step: () => play('step'),
  sit: () => play('sit'),
  stand: () => play('stand'),
  interact: () => play('interact'),
  flavor: () => play('flavor'),
  fire: () => play('fire'),
  music: () => play('music'),
  splash: () => play('splash'),
  bite: () => play('bite'),
  door: () => play('door'),
  place: () => play('place'),
  remove: () => play('remove'),
  tick: () => play('tick'),
  lamp: () => play('lamp'),
  night: () => play('night'),
  dawn: () => play('dawn'),
  dusk: () => play('dusk')
};
