import { TILE, mulberry32, px, circlePixels } from './pixel.js';
import {
  drawTree, drawBush, drawRock, drawStump, drawLampPost, drawBench, drawBoard,
  drawSignpost, drawPostbox, drawCrate, drawBarrel, drawFlowerbox, drawFountain,
  drawGate, drawDuck, drawCat, drawBuilding, drawWell, drawHive, drawPicnic,
  drawScarecrow, drawWindmill, drawFlowerArch, drawStage, drawCampfire, drawDock,
  drawBoat
} from './worldArt.js';
import { COURSE_MAP } from '../data/courses.js';
import { GATE_LEVEL, levelInfo } from '../data/progression.js';

export const WORLD_TILES_W = 96;
export const WORLD_TILES_H = 64;
export const WORLD_W = WORLD_TILES_W * TILE;
export const WORLD_H = WORLD_TILES_H * TILE;

const POND = { cx: 548, cy: 728, rx: 136, ry: 92, sandRx: 154, sandRy: 110 };
const DOCK = { x: 656, y: 736, w: 64, h: 18 };
const BOAT = { x: 636, y: 748 };
const PLAZA = { x: 41, y: 29, w: 17, h: 11 };
const GATE = { x: 776, y: 312 };
const EAST_GATE = { x: 1416, y: 552 };

const BUILDINGS = [
  {
    id: 'home', kind: 'home', name: '我的小屋', short: '小屋',
    x: 608, y: 320, w: 112, h: 128,
    door: { x: 664, y: 448 },
    interact: { x: 664, y: 466, r: 38, label: '进入小屋', type: 'home', fx: '家', fxTone: 'warm' },
    labelY: 306
  },
  {
    id: 'python-hall', kind: 'python', name: '蟒蛇学堂', short: 'PYTHON',
    courseId: 'python',
    x: 272, y: 320, w: 160, h: 144,
    door: { x: 352, y: 464 },
    interact: { x: 352, y: 474, r: 40, label: '走进蟒蛇学堂', type: 'course', fx: '蟒', fxTone: 'nature' },
    labelY: 300
  },
  {
    id: 'web-hall', kind: 'web', name: '起源工坊', short: 'WEB',
    courseId: 'web',
    x: 1088, y: 352, w: 144, h: 144,
    door: { x: 1160, y: 496 },
    interact: { x: 1160, y: 508, r: 40, label: '推开工坊的门', type: 'course', fx: '工', fxTone: 'warm' },
    labelY: 332
  },
  {
    id: 'sql-hall', kind: 'sql', name: '水晶档案馆', short: 'SQL',
    courseId: 'sql',
    x: 288, y: 736, w: 144, h: 144,
    door: { x: 360, y: 880 },
    interact: { x: 360, y: 892, r: 40, label: '进入水晶档案', type: 'course', fx: '晶', fxTone: 'water' },
    labelY: 716
  },
  {
    id: 'data-hall', kind: 'data', name: '北岭观星台', short: 'DATA',
    courseId: 'data',
    x: 896, y: 64, w: 144, h: 152,
    door: { x: 968, y: 216 },
    interact: { x: 968, y: 230, r: 42, label: '登上观星台', type: 'course', fx: '星', fxTone: 'arcane' },
    labelY: 44
  },
  {
    id: 'lua-tent', kind: 'tent', name: '卢亚的帐篷', short: '筹备中',
    x: 1280, y: 704, w: 64, h: 56,
    door: { x: 1312, y: 760 },
    interact: { x: 1312, y: 774, r: 44, label: '看看帐篷', type: 'future', fx: '锁', fxTone: 'muted' },
    labelY: 690
  },
  {
    id: 'ml-greenhouse', kind: 'greenhouse', name: '机器学习温室', short: '筹备中',
    x: 1072, y: 800, w: 96, h: 110,
    door: { x: 1120, y: 910 },
    interact: { x: 1120, y: 922, r: 44, label: '看看温室', type: 'future', fx: '锁', fxTone: 'muted' },
    labelY: 786
  }
];

const PATH_RECTS = [
  { x: 41, y: 29, w: 17, h: 11, plaza: true },
  { x: 47, y: 19, w: 3, h: 10 },
  { x: 47, y: 39, w: 3, h: 20 },
  { x: 6, y: 33, w: 35, h: 3 },
  { x: 58, y: 33, w: 32, h: 3 },
  { x: 21, y: 29, w: 3, h: 4 },
  { x: 72, y: 31, w: 3, h: 2 },
  { x: 21, y: 35, w: 3, h: 20 },
  { x: 47, y: 15, w: 3, h: 4 },
  { x: 47, y: 16, w: 18, h: 2 },
  { x: 60, y: 14, w: 2, h: 4 },
  { x: 38, y: 28, w: 6, h: 1 }
];

function key(tx, ty) {
  return `${tx},${ty}`;
}

function buildPathSet() {
  const set = new Set();
  for (const r of PATH_RECTS) {
    for (let ty = r.y; ty < r.y + r.h; ty++) {
      for (let tx = r.x; tx < r.x + r.w; tx++) set.add(key(tx, ty));
    }
  }
  return set;
}

const PATH_SET = buildPathSet();

function isPathTile(tx, ty) {
  return PATH_SET.has(key(tx, ty));
}

function inPond(x, y, pad = 0) {
  const dx = (x - POND.cx) / (POND.rx + pad);
  const dy = (y - POND.cy) / (POND.ry + pad);
  return dx * dx + dy * dy <= 1;
}

function inPondSand(x, y) {
  const dx = (x - POND.cx) / POND.sandRx;
  const dy = (y - POND.cy) / POND.sandRy;
  return dx * dx + dy * dy <= 1;
}

function inBuilding(x, y, pad = 0) {
  return BUILDINGS.some((b) => (
    x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad
  ));
}

function fillEllipse(ctx, cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y++) {
    const span = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (span <= 0) continue;
    ctx.fillRect(Math.round(cx - span), Math.round(cy + y), span * 2, 1);
  }
}

/* ---------------- ground ---------------- */

function drawGrass(ctx, rand) {
  ctx.fillStyle = '#6f9e58';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  const patches = [
    ['#679551', 90], ['#769f5c', 80], ['#6b9854', 70], ['#7aa55f', 55]
  ];
  for (const [color, count] of patches) {
    for (let i = 0; i < count; i++) {
      const x = 20 + rand() * (WORLD_W - 40);
      const y = 20 + rand() * (WORLD_H - 40);
      const r = 6 + rand() * 16;
      ctx.globalAlpha = 0.55;
      circlePixels(ctx, x, y, r, color);
    }
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rand() * WORLD_W);
    const y = Math.floor(rand() * WORLD_H);
    px(ctx, x, y, 2, 1, rand() > 0.5 ? '#64914e' : '#84ad67');
  }
}

