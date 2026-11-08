import { px, poly, circlePixels, TILE } from './pixel.js';

/* ---------------- helpers ---------------- */

function treePalette(variant) {
  if (variant === 'gold') {
    return { deep: '#7f7038', base: '#a8923f', light: '#c9b356', hi: '#e3cf79', trunk: '#6b4c34' };
  }
  if (variant === 'pine') {
    return { deep: '#254d3f', base: '#2f6250', light: '#3b7a60', hi: '#519477', trunk: '#4d3829' };
  }
  if (variant === 'birch') {
    return { deep: '#4a7a47', base: '#609a56', light: '#7ab96a', hi: '#9ad583', trunk: '#ded9c6' };
  }
  return { deep: '#356b46', base: '#47884f', light: '#5fa45c', hi: '#7fc274', trunk: '#624530' };
}

function drawCanopyBlob(ctx, x, y, r, color) {
  circlePixels(ctx, x, y, r, color);
}

export function drawTree(ctx, obj, time) {
  const p = treePalette(obj.variant);
  const size = obj.size || 1;
  const x = Math.round(obj.x);
  const y = Math.round(obj.y);
  const sway = Math.sin(time * 0.0009 + (obj.seed || 0)) > 0.4 ? 1 : 0;

  ctx.fillStyle = 'rgba(25, 33, 26, 0.24)';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 16 * size, 5 * size, 0, 0, Math.PI * 2);
  ctx.fill();

  if (obj.variant === 'pine') {
    const trunkH = 18 * size;
    px(ctx, x - 2, y - trunkH, 4, trunkH, p.trunk);
    px(ctx, x - 1, y - trunkH, 1, trunkH, '#6a4c35');
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
      const w = (26 - i * 5) * size;
      const h = (18 - i * 2) * size;
      const baseY = y - 10 * size - i * 13 * size;
      poly(ctx, [[x - w / 2, baseY], [x, baseY - h], [x + w / 2, baseY]], p.deep);
      poly(ctx, [[x - w / 2 + 3, baseY - 1], [x, baseY - h + 4], [x + w / 2 - 3, baseY - 1]], p.base);
      poly(ctx, [[x - 4, baseY - 4], [x, baseY - h + 4], [x + 2, baseY - 5]], p.light);
    }
    px(ctx, x - 1, y - 46 * size, 2, 2, p.hi);
    return;
  }

  const trunkH = (obj.variant === 'birch' ? 26 : 22) * size;
  px(ctx, x - 3, y - trunkH, 6, trunkH, p.trunk);
  px(ctx, x - 2, y - trunkH, 2, trunkH, obj.variant === 'birch' ? '#f2edda' : '#7a583b');
  if (obj.variant === 'birch') {
    for (let i = 0; i < 4; i++) px(ctx, x - 3 + (i % 2), y - trunkH + 4 + i * 5, 2, 1, '#5a5248');
  } else {
    px(ctx, x + 2, y - trunkH + 4, 2, trunkH - 8, '#503622');
    px(ctx, x - 6, y - 2, 4, 2, p.trunk);
    px(ctx, x + 3, y - 2, 4, 2, p.trunk);
  }

  const cy = y - trunkH - 10 * size;
  const r = 17 * size;
  drawCanopyBlob(ctx, x + sway, cy + 5, r + 3, p.deep);
  drawCanopyBlob(ctx, x - 9 * size + sway, cy + 2, r * 0.8, p.base);
  drawCanopyBlob(ctx, x + 10 * size + sway, cy + 1, r * 0.78, p.base);
  drawCanopyBlob(ctx, x + sway, cy - 8 * size, r * 0.85, p.light);
  drawCanopyBlob(ctx, x - 7 * size + sway, cy - 3 * size, r * 0.55, p.light);
  drawCanopyBlob(ctx, x + 7 * size + sway, cy - 9 * size, r * 0.42, p.hi);
  px(ctx, x - 13 * size, cy + 12 * size, 3, 1, p.deep);
  px(ctx, x + 15 * size, cy + 9 * size, 2, 1, p.deep);
  px(ctx, x + 4 * size, cy - 19 * size, 2, 2, p.hi);
  if (obj.variant === 'gold') {
    px(ctx, x - 18 * size, cy, 1, 1, '#f4e3a0');
    px(ctx, x + 8 * size, cy + 18 * size, 1, 1, '#f4e3a0');
  }
  if (obj.leafy) {
    px(ctx, x - 2, y - 4, 1, 2, '#5a7f49');
  }
}

export function drawBush(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  const s = obj.size || 1;
  const berries = obj.berries;
  circlePixels(ctx, x, y - 5 * s, 8 * s, '#376c42');
  circlePixels(ctx, x - 5 * s, y - 8 * s, 6 * s, '#47884f');
  circlePixels(ctx, x + 5 * s, y - 7 * s, 5 * s, '#3f7a49');
  circlePixels(ctx, x - 2 * s, y - 11 * s, 4 * s, '#5a9c58');
  px(ctx, x - 4 * s, y - 12 * s, 2, 1, '#7abd70');
  if (berries) {
    px(ctx, x - 6, y - 7, 1, 1, '#e8a0a0');
    px(ctx, x + 4, y - 9, 1, 1, '#e8a0a0');
    px(ctx, x + 1, y - 4, 1, 1, '#e8a0a0');
  }
}

