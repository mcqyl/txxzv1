import { px, poly, hashString, shadow, TILE } from './pixel.js';
import { FURNITURE, furnitureSize } from '../data/furniture.js';

const SKINS = [
  { base: '#f2c9a2', shade: '#d9a97f', light: '#ffddb8' },
  { base: '#e2b088', shade: '#c08e67', light: '#f6caa4' },
  { base: '#c98f64', shade: '#a56e4a', light: '#e3ad82' },
  { base: '#a9714b', shade: '#875736', light: '#c78e66' },
  { base: '#8a5738', shade: '#6b4029', light: '#a87452' }
];

const HAIRS = [
  { base: '#3b2b2c', hi: '#5c4240', lo: '#251a1c' },
  { base: '#6a4632', hi: '#8a6244', lo: '#4a2f21' },
  { base: '#c99a52', hi: '#e5bd76', lo: '#9c7137' },
  { base: '#2f3e5c', hi: '#4d6287', lo: '#1d2940' },
  { base: '#6d3d56', hi: '#8f5673', lo: '#4c273b' },
  { base: '#9b5a3c', hi: '#bf7c58', lo: '#743d26' },
  { base: '#d8d2c2', hi: '#f2ecdd', lo: '#aaa391' }
];

const SHIRTS = [
  { base: '#79c2a4', hi: '#a8e4c4', lo: '#4f8e73' },
  { base: '#e0a45e', hi: '#f3c681', lo: '#b37a3f' },
  { base: '#7f9fd9', hi: '#a5c0ee', lo: '#5976ad' },
  { base: '#d77f7c', hi: '#f0a19c', lo: '#a95957' },
  { base: '#b18bd1', hi: '#cfabe9', lo: '#8562a4' },
  { base: '#c9b96e', hi: '#e3d58c', lo: '#9b8c48' }
];

const PANTS = [
  { base: '#414a63', hi: '#58627e', lo: '#2c3347' },
  { base: '#5b4335', hi: '#755947', lo: '#3e2c22' },
  { base: '#3f4a3d', hi: '#56644f', lo: '#2a332a' },
  { base: '#4a3c55', hi: '#635272', lo: '#32283b' }
];

const LEAF_ACCENTS = ['#8fe3b0', '#ffd166', '#c9a7ff', '#8ecae6', '#ff9f90'];

export function paletteForName(name) {
  const h = hashString(name || 'traveler');
  return {
    skin: SKINS[h % SKINS.length],
    hair: HAIRS[(h >>> 3) % HAIRS.length],
    shirt: SHIRTS[(h >>> 6) % SHIRTS.length],
    pants: PANTS[(h >>> 9) % PANTS.length],
    accent: LEAF_ACCENTS[(h >>> 12) % LEAF_ACCENTS.length],
    hairStyle: (h >>> 15) % 4,
    bag: (h >>> 18) % 2 === 0
  };
}

function drawHair(ctx, palette, style, top) {
  const { hair } = palette;
  px(ctx, -5, top, 10, 5, hair.lo);
  px(ctx, -5, top, 10, 4, hair.base);
  px(ctx, -4, top, 8, 2, hair.hi);
  px(ctx, -5, top + 3, 2, 3, hair.base);
  px(ctx, 4, top + 3, 1, 3, hair.lo);
  if (style === 0) {
    px(ctx, -4, top + 4, 3, 2, hair.base);
    px(ctx, 2, top + 4, 2, 1, hair.base);
  } else if (style === 1) {
    px(ctx, -4, top + 4, 5, 1, hair.hi);
    px(ctx, -3, top + 5, 3, 1, hair.base);
    px(ctx, 4, top + 3, 1, 4, hair.base);
  } else if (style === 2) {
    px(ctx, -1, top - 3, 4, 3, hair.base);
    px(ctx, 0, top - 4, 2, 2, hair.hi);
    px(ctx, -4, top + 4, 2, 1, hair.base);
  } else {
    px(ctx, -5, top + 4, 2, 2, hair.base);
    px(ctx, 3, top + 4, 2, 2, hair.lo);
    px(ctx, -2, top + 4, 2, 1, hair.hi);
  }
}

export function drawAvatar(canvas, palette) {
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(8, 10);
  px(ctx, -7, 1, 14, 8, palette.shirt.lo);
  px(ctx, -7, 0, 14, 7, palette.shirt.base);
  px(ctx, -7, 0, 14, 2, palette.shirt.hi);
  px(ctx, -2, 0, 4, 2, palette.skin.base);
  px(ctx, -6, -8, 12, 9, palette.hair.lo);
  px(ctx, -6, -8, 12, 7, palette.hair.base);
  px(ctx, -6, -8, 12, 2, palette.hair.hi);
  px(ctx, -5, -5, 10, 7, palette.skin.base);
  px(ctx, -5, -5, 10, 2, palette.skin.light);
  px(ctx, -6, -6, 2, 5, palette.hair.base);
  px(ctx, 4, -6, 2, 5, palette.hair.base);
  px(ctx, -3, -3, 1, 2, '#2b2530');
  px(ctx, 2, -3, 1, 2, '#2b2530');
  px(ctx, -4, -1, 2, 1, 'rgba(224, 138, 126, .55)');
  px(ctx, 2, -1, 2, 1, 'rgba(224, 138, 126, .55)');
  px(ctx, -1, 0, 2, 1, '#a56f5c');
  px(ctx, 4, -7, 2, 2, palette.accent);
  px(ctx, 5, -8, 1, 1, palette.accent);
  ctx.restore();
}