function drawPond(ctx, rand) {
  // sand shore
  fillEllipse(ctx, POND.cx, POND.cy, POND.sandRx, POND.sandRy, '#d9c391');
  fillEllipse(ctx, POND.cx, POND.cy, POND.sandRx - 5, POND.sandRy - 4, '#e2cf9f');
  for (let i = 0; i < 90; i++) {
    const a = rand() * Math.PI * 2;
    const rr = 0.82 + rand() * 0.16;
    const x = POND.cx + Math.cos(a) * POND.sandRx * rr;
    const y = POND.cy + Math.sin(a) * POND.sandRy * rr;
    px(ctx, x, y, 2, 1, rand() > 0.5 ? '#cbb480' : '#ead8ab');
  }
  // water
  fillEllipse(ctx, POND.cx, POND.cy, POND.rx + 5, POND.ry + 3, '#5e98a0');
  fillEllipse(ctx, POND.cx, POND.cy, POND.rx, POND.ry, '#4f8792');
  fillEllipse(ctx, POND.cx, POND.cy, POND.rx - 12, POND.ry - 10, '#467b88');
  fillEllipse(ctx, POND.cx - 14, POND.cy - 8, POND.rx - 34, POND.ry - 30, '#3f7080');
  // ripples
  for (let i = 0; i < 44; i++) {
    const x = POND.cx - POND.rx + 14 + rand() * (POND.rx * 2 - 28);
    const t = (x - POND.cx) / POND.rx;
    const maxY = POND.ry * Math.sqrt(Math.max(0, 1 - t * t)) - 8;
    if (maxY <= 0) continue;
    const y = POND.cy - maxY + rand() * maxY * 2;
    const w = 4 + Math.floor(rand() * 12);
    px(ctx, x, y, w, 1, rand() > 0.5 ? '#5f96a0' : '#548c98');
  }
  // lily pads
  const pads = [[-66, -16], [-24, 30], [44, -40], [70, 22], [-84, 38], [12, 6], [98, -8], [-36, 58]];
  for (const [dx, dy] of pads) {
    const x = POND.cx + dx;
    const y = POND.cy + dy;
    circlePixels(ctx, x, y, 6, '#4f8a52');
    circlePixels(ctx, x, y - 1, 5, '#67a35f');
    px(ctx, x + 2, y - 6, 2, 3, '#467b88');
    if ((dx + dy) % 3 === 0) px(ctx, x - 1, y - 3, 2, 2, '#f3d9e2');
  }
  // reeds on the shore
  const reeds = [
    [-140, -20], [-134, 30], [-118, 64], [-88, 90], [18, 102], [76, 82],
    [120, 46], [134, -14], [-30, -100], [52, -98], [104, -64]
  ];
  for (const [dx, dy] of reeds) {
    const bx = POND.cx + dx;
    const by = POND.cy + dy;
    px(ctx, bx, by - 11, 1, 11, '#5d8447');
    px(ctx, bx + 3, by - 8, 1, 8, '#527a40');
    px(ctx, bx - 3, by - 6, 1, 6, '#68934f');
    px(ctx, bx, by - 13, 2, 2, '#8a6a3d');
    px(ctx, bx + 3, by - 10, 2, 2, '#9a7b49');
    if ((dx + dy) % 4 === 0) px(ctx, bx - 1, by - 7, 2, 2, '#c9b57a');
  }
  // shore stones and a couple of buoys
  const shoreStones = [[-148, 8], [-126, -58], [-104, 96], [8, -112], [128, 74], [150, -34], [96, 106]];
  for (const [dx, dy] of shoreStones) {
    const sx = POND.cx + dx;
    const sy = POND.cy + dy;
    px(ctx, sx, sy, 4, 3, '#a49a83');
    px(ctx, sx + 1, sy - 1, 2, 1, '#c2b89f');
    px(ctx, sx, sy + 1, 4, 1, '#8a806c');
  }
  const buoy = (bx, by, color) => {
    px(ctx, bx, by, 3, 3, color);
    px(ctx, bx, by - 2, 3, 1, '#f7f0dc');
    px(ctx, bx + 1, by + 3, 1, 2, '#3f6f7a');
  };
  buoy(POND.cx - 58, POND.cy - 34, '#d9695f');
  buoy(POND.cx + 46, POND.cy + 44, '#e2b45c');
}

function drawPathTile(ctx, tx, ty, rand) {
  const x = tx * TILE;
  const y = ty * TILE;
  const plaza = tx >= PLAZA.x && tx < PLAZA.x + PLAZA.w && ty >= PLAZA.y && ty < PLAZA.y + PLAZA.h;
  const base = plaza
    ? ['#cbb083', '#c6a97b', '#d0b58a'][Math.floor(rand() * 3)]
    : ['#c3a67a', '#bea074', '#c8ac80'][Math.floor(rand() * 3)];
  px(ctx, x, y, TILE, TILE, base);
  // cobbles
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const off = (tx + ty) % 2 === 0 ? 0 : 3;
      const sx = x + col * 8 + (row % 2 ? 4 : 0) + off;
      const sy = y + row * 8 + 1;
      const w = 7 - (row % 2);
      const tone = rand();
      px(ctx, Math.min(sx, x + 9), Math.min(sy, y + 9), Math.min(w, 6), 5, tone > 0.65 ? '#b08f64' : tone > 0.3 ? '#d4ba90' : '#c9ae82');
      px(ctx, Math.min(sx, x + 9), Math.min(sy, y + 9), Math.min(w, 6), 1, '#dcc49c');
    }
  }
  if (rand() > 0.82) px(ctx, x + 3 + rand() * 8, y + 4 + rand() * 8, 2, 1, '#947a55');
  // edges toward grass
  if (!isPathTile(tx, ty - 1)) px(ctx, x, y, TILE, 2, '#a2825a');
  if (!isPathTile(tx, ty + 1)) px(ctx, x, y + TILE - 2, TILE, 2, '#a2825a');
  if (!isPathTile(tx - 1, ty)) px(ctx, x, y, 2, TILE, '#a2825a');
  if (!isPathTile(tx + 1, ty)) px(ctx, x + TILE - 2, y, 2, TILE, '#a2825a');
}

function drawPlazaMedallion(ctx) {
  const cx = 712;
  const cy = 600;
  const ring = (r, color, step = 1) => {
    ctx.fillStyle = color;
    const points = Math.ceil(r * Math.PI * 2);
    for (let i = 0; i < points; i++) {
      const a = (i / points) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * 0.62;
      ctx.fillRect(Math.round(x), Math.round(y), step, step);
    }
  };
  ring(72, '#a98b61', 2);
  ring(66, '#d6bd92', 2);
  ring(48, '#b29569', 2);
  ring(42, '#d9c096', 1);
  // four points
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i;
    const x = cx + Math.cos(a) * 58;
    const y = cy + Math.sin(a) * 36;
    px(ctx, x - 4, y - 1, 8, 2, '#9c7f58');
    px(ctx, x - 1, y - 4, 2, 8, '#9c7f58');
  }
}

function drawScatter(ctx, rand) {
  const flowerColors = ['#f2d06f', '#f0a7ac', '#d9c4f2', '#f5efd9', '#f2b171', '#c9e3f5'];
  const pointOk = (x, y) => {
    if (isPathTile(Math.floor(x / 16), Math.floor(y / 16))) return false;
    if (inPondSand(x, y)) return false;
    if (inBuilding(x, y, 6)) return false;
    return true;
  };
  for (let i = 0; i < 2400; i++) {
    const x = 24 + rand() * (WORLD_W - 48);
    const y = 24 + rand() * (WORLD_H - 48);
    if (!pointOk(x, y)) continue;
    const roll = rand();
    if (roll < 0.72) {
      const c = rand() > 0.5 ? '#5f8f4b' : '#7fae63';
      px(ctx, x, y, 1, 2, c);
      px(ctx, x + 2, y + 1, 1, 1, c);
      if (rand() > 0.7) px(ctx, x - 1, y + 1, 1, 1, c);
    } else if (roll < 0.9) {
      const c = flowerColors[Math.floor(rand() * flowerColors.length)];
      px(ctx, x, y + 1, 1, 3, '#558241');
      px(ctx, x - 1, y, 3, 1, c);
      px(ctx, x, y - 1, 1, 1, c);
      if (rand() > 0.5) px(ctx, x + 1, y + 1, 1, 1, '#f7e8b0');
    } else {
      px(ctx, x, y, 2, 1, rand() > 0.5 ? '#a49a83' : '#8a806c');
    }
  }
  // a richer wildflower meadow in the south-east
  for (let i = 0; i < 280; i++) {
    const x = 1000 + rand() * 420;
    const y = 600 + rand() * 300;
    if (!pointOk(x, y)) continue;
    const c = flowerColors[Math.floor(rand() * flowerColors.length)];
    px(ctx, x, y + 1, 1, 3, '#5a8845');
    px(ctx, x - 1, y, 3, 1, c);
    px(ctx, x, y - 1, 1, 1, c);
  }
}