export function drawRock(ctx, obj) {
  const x = obj.x;
  const y = obj.y;
  const s = obj.size || 1;
  ctx.fillStyle = 'rgba(20, 26, 22, .2)';
  ctx.beginPath();
  ctx.ellipse(x, y, 10 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  poly(ctx, [[x - 11 * s, y], [x - 8 * s, y - 7 * s], [x - 2 * s, y - 11 * s], [x + 6 * s, y - 8 * s], [x + 11 * s, y]], '#6f7278');
  poly(ctx, [[x - 7 * s, y - 1], [x - 5 * s, y - 6 * s], [x - 1 * s, y - 9 * s], [x + 5 * s, y - 6 * s], [x + 7 * s, y - 1]], '#8d9097');
  poly(ctx, [[x - 4 * s, y - 3 * s], [x - 2 * s, y - 7 * s], [x + 1 * s, y - 6 * s], [x + 2 * s, y - 2]], '#a8abb0');
  px(ctx, x + 6 * s, y - 4, 1, 2, '#5b5e65');
  if (obj.moss) {
    px(ctx, x - 7 * s, y - 4, 3, 1, '#6b9a58');
    px(ctx, x + 1 * s, y - 8 * s, 2, 1, '#6b9a58');
  }
}

export function drawStump(ctx, obj) {
  const x = obj.x;
  const y = obj.y;
  px(ctx, x - 5, y - 6, 10, 5, '#5a3c28');
  px(ctx, x - 5, y - 7, 10, 2, '#8c603f');
  px(ctx, x - 3, y - 7, 6, 1, '#bd8e5f');
  px(ctx, x - 1, y - 7, 2, 1, '#8c603f');
  px(ctx, x - 8, y - 1, 3, 1, '#4f3828');
  px(ctx, x + 6, y - 2, 3, 1, '#4f3828');
}

export function drawLampPost(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  const lit = obj.lit !== false;
  ctx.fillStyle = 'rgba(22, 25, 30, .22)';
  ctx.beginPath();
  ctx.ellipse(x, y, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, x - 3, y - 6, 6, 4, '#4b4640');
  px(ctx, x - 2, y - 40, 4, 35, '#3d3833');
  px(ctx, x - 1, y - 40, 1, 33, '#6b6357');
  px(ctx, x - 5, y - 44, 10, 2, '#4b4640');
  if (lit) {
    const pulse = 0.85 + Math.sin(time * 0.002 + (obj.seed || 0)) * 0.15;
    const glow = ctx.createRadialGradient(x, y - 47, 2, x, y - 47, 26);
    glow.addColorStop(0, `rgba(255, 207, 120, ${0.22 * pulse})`);
    glow.addColorStop(1, 'rgba(255, 207, 120, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - 28, y - 75, 56, 56);
  }
  px(ctx, x - 5, y - 55, 10, 11, '#3a3430');
  px(ctx, x - 4, y - 54, 8, 9, lit ? '#f6cf82' : '#80735e');
  px(ctx, x - 3, y - 53, 6, 7, lit ? '#ffe6a8' : '#9d8f77');
  px(ctx, x - 1, y - 53, 2, 6, lit ? '#fff4cc' : '#b5a68a');
  px(ctx, x - 6, y - 56, 12, 2, '#4f4942');
  px(ctx, x - 4, y - 45, 8, 2, '#4f4942');
  px(ctx, x - 1, y - 58, 2, 2, '#4f4942');
  if (obj.flower) {
    px(ctx, x - 2, y - 2, 2, 2, '#d8a2b8');
  }
}

export function drawBench(ctx, obj) {
  const x = obj.x;
  const y = obj.y;
  ctx.fillStyle = 'rgba(22, 26, 22, .2)';
  ctx.fillRect(x - 16, y - 2, 32, 3);
  px(ctx, x - 16, y - 12, 32, 4, '#6c4a31');
  px(ctx, x - 16, y - 12, 32, 1, '#a5744b');
  px(ctx, x - 15, y - 8, 30, 3, '#93673f');
  px(ctx, x - 15, y - 5, 30, 2, '#b98755');
  px(ctx, x - 15, y - 3, 2, 10, '#4f3828');
  px(ctx, x + 13, y - 3, 2, 10, '#4f3828');
  px(ctx, x - 16, y - 17, 3, 9, '#5b3f2b');
  px(ctx, x + 13, y - 17, 3, 9, '#5b3f2b');
  px(ctx, x - 14, y - 16, 28, 2, '#8b5f3b');
  px(ctx, x - 13, y - 13, 2, 1, '#c08d5e');
  px(ctx, x + 11, y - 13, 2, 1, '#c08d5e');
}

export function drawBoard(ctx, obj) {
  const x = obj.x;
  const y = obj.y;
  ctx.fillStyle = 'rgba(22, 26, 22, .22)';
  ctx.fillRect(x - 18, y - 2, 36, 3);
  px(ctx, x - 15, y - 34, 3, 34, '#4f3626');
  px(ctx, x + 12, y - 34, 3, 34, '#4f3626');
  px(ctx, x - 20, y - 48, 40, 28, '#5a3d29');
  px(ctx, x - 18, y - 46, 36, 24, '#9a7048');
  px(ctx, x - 16, y - 44, 32, 20, '#c79a63');
  px(ctx, x - 18, y - 52, 36, 5, '#416b60');
  px(ctx, x - 20, y - 54, 40, 3, '#5b8879');
  px(ctx, x - 17, y - 53, 34, 1, '#7aa898');
  // papers
  const papers = [
    [-12, -41, 10, 12, '#f0e4c7'],
    [1, -42, 11, 10, '#e7d7b5'],
    [-10, -27, 12, 7, '#f5ecd7'],
    [4, -29, 9, 8, '#e6c99b']
  ];
  for (const [dx, dy, w, h, color] of papers) {
    px(ctx, x + dx, y + dy, w, h, color);
    px(ctx, x + dx + 2, y + dy + 2, w - 4, 1, '#a99676');
    px(ctx, x + dx + 2, y + dy + 4, w - 5, 1, '#b7a484');
    px(ctx, x + dx + 2, y + dy + 6, w - 3, 1, '#c4b294');
    px(ctx, x + dx + Math.floor(w / 2), y + dy + 1, 1, 1, '#b45e50');
  }
  px(ctx, x - 5, y - 46, 10, 2, '#e0c078');
  px(ctx, x - 1, y - 47, 2, 1, '#f1d79b');
  px(ctx, x - 12, y - 49, 1, 3, '#718b5d');
  px(ctx, x + 11, y - 49, 1, 2, '#718b5d');
}

export function drawSignpost(ctx, obj) {
  const x = obj.x;
  const y = obj.y;
  px(ctx, x - 2, y - 34, 4, 34, '#6d4b30');
  px(ctx, x - 1, y - 34, 1, 32, '#956b47');
  px(ctx, x - 18, y - 36, 26, 9, '#9d7047');
  px(ctx, x - 18, y - 36, 26, 2, '#c08f5f');
  poly(ctx, [[x + 8, y - 27], [x + 14, y - 31.5], [x + 8, y - 36]], '#9d7047');
  px(ctx, x - 14, y - 32, 4, 1, '#5d4229');
  px(ctx, x - 8, y - 32, 10, 1, '#5d4229');
  px(ctx, x + 2, y - 25, 15, 8, '#b78957');
  px(ctx, x + 2, y - 25, 15, 1, '#d3a874');
  poly(ctx, [[x + 2, y - 17], [x - 4, y - 21], [x + 2, y - 25]], '#b78957');
  px(ctx, x + 6, y - 22, 8, 1, '#5d4229');
  px(ctx, x - 4, y - 4, 8, 3, '#4f6b3f');
  px(ctx, x - 2, y - 8, 4, 4, '#6a8f4e');
}

export function drawPostbox(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  ctx.fillStyle = 'rgba(22, 26, 22, .22)';
  ctx.fillRect(x - 8, y - 2, 16, 3);
  px(ctx, x - 7, y - 22, 14, 21, '#8f3f3c');
  px(ctx, x - 7, y - 24, 14, 4, '#b95750');
  px(ctx, x - 6, y - 26, 12, 3, '#c96a5d');
  px(ctx, x - 5, y - 28, 10, 3, '#b95750');
  px(ctx, x - 7, y - 24, 2, 20, '#702f2e');
  px(ctx, x + 4, y - 22, 2, 18, '#b65a50');
  px(ctx, x - 4, y - 20, 7, 3, '#3d2b2b');
  px(ctx, x - 4, y - 9, 8, 6, '#f0e1c2');
  px(ctx, x - 3, y - 8, 6, 1, '#b5a382');
  px(ctx, x - 3, y - 6, 4, 1, '#b5a382');
  px(ctx, x - 8, y - 34, 2, 10, '#6b5b4a');
  px(ctx, x + 6, y - 39, 2, 15, '#6b5b4a');
  const flag = Math.sin(time * 0.003) > 0 ? '#e0c078' : '#c9a95f';
  px(ctx, x + 6, y - 38, 8, 5, flag);
  px(ctx, x + 6, y - 33, 8, 1, '#8f7a3f');
  px(ctx, x - 2, y - 13, 4, 1, '#d9c9a9');
}

export function drawCrate(ctx, obj) {
  const x = obj.x;
  const y = obj.y;
  px(ctx, x - 8, y - 14, 16, 14, '#8b623d');
  px(ctx, x - 7, y - 13, 14, 12, '#a8784a');
  px(ctx, x - 7, y - 13, 14, 2, '#c08f5c');
  px(ctx, x - 7, y - 7, 14, 1, '#6d4a2d');
  px(ctx, x - 1, y - 13, 2, 12, '#6d4a2d');
  px(ctx, x - 8, y - 3, 16, 2, '#6d4a2d');
}

export function drawBarrel(ctx, obj) {
  const x = obj.x;
  const y = obj.y;
  px(ctx, x - 7, y - 15, 14, 14, '#72502f');
  px(ctx, x - 6, y - 15, 12, 13, '#936838');
  px(ctx, x - 6, y - 12, 12, 2, '#5b4027');
  px(ctx, x - 6, y - 6, 12, 2, '#5b4027');
  px(ctx, x - 5, y - 14, 2, 12, '#aa7a48');
  px(ctx, x - 7, y - 3, 2, 2, '#5b4027');
  px(ctx, x + 5, y - 3, 2, 2, '#5b4027');
}

export function drawFlowerbox(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  px(ctx, x - 12, y - 8, 24, 8, '#7a5136');
  px(ctx, x - 11, y - 8, 22, 2, '#a1754c');
  px(ctx, x - 12, y - 2, 24, 2, '#5b3a26');
  const colors = ['#e88f8a', '#f2cf7c', '#c9a7ff', '#f5e7c8'];
  for (let i = 0; i < 5; i++) {
    const fx = x - 8 + i * 4;
    const sway = Math.sin(time * 0.0015 + i) > 0 ? 1 : 0;
    px(ctx, fx, y - 11 + sway, 1, 4, '#4c7a45');
    px(ctx, fx - 1, y - 13 + sway, 3, 2, colors[i % colors.length]);
    px(ctx, fx, y - 14 + sway, 1, 1, colors[(i + 2) % colors.length]);
  }
}

export function drawWell(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  ctx.fillStyle = 'rgba(22, 26, 22, .22)';
  ctx.beginPath();
  ctx.ellipse(x, y - 1, 20, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // stone ring
  px(ctx, x - 17, y - 14, 34, 13, '#7d7a70');
  px(ctx, x - 16, y - 15, 32, 4, '#a09a8b');
  px(ctx, x - 17, y - 6, 34, 4, '#5f5c54');
  for (let i = 0; i < 5; i++) {
    px(ctx, x - 14 + i * 7, y - 13, 5, 4, i % 2 ? '#908b7e' : '#858175');
    px(ctx, x - 12 + i * 7, y - 8, 4, 3, i % 2 ? '#6d6a62' : '#777369');
  }
  // water inside
  px(ctx, x - 13, y - 17, 26, 4, '#3d5c63');
  const glint = Math.sin(time * 0.002) > 0 ? '#8fc0c3' : '#6fa3a8';
  px(ctx, x - 8, y - 17, 6, 1, glint);
  // posts and roof
  px(ctx, x - 14, y - 40, 3, 27, '#5d422c');
  px(ctx, x + 11, y - 40, 3, 27, '#5d422c');
  poly(ctx, [[x - 20, y - 40], [x, y - 49], [x + 20, y - 40]], '#7a4f37');
  poly(ctx, [[x - 16, y - 40], [x, y - 47], [x + 16, y - 40]], '#a06844');
  px(ctx, x - 21, y - 40, 42, 3, '#5b3b2a');
  px(ctx, x - 1, y - 43, 2, 3, '#e0c078');
  // rope + bucket
  px(ctx, x - 1, y - 36, 1, 13, '#c9b184');
  px(ctx, x - 5, y - 26, 9, 7, '#8a6038');
  px(ctx, x - 5, y - 26, 9, 2, '#b7854f');
  px(ctx, x - 5, y - 21, 9, 2, '#5f4027');
}

export function drawHive(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  ctx.fillStyle = 'rgba(22, 26, 22, .2)';
  ctx.fillRect(x - 10, y - 2, 20, 3);
  px(ctx, x - 12, y - 8, 3, 7, '#6a4a2f');
  px(ctx, x + 9, y - 8, 3, 7, '#6a4a2f');
  px(ctx, x - 10, y - 10, 20, 3, '#8a6238');
  px(ctx, x - 9, y - 26, 18, 17, '#c89a4c');
  px(ctx, x - 9, y - 26, 18, 2, '#e0b76e');
  for (let i = 0; i < 4; i++) px(ctx, x - 8, y - 23 + i * 4, 16, 1, '#a97b35');
  px(ctx, x - 6, y - 22, 3, 2, '#7a5427');
  px(ctx, x + 3, y - 22, 3, 2, '#7a5427');
  poly(ctx, [[x - 12, y - 27], [x, y - 33], [x + 12, y - 27]], '#8a6238');
  px(ctx, x - 1, y - 32, 2, 5, '#6a4a2f');
  const t = time * 0.002;
  for (let i = 0; i < 3; i++) {
    const bx = x + Math.cos(t + i * 2.1) * (10 + i * 3);
    const by = y - 26 + Math.sin(t * 1.4 + i * 1.7) * 5;
    px(ctx, bx, by, 1, 1, '#f5d97d');
    px(ctx, bx - 1, by, 1, 1, 'rgba(255,255,255,.45)');
  }
}

export function drawPicnic(ctx, obj) {
  const x = obj.x;
  const y = obj.y;
  px(ctx, x - 22, y - 16, 44, 15, '#c8877b');
  for (let i = 0; i < 4; i++) {
    px(ctx, x - 20 + i * 11, y - 16, 5, 15, '#e5b6a4');
    px(ctx, x - 20 + i * 11, y - 16, 5, 1, '#f0cdbd');
  }
  px(ctx, x - 22, y - 17, 44, 2, '#a4685f');
  // basket
  px(ctx, x - 10, y - 24, 15, 8, '#a97a47');
  px(ctx, x - 10, y - 24, 15, 2, '#c99a60');
  px(ctx, x - 6, y - 28, 8, 4, '#8a6038');
  px(ctx, x - 4, y - 27, 4, 1, '#6a4a2f');
  // cups and fruit
  px(ctx, x + 9, y - 20, 3, 4, '#e8dbc2');
  px(ctx, x + 13, y - 19, 3, 3, '#e8dbc2');
  px(ctx, x - 15, y - 20, 4, 4, '#d96f62');
  px(ctx, x - 14, y - 21, 2, 1, '#7fa45c');
  // grass tufts around
  px(ctx, x - 27, y - 4, 1, 4, '#5a8845');
  px(ctx, x + 25, y - 3, 1, 5, '#6b9a52');
}

export function drawScarecrow(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  ctx.fillStyle = 'rgba(22, 26, 22, .2)';
  px(ctx, x - 11, y - 2, 22, 2, 'rgba(22, 26, 22, .18)');
  px(ctx, x - 1, y - 38, 2, 38, '#6f4c30');
  px(ctx, x - 13, y - 30, 26, 2, '#6f4c30');
  // shirt
  px(ctx, x - 9, y - 34, 18, 12, '#7b8f6a');
  px(ctx, x - 9, y - 34, 18, 2, '#98ab83');
  px(ctx, x - 13, y - 31, 4, 3, '#6c7f5c');
  px(ctx, x + 9, y - 31, 4, 3, '#6c7f5c');
  for (const sx of [-11, 12]) {
    px(ctx, sx + x, y - 29, 1, 3, '#d8b96a');
    px(ctx, sx + x - 1, y - 26, 3, 1, '#d8b96a');
  }
  // head sack + hat
  px(ctx, x - 6, y - 43, 12, 10, '#d9c08c');
  px(ctx, x - 5, y - 42, 10, 8, '#e7d3a4');
  px(ctx, x - 3, y - 40, 1, 2, '#5a4630');
  px(ctx, x + 2, y - 40, 1, 2, '#5a4630');
  px(ctx, x - 2, y - 36, 4, 1, '#7a5d3d');
  const sway = Math.sin(time * 0.0015) > 0 ? 1 : 0;
  px(ctx, x - 10, y - 46 + sway, 20, 3, '#c0a05e');
  poly(ctx, [[x - 7, y - 46], [x, y - 52], [x + 7, y - 46]], '#d8b96a');
  px(ctx, x - 8, y - 46, 16, 1, '#efe0ae');
  px(ctx, x - 1, y - 50, 2, 3, '#a4844a');
}

/* ---------------- fountain ---------------- */

function ellipseFill(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let dy = -Math.round(ry); dy <= Math.round(ry); dy++) {
    const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    if (span <= 0) continue;
    ctx.fillRect(Math.round(cx - span), Math.round(cy + dy), span * 2, 1);
  }
}

function ellipseRing(ctx, cx, cy, rx, ry, color, step = 1) {
  ctx.fillStyle = color;
  const points = Math.ceil(rx * Math.PI * 2);
  for (let i = 0; i < points; i++) {
    const a = (i / points) * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), step, step);
  }
}