function drawHead(ctx, palette, facing, headY) {
  if (facing === 'up') {
    px(ctx, -5, headY + 1, 10, 9, palette.hair.lo);
    px(ctx, -5, headY + 1, 10, 8, palette.hair.base);
    px(ctx, -4, headY + 1, 8, 2, palette.hair.hi);
    px(ctx, -4, headY + 7, 8, 2, palette.hair.lo);
    px(ctx, 3, headY + 5, 2, 2, palette.accent);
  } else if (facing === 'right') {
    px(ctx, -5, headY + 1, 10, 9, palette.skin.shade);
    px(ctx, -5, headY + 1, 9, 8, palette.skin.base);
    px(ctx, -5, headY + 1, 10, 2, palette.skin.light);
    drawHair(ctx, palette, palette.hairStyle, headY);
    px(ctx, 4, headY + 4, 1, 3, palette.skin.base);
    px(ctx, 3, headY + 5, 1, 2, '#2b2530');
    px(ctx, 2, headY + 7, 2, 1, 'rgba(170, 105, 90, 0.8)');
    px(ctx, 5, headY + 7, 1, 1, palette.skin.base);
    px(ctx, -2, headY + 2, 5, 1, palette.hair.hi);
    px(ctx, 4, headY + 8, 2, 1, palette.accent);
  } else {
    px(ctx, -5, headY + 1, 10, 9, palette.skin.shade);
    px(ctx, -5, headY + 1, 9, 8, palette.skin.base);
    px(ctx, -4, headY + 1, 8, 2, palette.skin.light);
    drawHair(ctx, palette, palette.hairStyle, headY);
    px(ctx, -3, headY + 4, 1, 2, '#2b2530');
    px(ctx, 2, headY + 4, 1, 2, '#2b2530');
    px(ctx, -4, headY + 6, 2, 1, 'rgba(224, 138, 126, 0.55)');
    px(ctx, 2, headY + 6, 2, 1, 'rgba(224, 138, 126, 0.55)');
    px(ctx, -1, headY + 7, 2, 1, '#a56f5c');
    px(ctx, 4, headY + 2, 2, 2, palette.accent);
    px(ctx, 5, headY + 1, 1, 1, palette.accent);
  }
}

function drawSeated(ctx, palette, facing) {
  px(ctx, -7, -1, 14, 3, 'rgba(20, 26, 22, 0.3)');
  px(ctx, -4, 1, 8, 1, 'rgba(20, 26, 22, 0.16)');

  const bodyY = -12;
  // folded legs
  if (facing === 'down') {
    px(ctx, -5, -5, 4, 4, palette.pants.base);
    px(ctx, 1, -5, 4, 4, palette.pants.lo);
    px(ctx, -5, -2, 4, 1, '#2c2522');
    px(ctx, 1, -2, 4, 1, '#2c2522');
    px(ctx, -5, -4, 1, 2, palette.pants.hi);
    px(ctx, 4, -4, 1, 2, palette.pants.base);
  } else if (facing === 'up') {
    px(ctx, -5, -3, 4, 3, palette.pants.lo);
    px(ctx, 1, -3, 4, 3, palette.pants.hi);
  } else {
    const dir = 1;
    px(ctx, 3, -5, 4, 3, palette.pants.base);
    px(ctx, 6, -4, 3, 2, palette.pants.lo);
    px(ctx, 8, -4, 2, 2, '#2c2522');
    px(ctx, -2, -3, 5, 3, palette.pants.lo);
  }
  // torso
  px(ctx, -5, bodyY, 10, 7, palette.shirt.lo);
  px(ctx, -5, bodyY, 10, 5, palette.shirt.base);
  px(ctx, -4, bodyY, 8, 2, palette.shirt.hi);
  px(ctx, -5, bodyY + 5, 10, 2, palette.pants.base);
  px(ctx, -3, bodyY, 6, 1, palette.accent);
  // arms resting on lap
  px(ctx, -6, bodyY + 2, 2, 4, palette.shirt.base);
  px(ctx, 4, bodyY + 2, 2, 4, palette.shirt.base);
  px(ctx, -5, bodyY + 5, 3, 2, palette.skin.base);
  px(ctx, 2, bodyY + 5, 3, 2, palette.skin.base);
  if (palette.bag && facing !== 'down') px(ctx, -6, bodyY + 3, 3, 3, '#7a5137');
  drawHead(ctx, palette, facing, bodyY - 9);
}