function buildGround() {
  const canvas = document.createElement('canvas');
  canvas.width = WORLD_W;
  canvas.height = WORLD_H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const rand = mulberry32(0x51a7c0de);

  drawGrass(ctx, rand);
  drawPond(ctx, rand);

  const tiles = [...PATH_SET].map((k) => k.split(',').map(Number));
  for (const [tx, ty] of tiles) drawPathTile(ctx, tx, ty, rand);
  drawPlazaMedallion(ctx);
  drawScatter(ctx, rand);
  return canvas;
}

/* ---------------- collision ---------------- */

function buildCollisionGrid() {
  const grid = new Uint8Array(WORLD_TILES_W * WORLD_TILES_H);
  const mark = (tx, ty) => {
    if (tx < 0 || ty < 0 || tx >= WORLD_TILES_W || ty >= WORLD_TILES_H) return;
    grid[ty * WORLD_TILES_W + tx] = 1;
  };
  for (const b of BUILDINGS) {
    const x0 = Math.floor((b.x + 7) / TILE);
    const x1 = Math.floor((b.x + b.w - 8) / TILE);
    const y0 = Math.floor((b.y + 8) / TILE);
    const y1 = Math.floor((b.y + b.h - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) mark(tx, ty);
    }
  }
  for (let ty = 0; ty < WORLD_TILES_H; ty++) {
    for (let tx = 0; tx < WORLD_TILES_W; tx++) {
      const x = tx * TILE + 8;
      const y = ty * TILE + 8;
      const dx = (x - POND.cx) / (POND.rx - 2);
      const dy = (y - POND.cy) / (POND.ry - 2);
      if (dx * dx + dy * dy <= 1) mark(tx, ty);
    }
  }
  return grid;
}

const COLLISION_GRID = buildCollisionGrid();

/* ---------------- decorations ---------------- */