export function drawFountain(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  const t = time * 0.001;
  const shimmer = Math.sin(t * 2.2);

  ctx.fillStyle = 'rgba(22, 26, 22, .28)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 36, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // stepped stone base
  ellipseFill(ctx, x, y + 1, 34, 11, '#6f6a60');
  ellipseFill(ctx, x, y, 33, 10, '#969082');
  ellipseFill(ctx, x, y - 1, 31, 9, '#a9a292');

  // basin wall with gold trim
  ellipseFill(ctx, x, y - 3, 30, 9, '#b8af9b');
  ellipseFill(ctx, x, y - 4, 28, 8, '#cdc4ae');
  ellipseRing(ctx, x, y - 4, 27, 7, '#c9a24a', 2);
  ellipseRing(ctx, x, y - 5, 25, 6, '#e6c76b', 1);

  // water
  ellipseFill(ctx, x, y - 5, 23, 5, '#4b818d');
  ellipseFill(ctx, x, y - 6, 21, 4, '#5c9aa6');
  ellipseFill(ctx, x + Math.round(shimmer), y - 6, 16, 3, '#72b3bf');

  // carved stone carp on the rim, spraying inward
  for (const [dx, dy, flip] of [[-24, -5, -1], [24, -5, 1], [-13, 2, -1], [13, 2, 1]]) {
    px(ctx, x + dx - 3, y + dy - 3, 7, 4, '#a9a292');
    px(ctx, x + dx - 2, y + dy - 4, 5, 2, '#d0c7b2');
    px(ctx, x + dx + flip * 4, y + dy - 5, 2, 2, '#8f8778');
    px(ctx, x + dx + flip * 2, y + dy - 5, 1, 1, '#45423c');
    const drop = (Math.sin(t * 1.8 + dx) + 1) / 2;
    px(ctx, x + dx + flip * (5 + drop * 3), y + dy - 3 - drop * 5, 1, 1, 'rgba(214, 244, 247, .8)');
  }

  // lower tier bowl
  px(ctx, x - 3, y - 27, 6, 21, '#8f8878');
  px(ctx, x - 2, y - 27, 2, 21, '#c0b7a3');
  ellipseFill(ctx, x, y - 26, 13, 4, '#8b8476');
  ellipseFill(ctx, x, y - 27, 12, 3, '#cdc4ae');
  ellipseRing(ctx, x, y - 27, 11, 2, '#d9b45c', 1);
  ellipseFill(ctx, x, y - 27, 9, 2, '#6fa9b4');

  // upper column and bowl
  px(ctx, x - 2, y - 42, 4, 16, '#a49b8a');
  px(ctx, x - 1, y - 42, 1, 16, '#d2c9b4');
  ellipseFill(ctx, x, y - 41, 8, 3, '#8b8476');
  ellipseFill(ctx, x, y - 42, 7, 2, '#d6cdb8');
  ellipseRing(ctx, x, y - 42, 6, 1, '#e4c168', 1);
  px(ctx, x - 1, y - 50, 2, 8, '#c9a24a');
  px(ctx, x - 2, y - 54, 4, 4, '#e9c96e');
  px(ctx, x - 1, y - 55, 2, 1, '#fff0b6');

  // central jet
  for (let i = 0; i < 8; i++) {
    const phase = t * 2 + i * 0.45;
    const h = (Math.sin(phase) + 1) / 2;
    px(ctx, x - 1 + Math.round(Math.sin(phase * 1.7) * 2), Math.round(y - 58 - h * 9), 2, 2, 'rgba(222, 247, 248, .85)');
  }

  // arcs falling from the tiers
  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const phase = t * 1.6 + i * 0.7 + (side > 0 ? 1.3 : 0);
      const k = (Math.sin(phase) + 1) / 2;
      px(ctx, x + side * (7 + k * 13), y - 41 + k * k * 16, 1, 1, 'rgba(210, 242, 246, .8)');
    }
  }

  // gold glints on the water
  for (let i = 0; i < 6; i++) {
    const a = t * 0.8 + i * 1.05;
    const r = 11 + (i % 3) * 5;
    if (Math.sin(t * 2.4 + i) > 0.2) {
      px(ctx, x + Math.cos(a) * r, y - 6 + Math.sin(a) * r * 0.3, 1, 1, '#ffe7a6');
    }
  }

  ctx.globalAlpha = 0.45;
  px(ctx, x - 17 + Math.round(shimmer * 2), y - 4, 8, 1, '#d3efee');
  px(ctx, x + 7 - Math.round(shimmer), y - 7, 9, 1, '#d3efee');
  ctx.globalAlpha = 1;
}

/* ---------------- attractions ---------------- */

export function drawWindmill(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  const t = time * 0.001;

  ctx.fillStyle = 'rgba(22, 26, 22, .22)';
  ctx.beginPath();
  ctx.ellipse(x, y, 27, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // stone base with door
  px(ctx, x - 18, y - 14, 36, 14, '#948d7d');
  px(ctx, x - 16, y - 14, 32, 12, '#b3ab98');
  px(ctx, x - 18, y - 3, 36, 3, '#7f786b');
  px(ctx, x - 5, y - 16, 10, 15, '#6b4a33');
  px(ctx, x - 4, y - 15, 8, 13, '#8a6244');
  px(ctx, x - 1, y - 10, 2, 2, '#ffd98b');

  // tower
  px(ctx, x - 15, y - 60, 30, 46, '#a89c84');
  px(ctx, x - 13, y - 60, 26, 44, '#c0b39a');
  px(ctx, x - 15, y - 60, 3, 46, '#8d8169');
  px(ctx, x + 12, y - 60, 3, 46, '#93876f');
  for (let i = 0; i < 4; i++) px(ctx, x - 13, y - 56 + i * 10, 26, 1, '#a4977e');
  px(ctx, x - 4, y - 52, 8, 9, '#6f5a3b');
  px(ctx, x - 3, y - 51, 6, 7, '#f4d896');
  px(ctx, x - 3, y - 45, 6, 1, '#8a6f45');

  // cap
  poly(ctx, [[x - 18, y - 60], [x, y - 74], [x + 18, y - 60]], '#7c5136');
  poly(ctx, [[x - 14, y - 60], [x, y - 70], [x + 14, y - 60]], '#9a6a45');
  px(ctx, x - 2, y - 78, 4, 6, '#5b3d2a');

  // turning blades
  ctx.save();
  ctx.translate(x, y - 64);
  ctx.rotate(t * 0.6);
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((Math.PI / 2) * i);
    ctx.fillStyle = '#8a6a45';
    ctx.fillRect(1, -2, 30, 4);
    ctx.fillStyle = '#d8c8a8';
    ctx.fillRect(4, -2, 25, 2);
    ctx.fillStyle = '#b9a582';
    for (let s = 0; s < 6; s++) ctx.fillRect(6 + s * 4, -2, 1, 4);
    ctx.restore();
  }
  px(ctx, -3, -3, 6, 6, '#5b3d2a');
  px(ctx, -1, -1, 2, 2, '#d9b46c');
  ctx.restore();

  // tulips at the foot
  for (const [dx, color] of [[-22, '#e8687d'], [-17, '#f2c14e'], [20, '#d96a8a'], [25, '#f2c14e']]) {
    px(ctx, x + dx, y - 6, 1, 5, '#5d8447');
    px(ctx, x + dx - 1, y - 8, 3, 2, color);
  }
}

export function drawFlowerArch(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  const t = time * 0.001;

  ctx.fillStyle = 'rgba(22, 26, 22, .2)';
  ctx.beginPath();
  ctx.ellipse(x, y, 25, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const side of [-1, 1]) {
    px(ctx, x + side * 20 - 2, y - 42, 5, 42, '#7c6a4c');
    px(ctx, x + side * 20 - 1, y - 42, 2, 42, '#9c8763');
    px(ctx, x + side * 20 - 4, y - 45, 9, 4, '#a89060');
  }
  ctx.strokeStyle = '#7c6a4c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, y - 42, 21, Math.PI, 0);
  ctx.stroke();
  ctx.strokeStyle = '#9c8763';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 44, 21, Math.PI, 0);
  ctx.stroke();

  const flowerColors = ['#f2a7b8', '#f6d97a', '#d8b6ef', '#f7ecd9'];
  for (let i = 0; i < 20; i++) {
    const a = Math.PI + (i / 19) * Math.PI;
    const fx = x + Math.cos(a) * 21;
    const fy = y - 42 + Math.sin(a) * 21;
    px(ctx, fx, fy - 2, 2, 2, i % 3 === 0 ? flowerColors[i % 4] : '#6f9e58');
    if (i % 2 === 0) {
      px(ctx, fx - 1, fy - 4 + (Math.sin(t * 2 + i) > 0 ? 1 : 0), 1, 1, flowerColors[(i + 1) % 4]);
    }
  }
  for (let i = 0; i < 5; i++) {
    const lx = x - 14 + i * 7;
    px(ctx, lx, y - 48, 1, 3, '#6b5a3d');
    px(ctx, lx - 1, y - 45, 2, 2, Math.sin(t * 2.2 + i) > 0 ? '#ffe6a0' : '#c9a869');
  }
  for (let i = 0; i < 7; i++) {
    const fx = x - 22 + (i * 9) % 45;
    px(ctx, fx, y - 2 + (i % 2), 2, 1, flowerColors[i % 4]);
  }
}