function drawLying(ctx, palette) {
  // legs tucked under the quilt
  px(ctx, -4, -10, 8, 8, palette.pants.lo);
  // torso
  px(ctx, -5, -20, 10, 11, palette.shirt.lo);
  px(ctx, -5, -20, 10, 9, palette.shirt.base);
  px(ctx, -4, -19, 8, 2, palette.shirt.hi);
  px(ctx, -3, -20, 6, 1, palette.accent);
  // arms folded over the quilt
  px(ctx, -7, -16, 2, 6, palette.shirt.base);
  px(ctx, 5, -16, 2, 6, palette.shirt.base);
  px(ctx, -7, -10, 2, 2, palette.skin.base);
  px(ctx, 5, -10, 2, 2, palette.skin.base);
  // quilt
  px(ctx, -7, -9, 14, 9, '#6fa596');
  px(ctx, -7, -9, 14, 1, '#a9d4c6');
  px(ctx, -6, -8, 12, 3, '#8fc2b2');
  px(ctx, -6, -3, 12, 3, '#5c8f83');
  px(ctx, -5, -5, 3, 1, '#7fb3a4');
  px(ctx, 2, -5, 3, 1, '#7fb3a4');
  drawHead(ctx, palette, 'down', -28);
}

export function drawPlayer(ctx, cx, feetY, dir, frame, palette, moving, opts = {}) {
  const flip = dir === 'left';
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(feetY));
  if (flip) ctx.scale(-1, 1);
  const facing = flip ? 'right' : dir;

  if (opts.lying) {
    drawLying(ctx, palette);
    ctx.restore();
    return;
  }

  if (opts.sitting) {
    drawSeated(ctx, palette, facing);
    ctx.restore();
    return;
  }

  px(ctx, -6, -1, 12, 3, 'rgba(20, 26, 22, 0.28)');
  px(ctx, -4, 1, 8, 1, 'rgba(20, 26, 22, 0.16)');

  const walking = Boolean(moving);
  const step = walking ? [0, 1, 0, -1][frame % 4] : 0;
  const bob = walking && (frame % 4 === 1 || frame % 4 === 3) ? -1 : 0;

  // legs
  const legY = -5;
  const leftLegX = -4 + (walking ? (step > 0 ? 1 : 0) : 0);
  const rightLegX = 1 + (walking ? (step < 0 ? -1 : 0) : 0);
  const leftLift = walking && step > 0 ? 1 : 0;
  const rightLift = walking && step < 0 ? 1 : 0;
  px(ctx, leftLegX, legY + leftLift, 3, 4 - leftLift, palette.pants.lo);
  px(ctx, rightLegX, legY + rightLift, 3, 4 - rightLift, palette.pants.lo);
  px(ctx, leftLegX, legY + 3, 3, 1, '#2c2522');
  px(ctx, rightLegX, legY + 3, 3, 1, '#2c2522');
  px(ctx, leftLegX, legY + leftLift, 1, 3 - leftLift, palette.pants.hi);
  px(ctx, rightLegX + 2, legY + rightLift, 1, 3 - rightLift, palette.pants.base);

  const bodyY = -13 + bob;
  // body
  px(ctx, -5, bodyY, 10, 8, palette.shirt.lo);
  px(ctx, -5, bodyY, 10, 6, palette.shirt.base);
  px(ctx, -4, bodyY, 8, 2, palette.shirt.hi);
  px(ctx, -5, bodyY + 6, 10, 2, palette.pants.base);
  px(ctx, -1, bodyY + 6, 2, 2, '#e5c66d');

  // arms
  const armSwing = walking ? (step > 0 ? 1 : step < 0 ? -1 : 0) : 0;
  if (facing === 'down' || facing === 'up') {
    px(ctx, -7, bodyY + 2 + Math.max(0, armSwing), 2, 5, palette.shirt.base);
    px(ctx, 5, bodyY + 2 + Math.max(0, -armSwing), 2, 5, palette.shirt.base);
    px(ctx, -7, bodyY + 6, 2, 1, palette.skin.base);
    px(ctx, 5, bodyY + 6, 2, 1, palette.skin.base);
  } else {
    px(ctx, -1, bodyY + 2 + armSwing, 2, 5, palette.shirt.base);
    px(ctx, -1, bodyY + 6, 2, 1, palette.skin.base);
    px(ctx, -5, bodyY + 2 - armSwing, 2, 4, palette.shirt.lo);
  }

  if (palette.bag && facing !== 'down') {
    px(ctx, -5, bodyY + 3, 3, 4, '#7a5137');
    px(ctx, -4, bodyY + 4, 1, 1, '#d7b06b');
  }
  if (facing === 'down') {
    px(ctx, -4, bodyY, 2, 5, '#7a5137');
    px(ctx, 2, bodyY, 2, 4, '#7a5137');
  }

  // head
  const headY = -22 + bob;
  drawHead(ctx, palette, facing, headY);

  // scarf / collar accent
  px(ctx, -3, bodyY, 6, 1, palette.accent);
  ctx.restore();
}