function buildDecorations() {
  const decos = [];
  const solids = [];
  const rand = mulberry32(0x9e3779b9);

  const footFor = (o) => {
    switch (o.type) {
      case 'tree': return { x: o.x - 6, y: o.y - 6, w: 12, h: 7 };
      case 'rock': return { x: o.x - 7, y: o.y - 6, w: 14, h: 7 };
      case 'stump': return { x: o.x - 6, y: o.y - 5, w: 12, h: 6 };
      case 'lamp': return { x: o.x - 3, y: o.y - 4, w: 6, h: 5 };
      case 'bench': return { x: o.x - 17, y: o.y - 5, w: 34, h: 7 };
      case 'board': return { x: o.x - 20, y: o.y - 7, w: 40, h: 9 };
      case 'sign': return { x: o.x - 5, y: o.y - 5, w: 10, h: 6 };
      case 'postbox': return { x: o.x - 6, y: o.y - 5, w: 12, h: 6 };
      case 'crate': return { x: o.x - 8, y: o.y - 6, w: 16, h: 7 };
      case 'barrel': return { x: o.x - 7, y: o.y - 5, w: 14, h: 6 };
      case 'fountain': return { x: o.x - 33, y: o.y - 13, w: 66, h: 15 };
      case 'well': return { x: o.x - 18, y: o.y - 9, w: 36, h: 10 };
      case 'hive': return { x: o.x - 12, y: o.y - 6, w: 24, h: 7 };
      case 'scarecrow': return { x: o.x - 10, y: o.y - 5, w: 20, h: 6 };
      case 'windmill': return { x: o.x - 26, y: o.y - 10, w: 52, h: 11 };
      case 'stage': return { x: o.x - 33, y: o.y - 10, w: 66, h: 11 };
      case 'campfire': return { x: o.x - 14, y: o.y - 7, w: 28, h: 8 };
      case 'picnic': return null;
      default: return null;
    }
  };

  const add = (o, solid = true) => {
    if (!o.id) o.id = `${o.type}-${decos.length}`;
    decos.push(o);
    if (solid) {
      const foot = footFor(o);
      if (foot) solids.push(foot);
    }
  };

  const tree = (x, y, variant = 'oak', size = 1, solid = true) => {
    add({ type: 'tree', x, y, variant, size, seed: rand() * 8, sway: rand() > 0.5 }, solid);
  };

  const bush = (x, y, size = 1) => add({ type: 'bush', x, y, size, seed: rand() * 8 }, false);
  const rock = (x, y, size = 1) => add({ type: 'rock', x, y, size }, true);
  const lamp = (x, y) => add({ type: 'lamp', x, y, lit: true, seed: rand() * 8, flower: rand() > 0.65 }, true);
  const bench = (x, y) => add({ type: 'bench', x, y }, true);
  const sign = (x, y) => add({ type: 'sign', x, y }, true);
  const crate = (x, y) => add({ type: 'crate', x, y }, true);
  const barrel = (x, y) => add({ type: 'barrel', x, y }, true);

  add({ type: 'board', x: 872, y: 496 }, true);
  add({ type: 'fountain', x: 712, y: 600 }, true);
  add({ type: 'postbox', x: 588, y: 480, seed: 2 }, true);
  add({ type: 'cat', x: 584, y: 462, seed: 1 });
  add({ type: 'flowerbox', x: 612, y: 456 });
  add({ type: 'flowerbox', x: 716, y: 456 });
  add({ type: 'sign', x: 816, y: 648 });
  add({ type: 'sign', x: 720, y: 344 });

  lamp(736, 456);
  lamp(920, 456);
  lamp(646, 626);
  lamp(946, 632);
  lamp(320, 520);
  lamp(1244, 492);
  lamp(736, 720);

  bench(742, 770);
  bench(392, 652);
  bench(820, 560);
  bench(612, 600);
  bench(1200, 600);
  bench(824, 858);

  crate(1058, 512);
  crate(1078, 506);
  barrel(1074, 520);
  barrel(318, 900);
  crate(948, 516);
  crate(964, 510);
  barrel(982, 518);
  barrel(1176, 616);

  add({ type: 'well', x: 1046, y: 608 }, true);
  add({ type: 'hive', x: 1170, y: 664 }, true);
  add({ type: 'hive', x: 1202, y: 676 }, true);
  add({ type: 'picnic', x: 812, y: 812 }, false);
  add({ type: 'picnic', x: 1222, y: 842 }, false);
  add({ type: 'scarecrow', x: 452, y: 930 }, true);
  add({ type: 'scarecrow', x: 1296, y: 764 }, true);

  crate(1310, 826);
  barrel(1322, 838);
  add({ type: 'flowerbox', x: 640, y: 512 });
  add({ type: 'flowerbox', x: 838, y: 512 });
  add({ type: 'flowerbox', x: 888, y: 660 });
  add({ type: 'flowerbox', x: 664, y: 626 });
  add({ type: 'flowerbox', x: 1188, y: 650 });
  add({ type: 'sign', x: 1216, y: 506 });
  add({ type: 'sign', x: 452, y: 840 });
  add({ type: 'sign', x: 632, y: 900 });

  // lakeside dock and moored boat
  add({ type: 'dock', x: DOCK.x + DOCK.w / 2, y: DOCK.y, w: DOCK.w, h: DOCK.h }, false);
  add({ type: 'boat', x: BOAT.x, y: BOAT.y }, false);

  // attractions that make town feel lively
  add({ type: 'windmill', x: 1352, y: 858 }, true);
  add({ type: 'flowerarch', x: 776, y: 690 }, false);
  add({ type: 'stage', x: 1010, y: 812 }, true);
  add({ type: 'campfire', x: 260, y: 600 }, true);

  lamp(956, 512);
  lamp(1244, 600);
  lamp(480, 872);
  lamp(1280, 780);
  lamp(1440, 620);

  // hand-placed trees around town
  const trees = [
    [232, 500, 'gold', 1.1], [456, 508, 'oak', 1.0], [480, 336, 'pine', 0.95],
    [416, 300, 'gold', 1.05], [600, 300, 'oak', 0.9], [740, 388, 'birch', 0.95],
    [392, 716, 'oak', 1.05], [408, 784, 'birch', 0.9], [412, 612, 'gold', 1.0],
    [680, 820, 'pine', 0.95], [660, 648, 'birch', 0.9],
    [880, 880, 'oak', 1.15], [1000, 900, 'gold', 1.0], [1180, 930, 'pine', 1.0],
    [940, 760, 'gold', 1.0], [980, 486, 'birch', 0.9],
    [1080, 640, 'birch', 1.0], [1260, 664, 'oak', 1.0], [1340, 640, 'pine', 1.0],
    [1400, 680, 'gold', 1.1], [1230, 800, 'birch', 0.95], [1300, 880, 'oak', 1.0],
    [648, 920, 'pine', 1.1], [728, 936, 'oak', 0.9], [860, 936, 'oak', 1.0],
    [480, 900, 'birch', 0.95],
    [840, 236, 'pine', 1.1], [872, 120, 'pine', 1.0], [1064, 144, 'pine', 1.1],
    [1070, 248, 'oak', 0.95], [760, 150, 'pine', 1.05], [690, 220, 'gold', 1.0],
    [620, 120, 'birch', 0.95], [1140, 220, 'pine', 0.9], [824, 60, 'pine', 1.0],
    [1220, 300, 'birch', 0.95],
    [180, 492, 'oak', 1.0], [160, 690, 'pine', 1.05], [210, 830, 'birch', 0.9],
    [270, 680, 'gold', 1.0], [120, 900, 'oak', 1.1],
    [520, 220, 'oak', 1.0], [600, 240, 'birch', 0.95], [660, 180, 'pine', 1.05],
    [980, 340, 'gold', 1.0], [1060, 330, 'oak', 0.95], [1180, 380, 'birch', 1.0],
    [1280, 240, 'pine', 1.05], [1400, 280, 'oak', 1.0], [1450, 400, 'birch', 0.95],
    [1480, 560, 'gold', 1.05], [1470, 760, 'pine', 1.0], [1440, 900, 'oak', 1.05],
    [1180, 840, 'birch', 0.95], [1260, 900, 'gold', 1.0],
    [946, 918, 'pine', 1.0], [820, 924, 'birch', 0.9], [520, 960, 'oak', 1.0],
    [330, 820, 'gold', 1.0], [220, 940, 'pine', 1.05],
    [1080, 460, 'birch', 0.9], [1128, 712, 'oak', 0.95], [1368, 496, 'gold', 1.0],
    [860, 700, 'birch', 0.9], [940, 660, 'gold', 0.95]
  ];
  for (const [x, y, variant, size] of trees) tree(x, y, variant, size);

  // hedge row that seals the north ridge (opening at the gate)
  for (let x = 72; x < WORLD_W - 40; x += 30) {
    if (Math.abs(x - GATE.x) < 38) continue;
    tree(x + rand() * 8, 312 + rand() * 4, rand() > 0.55 ? 'pine' : 'oak', 1.05 + rand() * 0.25);
  }
  for (let x = 96; x < WORLD_W - 60; x += 46) {
    if (Math.abs(x - GATE.x) < 42) continue;
    tree(x + rand() * 10, 296 + rand() * 4, rand() > 0.5 ? 'pine' : 'gold', 1.0 + rand() * 0.2);
  }

  // forest frame
  for (let x = 20; x < WORLD_W - 10; x += 32) {
    tree(x + rand() * 10, 52 + rand() * 22, rand() > 0.4 ? 'pine' : 'oak', 0.95 + rand() * 0.3);
    tree(x + rand() * 12, 972 + rand() * 24, rand() > 0.5 ? 'oak' : 'pine', 1.0 + rand() * 0.25);
  }
  for (let y = 90; y < 960; y += 34) {
    tree(38 + rand() * 26, y + rand() * 8, rand() > 0.5 ? 'pine' : 'birch', 0.95 + rand() * 0.3);
    tree(WORLD_W - 46 + rand() * 24, y + rand() * 10, rand() > 0.5 ? 'oak' : 'pine', 1.0 + rand() * 0.3);
  }

  // bushes and stones
  const bushes = [
    [430, 820, 0.9], [440, 836, 0.8], [754, 790, 0.85], [768, 800, 0.8],
    [456, 600, 0.8], [470, 612, 0.9], [352, 430, 0.85], [1112, 528, 0.8],
    [1250, 500, 0.9], [1268, 512, 0.75], [472, 640, 0.9], [300, 640, 0.8],
    [900, 700, 0.9], [936, 712, 0.75], [1320, 800, 0.85], [1100, 900, 0.8]
  ];
  for (const [x, y, size] of bushes) bush(x, y, size);

  const rocks = [
    [400, 598, 0.9], [420, 660, 0.7], [700, 880, 0.9], [820, 888, 0.7],
    [1080, 700, 0.9], [1380, 740, 0.8], [900, 300, 0.7], [1088, 268, 0.8],
    [640, 300, 0.7], [1440, 460, 0.85]
  ];
  for (const [x, y, size] of rocks) rock(x, y, size);

  const stumps = [[240, 760], [1120, 880], [560, 940], [1000, 300]];
  for (const [x, y] of stumps) add({ type: 'stump', x, y }, true);

  // continuous collision along the north hedge (visually hidden by trees)
  solids.push({ x: 0, y: 302, w: GATE.x - 40, h: 14 });
  solids.push({ x: GATE.x + 40, y: 302, w: WORLD_W - GATE.x - 40, h: 14 });

  return { decos, solids };
}

/* ---------------- world factory ---------------- */

