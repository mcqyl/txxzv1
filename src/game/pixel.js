export const TILE = 16;
export const VIEW_H = 270;

export function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function poly(ctx, points, color) {
  if (!points.length) return;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(Math.round(points[0][0]), Math.round(points[0][1]));
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(Math.round(points[i][0]), Math.round(points[i][1]));
  }
  ctx.closePath();
  ctx.fill();
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shadow(ctx, cx, baseY, width, height = 4, alpha = 0.24) {
  ctx.fillStyle = `rgba(20, 26, 22, ${alpha})`;
  const w = Math.round(width);
  const h = Math.max(2, Math.round(height));
  ctx.fillRect(Math.round(cx - w / 2), Math.round(baseY - h + 1), w, h);
  ctx.fillRect(Math.round(cx - w / 2 + 2), Math.round(baseY + 1), w - 4, 1);
}

export function circlePixels(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const span = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2 + 1, 1);
  }
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function seededNoise(x, y, seed = 1) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}