/* =========================================================
   FURNITURE
   ========================================================= */

function rugBase(ctx, W, H, colors) {
  px(ctx, 2, 2, W - 4, H - 4, colors.edge);
  px(ctx, 3, 3, W - 6, H - 6, colors.base);
  px(ctx, 5, 5, W - 10, H - 10, colors.inner || colors.base);
}

function drawBed(ctx, W, H, time) {
  px(ctx, 3, 12, W - 6, H - 16, '#5a3a28');
  px(ctx, 4, 14, W - 8, H - 20, '#8a5a3b');
  px(ctx, 6, 8, W - 12, 8, '#6a442d');
  px(ctx, 7, 9, W - 14, 5, '#8f6040');
  px(ctx, 10, 10, W - 20, 2, '#b07b4e');
  px(ctx, 5, 18, W - 10, H - 26, '#f2e5cc');
  px(ctx, 6, 19, W - 12, 5, '#fbf2df');
  px(ctx, 16, 18, 2, 6, '#d7c6a7');
  px(ctx, 5, 25, W - 10, H - 33, '#6fa596');
  px(ctx, 6, 26, W - 12, 3, '#8fc2b2');
  px(ctx, 6, 31, W - 12, H - 40, '#5c8f83');
  for (let i = 0; i < 3; i++) {
    px(ctx, 8 + i * 8, 34, 5, 2, '#7fb3a4');
  }
  px(ctx, 5, H - 9, 3, 6, '#4a3021');
  px(ctx, W - 8, H - 9, 3, 6, '#4a3021');
  px(ctx, 6, H - 11, W - 12, 2, '#5f3d2a');
  px(ctx, 8, 20, 7, 5, '#e8d3ae');
  px(ctx, 9, 21, 5, 3, '#f8eeda');
  px(ctx, 11, 23, 1, 1, '#b89a74');
  px(ctx, W - 12, 26, 4, 4, '#d4b483');
  px(ctx, W - 11, 27, 2, 1, '#8a5a3b');
  px(ctx, W - 11, 29, 2, 1, '#8a5a3b');
}

function drawChair(ctx, W, H) {
  px(ctx, 4, 2, 8, 8, '#5c3b28');
  px(ctx, 5, 3, 6, 6, '#7c5136');
  px(ctx, 6, 4, 4, 3, '#9b6a45');
  px(ctx, 3, 9, 10, 4, '#6b452d');
  px(ctx, 4, 9, 8, 2, '#a06d47');
  px(ctx, 3, 13, 3, 2, '#4a2f20');
  px(ctx, 10, 13, 3, 2, '#4a2f20');
  px(ctx, 5, 11, 6, 1, '#c18b5c');
}

function drawTable(ctx, W, H) {
  px(ctx, 1, 4, W - 2, 7, '#5d3e2b');
  px(ctx, 2, 3, W - 4, 7, '#a5744b');
  px(ctx, 3, 3, W - 6, 2, '#c08d5e');
  px(ctx, 3, 10, 3, 5, '#5d3e2b');
  px(ctx, W - 6, 10, 3, 5, '#5d3e2b');
  px(ctx, 5, 5, 8, 3, '#e8dcc2');
  px(ctx, 6, 5, 6, 1, '#c5b494');
  px(ctx, 6, 6, 2, 1, '#b86f62');
  px(ctx, 9, 6, 2, 1, '#7fa86f');
  px(ctx, W - 10, 4, 4, 4, '#d9c7a5');
  px(ctx, W - 9, 3, 2, 1, '#f4e9d4');
  px(ctx, W - 6, 4, 2, 1, '#d9c7a5');
}

function drawRug(ctx, W, H) {
  const edge = '#b96d52';
  px(ctx, 2, 2, W - 4, H - 4, '#8e4f3e');
  px(ctx, 3, 3, W - 6, H - 6, '#d89b76');
  px(ctx, 4, 4, W - 8, H - 8, '#e8b98d');
  px(ctx, 6, 6, W - 12, H - 12, '#d89b76');
  px(ctx, 7, 7, W - 14, H - 14, '#efc79f');
  for (let i = 0; i < 5; i++) {
    px(ctx, 9 + i * 3, 9, 1, H - 18, '#d89b76');
    px(ctx, 9, 9 + i * 4, W - 18, 1, '#d89b76');
  }
  for (let x = 4; x < W - 4; x += 4) {
    px(ctx, x, 0, 1, 2, '#c78d6c');
    px(ctx, x, H - 2, 1, 2, '#c78d6c');
  }
  for (let y = 4; y < H - 4; y += 4) {
    px(ctx, 0, y, 2, 1, '#c78d6c');
    px(ctx, W - 2, y, 2, 1, '#c78d6c');
  }
  px(ctx, W / 2 - 4, H / 2 - 3, 8, 6, edge);
  px(ctx, W / 2 - 2, H / 2 - 1, 4, 2, '#efc79f');
}