export function drawStage(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  const t = time * 0.001;

  ctx.fillStyle = 'rgba(22, 26, 22, .22)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 36, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  px(ctx, x - 34, y - 16, 68, 16, '#6b4a33');
  px(ctx, x - 33, y - 15, 66, 12, '#8f6644');
  px(ctx, x - 34, y - 6, 68, 5, '#5c3f2c');
  for (let i = 0; i < 8; i++) px(ctx, x - 32 + i * 8, y - 14, 1, 9, '#7c5739');
  px(ctx, x - 34, y - 16, 68, 2, '#a4784c');

  px(ctx, x - 30, y - 44, 3, 28, '#6b4a33');
  px(ctx, x + 27, y - 44, 3, 28, '#6b4a33');
  px(ctx, x - 30, y - 46, 60, 1, '#8a6a45');
  for (let i = 0; i < 6; i++) {
    const bx = x - 28 + i * 11;
    const by = y - 45 + Math.round(Math.sin((i / 5) * Math.PI) * -3);
    px(ctx, bx, by, 7, 5, ['#e07a6b', '#f2c14e', '#7fb3a4', '#d8b6ef'][i % 4]);
    px(ctx, bx + 1, by + 5, 5, 1, '#f7ecd2');
  }

  for (const side of [-1, 1]) {
    const sx = x + side * 28;
    px(ctx, sx - 5, y - 26, 10, 12, '#3f3b36');
    px(ctx, sx - 4, y - 25, 8, 10, '#55504a');
    circlePixels(ctx, sx, y - 20, 3, '#2c2a27');
    px(ctx, sx - 1, y - 21, 2, 2, '#8a847b');
  }

  px(ctx, x - 1, y - 30, 2, 16, '#4a4741');
  px(ctx, x - 6, y - 32, 6, 3, '#6b675f');
  px(ctx, x - 9, y - 34, 4, 4, '#3f3b36');
  px(ctx, x - 9, y - 34, 3, 3, '#9a948a');

  for (let i = 0; i < 3; i++) {
    const phase = t * 1.4 + i * 1.3;
    const nx = x + 6 + Math.sin(phase) * 8 + i * 6;
    const ny = y - 34 - ((t * 10 + i * 9) % 22);
    ctx.globalAlpha = Math.max(0.15, 0.45 + Math.sin(phase) * 0.3);
    px(ctx, nx, ny, 2, 3, '#ffe6a0');
    px(ctx, nx + 2, ny - 1, 1, 1, '#ffe6a0');
    ctx.globalAlpha = 1;
  }
}

export function drawCampfire(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  const t = time * 0.001;
  const f1 = Math.sin(t * 8) > 0 ? 1 : 0;
  const f2 = Math.sin(t * 6.4 + 1.2) > 0 ? 1 : 0;

  ctx.fillStyle = 'rgba(22, 26, 22, .2)';
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    px(ctx, x + Math.cos(a) * 12 - 2, y - 2 + Math.sin(a) * 4, 5, 3, i % 2 ? '#8a857a' : '#a49d8d');
  }
  px(ctx, x - 9, y - 5, 18, 3, '#6b4a33');
  px(ctx, x - 8, y - 7, 16, 3, '#8a5f3d');
  px(ctx, x - 3, y - 9, 3, 8, '#7c5136');
  px(ctx, x - 4, y - 12 - f1, 8, 7, '#e07a4d');
  px(ctx, x - 3, y - 15 - f1, 6, 5, '#f2a84e');
  px(ctx, x - 2, y - 18 - f2, 4, 5, '#ffd166');
  px(ctx, x - 1, y - 20 - f1, 2, 4, '#fff0b6');

  for (let i = 0; i < 4; i++) {
    const phase = t * 2 + i * 1.6;
    const ey = y - 14 - ((t * 12 + i * 7) % 20);
    const ex = x + Math.sin(phase) * 7;
    ctx.globalAlpha = 0.5 + Math.sin(phase) * 0.3;
    px(ctx, ex, ey, 1, 1, '#ffca7a');
    ctx.globalAlpha = 1;
  }

  px(ctx, x - 27, y + 1, 14, 3, '#8a5f3d');
  px(ctx, x - 26, y, 12, 2, '#a4784c');
  px(ctx, x + 13, y + 2, 13, 3, '#7c5136');
  px(ctx, x + 14, y + 1, 11, 2, '#96633f');
}

/* ---------------- water ---------------- */

export function drawDock(ctx, obj) {
  const x = obj.x;
  const y = obj.y;
  ctx.fillStyle = 'rgba(20, 40, 44, .28)';
  ctx.fillRect(x - 32, y + 12, 64, 4);
  for (const dx of [-30, -10, 10, 30]) {
    px(ctx, x + dx - 2, y + 10, 4, 9, '#5d3f28');
    px(ctx, x + dx - 2, y + 10, 2, 8, '#7c5739');
  }
  px(ctx, x - 32, y, 64, 14, '#7b5636');
  px(ctx, x - 32, y, 64, 2, '#a4784c');
  for (let i = 0; i < 8; i++) {
    px(ctx, x - 30 + i * 8, y + 2, 1, 10, '#5f432c');
    px(ctx, x - 29 + i * 8, y + 2, 6, 1, '#8f6644');
  }
  px(ctx, x - 32, y + 8, 64, 1, '#66482f');
  px(ctx, x + 18, y + 4, 6, 5, '#c7a76a');
  px(ctx, x + 20, y + 5, 3, 3, '#8a6a45');
}

export function drawBoat(ctx, obj, time, moving = false) {
  const x = obj.x;
  const y = obj.y;
  const t = time * 0.001;
  const bob = Math.sin(t * 2.2) > 0 ? 0 : 1;

  ctx.fillStyle = 'rgba(28, 60, 66, .35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  if (moving) {
    ctx.globalAlpha = 0.5;
    px(ctx, x - 27, y, 6, 1, '#cfeeed');
    px(ctx, x + 21, y, 6, 1, '#cfeeed');
    px(ctx, x - 23, y + 4, 4, 1, '#a9d8dd');
    px(ctx, x + 19, y + 4, 4, 1, '#a9d8dd');
    ctx.globalAlpha = 1;
  }

  px(ctx, x - 20, y - 3 + bob, 40, 8, '#6b4a33');
  px(ctx, x - 18, y - 6 + bob, 36, 8, '#8f6644');
  px(ctx, x - 16, y - 7 + bob, 32, 5, '#a4784c');
  px(ctx, x - 20, y - 1 + bob, 4, 5, '#5d3f28');
  px(ctx, x + 16, y - 1 + bob, 4, 5, '#5d3f28');
  px(ctx, x - 18, y + 1 + bob, 36, 2, '#7c5739');
  px(ctx, x - 12, y - 3 + bob, 24, 5, '#b98a5c');
  px(ctx, x - 11, y - 2 + bob, 22, 2, '#caa274');
  px(ctx, x - 10, y - 6 + bob, 6, 4, '#8f6644');
  px(ctx, x + 4, y - 6 + bob, 6, 4, '#8f6644');

  const swing = moving ? Math.round(Math.sin(t * 6) * 2) : 0;
  px(ctx, x - 24, y + 2 + bob + swing, 9, 1, '#c7a76a');
  px(ctx, x + 15, y + 2 + bob - swing, 9, 1, '#c7a76a');
  px(ctx, x - 19, y - 6 + bob, 2, 2, '#d9b46c');
}

/* ---------------- gate ---------------- */

export function drawGate(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  const open = obj.open;
  ctx.fillStyle = 'rgba(22, 26, 22, .24)';
  ctx.fillRect(x - 34, y - 2, 68, 4);
  for (const side of [-1, 1]) {
    const gx = x + side * 30;
    px(ctx, gx - 6, y - 44, 12, 44, '#6f6a60');
    px(ctx, gx - 5, y - 43, 10, 41, '#928b7d');
    px(ctx, gx - 7, y - 48, 14, 6, '#7c766a');
    px(ctx, gx - 6, y - 49, 12, 2, '#a49c8b');
    px(ctx, gx - 4, y - 56, 8, 8, '#4b453d');
    px(ctx, gx - 3, y - 55, 6, 6, '#d9b46c');
    px(ctx, gx - 2, y - 54, 4, 4, '#ffdf96');
    px(ctx, gx + 20 * side, y - 40, 8, 6, '#6f6a60');
  }
  if (open) {
    px(ctx, x - 20, y - 24, 14, 3, '#755139');
    px(ctx, x - 20, y - 18, 14, 3, '#8f6644');
    px(ctx, x + 6, y - 24, 14, 3, '#755139');
    px(ctx, x + 6, y - 18, 14, 3, '#8f6644');
    px(ctx, x - 20, y - 30, 2, 15, '#5a3d2a');
    px(ctx, x + 18, y - 30, 2, 15, '#5a3d2a');
    px(ctx, x - 1, y - 38, 2, 12, '#5a3d2a');
    const glow = Math.sin(time * 0.002) > -0.2;
    if (glow) {
      px(ctx, x - 1, y - 41, 2, 2, '#ffe5a3');
    }
  } else {
    px(ctx, x - 30, y - 30, 60, 4, '#755139');
    px(ctx, x - 30, y - 22, 60, 4, '#8f6644');
    px(ctx, x - 30, y - 14, 60, 4, '#755139');
    for (let i = -3; i <= 3; i++) {
      px(ctx, x + i * 8, y - 32, 2, 24, '#5a3d2a');
    }
    px(ctx, x - 2, y - 26, 4, 4, '#d9b46c');
    const blink = Math.sin(time * 0.0015) > 0.4;
    px(ctx, x - 1, y - 25, 2, 2, blink ? '#ffe6a1' : '#a58b55');
  }
}

/* ---------------- ducks & cat ---------------- */