export function createTown() {
  const ground = buildGround();
  const { decos, solids } = buildDecorations();
  const northGate = { type: 'gate', x: GATE.x, y: GATE.y, open: false };
  const eastGate = { type: 'gate', x: EAST_GATE.x, y: EAST_GATE.y, open: false, future: true };
  const gates = [northGate, eastGate];
  const rand = mulberry32(0x5eed);

  const fireflies = [];
  for (let i = 0; i < 18; i++) {
    fireflies.push({
      x: 420 + rand() * 280,
      y: 620 + rand() * 240,
      phase: rand() * Math.PI * 2,
      speed: 0.5 + rand() * 0.9
    });
  }
  for (let i = 0; i < 14; i++) {
    fireflies.push({
      x: 620 + rand() * 500,
      y: 90 + rand() * 200,
      phase: rand() * Math.PI * 2,
      speed: 0.4 + rand() * 0.7
    });
  }
  for (let i = 0; i < 12; i++) {
    fireflies.push({
      x: 190 + rand() * 220,
      y: 540 + rand() * 140,
      phase: rand() * Math.PI * 2,
      speed: 0.5 + rand() * 0.8
    });
  }
  for (let i = 0; i < 10; i++) {
    fireflies.push({
      x: 900 + rand() * 380,
      y: 700 + rand() * 220,
      phase: rand() * Math.PI * 2,
      speed: 0.4 + rand() * 0.7
    });
  }

  const gateRect = { x: GATE.x - 40, y: GATE.y - 10, w: 80, h: 18 };
  const eastGateRect = { x: EAST_GATE.x - 40, y: EAST_GATE.y - 10, w: 80, h: 18 };

  const world = {
    width: WORLD_W,
    height: WORLD_H,
    entryFromHome: { x: 664, y: 472, dir: 'down' },
    defaultSpawn: { x: 776, y: 552, dir: 'down' },
    northGatePassage: {
      north: { x: GATE.x, y: 288, dir: 'up' },
      south: { x: GATE.x, y: 342, dir: 'down' }
    },

    canStand(x, y, save) {
      if (x < 92 || x > WORLD_W - 92 || y < 78 || y > WORLD_H - 84) return false;
      // the dock deck is walkable even where it hangs over the water
      if (x >= DOCK.x + 5 && x <= DOCK.x + DOCK.w - 5 && y >= DOCK.y + 7 && y <= DOCK.y + DOCK.h - 1) {
        return true;
      }
      const box = { x0: x - 5, x1: x + 5, y0: y - 7, y1: y };
      const tx0 = Math.floor(box.x0 / TILE);
      const tx1 = Math.floor(box.x1 / TILE);
      const ty0 = Math.floor(box.y0 / TILE);
      const ty1 = Math.floor(box.y1 / TILE);
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          if (tx < 0 || ty < 0 || tx >= WORLD_TILES_W || ty >= WORLD_TILES_H) return false;
          if (COLLISION_GRID[ty * WORLD_TILES_W + tx]) return false;
        }
      }
      for (const s of solids) {
        if (box.x1 > s.x && box.x0 < s.x + s.w && box.y1 > s.y && box.y0 < s.y + s.h) return false;
      }
      if (!save?.flags?.northGateOpen) {
        const g = gateRect;
        if (box.x1 > g.x && box.x0 < g.x + g.w && box.y1 > g.y && box.y0 < g.y + g.h) return false;
      }
      const eg = eastGateRect;
      if (box.x1 > eg.x && box.x0 < eg.x + eg.w && box.y1 > eg.y && box.y0 < eg.y + eg.h) return false;
      return true;
    },

    isLake(x, y, inset = 0) {
      const rx = Math.max(10, POND.rx - inset);
      const ry = Math.max(10, POND.ry - inset);
      const dx = (x - POND.cx) / rx;
      const dy = (y - POND.cy) / ry;
      return dx * dx + dy * dy <= 1;
    },

    canBoat(x, y) {
      if (x < 92 || x > WORLD_W - 92 || y < 78 || y > WORLD_H - 84) return false;
      return this.isLake(x, y, 14);
    },

    boatDock: { x: BOAT.x, y: BOAT.y, dir: 'left' },
    dockRect: { ...DOCK },

    spawn(save) {
      const p = save?.player;
      if (p && p.scene === 'town' && this.canStand(p.x, p.y, save)) {
        return { x: p.x, y: p.y, dir: p.dir || 'down' };
      }
      return { ...this.defaultSpawn };
    },

    zoneAt(x, y) {
      if (y < 300) return '北岭 · 观星台';
      if (x > 560 && x < 770 && y > 410 && y < 512) return '小屋庭院';
      if (x > 648 && x < 936 && y > 456 && y < 634) return '中央广场';
      if (x > 390 && x < 712 && y > 600 && y < 852) return '镜湖岸边';
      if (x > 190 && x < 330 && y > 550 && y < 660) return '篝火营地';
      if (x > 940 && x < 1090 && y > 740 && y < 900) return '小舞台';
      if (x > 1290 && x < 1420 && y > 800 && y < 920) return '风车花田';
      if (x > 220 && x < 470 && y > 292 && y < 540) return '榕树巷';
      if (x > 1020 && x < 1300 && y > 320 && y < 574) return '工坊街';
      if (x > 230 && x < 480 && y > 700 && y < 934) return '水晶坡';
      if (x > 1140) return '东边草甸';
      if (y > 844) return '南林小径';
      return '苔溪小镇';
    },

    labels(save) {
      const level = levelInfo(save?.xp || 0).level;
      return BUILDINGS.map((b) => {
        let sub = '';
        let locked = false;
        if (b.courseId) {
          const course = COURSE_MAP[b.courseId];
          if (course?.requiresLevel && level < course.requiresLevel) {
            locked = true;
            sub = `Lv.${course.requiresLevel} 开放`;
          } else {
            sub = `${course.lessons.length} 课`;
          }
        } else if (b.kind === 'home') {
          sub = 'E 进入';
        } else {
          sub = '筹备中';
          locked = true;
        }
        return {
          id: b.id,
          x: b.x + b.w / 2,
          y: b.labelY,
          text: b.name,
          sub,
          locked
        };
      });
    },

    interactables(save) {
      const level = levelInfo(save?.xp || 0).level;
      const list = [];
      const push = (o) => list.push(o);

      for (const b of BUILDINGS) {
        const it = b.interact;
        if (b.kind === 'tent' || b.kind === 'greenhouse') continue;
        if (b.courseId) {
          const course = COURSE_MAP[b.courseId];
          const lockedByLevel = Boolean(course?.requiresLevel && level < course.requiresLevel);
          push({
            ...it, id: b.id, courseId: b.courseId, locked: lockedByLevel,
            lockText: lockedByLevel ? `还要再成长一点（Lv.${course.requiresLevel}）才能进入${b.name}。` : '',
            label: lockedByLevel ? `${b.name} · Lv.${course.requiresLevel} 解锁` : it.label
          });
        } else {
          push({ ...it, id: b.id, locked: false });
        }
      }

      push({ id: 'task-board', type: 'tasks', x: 872, y: 502, r: 44, label: '看看今天的任务', fx: '!', fxTone: 'quest' });
      push({
        id: 'fish-north', type: 'fishing', x: 500, y: 626, r: 32,
        label: '在北岸垂钓', fx: '钓', fxTone: 'water', cast: { x: 500, y: 676 }
      });
      push({
        id: 'fish-south', type: 'fishing', x: 578, y: 834, r: 32,
        label: '在南岸钓鱼', fx: '钓', fxTone: 'water', cast: { x: 578, y: 792 }
      });
      push({
        id: 'lake-view', type: 'flavor', x: 462, y: 650, r: 34,
        label: '看看湖面', fx: '水', fxTone: 'water',
        flavor: '湖面比从前更宽了，白云慢慢游过去，鸭子以为那是同伴，追了半天。'
      });
      push({
        id: 'boat-dock', type: 'boat', x: 636, y: 748, r: 34,
        label: '登上小船，划向湖心', fx: '舟', fxTone: 'water'
      });
      push({
        id: 'flower-arch', type: 'photo', x: 776, y: 690, r: 36,
        label: '在花拱门下拍照', fx: '影', fxTone: 'love'
      });
      push({
        id: 'stage', type: 'stage', x: 1010, y: 820, r: 40,
        label: '站上小舞台', fx: '♪', fxTone: 'arcane'
      });
      push({
        id: 'campfire', type: 'campfire', x: 260, y: 600, r: 38,
        label: '在篝火边取暖', fx: '火', fxTone: 'warm'
      });

      push({
        id: 'north-gate', type: 'gate', x: GATE.x, y: 344, r: 54,
        locked: !save?.flags?.northGateOpen,
        fx: save?.flags?.northGateOpen ? '门' : '锁',
        fxTone: save?.flags?.northGateOpen ? 'warm' : 'muted',
        label: save?.flags?.northGateOpen ? '穿过北门，去北岭' : `北门 · Lv.${GATE_LEVEL} 解锁`,
        lockText: `北门的木闩扣得很紧。升到 Lv.${GATE_LEVEL}，守林人就会替你打开。`
      });
      push({
        id: 'east-gate', type: 'gate', x: EAST_GATE.x, y: 568, r: 48,
        locked: true,
        fx: '锁',
        fxTone: 'muted',
        label: '东边的小径 · 施工中',
        lockText: '东边的小径还在修。等新的课程盖好，路就会通。'
      });

      for (const b of BUILDINGS.filter((x) => x.kind === 'tent' || x.kind === 'greenhouse')) {
        push({
          id: b.id, type: 'future', x: b.interact.x, y: b.interact.y, r: b.interact.r,
          locked: true, label: b.kind === 'tent' ? '看看卢亚的帐篷' : '看看玻璃温室',
          fx: '锁', fxTone: 'muted',
          lockText: b.kind === 'tent'
            ? '帐篷里传来均匀的呼吸声。木牌上写着：Lua 课程筹备中。'
            : '温室的门锁着，玻璃上贴着一张便签：等小灯学会看天气，就开门。'
        });
      }

      const treeLines = [
        '树叶把阳光筛成一小片一小片。你听见树梢有谁在打盹。',
        '树干上有一道旧刻痕，像很久以前留下的身高线。',
        '你抬头看了看树冠，一只松鼠也在低头看你。',
        '风从枝叶间穿过，带走了一点夏天的热气。'
      ];
      const labels = {
        tree: '看看树', bush: '拨开灌木', rock: '看看石头', lamp: '看看路灯',
        flowerbox: '闻闻花', crate: '翻翻木箱', barrel: '看看木桶', postbox: '看看信箱',
        fountain: '向喷泉许个愿', cat: '摸摸阿橘', well: '看看水井', hive: '看看蜂箱',
        scarecrow: '和稻草人打个招呼', sign: '查看路牌', windmill: '看看风车转呀转'
      };
      const texts = {
        bush: ['灌木丛里藏着几颗小浆果。你决定给小鸟留着。', '叶子抖了抖，一只很小的甲虫爬走了。'],
        rock: ['石头被日头晒得温温的。下面压着一小片青苔。', '你数了数石头上的斑点，像一张小小的星图。'],
        lamp: ['灯罩里暖着一小团光。天黑以后，它会替你照路。', '灯柱上刻着一行小字：慢一点也没关系。'],
        flowerbox: ['花香淡淡的，像刚洗过的围巾。', '一朵小花歪向你这一边，好像在听你说话。'],
        crate: ['箱子里整齐地码着空玻璃瓶，叮叮当当。', '木箱上写着“小镇公用”，里面有一卷麻绳。'],
        barrel: ['桶里是今年的苹果酒，闻起来很甜。', '桶盖上放着一只小木杯，像是给路过的人留的。'],
        postbox: ['信箱里躺着一片枫叶，还有一张便签：等你学完第一课，再来看看。', '今天的信已经取走了，只剩一枚圆圆的邮戳。'],
        fountain: ['你往水里投了一枚想象的硬币。喷泉的水花轻轻跳了一下。', '水声把广场的喧闹洗得干干净净。'],
        cat: ['阿橘翻了个身，尾巴在你鞋边扫了一下，又睡过去了。', '阿橘眯起眼睛，喉咙里滚出一小串呼噜声。'],
        well: ['井水映出一小块圆圆的天。你朝里面挥了挥手。', '桶里的水凉丝丝的，带着石头和青苔的味道。'],
        hive: ['蜜蜂忙着在花和蜂箱之间来回。你站远一点，替它们数拍子。', '蜂箱里传来低低的嗡鸣，像一台很小的发动机。'],
        scarecrow: ['稻草人的帽子歪着。你替它扶正了一点。', '它张开手臂，认真地把风拦在田边。'],
        sign: ['路牌上画着北岭、镜湖和东边未修好的小径。', '木头上的箭头被摸得发亮。'],
        windmill: ['风车一圈一圈地转，把风磨成了细细的白色粉末。', '叶片停下来喘了口气，又慢慢转起来。']
      };
      const fxByType = {
        tree: ['叶', 'nature'], bush: ['莓', 'nature'], rock: ['石', 'muted'],
        lamp: ['光', 'warm'], flowerbox: ['花', 'love'], crate: ['瓶', 'warm'],
        barrel: ['酒', 'warm'], postbox: ['信', 'warm'], fountain: ['愿', 'water'],
        cat: ['喵', 'love'], well: ['水', 'water'], hive: ['嗡', 'warm'],
        scarecrow: ['风', 'nature'], sign: ['路', 'quest'], bench: ['憩', 'nature'],
        stump: ['憩', 'nature'], picnic: ['憩', 'nature'], windmill: ['风', 'nature']
      };
      const radii = {
        tree: 32, bush: 26, rock: 24, stump: 28, lamp: 26, bench: 34,
        sign: 30, postbox: 30, crate: 26, barrel: 26, flowerbox: 24,
        cat: 32, fountain: 62, well: 42, hive: 30, picnic: 38, scarecrow: 34,
        windmill: 48
      };
      let treeIndex = 0;
      for (const o of decos) {
        if (o.type === 'board') continue;
        const id = o.id || `${o.type}-${Math.round(o.x)}-${Math.round(o.y)}`;
        if (o.type === 'bench' || o.type === 'stump' || o.type === 'picnic') {
          const label = o.type === 'bench' ? '在长椅上坐下'
            : o.type === 'stump' ? '在树桩上坐一会儿' : '在野餐毯上坐下';
          const text = o.type === 'bench'
            ? ['坐下以后，风把远处的说话声送了过来。', '长椅还留着太阳的温度。', '你坐了一会儿，看云慢慢挪动。'][Math.floor(o.x + o.y) % 3]
            : o.type === 'stump'
              ? '树桩被磨得光光的，像一个安静的座位。'
              : '毯子上摊着一小篮点心和两只杯子，像是专门等你来。';
          const benchSeats = o.type === 'bench' ? [
            { x: o.x - 8, y: o.y + 1, dir: 'down', text, stand: { x: o.x - 8, y: o.y + 14 } },
            { x: o.x + 8, y: o.y + 1, dir: 'down', text, stand: { x: o.x + 8, y: o.y + 14 } }
          ] : null;
          push({
            id, type: 'sit', x: o.x, y: o.y - 6, r: radii[o.type], label,
            flavor: text,
            fx: '憩', fxTone: 'nature',
            seats: benchSeats,
            seat: benchSeats ? benchSeats[1] : {
              x: o.x,
              y: o.y + 1,
              dir: 'down',
              text,
              stand: { x: o.x, y: o.y + 14 }
            }
          });
          continue;
        }
        if (o.type === 'sign') {
          push({ id, type: 'map', x: o.x, y: o.y - 6, r: radii.sign, label: labels.sign, fx: '路', fxTone: 'quest' });
          continue;
        }
        if (!labels[o.type]) continue;
        const pool = texts[o.type];
        const flavor = o.type === 'tree'
          ? treeLines[treeIndex++ % treeLines.length]
          : pool ? pool[Math.floor(o.x + o.y) % pool.length] : '你在这儿看了一会儿。';
        const [fx, fxTone] = fxByType[o.type] || ['✦', 'nature'];
        push({
          id,
          type: 'flavor',
          x: o.x,
          y: o.y - (o.type === 'fountain' ? 4 : 6),
          r: radii[o.type] || 28,
          label: labels[o.type],
          flavor,
          fx,
          fxTone
        });
      }

      return list;
    },

    nearestInteractable(player, save) {
      const list = this.interactables(save);
      let best = null;
      let bestDist = Infinity;
      for (const it of list) {
        const dx = player.x - it.x;
        const dy = player.y - it.y;
        const d = Math.hypot(dx, dy);
        if (d <= it.r && d < bestDist) {
          best = it;
          bestDist = d;
        }
      }
      return best;
    },

    draw(ctx, camera, time, state) {
      const { player, save, reduceMotion, viewW, viewH, day } = state;
      const daylight = day || { darkness: 0, overlay: 'rgba(0,0,0,0)', night: false };
      northGate.open = Boolean(save?.flags?.northGateOpen);
      ctx.drawImage(ground, -Math.round(camera.x), -Math.round(camera.y));

      // water sparkles
      const t = time * 0.001;
      const sparkles = [
        [500, 676, 0], [588, 662, 1.7], [644, 700, 3.1], [466, 712, 4.4],
        [556, 748, 5.2], [626, 742, 2.4], [492, 780, 6.1], [598, 790, 7.3],
        [530, 700, 8.1], [656, 724, 2.9]
      ];
      for (const [x, y, phase] of sparkles) {
        const a = 0.35 + Math.sin(t * 1.3 + phase) * 0.3;
        ctx.globalAlpha = Math.max(0, a);
        px(ctx, x - camera.x, y - camera.y, 4, 1, '#d7f0ef');
      }
      ctx.globalAlpha = 1;

      if (!reduceMotion) {
        const duck1x = POND.cx + Math.cos(t * 0.16) * 92;
        const duck1y = POND.cy + Math.sin(t * 0.16) * 34;
        const duck2x = POND.cx + Math.cos(t * 0.12 + 2.6) * 62;
        const duck2y = POND.cy + Math.sin(t * 0.12 + 2.6) * 22;
        drawDuck(ctx, duck1x - camera.x, duck1y - camera.y, time, 0.4);
        drawDuck(ctx, duck2x - camera.x, duck2y - camera.y, time, 2.1);
      } else {
        drawDuck(ctx, POND.cx + 40 - camera.x, POND.cy - camera.y, time, 0.4);
        drawDuck(ctx, POND.cx - 30 - camera.x, POND.cy + 12 - camera.y, time, 2.1);
      }

      const renderables = [];
      const camX = Math.round(camera.x);
      const camY = Math.round(camera.y);
      const drawInWorld = (fn) => () => {
        ctx.save();
        try {
          ctx.translate(-camX, -camY);
          fn();
        } finally {
          ctx.restore();
        }
      };
      for (const b of BUILDINGS) {
        if (b.x + b.w < camera.x - 96 || b.x > camera.x + viewW + 96) continue;
        if (b.y + b.h < camera.y - 160 || b.y > camera.y + viewH + 160) continue;
        renderables.push({
          sortY: b.y + b.h,
          draw: drawInWorld(() => drawBuilding(ctx, b, time))
        });
      }
      for (const o of decos) {
        if (o.x < camera.x - 90 || o.x > camera.x + viewW + 90) continue;
        if (o.y < camera.y - 160 || o.y > camera.y + viewH + 120) continue;
        if (o.type === 'boat' && player?.boating) continue;
        renderables.push({
          sortY: o.y,
          draw: drawInWorld(() => drawDeco(ctx, o, time, daylight))
        });
      }
      for (const g of gates) {
        if (g.x < camera.x - 90 || g.x > camera.x + viewW + 90) continue;
        renderables.push({
          sortY: g.y,
          draw: () => drawGate(ctx, { ...g, x: g.x - camera.x, y: g.y - camera.y }, time)
        });
      }
      if (player) {
        renderables.push({
          sortY: player.y,
          draw: () => {
            // drawn by the game layer via callback
          },
          isPlayer: true
        });
      }
      for (const actor of state.extraActors || []) {
        renderables.push({ sortY: actor.y, actor, isExtraActor: true });
      }
      renderables.sort((a, b) => a.sortY - b.sortY);
      for (const r of renderables) {
        if (r.isPlayer) {
          state.drawPlayer(ctx, camera);
        } else if (r.isExtraActor) {
          state.drawPeer?.(ctx, r.actor, camera);
        } else {
          r.draw();
        }
      }

      // fireflies
      if (!reduceMotion) {
        for (const f of fireflies) {
          const a = Math.sin(t * f.speed + f.phase) * (0.2 + daylight.darkness * 0.9);
          if (a < 0.12) continue;
          const x = f.x + Math.sin(t * 0.5 + f.phase) * 10 - camera.x;
          const y = f.y + Math.cos(t * 0.4 + f.phase * 1.7) * 6 - camera.y;
          if (x < -10 || x > viewW + 10 || y < -10 || y > viewH + 10) continue;
          ctx.globalAlpha = a;
          px(ctx, x, y, 1, 1, '#ffe9a8');
          if (a > 0.55) {
            ctx.globalAlpha = a * 0.25;
            px(ctx, x - 1, y, 3, 1, '#ffd98a');
            px(ctx, x, y - 1, 1, 3, '#ffd98a');
          }
        }
        ctx.globalAlpha = 1;
      }

      // drifting leaves
      if (!reduceMotion) {
        for (let i = 0; i < 14; i++) {
          const speed = 12 + (i % 5) * 3;
          const x = ((i * 97 + t * speed) % (viewW + 80)) - 40 + camera.x;
          const y = (i * 53 + Math.sin(t * 0.8 + i) * 20 + t * 7) % (viewH + 60);
          const colors = ['#c7a15b', '#a9723f', '#d6b26c', '#9c5f3a'];
          ctx.globalAlpha = 0.7;
          px(ctx, x - camera.x, y, 2, 1, colors[i % 4]);
          px(ctx, x - camera.x + 1, y + 1, 1, 1, colors[(i + 1) % 4]);
        }
        ctx.globalAlpha = 1;
      }

      // day / night wash
      if (daylight.overlayAlpha > 0.004) {
        ctx.fillStyle = daylight.overlay;
        ctx.fillRect(0, 0, viewW, viewH);
      }

      // warm pools of light after dark
      if (daylight.darkness > 0.18) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const lampAlpha = (daylight.darkness - 0.18) * 0.48;
        for (const o of decos) {
          if (o.type !== 'lamp') continue;
          if (o.x < camera.x - 70 || o.x > camera.x + viewW + 70) continue;
          if (o.y < camera.y - 90 || o.y > camera.y + viewH + 90) continue;
          const x = o.x - camera.x;
          const y = o.y - camera.y - 47;
          const glow = ctx.createRadialGradient(x, y, 3, x, y, 54);
          glow.addColorStop(0, `rgba(255, 214, 140, ${lampAlpha})`);
          glow.addColorStop(0.5, `rgba(255, 186, 96, ${lampAlpha * 0.3})`);
          glow.addColorStop(1, 'rgba(255, 170, 80, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(x - 56, y - 56, 112, 112);
        }
        for (const b of BUILDINGS) {
          if (b.x + b.w < camera.x - 40 || b.x > camera.x + viewW + 40) continue;
          if (b.y + b.h < camera.y - 80 || b.y > camera.y + viewH + 40) continue;
          const x = b.door.x - camera.x;
          const y = b.door.y - camera.y - 30;
          const glow = ctx.createRadialGradient(x, y, 2, x, y, 36);
          glow.addColorStop(0, `rgba(255, 204, 122, ${lampAlpha * 0.5})`);
          glow.addColorStop(1, 'rgba(255, 180, 90, 0)');
          ctx.fillStyle = glow;
          ctx.fillRect(x - 38, y - 38, 76, 76);
        }
        const attractionGlow = {
          fountain: [255, 228, 172, 66, -18],
          campfire: [255, 158, 90, 54, -8],
          stage: [255, 206, 128, 48, -18]
        };
        for (const o of decos) {
          const spot = attractionGlow[o.type];
          if (!spot) continue;
          if (o.x < camera.x - 80 || o.x > camera.x + viewW + 80) continue;
          if (o.y < camera.y - 90 || o.y > camera.y + viewH + 90) continue;
          const [r, g, b, radius, lift] = spot;
          const flick = o.type === 'campfire' ? 0.72 + Math.sin(time * 0.008) * 0.22 : 1;
          const x = o.x - camera.x;
          const y = o.y - camera.y + lift;
          const glow = ctx.createRadialGradient(x, y, 3, x, y, radius);
          glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${lampAlpha * 0.6 * flick})`);
          glow.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${lampAlpha * 0.2 * flick})`);
          glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
          ctx.fillStyle = glow;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        }
        ctx.restore();
      }
    }
  };

  return world;
}