function drawPlant(ctx, W, H, time, tall = false) {
  const sway = Math.sin(time * 0.0012) > 0 ? 1 : 0;
  if (!tall) {
    px(ctx, 5, H - 6, 6, 5, '#a45941');
    px(ctx, 5, H - 6, 6, 1, '#c97c5c');
    px(ctx, 6, H - 5, 4, 3, '#7f3f2f');
    px(ctx, 7, H - 9, 1, 4, '#417a4b');
    px(ctx, 3 + sway, H - 12, 4, 4, '#5da45e');
    px(ctx, 9 - sway, H - 13, 4, 5, '#4a8d51');
    px(ctx, 6, H - 15, 4, 4, '#74bd6c');
    px(ctx, 4 + sway, H - 11, 2, 1, '#8fd47c');
    px(ctx, 10 - sway, H - 12, 1, 1, '#8fd47c');
  } else {
    px(ctx, 4, H - 8, 8, 7, '#9a5a42');
    px(ctx, 5, H - 8, 6, 1, '#bd7c5f');
    px(ctx, 7, H - 22, 2, 15, '#3d6f43');
    px(ctx, 1, H - 20, 7, 5, '#549b55');
    px(ctx, 8, H - 24, 7, 5, '#478b4d');
    px(ctx, 2, H - 14, 6, 4, '#68b363');
    px(ctx, 9, H - 16, 6, 4, '#5aa55b');
    px(ctx, 6, H - 27, 5, 4, '#79c36e');
    px(ctx, 3, H - 19, 2, 1, '#94d98a');
    px(ctx, 11, H - 23, 2, 1, '#94d98a');
    px(ctx, 7, H - 26, 2, 1, '#a8e39b');
  }
}

function drawFloorLamp(ctx, W, H, time) {
  const glow = 0.5 + Math.sin(time * 0.002) * 0.08;
  ctx.fillStyle = `rgba(255, 207, 126, ${0.1 * glow})`;
  ctx.beginPath();
  ctx.arc(8, -6, 18, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, 5, H - 4, 6, 3, '#4a3b34');
  px(ctx, 7, H - 18, 2, 15, '#7a6552');
  px(ctx, 6, H - 20, 4, 3, '#5d4c3e');
  px(ctx, 1, -13, 14, 8, '#6b5644');
  px(ctx, 2, -13, 12, 6, '#e8c47e');
  px(ctx, 3, -12, 10, 4, '#ffe3a4');
  px(ctx, 4, -11, 8, 2, '#fff1c9');
  px(ctx, 2, -6, 12, 1, '#8a6f50');
  px(ctx, 8, -18, 2, 3, '#5d4c3e');
}

function drawShelf(ctx, W, H) {
  px(ctx, 2, 4, W - 4, H - 6, '#5a3b28');
  px(ctx, 3, 5, W - 6, H - 8, '#8c5c3c');
  px(ctx, 4, 6, W - 8, H - 12, '#2f2924');
  for (let i = 0; i < 3; i++) {
    const y = 8 + i * 9;
    px(ctx, 4, y + 7, W - 8, 2, '#a97850');
    const colors = ['#b56f5f', '#5f8f7c', '#aa8b57', '#6d7fa8', '#8b6b97'];
    for (let b = 0; b < 5; b++) {
      const bh = 4 + ((b + i) % 2);
      px(ctx, 5 + b * 2, y + 7 - bh, 2, bh, colors[(b + i * 2) % colors.length]);
    }
  }
  px(ctx, 4, H - 7, 2, 3, '#4a3021');
  px(ctx, W - 6, H - 7, 2, 3, '#4a3021');
}

function drawDesk(ctx, W, H, time) {
  // monitor
  px(ctx, 9, -12, 15, 13, '#232635');
  px(ctx, 10, -11, 13, 11, '#1b2c35');
  px(ctx, 11, -10, 11, 9, '#28463f');
  px(ctx, 12, -9, 9, 1, '#7fd8a0');
  px(ctx, 12, -7, 6, 1, '#63b98b');
  px(ctx, 12, -5, 7, 1, '#4c9974');
  px(ctx, 12, -3, 4, 1, '#63b98b');
  px(ctx, 16, 1, 3, 3, '#343948');
  px(ctx, 13, 4, 9, 2, '#43485a');
  // desk
  px(ctx, 1, 7, W - 2, 5, '#6b452d');
  px(ctx, 2, 6, W - 4, 4, '#b07b4e');
  px(ctx, 3, 6, W - 6, 1, '#c9935f');
  px(ctx, 3, 12, 3, 3, '#5a3a28');
  px(ctx, W - 6, 12, 3, 3, '#5a3a28');
  // keyboard + mug
  px(ctx, 12, 9, 13, 2, '#d7c7ab');
  px(ctx, 13, 9, 11, 1, '#f0e3cc');
  px(ctx, W - 8, 3, 4, 3, '#d9c7a5');
  px(ctx, W - 7, 3, 2, 1, '#7aa387');
  px(ctx, W - 4, 4, 1, 1, '#d9c7a5');
  const blink = Math.sin(time * 0.004) > 0 ? '#b8f0c9' : '#7fd8a0';
  px(ctx, 18, -9, 1, 1, blink);
}