export function drawDuck(ctx, x, y, time, phase = 0) {
  const bob = Math.sin(time * 0.002 + phase) > 0 ? 1 : 0;
  const flip = Math.sin(time * 0.0003 + phase) > 0;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y + bob));
  if (flip) ctx.scale(-1, 1);
  ctx.fillStyle = 'rgba(30, 55, 60, .2)';
  ctx.fillRect(-5, 1, 10, 2);
  px(ctx, -4, -6, 8, 5, '#f1e3c9');
  px(ctx, -3, -7, 6, 2, '#fbf1dc');
  px(ctx, 2, -10, 4, 5, '#e7d6b8');
  px(ctx, 4, -12, 3, 3, '#4d7d55');
  px(ctx, 6, -11, 1, 1, '#2f2c28');
  px(ctx, 6, -10, 3, 1, '#e2a34d');
  px(ctx, 6, -9, 2, 1, '#c98637');
  px(ctx, -6, -5, 2, 2, '#d9c7a8');
  px(ctx, 1, -4, 3, 1, '#b7a78d');
  ctx.restore();
}

export function drawCat(ctx, obj, time) {
  const x = obj.x;
  const y = obj.y;
  const breathe = Math.sin(time * 0.0014) > 0 ? 0 : 1;
  const tail = Math.sin(time * 0.0024) > 0 ? 1 : 0;
  ctx.fillStyle = 'rgba(20, 24, 20, .18)';
  ctx.fillRect(x - 7, y - 2, 14, 2);
  px(ctx, x - 5, y - 7 + breathe, 8, 6, '#d58f4f');
  px(ctx, x - 4, y - 8 + breathe, 6, 4, '#e5a45f');
  px(ctx, x - 8, y - 10 + breathe, 4, 4, '#d58f4f');
  px(ctx, x - 8, y - 12 + breathe, 5, 3, '#e8ab68');
  px(ctx, x - 9, y - 14 + breathe, 2, 2, '#d58f4f');
  px(ctx, x - 5, y - 14 + breathe, 2, 2, '#d58f4f');
  px(ctx, x - 8, y - 12 + breathe, 1, 1, '#9a6234');
  px(ctx, x - 6, y - 12 + breathe, 1, 1, '#9a6234');
  px(ctx, x - 7, y - 11 + breathe, 1, 1, '#b5655c');
  px(ctx, x + 3, y - 6 + breathe, 4, 2, '#c57f42');
  px(ctx, x + 6, y - 8 - tail, 2, 3 + tail, '#c57f42');
  px(ctx, x - 3, y - 4 + breathe, 2, 1, '#f0c998');
  px(ctx, x + 1, y - 4 + breathe, 2, 1, '#f0c998');
}

/* ---------------- buildings ---------------- */

function drawWindow(ctx, x, y, w, h, warm = true, frame = '#5c4430') {
  px(ctx, x - 2, y - 2, w + 4, h + 4, frame);
  px(ctx, x - 1, y - 1, w + 2, h + 2, '#3b2d24');
  if (warm) {
    px(ctx, x, y, w, h, '#e4b968');
    px(ctx, x + 1, y + 1, w - 2, h - 2, '#ffd98b');
    px(ctx, x + 2, y + 2, Math.floor(w / 2) - 2, h - 4, '#ffe9b2');
    px(ctx, x + Math.floor(w / 2) + 1, y + 2, 2, h - 4, '#d9a95c');
    px(ctx, x + 2, y + Math.floor(h / 2), w - 4, 1, '#c99a55');
  } else {
    px(ctx, x, y, w, h, '#537a80');
    px(ctx, x + 1, y + 1, w - 2, h - 2, '#6f9ca0');
    px(ctx, x + 2, y + 2, 2, h - 4, '#8fbfc0');
  }
  px(ctx, x + Math.floor(w / 2), y, 1, h, frame);
  px(ctx, x, y + Math.floor(h / 2), w, 1, frame);
}

function drawRoundWindow(ctx, cx, cy, r, warm = true) {
  circlePixels(ctx, cx, cy, r + 1, '#4e3927');
  circlePixels(ctx, cx, cy, r, warm ? '#ffd98b' : '#6f9ca0');
  circlePixels(ctx, cx - 1, cy - 1, Math.max(1, r - 3), warm ? '#fff0c4' : '#9ccfcc');
  px(ctx, cx - r, cy, r * 2, 1, '#4e3927');
  px(ctx, cx, cy - r, 1, r * 2, '#4e3927');
  px(ctx, cx - 2, cy - 2, 2, 2, 'rgba(255,255,255,.6)');
}

function drawSmoke(ctx, x, y, time, seed = 0) {
  const t = time * 0.00035 + seed;
  for (let i = 0; i < 4; i++) {
    const p = (t + i * 0.25) % 1;
    const sx = x + Math.sin((t + i) * 7) * 4 + p * 8;
    const sy = y - p * 30;
    const s = 2 + Math.floor(p * 4);
    ctx.fillStyle = `rgba(228, 225, 215, ${(1 - p) * 0.25})`;
    ctx.fillRect(Math.round(sx), Math.round(sy), s, s);
  }
}

function drawFlowerTuft(ctx, x, y, color) {
  px(ctx, x, y, 1, 3, '#4e7a45');
  px(ctx, x - 1, y - 1, 3, 2, color);
  px(ctx, x, y - 2, 1, 1, '#ffe8b0');
}

function drawHome(ctx, b, time) {
  const x = b.x;
  const y = b.y;
  const W = b.w;
  const H = b.h;
  ctx.fillStyle = 'rgba(25, 32, 26, .22)';
  ctx.beginPath();
  ctx.ellipse(x + W / 2, y + H - 1, W * 0.47, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // front bushes
  circlePixels(ctx, x + 22, y + H - 13, 11, '#3e7447');
  circlePixels(ctx, x + W - 24, y + H - 14, 13, '#376b42');
  circlePixels(ctx, x + 20, y + H - 16, 7, '#579257');
  circlePixels(ctx, x + W - 27, y + H - 17, 8, '#4d8851');

  // steps
  px(ctx, x + W / 2 - 21, y + H - 8, 42, 6, '#8e877a');
  px(ctx, x + W / 2 - 18, y + H - 10, 36, 4, '#a8a091');
  px(ctx, x + W / 2 - 21, y + H - 3, 42, 3, '#726c61');

  // foundation
  px(ctx, x + 7, y + H - 22, W - 14, 15, '#787166');
  px(ctx, x + 8, y + H - 21, W - 16, 13, '#928a7c');
  for (let i = 0; i < 6; i++) {
    px(ctx, x + 10 + i * 19, y + H - 18 + (i % 2) * 4, 14, 6, i % 2 ? '#9c9485' : '#8b8376');
  }

  // walls
  px(ctx, x + 12, y + 42, W - 24, H - 62, '#cbb085');
  px(ctx, x + 14, y + 44, W - 28, H - 66, '#e8d5b1');
  px(ctx, x + 14, y + 44, W - 28, 4, '#f4e5c7');
  // timber
  px(ctx, x + 13, y + 44, 4, H - 66, '#6f4f38');
  px(ctx, x + W - 17, y + 44, 4, H - 66, '#6f4f38');
  px(ctx, x + 14, y + 64, W - 28, 3, '#7a573d');
  px(ctx, x + 14, y + H - 28, W - 28, 3, '#7a573d');
  for (let i = 1; i < 6; i++) {
    const bx = x + 14 + i * ((W - 28) / 6);
    px(ctx, bx, y + 44, 1, H - 66, 'rgba(111, 79, 56, .25)');
  }

  // chimney
  px(ctx, x + W - 43, y + 14, 15, 36, '#6f6a60');
  px(ctx, x + W - 41, y + 15, 11, 32, '#8c8578');
  px(ctx, x + W - 45, y + 10, 19, 6, '#565149');
  px(ctx, x + W - 43, y + 11, 15, 3, '#9b9384');
  for (let i = 0; i < 3; i++) px(ctx, x + W - 40 + i * 4, y + 22 + i * 6, 6, 2, '#797267');
  drawSmoke(ctx, x + W - 35, y + 8, time, 0.2);

  // roof
  const roof = [
    [x + 3, y + 51], [x + W * 0.38, y + 10], [x + W * 0.62, y + 10], [x + W - 3, y + 51]
  ];
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...roof[0]);
  for (let i = 1; i < roof.length; i++) ctx.lineTo(...roof[i]);
  ctx.closePath();
  ctx.fillStyle = '#2f4f57';
  ctx.fill();
  ctx.clip();
  px(ctx, x, y + 10, W, 43, '#3d6470');
  const roofRows = 7;
  for (let i = 0; i < roofRows; i++) {
    const ry = y + 14 + i * 6;
    px(ctx, x, ry, W, 1, '#31535d');
    const offset = (i % 2) * 5;
    for (let sx = -offset; sx < W; sx += 10) {
      px(ctx, x + sx, ry + 1, 8, 3, i % 2 ? '#456f7a' : '#3f6874');
      if ((sx + i) % 3 === 0) px(ctx, x + sx + 2, ry + 2, 3, 1, '#5b8490');
    }
  }
  ctx.restore();
  poly(ctx, roof.map(([rx, ry]) => [rx - 3, ry + 1]), '#253f47');
  poly(ctx, [[x + W * 0.38, y + 8], [x + W * 0.62, y + 8], [x + W * 0.6, y + 15], [x + W * 0.4, y + 15]], '#29444c');
  px(ctx, x + 3, y + 50, W - 6, 5, '#264049');
  px(ctx, x + 5, y + 50, W - 10, 2, '#547b81');
  px(ctx, x + W * 0.38 - 3, y + 9, 6, 4, '#5c7d80');
  px(ctx, x + W * 0.62 - 3, y + 9, 6, 4, '#5c7d80');

  // attic window
  drawRoundWindow(ctx, x + W / 2, y + 38, 7, true);

  // windows
  drawWindow(ctx, x + 24, y + 74, 20, 18, true);
  drawWindow(ctx, x + W - 44, y + 74, 20, 18, true);
  // flower boxes under windows
  drawFlowerbox(ctx, { x: x + 34, y: y + 96 }, time);
  drawFlowerbox(ctx, { x: x + W - 34, y: y + 96 }, time);

  // door frame (pixel arch)
  const dx = x + W / 2 - 18;
  const dy = y + H - 56;
  px(ctx, dx - 3, dy + 5, 42, 47, '#5f4733');
  px(ctx, dx - 2, dy + 5, 40, 45, '#7c5b3f');
  px(ctx, dx + 2, dy + 1, 32, 5, '#5f4733');
  px(ctx, dx + 4, dy - 2, 28, 4, '#7c5b3f');
  px(ctx, dx + 1, dy + 7, 34, 41, '#2f4a4e');
  px(ctx, dx + 3, dy + 8, 30, 38, '#3f6062');
  px(ctx, dx + 3, dy + 8, 30, 2, '#5b7b79');
  px(ctx, dx + 5, dy + 11, 26, 11, '#2a4145');
  px(ctx, dx + 6, dy + 12, 24, 9, '#e0b56c');
  px(ctx, dx + 7, dy + 13, 22, 7, '#ffda91');
  px(ctx, dx + 8, dy + 14, 9, 5, '#fff0c1');
  px(ctx, dx + 18, dy + 12, 1, 9, '#8f6a3f');
  px(ctx, dx + 5, dy + 26, 26, 2, '#355354');
  px(ctx, dx + 5, dy + 32, 26, 2, '#355354');
  px(ctx, dx + 25, dy + 27, 3, 3, '#e0c078');
  px(ctx, dx + 26, dy + 27, 1, 1, '#fff0c1');
  px(ctx, dx + 4, dy + 42, 28, 3, '#294144');
  // vine
  px(ctx, dx + 37, dy + 8, 2, 22, '#4f7a42');
  px(ctx, dx + 36, dy + 12, 3, 2, '#6a9a54');
  px(ctx, dx + 38, dy + 18, 3, 2, '#6a9a54');
  px(ctx, dx + 36, dy + 24, 3, 2, '#6a9a54');
  // door lamp
  px(ctx, dx - 9, dy + 10, 3, 8, '#3d3a34');
  px(ctx, dx - 12, dy + 17, 9, 7, '#4a443b');
  px(ctx, dx - 11, dy + 18, 7, 5, '#ffd98b');
  px(ctx, dx - 9, dy + 18, 3, 4, '#fff0bf');
  const gl = ctx.createRadialGradient(dx - 7, dy + 21, 1, dx - 7, dy + 21, 20);
  gl.addColorStop(0, 'rgba(255, 210, 120, .2)');
  gl.addColorStop(1, 'rgba(255, 210, 120, 0)');
  ctx.fillStyle = gl;
  ctx.fillRect(dx - 28, dy + 1, 40, 40);

  // foreground greenery & flowers
  for (let i = 0; i < 6; i++) {
    drawFlowerTuft(ctx, x + 14 + i * 3, y + H - 2, i % 2 ? '#e8a2a2' : '#f3d17f');
    drawFlowerTuft(ctx, x + W - 28 + i * 3, y + H - 2, i % 2 ? '#c9a7ff' : '#f3d17f');
  }
}

