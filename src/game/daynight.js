const CYCLE_SECONDS = 12 * 60;
const MINUTES_PER_SECOND = 1440 / CYCLE_SECONDS;

const OVERLAY_KEYS = [
  { h: 0, color: [15, 23, 55], a: 0.58 },
  { h: 4.4, color: [18, 27, 62], a: 0.52 },
  { h: 6.2, color: [96, 72, 104], a: 0.3 },
  { h: 7.6, color: [255, 198, 132], a: 0.08 },
  { h: 12, color: [255, 244, 218], a: 0.02 },
  { h: 16.2, color: [255, 196, 118], a: 0.1 },
  { h: 18.4, color: [244, 132, 82], a: 0.2 },
  { h: 19.8, color: [72, 52, 102], a: 0.36 },
  { h: 21.4, color: [20, 29, 66], a: 0.54 },
  { h: 24, color: [15, 23, 55], a: 0.58 }
];

const DARK_KEYS = [
  { h: 0, v: 1 },
  { h: 4.4, v: 0.9 },
  { h: 6.2, v: 0.45 },
  { h: 7.6, v: 0.05 },
  { h: 16.2, v: 0.05 },
  { h: 18.4, v: 0.5 },
  { h: 19.8, v: 0.86 },
  { h: 21.4, v: 1 },
  { h: 24, v: 1 }
];

function mixColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t)
  ];
}

function sample(keys, hours, blend) {
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (hours >= a.h && hours <= b.h) {
      const t = (hours - a.h) / Math.max(0.001, b.h - a.h);
      return blend(a, b, t);
    }
  }
  return blend(keys[0], keys[0], 0);
}

function phaseFor(hours) {
  if (hours < 4.6) return { key: 'night', label: '深夜', icon: 'moon' };
  if (hours < 6.4) return { key: 'dawn', label: '黎明', icon: 'dawn' };
  if (hours < 9) return { key: 'morning', label: '清晨', icon: 'sun' };
  if (hours < 12) return { key: 'day', label: '上午', icon: 'sun' };
  if (hours < 14) return { key: 'noon', label: '正午', icon: 'sun' };
  if (hours < 17) return { key: 'afternoon', label: '午后', icon: 'sun' };
  if (hours < 19.2) return { key: 'dusk', label: '黄昏', icon: 'sunset' };
  return { key: 'night', label: '夜晚', icon: 'moon' };
}

export function createDayCycle(startHours = 16.6) {
  let total = ((startHours % 24) + 24) % 24 * 60;
  let lastPhase = phaseFor(total / 60).key;
  let lastTickMinute = -1;

  return {
    update(dt) {
      total = (total + dt * MINUTES_PER_SECOND) % 1440;
      if (total < 0) total += 1440;
    },
    setHours(hours) {
      total = ((hours % 24) + 24) % 24 * 60;
    },
    get hours() {
      return total / 60;
    },
    info() {
      const hours = total / 60;
      const phase = phaseFor(hours);
      const [r, g, b] = sample(OVERLAY_KEYS, hours, (a, bb, t) => mixColor(a.color, bb.color, t));
      const alpha = sample(OVERLAY_KEYS, hours, (a, bb, t) => ({ v: a.a + (bb.a - a.a) * t })).v;
      const darkness = sample(DARK_KEYS, hours, (a, bb, t) => ({ v: a.v + (bb.v - a.v) * t })).v;
      const minute = Math.floor(total);
      const changed = minute !== lastTickMinute;
      lastTickMinute = minute;
      const phaseChanged = phase.key !== lastPhase;
      lastPhase = phase.key;
      const hh = Math.floor(hours);
      const mm = Math.floor((hours - hh) * 60);
      return {
        hours,
        phase: phase.key,
        label: phase.label,
        icon: phase.icon,
        overlay: `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`,
        overlayColor: [r, g, b],
        overlayAlpha: alpha,
        darkness,
        night: darkness > 0.55,
        clock: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
        changed,
        phaseChanged
      };
    }
  };
}

export function skyGradient(info) {
  if (info.phase === 'night') {
    return ['#101b38', '#1c2a50', '#334066'];
  }
  if (info.phase === 'dawn') {
    return ['#3a3f68', '#8a6f86', '#e6a681'];
  }
  if (info.phase === 'dusk') {
    return ['#2c3556', '#5f5a78', '#c98f7a'];
  }
  if (info.phase === 'morning' || info.phase === 'noon') {
    return ['#6ea8c4', '#a8cfd8', '#e7e3c3'];
  }
  return ['#6f9ec0', '#a5c7cc', '#e9d6ad'];
}