function drawAquarium(ctx, W, H, time) {
  const t = time * 0.001;
  px(ctx, 2, 9, W - 4, 6, '#5c402c');
  px(ctx, 3, 10, W - 6, 4, '#8f6240');
  px(ctx, 4, 1, W - 8, 9, '#2d4a58');
  px(ctx, 5, 0, W - 10, 10, '#3f7685');
  px(ctx, 6, 1, W - 12, 8, '#5fa8b1');
  px(ctx, 6, 1, W - 12, 2, '#83cbd0');
  px(ctx, 5, 7, W - 10, 3, '#6b9d86');
  px(ctx, 8, 8, 3, 2, '#8fbd9f');
  px(ctx, W - 12, 7, 4, 3, '#c9a75f');
  px(ctx, 23, 3, 2, 2, '#e0806b');
  px(ctx, 22, 3, 1, 1, '#ffb19a');
  px(ctx, 24, 3, 1, 1, '#b95f50');
  px(ctx, 25, 3, 2, 1, '#d97262');
  const fx = 10 + (Math.sin(t * 0.9) * 0.5 + 0.5) * 12;
  const fy = 4 + Math.sin(t * 1.6) * 1.5;
  px(ctx, fx, fy, 2, 1, '#ffd166');
  px(ctx, fx + 2, fy, 1, 1, '#f3b84c');
  px(ctx, fx - 1, fy, 1, 1, '#f3b84c');
  for (let i = 0; i < 2; i++) {
    const by = 5 - ((t * 2 + i * 1.4) % 5);
    px(ctx, 9 + i * 3, by, 1, 1, 'rgba(220, 250, 255, .6)');
  }
  px(ctx, 2, 0, W - 4, 1, '#8fbfc4');
  px(ctx, 2, 0, 1, 9, '#7ba7ab');
  px(ctx, W - 3, 0, 1, 9, '#7ba7ab');
}

function drawCatBed(ctx, W, H, time) {
  const breathe = Math.sin(time * 0.0015) > 0 ? 0 : 1;
  px(ctx, 2, 6, 12, 8, '#a46a58');
  px(ctx, 1, 8, 14, 5, '#c78a74');
  px(ctx, 3, 7, 10, 6, '#d9a58c');
  px(ctx, 5, 8, 6, 4, '#e6bda7');
  px(ctx, 5, 9, 6, 1, '#b9836d');
  // sleeping cat
  px(ctx, 5, 6 + breathe, 7, 4, '#d08a4e');
  px(ctx, 6, 5 + breathe, 5, 3, '#e3a25f');
  px(ctx, 4, 7 + breathe, 3, 3, '#c77f44');
  px(ctx, 12, 7 + breathe, 3, 2, '#c77f44');
  px(ctx, 11, 4 + breathe, 3, 4, '#e3a25f');
  px(ctx, 10, 3 + breathe, 4, 2, '#eeb472');
  px(ctx, 10 + breathe, 3 + breathe, 1, 1, '#5c3a22');
  px(ctx, 13, 4 + breathe, 1, 1, '#5c3a22');
  px(ctx, 12, 5 + breathe, 1, 1, '#b56f64');
  px(ctx, 14, 8 + breathe, 2, 1, '#c77f44');
  px(ctx, 8, 11, 2, 1, '#b9836d');
  px(ctx, 9, 10, 1, 1, '#b9836d');
}

function drawCrystalLamp(ctx, W, H, time) {
  const t = time * 0.002;
  const pulse = 0.65 + Math.sin(t) * 0.2;
  ctx.fillStyle = `rgba(190, 150, 255, ${0.12 * pulse})`;
  ctx.beginPath();
  ctx.arc(8, 4, 16, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, 4, H - 4, 8, 3, '#3e3852');
  px(ctx, 5, H - 5, 6, 1, '#67618a');
  poly(ctx, [[7, H - 5], [5, 3], [8, -5], [10, 2], [9, H - 5]], '#8f6fb8');
  poly(ctx, [[8, H - 5], [10, 2], [12, -5], [14, 4], [13, H - 5]], '#b28ad6');
  poly(ctx, [[6, H - 6], [3, 4], [5, 0], [7, 5], [8, H - 6]], '#a97fd0');
  poly(ctx, [[8, 0], [9, -4], [10, 0], [9, 3]], '#e6d1ff');
  const spark = Math.sin(t * 3) > 0.6;
  if (spark) {
    px(ctx, 12, 0, 1, 1, '#fff2ff');
    px(ctx, 4, -2, 1, 1, '#d9c4ff');
  }
}