function drawPythonHall(ctx, b, time) {
  const x = b.x;
  const y = b.y;
  const W = b.w;
  const H = b.h;

  ctx.fillStyle = 'rgba(24, 32, 25, .24)';
  ctx.beginPath();
  ctx.ellipse(x + W / 2, y + H - 1, W * 0.46, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // big tree behind
  px(ctx, x + 106, y + 22, 16, H - 28, '#5c412d');
  px(ctx, x + 108, y + 22, 4, H - 30, '#7b5a3d');
  px(ctx, x + 114, y + 24, 3, H - 40, '#4d3626');
  circlePixels(ctx, x + 82, y + 2, 35, '#2d5c3e');
  circlePixels(ctx, x + 116, y - 2, 31, '#316544');
  circlePixels(ctx, x + 96, y - 18, 27, '#3a734c');
  circlePixels(ctx, x + 77, y - 17, 24, '#3f7a51');
  circlePixels(ctx, x + 118, y - 19, 23, '#447f54');
  circlePixels(ctx, x + 98, y - 27, 22, '#4c8c5b');
  circlePixels(ctx, x + 87, y - 29, 16, '#589a63');
  circlePixels(ctx, x + 111, y - 32, 13, '#609f69');
  const sway = Math.sin(time * 0.001) > 0.3 ? 1 : 0;
  px(ctx, x + 69 + sway, y - 31, 5, 2, '#6fae74');
  px(ctx, x + 124, y - 33, 4, 2, '#7aba7c');

  // foundation & walls
  px(ctx, x + 10, y + H - 24, W - 20, 17, '#6e6a60');
  px(ctx, x + 11, y + H - 23, W - 22, 15, '#8c8677');
  for (let i = 0; i < 7; i++) px(ctx, x + 13 + i * 19, y + H - 19 + (i % 2) * 4, 15, 5, i % 2 ? '#97907f' : '#837d70');

  px(ctx, x + 12, y + 46, W - 24, H - 66, '#5e432c');
  px(ctx, x + 14, y + 47, W - 28, H - 70, '#86603d');
  for (let i = 0; i < 6; i++) {
    px(ctx, x + 14, y + 50 + i * 8, W - 28, 1, '#6c4b31');
  }
  px(ctx, x + 14, y + 47, W - 28, 3, '#a5794d');
  px(ctx, x + 12, y + 46, 4, H - 66, '#4f3625');
  px(ctx, x + W - 16, y + 46, 4, H - 66, '#4f3625');

  // roof, mossy
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + 1, y + 54);
  ctx.lineTo(x + W * 0.32, y + 12);
  ctx.lineTo(x + W * 0.68, y + 12);
  ctx.lineTo(x + W - 1, y + 54);
  ctx.closePath();
  ctx.fillStyle = '#2b4b35';
  ctx.fill();
  ctx.clip();
  px(ctx, x, y + 12, W, 44, '#3c6343');
  for (let i = 0; i < 7; i++) {
    const ry = y + 14 + i * 6;
    px(ctx, x, ry, W, 1, '#31533a');
    for (let sx = (i % 2) * 6; sx < W; sx += 12) {
      px(ctx, x + sx, ry + 1, 9, 3, '#477149');
      if ((sx + i) % 4 === 0) px(ctx, x + sx + 2, ry + 2, 3, 1, '#6d935f');
    }
  }
  ctx.restore();
  px(ctx, x + 1, y + 53, W - 2, 5, '#243f2c');
  px(ctx, x + 4, y + 52, W - 8, 2, '#5b8459');
  // moss patches
  px(ctx, x + 24, y + 42, 10, 3, '#6f9250');
  px(ctx, x + 30, y + 45, 6, 2, '#7fa359');
  px(ctx, x + W - 46, y + 30, 9, 2, '#75994f');
  px(ctx, x + W - 39, y + 33, 5, 2, '#75994f');

  // windows
  drawWindow(ctx, x + 26, y + 68, 24, 20, true, '#4f3927');
  drawWindow(ctx, x + 108, y + 68, 24, 20, true, '#4f3927');
  drawRoundWindow(ctx, x + 80, y + 38, 8, true);
  drawRoundWindow(ctx, x + 26, y + 38, 6, false);
  drawRoundWindow(ctx, x + 130, y + 46, 6, false);

  // door
  const dx = x + W / 2 - 17;
  const dy = y + H - 58;
  px(ctx, dx - 3, dy + 4, 40, 49, '#3f2d1e');
  px(ctx, dx - 2, dy + 5, 38, 47, '#6b4a2e');
  px(ctx, dx + 1, dy, 32, 6, '#3f2d1e');
  px(ctx, dx + 4, dy - 3, 26, 5, '#6b4a2e');
  px(ctx, dx + 1, dy + 8, 32, 42, '#25462f');
  px(ctx, dx + 3, dy + 9, 28, 39, '#336040');
  px(ctx, dx + 3, dy + 9, 28, 2, '#527c55');
  px(ctx, dx + 6, dy + 14, 22, 12, '#1d3826');
  px(ctx, dx + 7, dy + 15, 20, 10, '#b7d48d');
  px(ctx, dx + 8, dy + 16, 18, 8, '#d8e8a8');
  px(ctx, dx + 9, dy + 17, 7, 6, '#f3f2c6');
  px(ctx, dx + 20, dy + 15, 2, 10, '#7b9a5d');
  px(ctx, dx + 5, dy + 30, 24, 2, '#2b4a31');
  px(ctx, dx + 5, dy + 36, 24, 2, '#2b4a31');
  px(ctx, dx + 24, dy + 31, 3, 3, '#e0c078');
  // leaf sign above door
  px(ctx, dx + 8, dy - 12, 18, 8, '#4d3523');
  px(ctx, dx + 9, dy - 11, 16, 6, '#b08a58');
  px(ctx, dx + 15, dy - 10, 4, 3, '#8fe3b0');
  px(ctx, dx + 16, dy - 9, 2, 1, '#d7ffdf');
  // hanging lanterns
  for (const lx of [x + 20, x + W - 22]) {
    px(ctx, lx, y + 56, 1, 9, '#4d3523');
    px(ctx, lx - 3, y + 65, 7, 8, '#4a3c2a');
    px(ctx, lx - 2, y + 66, 5, 6, '#ffd98b');
    px(ctx, lx, y + 67, 1, 4, '#fff3c9');
  }

  // snake on trunk
  const sx = x + 114;
  const sy = y + 56;
  px(ctx, sx - 2, sy, 5, 18, '#4f8f52');
  px(ctx, sx, sy, 2, 16, '#8fc977');
  px(ctx, sx - 5, sy + 16, 9, 4, '#3f7a46');
  px(ctx, sx - 6, sy + 10, 9, 4, '#4f8f52');
  px(ctx, sx + 2, sy + 22, 8, 3, '#3f7a46');
  px(ctx, sx + 8, sy + 20, 5, 5, '#5b9c57');
  px(ctx, sx + 10, sy + 18, 3, 3, '#6aad63');
  px(ctx, sx + 11, sy + 19, 1, 1, '#1f2b1e');
  px(ctx, sx + 13, sy + 21, 2, 1, '#d76f63');
  px(ctx, sx + 4, sy + 14, 1, 1, '#c8e8a9');

  for (let i = 0; i < 5; i++) {
    drawFlowerTuft(ctx, x + 18 + i * 3, y + H - 2, i % 2 ? '#9fd6a4' : '#f0d083');
    drawFlowerTuft(ctx, x + W - 30 + i * 3, y + H - 2, i % 2 ? '#c9a7ff' : '#f0d083');
  }
}