function drawDeco(ctx, o, time, day) {
  switch (o.type) {
    case 'tree': drawTree(ctx, o, time); break;
    case 'bush': drawBush(ctx, o, time); break;
    case 'rock': drawRock(ctx, o); break;
    case 'stump': drawStump(ctx, o); break;
    case 'lamp': drawLampPost(ctx, { ...o, lit: o.lit !== false && (day?.darkness || 0) > 0.3 }, time); break;
    case 'bench': drawBench(ctx, o); break;
    case 'board': drawBoard(ctx, o); break;
    case 'sign': drawSignpost(ctx, o); break;
    case 'postbox': drawPostbox(ctx, o, time); break;
    case 'crate': drawCrate(ctx, o); break;
    case 'barrel': drawBarrel(ctx, o); break;
    case 'flowerbox': drawFlowerbox(ctx, o, time); break;
    case 'fountain': drawFountain(ctx, o, time); break;
    case 'cat': drawCat(ctx, o, time); break;
    case 'well': drawWell(ctx, o, time); break;
    case 'hive': drawHive(ctx, o, time); break;
    case 'picnic': drawPicnic(ctx, o); break;
    case 'scarecrow': drawScarecrow(ctx, o, time); break;
    case 'windmill': drawWindmill(ctx, o, time); break;
    case 'flowerarch': drawFlowerArch(ctx, o, time); break;
    case 'stage': drawStage(ctx, o, time); break;
    case 'campfire': drawCampfire(ctx, o, time); break;
    case 'dock': drawDock(ctx, o); break;
    case 'boat': drawBoat(ctx, o, time, false); break;
    default: break;
  }
}