function drawStool(ctx, W, H) {
  px(ctx, 6, H - 5, 4, 4, '#d8c3a2');
  px(ctx, 5, H - 4, 6, 3, '#bda27c');
  px(ctx, 2, 3, 12, 7, '#b95b50');
  px(ctx, 3, 2, 10, 5, '#d77363');
  px(ctx, 4, 2, 8, 2, '#e8907b');
  px(ctx, 5, 4, 2, 2, '#f4e4cf');
  px(ctx, 10, 4, 2, 2, '#f4e4cf');
  px(ctx, 8, 6, 1, 1, '#f4e4cf');
  px(ctx, 3, 8, 10, 2, '#9e483f');
}

function drawCabinet(ctx, W, H) {
  px(ctx, 2, 8, W - 4, H - 9, '#5c3d29');
  px(ctx, 3, 9, W - 6, H - 12, '#94613d');
  px(ctx, 4, 10, W - 8, H - 14, '#a87a4e');
  px(ctx, 7, 11, 1, H - 16, '#755037');
  px(ctx, 4, 11, 3, H - 16, '#b78a5b');
  px(ctx, 8, 11, 4, H - 16, '#9b6c46');
  px(ctx, 6, 18, 1, 2, '#e0c078');
  px(ctx, 9, 18, 1, 2, '#e0c078');
  px(ctx, 2, 7, W - 4, 3, '#6e4830');
  px(ctx, 4, 2, 6, 5, '#a8683e');
  px(ctx, 5, 3, 4, 3, '#8c4f35');
  px(ctx, 9, 1, 5, 6, '#b58b5d');
  px(ctx, 10, 2, 3, 2, '#d0a77a');
  px(ctx, 2, H - 3, 2, 2, '#3e281d');
  px(ctx, W - 4, H - 3, 2, 2, '#3e281d');
}

function drawWardrobe(ctx, W, H) {
  px(ctx, 3, 5, W - 6, H - 6, '#513523');
  px(ctx, 4, 6, W - 8, H - 9, '#8c5d3b');
  px(ctx, 5, 7, W - 10, 4, '#a4734b');
  px(ctx, 6, 12, W - 12, H - 17, '#7c5034');
  px(ctx, 7, 13, W - 22, H - 19, '#956644');
  px(ctx, W / 2 + 1, 13, W - 22, H - 19, '#956644');
  px(ctx, W / 2 - 1, 12, 2, H - 17, '#4e3322');
  px(ctx, W - 15, 22, 2, 3, '#e0c078');
  px(ctx, 13, 22, 2, 3, '#e0c078');
  px(ctx, 2, 3, W - 4, 4, '#69472f');
  px(ctx, 4, 1, W - 8, 3, '#a87a4e');
  px(ctx, 3, H - 3, 3, 3, '#3d281c');
  px(ctx, W - 6, H - 3, 3, 3, '#3d281c');
}

function drawStarRug(ctx, W, H, time) {
  px(ctx, 1, 2, W - 2, H - 4, '#3c3f63');
  px(ctx, 2, 3, W - 4, H - 6, '#4f537d');
  px(ctx, 4, 5, W - 8, H - 10, '#3b3f66');
  px(ctx, 5, 6, W - 10, H - 12, '#43477a');
  for (let x = 3; x < W - 3; x += 4) {
    px(ctx, x, 1, 1, 2, '#6b6d9c');
    px(ctx, x, H - 3, 1, 2, '#6b6d9c');
  }
  for (let y = 4; y < H - 4; y += 4) {
    px(ctx, 0, y, 2, 1, '#6b6d9c');
    px(ctx, W - 2, y, 2, 1, '#6b6d9c');
  }
  // constellation
  px(ctx, 9, 9, 1, 1, '#ffe4a1');
  px(ctx, 16, 12, 1, 1, '#f4d789');
  px(ctx, 24, 10, 1, 1, '#ffe4a1');
  px(ctx, 30, 16, 1, 1, '#f4d789');
  px(ctx, 38, 12, 1, 1, '#ffe4a1');
  px(ctx, 16, 12, 8, 1, 'rgba(244, 215, 137, .35)');
  px(ctx, 24, 10, 6, 1, 'rgba(244, 215, 137, .25)');
  px(ctx, 24, 10, 1, 6, 'rgba(244, 215, 137, .25)');
  px(ctx, 10, 20, 1, 1, '#c9a7ff');
  px(ctx, 20, 21, 1, 1, '#c9a7ff');
  px(ctx, 33, 21, 1, 1, '#ffe4a1');
  px(ctx, 41, 19, 1, 1, '#c9a7ff');
  const twinkle = Math.sin(time * 0.002) > 0.4;
  if (twinkle) {
    px(ctx, 24, 10, 1, 2, '#fff3c4');
    px(ctx, 23, 10, 3, 1, '#fff3c4');
  }
}