function cottageSection(ctx, x, y, w, h, roof, roofLight, wall, door = false) {
  px(ctx, x + 2, y + 26, w - 4, h - 26, '#5c4330');
  px(ctx, x + 4, y + 28, w - 8, h - 30, wall);
  px(ctx, x + 4, y + 28, w - 8, 3, '#f6e9cf');
  px(ctx, x, y + 24, w, 5, '#6d4c33');
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 28);
  ctx.lineTo(x + w * 0.28, y);
  ctx.lineTo(x + w * 0.72, y);
  ctx.lineTo(x + w + 2, y + 28);
  ctx.closePath();
  ctx.fillStyle = roof;
  ctx.fill();
  ctx.clip();
  for (let i = 0; i < 5; i++) {
    const ry = y + i * 6;
    px(ctx, x - 2, ry, w + 4, 1, roofLight);
    for (let sx = (i % 2) * 4; sx < w; sx += 8) {
      px(ctx, x + sx, ry + 1, 5, 2, i % 2 ? roof : roofLight);
    }
  }
  ctx.restore();
  px(ctx, x - 2, y + 26, w + 4, 3, '#4d3b2c');
  px(ctx, x + 3, y + 26, w - 6, 1, 'rgba(255,255,255,.18)');
  if (!door) {
    drawWindow(ctx, x + w / 2 - 8, y + 38, 16, 14, true, '#5b4938');
    px(ctx, x + w / 2 - 9, y + 54, 18, 3, '#7c5b3f');
    drawFlowerTuft(ctx, x + w / 2 - 4, y + 57, '#e8a2a2');
    drawFlowerTuft(ctx, x + w / 2 + 2, y + 58, '#f3d17f');
  }
}

function drawWebHall(ctx, b, time) {
  const x = b.x;
  const y = b.y;
  const W = b.w;
  const H = b.h;
  ctx.fillStyle = 'rgba(24, 30, 27, .24)';
  ctx.beginPath();
  ctx.ellipse(x + W / 2, y + H - 1, W * 0.45, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // base
  px(ctx, x + 6, y + H - 16, W - 12, 10, '#6e685e');
  px(ctx, x + 8, y + H - 14, W - 16, 7, '#8b8477');

  cottageSection(ctx, x + 4, y + 26, 64, H - 40, '#b1675b', '#d58b7a', '#e2cba5');
  cottageSection(ctx, x + W - 68, y + 26, 64, H - 40, '#b8934f', '#d9b46a', '#e2cba5');
  cottageSection(ctx, x + W / 2 - 46, y + 4, 92, H - 18, '#54759b', '#7c9dbd', '#ecdcbd', true);

  // central door
  const cx = x + W / 2;
  const dy = y + H - 62;
  px(ctx, cx - 21, dy + 6, 42, 56, '#5a3c28');
  px(ctx, cx - 20, dy + 7, 40, 54, '#84603d');
  px(ctx, cx - 16, dy + 2, 32, 5, '#5a3c28');
  px(ctx, cx - 12, dy - 1, 24, 4, '#84603d');
  px(ctx, cx - 18, dy + 9, 36, 52, '#34545f');
  px(ctx, cx - 16, dy + 10, 32, 49, '#446f7a');
  px(ctx, cx - 16, dy + 10, 32, 2, '#69919a');
  px(ctx, cx - 13, dy + 16, 26, 15, '#2b4650');
  px(ctx, cx - 12, dy + 17, 24, 13, '#f3c97c');
  px(ctx, cx - 11, dy + 18, 11, 11, '#ffe8b5');
  px(ctx, cx + 1, dy + 17, 1, 13, '#9a7545');
  px(ctx, cx - 16, dy + 36, 32, 2, '#355760');
  px(ctx, cx - 16, dy + 44, 32, 2, '#355760');
  px(ctx, cx + 10, dy + 37, 3, 3, '#e0c078');
  // sign hanging above door
  px(ctx, cx - 14, dy - 15, 28, 10, '#3f2e1e');
  px(ctx, cx - 13, dy - 14, 26, 8, '#b18855');
  px(ctx, cx - 9, dy - 11, 4, 2, '#f2e3c5');
  px(ctx, cx - 3, dy - 12, 2, 4, '#f2e3c5');
  px(ctx, cx - 3, dy - 7, 2, 1, '#f2e3c5');
  px(ctx, cx + 2, dy - 12, 4, 4, '#f2e3c5');
  px(ctx, cx - 16, dy - 19, 1, 4, '#5a4530');
  px(ctx, cx + 15, dy - 19, 1, 4, '#5a4530');

  // bunting
  const bx0 = x + 18;
  const bx1 = x + W - 18;
  px(ctx, bx0, y + 58, bx1 - bx0, 1, '#5b4b3c');
  const flags = ['#d86f63', '#f0c35f', '#7d9ed6', '#8fc7a2'];
  for (let i = 0; i < 8; i++) {
    const fx = bx0 + 8 + i * ((bx1 - bx0 - 16) / 7);
    const sag = Math.sin((i / 7) * Math.PI) * 5;
    poly(ctx, [[fx - 4, y + 58 + sag], [fx + 4, y + 58 + sag], [fx, y + 65 + sag]], flags[i % flags.length]);
  }

  // flower pots
  for (const px0 of [x + 18, x + W - 30]) {
    px(ctx, px0, y + H - 23, 12, 9, '#a06046');
    px(ctx, px0 + 1, y + H - 24, 10, 2, '#c07b5d');
    drawFlowerTuft(ctx, px0 + 3, y + H - 27, '#e8a2a2');
    drawFlowerTuft(ctx, px0 + 7, y + H - 28, '#f3d17f');
  }
}

function drawSqlHall(ctx, b, time) {
  const x = b.x;
  const y = b.y;
  const W = b.w;
  const H = b.h;
  const t = time * 0.001;

  ctx.fillStyle = 'rgba(22, 24, 32, .3)';
  ctx.beginPath();
  ctx.ellipse(x + W / 2, y + H - 1, W * 0.46, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // rock mound
  poly(ctx, [
    [x + 6, y + H],
    [x + 2, y + 78],
    [x + 18, y + 34],
    [x + 44, y + 12],
    [x + 92, y + 4],
    [x + 126, y + 18],
    [x + W - 8, y + 54],
    [x + W - 2, y + H]
  ], '#3c384b');
  poly(ctx, [
    [x + 10, y + H],
    [x + 10, y + 82],
    [x + 26, y + 42],
    [x + 50, y + 20],
    [x + 92, y + 12],
    [x + 120, y + 26],
    [x + W - 14, y + 58],
    [x + W - 10, y + H]
  ], '#4c475e');
  poly(ctx, [
    [x + 18, y + H],
    [x + 20, y + 84],
    [x + 36, y + 50],
    [x + 56, y + 28],
    [x + 90, y + 20],
    [x + 112, y + 32],
    [x + W - 22, y + 62],
    [x + W - 18, y + H]
  ], '#5a546b');
  // rock facets
  for (let i = 0; i < 9; i++) {
    px(ctx, x + 26 + i * 12, y + 36 + (i % 3) * 9, 8, 2, i % 2 ? '#686078' : '#494356');
  }
  px(ctx, x + 24, y + 82, 20, 2, '#3f3a4c');
  px(ctx, x + W - 52, y + 70, 24, 2, '#3f3a4c');

  // crystals
  const crystals = [
    [x + 18, y + 78, 1.1, '#9b7ae0', '#c5a7ff'],
    [x + 28, y + 92, 0.8, '#7c5fc0', '#a78df0'],
    [x + W - 26, y + 82, 1.2, '#8e6fd2', '#c9a7ff'],
    [x + W - 42, y + 96, 0.7, '#6e54a8', '#a88be8'],
    [x + 48, y + 26, 0.6, '#b28ad6', '#e0ccff']
  ];
  for (const [cx, cy, s, dark, light] of crystals) {
    poly(ctx, [[cx - 5 * s, cy], [cx - 3 * s, cy - 18 * s], [cx, cy - 26 * s], [cx + 3 * s, cy - 16 * s], [cx + 6 * s, cy]], dark);
    poly(ctx, [[cx - 2 * s, cy], [cx, cy - 23 * s], [cx + 2 * s, cy - 14 * s], [cx + 4 * s, cy]], light);
    px(ctx, cx - 1, cy - 20 * s, 1, 4 * s, '#f2e6ff');
  }
  const pulse = 0.5 + Math.sin(t * 2) * 0.2;
  ctx.fillStyle = `rgba(178, 138, 214, ${0.06 + pulse * 0.05})`;
  ctx.beginPath();
  ctx.arc(x + W / 2, y + H - 54, 62, 0, Math.PI * 2);
  ctx.fill();

  // entrance
  const cx = x + W / 2;
  const dy = y + H - 74;
  // arch stones
  for (let i = 0; i < 4; i++) {
    const inset = i * 4;
    const ah = 14 - i * 3;
    px(ctx, cx - 34 + inset, dy + ah, 68 - inset * 2, 74 - ah, i % 2 ? '#6b657b' : '#7d768b');
  }
  // arch top stepped
  px(ctx, cx - 30, dy + 4, 60, 12, '#6b657b');
  px(ctx, cx - 24, dy, 48, 8, '#7d768b');
  px(ctx, cx - 16, dy - 3, 32, 6, '#898196');
  px(ctx, cx - 21, dy + 14, 42, 60, '#141322');
  px(ctx, cx - 18, dy + 16, 36, 58, '#1d1930');
  // inner violet glow
  const grad = ctx.createLinearGradient(cx, dy + 16, cx, dy + 74);
  grad.addColorStop(0, 'rgba(84, 57, 128, .65)');
  grad.addColorStop(1, 'rgba(22, 18, 38, .1)');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - 16, dy + 18, 32, 56);
  // runes
  const runes = [[cx - 24, dy + 30], [cx + 21, dy + 34], [cx - 22, dy + 50], [cx + 20, dy + 52]];
  for (let i = 0; i < runes.length; i++) {
    const alpha = 0.5 + Math.sin(t * 1.6 + i) * 0.3;
    ctx.fillStyle = `rgba(143, 227, 240, ${Math.max(0.2, alpha)})`;
    ctx.fillRect(Math.round(runes[i][0]), Math.round(runes[i][1]), 2, 4);
    ctx.fillRect(Math.round(runes[i][0]) - 1, Math.round(runes[i][1]) + 1, 4, 1);
  }
  const doorGlow = ctx.createRadialGradient(cx, dy + 52, 2, cx, dy + 52, 42);
  doorGlow.addColorStop(0, 'rgba(185, 139, 255, .18)');
  doorGlow.addColorStop(1, 'rgba(185, 139, 255, 0)');
  ctx.fillStyle = doorGlow;
  ctx.fillRect(cx - 55, dy - 10, 110, 120);
  // steps
  px(ctx, cx - 32, y + H - 10, 64, 5, '#4a4657');
  px(ctx, cx - 26, y + H - 14, 52, 5, '#5c576a');
  px(ctx, cx - 21, y + H - 17, 42, 4, '#6d667c');
  // sparkles
  for (let i = 0; i < 6; i++) {
    const a = t * 0.8 + i * 1.7;
    const sx = cx + Math.sin(a) * (36 + i * 3);
    const sy = dy + 30 + Math.cos(a * 1.2) * 26;
    const visible = Math.sin(t * 2 + i) > 0.2;
    if (visible) px(ctx, sx, sy, 1, 1, i % 2 ? '#e0ccff' : '#8fe3f0');
  }
  // moss / foreground rocks
  px(ctx, x + 10, y + H - 8, 14, 5, '#444a3e');
  px(ctx, x + W - 22, y + H - 7, 11, 4, '#444a3e');
  px(ctx, x + 12, y + H - 10, 5, 2, '#68775a');
}

function drawDataHall(ctx, b, time) {
  const x = b.x;
  const y = b.y;
  const W = b.w;
  const H = b.h;
  const t = time * 0.001;
  ctx.fillStyle = 'rgba(18, 22, 32, .32)';
  ctx.beginPath();
  ctx.ellipse(x + W / 2, y + H - 1, W * 0.43, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // base
  px(ctx, x + 12, y + H - 14, W - 24, 10, '#5a5d70');
  px(ctx, x + 15, y + H - 12, W - 30, 7, '#797c8e');
  // tower
  px(ctx, x + 30, y + 46, W - 60, H - 58, '#545a72');
  px(ctx, x + 33, y + 48, W - 66, H - 64, '#6e7590');
  for (let i = 0; i < 5; i++) {
    px(ctx, x + 33, y + 62 + i * 12, W - 66, 1, '#5a607a');
  }
  px(ctx, x + 30, y + 46, W - 60, 4, '#8890a8');
  px(ctx, x + 28, y + 96, W - 56, 5, '#484d63');
  // balcony
  px(ctx, x + 24, y + 72, W - 48, 4, '#8890a8');
  px(ctx, x + 26, y + 76, 3, 7, '#626880');
  px(ctx, x + W - 29, y + 76, 3, 7, '#626880');
  for (let i = 0; i < 6; i++) {
    px(ctx, x + 34 + i * (W - 68) / 5, y + 74, 1, 5, '#7b8298');
  }

  // dome (pixel stepped)
  const dcx = x + W / 2;
  const dcy = y + 48;
  for (let i = 0; i <= 20; i++) {
    const yy = dcy - i;
    const span = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow(i / 22, 2))) * (W / 2 - 18));
    if (span > 0) px(ctx, dcx - span, yy, span * 2, 1, i < 4 ? '#3e4768' : i < 12 ? '#4a5578' : '#5a668c');
  }
  for (let i = 0; i <= 20; i += 4) {
    const span = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow(i / 22, 2))) * (W / 2 - 25));
    if (span > 2) px(ctx, dcx - span, dcy - i, span * 2, 1, '#3c4763');
  }
  // stars on dome
  const stars = [[-20, -28], [12, -36], [26, -20], [-8, -14], [4, -24], [-30, -16]];
  for (let i = 0; i < stars.length; i++) {
    const twinkle = Math.sin(t * 2 + i) > -0.3;
    if (twinkle) px(ctx, dcx + stars[i][0], dcy + stars[i][1], 1, 1, '#ffe8a8');
  }
  // telescope
  ctx.save();
  ctx.translate(dcx + 4, dcy - 8);
  ctx.rotate(-0.55);
  px(ctx, 0, -3, 34, 6, '#2f3448');
  px(ctx, 2, -2, 30, 3, '#6f7896');
  px(ctx, 32, -4, 6, 8, '#434a64');
  px(ctx, 36, -3, 2, 6, '#9bb0d8');
  px(ctx, 8, 3, 3, 8, '#3d4259');
  ctx.restore();
  // dome slit
  px(ctx, dcx + 21, dcy - 32, 5, 2, '#1d2338');

  // windows / door
  drawWindow(ctx, x + 42, y + 84, 16, 13, true, '#454b64');
  drawWindow(ctx, x + W - 58, y + 84, 16, 13, true, '#454b64');
  const dx = dcx - 15;
  const dy = y + H - 40;
  px(ctx, dx - 2, dy + 4, 34, 40, '#3d4157');
  px(ctx, dx - 1, dy + 5, 32, 38, '#5b6079');
  px(ctx, dx + 3, dy, 24, 5, '#3d4157');
  px(ctx, dx + 5, dy - 2, 20, 4, '#5b6079');
  px(ctx, dx + 2, dy + 8, 28, 34, '#232b43');
  px(ctx, dx + 4, dy + 9, 24, 32, '#2f3b5a');
  px(ctx, dx + 4, dy + 9, 24, 2, '#526083');
  px(ctx, dx + 8, dy + 14, 16, 8, '#141c30');
  px(ctx, dx + 9, dy + 15, 14, 6, '#ffe2a0');
  px(ctx, dx + 10, dy + 16, 5, 4, '#fff2c7');
  px(ctx, dx + 20, dy + 31, 2, 2, '#e0c078');
  // lantern
  px(ctx, x + 38, y + 68, 1, 7, '#3d4157');
  px(ctx, x + 35, y + 74, 6, 7, '#3f455c');
  px(ctx, x + 36, y + 75, 4, 5, '#ffd98b');
  const glow = ctx.createRadialGradient(x + 38, y + 78, 1, x + 38, y + 78, 18);
  glow.addColorStop(0, 'rgba(255, 216, 140, .16)');
  glow.addColorStop(1, 'rgba(255, 216, 140, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(x + 18, y + 58, 44, 40);

  // foreground shrubs
  circlePixels(ctx, x + 24, y + H - 10, 9, '#34505b');
  circlePixels(ctx, x + W - 28, y + H - 11, 10, '#34505b');
  circlePixels(ctx, x + 22, y + H - 13, 5, '#4b6b73');
  px(ctx, x + 30, y + H - 17, 1, 2, '#d3b36c');
}