/* ---------------- world map ---------------- */

export function renderTownMap(canvas, save) {
  const W = 480;
  const H = 320;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const sx = W / WORLD_W;
  const sy = H / WORLD_H;

  ctx.fillStyle = '#e5d3ac';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#c8d3a7';
  ctx.fillRect(6, 6, W - 12, H - 12);

  // forest frame
  ctx.fillStyle = '#7c9a70';
  for (let x = 8; x < W - 8; x += 10) {
    ctx.fillRect(x, 8 + (x % 3) * 2, 9, 16);
    ctx.fillRect(x, H - 24 - (x % 4), 9, 16);
  }
  for (let y = 20; y < H - 24; y += 11) {
    ctx.fillRect(8 + (y % 3) * 2, y, 14, 10);
    ctx.fillRect(W - 22 - (y % 4), y, 14, 10);
  }

  // pond
  ctx.fillStyle = '#7fb3bc';
  ctx.beginPath();
  ctx.ellipse(POND.cx * sx, POND.cy * sy, POND.rx * sx, POND.ry * sy, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e2cf9f';
  ctx.lineWidth = 2;
  ctx.stroke();

  // paths
  for (const k of PATH_SET) {
    const [tx, ty] = k.split(',').map(Number);
    ctx.fillStyle = '#d9bd8d';
    ctx.fillRect(tx * 16 * sx, ty * 16 * sy, 16 * sx + 0.6, 16 * sy + 0.6);
  }
  // hedge line
  ctx.fillStyle = '#6d8a63';
  ctx.fillRect(6, 304 * sy - 1, W - 12, 3);
  ctx.fillStyle = '#d9bd8d';
  ctx.fillRect(GATE.x * sx - 4, 304 * sy - 2, 8, 5);

  // buildings
  for (const b of BUILDINGS) {
    const course = b.courseId ? COURSE_MAP[b.courseId] : null;
    const x = b.x * sx;
    const y = b.y * sy;
    const w = Math.max(7, b.w * sx);
    const h = Math.max(6, b.h * sy);
    ctx.fillStyle = b.kind === 'home' ? '#e0b884' : course?.color || '#a7a08e';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(50, 40, 30, .55)';
    ctx.fillRect(x, y + h - 2, w, 2);
    ctx.fillStyle = '#f7ecd2';
    ctx.fillRect(x + w * 0.42, y + h - 5, 3, 5);
    if (course) {
      ctx.fillStyle = 'rgba(20, 24, 34, .45)';
      ctx.fillRect(x, y, w, 3);
    }
  }

  // gates
  ctx.fillStyle = save?.flags?.northGateOpen ? '#a8d8b4' : '#b9715f';
  ctx.fillRect(GATE.x * sx - 5, GATE.y * sy - 2, 10, 5);
  ctx.fillStyle = '#b9715f';
  ctx.fillRect(EAST_GATE.x * sx - 2, EAST_GATE.y * sy - 5, 5, 10);

  // attractions
  const markers = [
    [712, 600, '#8fd2e8', 4],
    [776, 690, '#f2a7b8', 3],
    [1010, 812, '#e2a38f', 4],
    [260, 600, '#ffb36b', 3],
    [1352, 858, '#e8cfa0', 4]
  ];
  for (const [ax, ay, color, size] of markers) {
    ctx.fillStyle = 'rgba(40, 34, 26, .35)';
    ctx.fillRect(ax * sx - size / 2, ay * sy - size / 2 + 1, size + 1, size);
    ctx.fillStyle = color;
    ctx.fillRect(ax * sx - size / 2, ay * sy - size / 2, size, size);
  }

  // player marker
  const p = save?.player;
  if (p) {
    const px0 = p.x * sx;
    const py0 = p.y * sy;
    ctx.fillStyle = 'rgba(255, 209, 102, .25)';
    ctx.beginPath();
    ctx.arc(px0, py0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(px0 - 2, py0 - 2, 5, 5);
    ctx.fillStyle = '#2a200c';
    ctx.fillRect(px0, py0, 1, 1);
  }

  // compass
  ctx.fillStyle = 'rgba(60, 52, 38, .65)';
  ctx.fillRect(W - 34, 18, 1, 16);
  ctx.fillRect(W - 41, 25, 16, 1);
  ctx.fillStyle = 'rgba(60, 52, 38, .9)';
  ctx.fillRect(W - 36, 16, 5, 3);
  ctx.font = '8px monospace';
  ctx.fillText('N', W - 37, 14);

  // border
  ctx.strokeStyle = '#8a7456';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, W - 6, H - 6);
}