function drawCandle(ctx, W, H, time) {
  const flicker = (Math.sin(time * 0.012) + Math.sin(time * 0.017)) > 0 ? 1 : 0;
  ctx.fillStyle = 'rgba(255, 200, 110, 0.1)';
  ctx.beginPath();
  ctx.arc(8, 4, 12, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, 4, H - 3, 8, 2, '#6d5b46');
  px(ctx, 5, H - 6, 6, 3, '#a8895e');
  px(ctx, 7, 6, 2, 7, '#eadbbd');
  px(ctx, 7, 6, 1, 7, '#f7ecd9');
  px(ctx, 8, 3, 1, 4, '#ffcf72');
  px(ctx, 7 - flicker, 1, 2, 3, '#ffe6a1');
  px(ctx, 8, 0, 1, 2, '#fff5cf');
  px(ctx, 7, 4, 2, 1, '#ff9d5c');
}

function drawGuitar(ctx, W, H) {
  px(ctx, 3, 9, 7, 6, '#6e4a2f');
  px(ctx, 2, 10, 9, 5, '#b07b4e');
  px(ctx, 3, 11, 7, 3, '#8c5a36');
  px(ctx, 6, 9, 2, 2, '#3d2b1e');
  px(ctx, 7, 13, 1, 2, '#3d2b1e');
  px(ctx, 5, 2, 2, 9, '#4e3322');
  px(ctx, 5, 2, 1, 9, '#9c6a43');
  px(ctx, 4, 1, 3, 2, '#3d2b1e');
  px(ctx, 4, 1, 3, 1, '#c8a06a');
  for (let i = 0; i < 3; i++) {
    px(ctx, 5 + i, 6, 1, 5, 'rgba(236, 220, 180, .5)');
  }
  px(ctx, 2, 11, 1, 3, '#8c5a36');
  px(ctx, 10, 11, 1, 3, '#8c5a36');
}

const FURNITURE_DRAWERS = {
  'bed-pine': drawBed,
  'chair-oak': drawChair,
  'table-oak': drawTable,
  'rug-woven': drawRug,
  'plant-sprout': (ctx, W, H, t) => drawPlant(ctx, W, H, t, false),
  'lamp-floor': drawFloorLamp,
  'shelf-pine': drawShelf,
  'desk-code': drawDesk,
  'aquarium': drawAquarium,
  'cat-bed': drawCatBed,
  'lamp-crystal': drawCrystalLamp,
  'stool-mushroom': drawStool,
  'cabinet-clay': drawCabinet,
  'wardrobe': drawWardrobe,
  'rug-star': drawStarRug,
  'candle': drawCandle,
  'guitar': drawGuitar,
  'plant-tall': (ctx, W, H, t) => drawPlant(ctx, W, H, t, true)
};

function drawFurnitureSprite(ctx, id, time) {
  const item = FURNITURE[id];
  if (!item) return;
  const W = item.w * TILE;
  const H = item.h * TILE;
  const drawer = FURNITURE_DRAWERS[id];
  if (!drawer) {
    px(ctx, 2, 2, W - 4, H - 4, '#7a5c44');
    return;
  }
  if (id !== 'rug-woven' && id !== 'rug-star') {
    shadow(ctx, W / 2, H - 1, W - 4, 4, 0.18);
  }
  drawer(ctx, W, H, time || 0);
}

export function drawFurniture(ctx, id, x, y, rot = 0, time = 0) {
  const item = FURNITURE[id];
  if (!item) return;
  const { w, h } = furnitureSize(id, rot);
  const W = w * TILE;
  const H = h * TILE;
  ctx.save();
  if (rot === 0) {
    ctx.translate(Math.round(x), Math.round(y));
  } else if (rot === 1) {
    ctx.translate(Math.round(x + H), Math.round(y));
    ctx.rotate(Math.PI / 2);
  } else if (rot === 2) {
    ctx.translate(Math.round(x + W), Math.round(y + H));
    ctx.rotate(Math.PI);
  } else {
    ctx.translate(Math.round(x), Math.round(y + W));
    ctx.rotate(-Math.PI / 2);
  }
  drawFurnitureSprite(ctx, id, time);
  ctx.restore();
}

export function drawFurnitureAtOrigin(ctx, id, time = 0) {
  drawFurnitureSprite(ctx, id, time);
}

export function renderFurnitureIcon(canvas, id, time = 0) {
  const item = FURNITURE[id];
  if (!item) return;
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, 64, 64);
  ctx.imageSmoothingEnabled = false;
  const W = item.w * TILE;
  const H = item.h * TILE;
  const scale = Math.min(58 / W, 52 / H);
  ctx.save();
  ctx.translate(32 - (W * scale) / 2, 60 - H * scale * 0.92);
  ctx.scale(scale, scale);
  drawFurnitureSprite(ctx, id, time);
  ctx.restore();
}