function drawTent(ctx, b, time) {
  const x = b.x;
  const y = b.y;
  const W = b.w;
  const H = b.h;
  ctx.fillStyle = 'rgba(24, 30, 26, .22)';
  ctx.beginPath();
  ctx.ellipse(x + W / 2, y + H - 1, W * 0.38, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  poly(ctx, [[x + 6, y + H - 4], [x + W / 2, y + 12], [x + W - 6, y + H - 4]], '#c97568');
  poly(ctx, [[x + 14, y + H - 4], [x + W / 2, y + 18], [x + W - 14, y + H - 4]], '#e1a38f');
  poly(ctx, [[x + W / 2, y + 12], [x + W / 2 + 10, y + H - 4], [x + W / 2 - 10, y + H - 4]], '#efc9ad');
  poly(ctx, [[x + W / 2 - 7, y + H - 4], [x + W / 2, y + 30], [x + W / 2 + 7, y + H - 4]], '#6d4a3d');
  px(ctx, x + W / 2 - 1, y + 8, 2, 8, '#5c4130');
  // string lights
  px(ctx, x + 8, y + 26, 3, 22, '#6b4b35');
  px(ctx, x + W - 11, y + 26, 3, 22, '#6b4b35');
  for (let i = 0; i < 4; i++) {
    const alpha = Math.sin(time * 0.002 + i) > 0 ? '#ffd98b' : '#b59155';
    px(ctx, x + 13 + i * 9, y + 30 + (i % 2) * 2, 2, 2, alpha);
  }
  ctx.fillStyle = 'rgba(255, 209, 102, .08)';
  ctx.beginPath();
  ctx.arc(x + W - 14, y + H - 12, 16, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, x + W - 17, y + H - 9, 7, 3, '#8b5a3a');
  const flick = Math.sin(time * 0.01) > 0 ? 1 : 0;
  px(ctx, x + W - 15, y + H - 15 - flick, 3, 5, '#e07a4d');
  px(ctx, x + W - 14, y + H - 18, 1, 4, '#ffd166');
  px(ctx, x + 4, y + H - 16, 8, 8, '#8a613e');
}

function drawGreenhouse(ctx, b, time) {
  const x = b.x;
  const y = b.y;
  const W = b.w;
  const H = b.h;
  ctx.fillStyle = 'rgba(24, 30, 26, .22)';
  ctx.beginPath();
  ctx.ellipse(x + W / 2, y + H - 1, W * 0.42, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, x + 6, y + H - 18, W - 12, 12, '#6e756d');
  px(ctx, x + 10, y + 18, W - 20, H - 26, '#a9c9c2');
  px(ctx, x + 12, y + 20, W - 24, H - 30, '#c1ded4');
  for (const gx of [x + 10 + (W - 20) * 0.25, x + 10 + (W - 20) * 0.5, x + 10 + (W - 20) * 0.75]) {
    px(ctx, gx, y + 18, 2, H - 26, '#6d8f83');
  }
  px(ctx, x + 10, y + 38, W - 20, 2, '#7c9d91');
  px(ctx, x + 10, y + 60, W - 20, 2, '#7c9d91');
  poly(ctx, [[x + 4, y + 20], [x + W / 2, y + 2], [x + W - 4, y + 20]], '#5c7d72');
  poly(ctx, [[x + 10, y + 19], [x + W / 2, y + 6], [x + W - 10, y + 19]], '#7c9d91');
  // plants inside
  for (let i = 0; i < 4; i++) {
    const px0 = x + 20 + i * ((W - 40) / 3);
    px(ctx, px0, y + H - 22, 10, 6, '#9c6b4b');
    circlePixels(ctx, px0 + 5, y + H - 28, 6, i % 2 ? '#558a55' : '#6ca05e');
    circlePixels(ctx, px0 + 7, y + H - 31, 4, '#8cbd74');
  }
  // door
  px(ctx, x + W / 2 - 10, y + H - 34, 20, 30, '#4b6d61');
  px(ctx, x + W / 2 - 9, y + H - 33, 18, 27, '#6e9384');
  px(ctx, x + W / 2 + 5, y + H - 20, 2, 2, '#e0c078');
  // tag
  px(ctx, x + W / 2 - 10, y + H - 42, 20, 5, '#d8c29a');
  px(ctx, x + W / 2 - 7, y + H - 41, 14, 1, '#8f7b5a');
  const shine = (time * 0.0002) % 1;
  px(ctx, x + 14 + shine * (W - 28), y + 22, 3, H - 34, 'rgba(255,255,255,.18)');
}

const BUILDING_DRAWERS = {
  home: drawHome,
  python: drawPythonHall,
  web: drawWebHall,
  sql: drawSqlHall,
  data: drawDataHall,
  tent: drawTent,
  greenhouse: drawGreenhouse
};

export function drawBuilding(ctx, b, time) {
  const fn = BUILDING_DRAWERS[b.kind];
  if (fn) fn(ctx, b, time);
}

/* ---------------- dungeon-ish sky/snow effects handled elsewhere ---------------- */
