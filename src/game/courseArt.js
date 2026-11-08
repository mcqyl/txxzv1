import { px, poly, circlePixels, mulberry32 } from './pixel.js';
import { drawBuilding, drawTree, drawBush, drawFountain } from './worldArt.js';

const W = 480;
const H = 200;

function setup(canvas) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

function skyBands(ctx, colors, height = 136) {
  const band = Math.ceil(height / colors.length);
  for (let i = 0; i < colors.length; i++) {
    px(ctx, 0, i * band, W, band, colors[i]);
  }
}

function stars(ctx, rand, count, maxY) {
  for (let i = 0; i < count; i++) {
    const x = rand() * W;
    const y = rand() * maxY;
    px(ctx, x, y, 1, 1, rand() > 0.7 ? '#fff4cf' : '#d9ddff');
    if (rand() > 0.92) {
      px(ctx, x - 1, y, 3, 1, 'rgba(255, 240, 200, .45)');
      px(ctx, x, y - 1, 1, 3, 'rgba(255, 240, 200, .45)');
    }
  }
}

function hills(ctx, y, colors) {
  colors.forEach((color, i) => {
    const offset = i * 26;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-20, H);
    ctx.lineTo(-20, y + offset);
    for (let x = -20; x <= W + 20; x += 40) {
      const h = Math.sin((x + i * 90) * 0.014) * 16 + Math.cos((x + i * 30) * 0.022) * 10;
      ctx.lineTo(x, y + offset - h);
    }
    ctx.lineTo(W + 20, H);
    ctx.closePath();
    ctx.fill();
  });
}

function grass(ctx, rand, y = 138) {
  px(ctx, 0, y, W, H - y, '#5d8c4c');
  px(ctx, 0, y, W, 4, '#6f9e58');
  for (let i = 0; i < 260; i++) {
    const x = rand() * W;
    const gy = y + 6 + rand() * (H - y - 10);
    const c = rand() > 0.5 ? '#527f42' : '#79a860';
    px(ctx, x, gy, 1, 2, c);
    if (rand() > 0.85) px(ctx, x - 1, gy, 3, 1, c);
  }
}

function fireflies(ctx, rand, count, x0, x1, y0, y1) {
  for (let i = 0; i < count; i++) {
    const x = x0 + rand() * (x1 - x0);
    const y = y0 + rand() * (y1 - y0);
    px(ctx, x, y, 1, 1, '#ffe9a8');
    px(ctx, x - 1, y, 3, 1, 'rgba(255, 220, 140, .18)');
    px(ctx, x, y - 1, 1, 3, 'rgba(255, 220, 140, .18)');
  }
}

function codeChips(ctx, entries, x, y0, gap = 26) {
  entries.forEach(([text, color], i) => {
    const w = Math.min(112, 34 + text.length * 7);
    const y = y0 + i * gap;
    px(ctx, x, y, w, 17, 'rgba(12, 17, 28, .72)');
    px(ctx, x, y, 2, 17, color || '#8fe3b0');
    ctx.font = '7px "Cascadia Mono", monospace';
    ctx.fillStyle = color || '#cfe8d9';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + 8, y + 9);
  });
}

export function drawCourseArt(canvas, courseId, time = 0, options = {}) {
  if (!canvas) return;
  const ctx = setup(canvas);
  const rand = mulberry32(0x1a2b3c + courseId.length * 73);

  if (courseId === 'python') {
    skyBands(ctx, ['#3b3550', '#5d4a5a', '#8a5f58', '#c98c62', '#e7b77c'], 142);
    px(ctx, 355, 30, 22, 22, '#f6d28e');
    px(ctx, 359, 26, 14, 30, '#f6d28e');
    px(ctx, 351, 34, 30, 14, '#f6d28e');
    hills(ctx, 118, ['#4e4c55', '#3b5148', '#2d4439']);
    grass(ctx, rand, 138);
    // path
    px(ctx, 0, 168, W, 18, '#b99b6e');
    px(ctx, 0, 170, W, 3, '#d2b68a');
    drawBuilding(ctx, { kind: 'python', x: 34, y: 16, w: 160, h: 156 }, time);
    drawTree(ctx, { x: 408, y: 176, variant: 'gold', size: 1.25, seed: 2 }, time);
    drawBush(ctx, { x: 220, y: 178, size: 1.1, seed: 1 }, time);
    drawBush(ctx, { x: 252, y: 184, size: 0.8, seed: 2 }, time);
    // snake visitor
    const bob = Math.sin(time * 0.002) > 0 ? 1 : 0;
    circlePixels(ctx, 300, 172 + bob, 9, '#3f7a51');
    circlePixels(ctx, 300, 169 + bob, 7, '#4f8f5c');
    circlePixels(ctx, 306, 163 + bob, 5, '#5da468');
    px(ctx, 307, 161 + bob, 2, 2, '#f4e8c9');
    px(ctx, 308, 162 + bob, 1, 1, '#252b25');
    px(ctx, 311, 165 + bob, 3, 1, '#e59a5a');
    codeChips(ctx, [['print("你好")', '#8fe3b0'], ['for i in range(3):', '#ffd166'], ['    print("*" * i)', '#8ecae6']], 330, 88, 24);
    fireflies(ctx, rand, 22, 210, 460, 60, 170);
    return;
  }

  if (courseId === 'web') {
    skyBands(ctx, ['#39445e', '#5b6e83', '#8ea1a2', '#e0b98c', '#f2d3a2'], 142);
    hills(ctx, 122, ['#5b6f62', '#47604f', '#35503f']);
    grass(ctx, rand, 140);
    drawBuilding(ctx, { kind: 'web', x: 30, y: 24, w: 144, h: 144 }, time);
    drawTree(ctx, { x: 218, y: 168, variant: 'birch', size: 0.9, seed: 3 }, time);
    drawTree(ctx, { x: 432, y: 178, variant: 'oak', size: 1.15, seed: 1 }, time);
    // floating tags
    ctx.font = '9px "Cascadia Mono", monospace';
    ctx.textBaseline = 'middle';
    const tags = [['<h1>', '#8ecae6', 268, 64], ['<p>', '#8fe3b0', 330, 96], ['{ }', '#ffd166', 404, 70], ['</>', '#ff9f90', 366, 132]];
    for (const [text, color, x, y] of tags) {
      const float = Math.sin(time * 0.0016 + x) * 2;
      px(ctx, x - 8, y - 11 + float, 46, 22, 'rgba(14, 20, 33, .66)');
      px(ctx, x - 8, y - 11 + float, 2, 22, color);
      ctx.fillStyle = color;
      ctx.fillText(text, x + 1, y + float);
    }
    fireflies(ctx, rand, 12, 260, 460, 50, 160);
    return;
  }

  if (courseId === 'sql') {
    skyBands(ctx, ['#171b32', '#232747', '#383158', '#57405f', '#7b525f'], 144);
    stars(ctx, rand, 80, 120);
    px(ctx, 396, 26, 18, 18, '#f3e3bd');
    px(ctx, 400, 23, 10, 24, '#f3e3bd');
    px(ctx, 392, 30, 26, 10, '#f3e3bd');
    hills(ctx, 126, ['#2a3045', '#23283a', '#1c2330']);
    grass(ctx, rand, 142);
    drawBuilding(ctx, { kind: 'sql', x: 36, y: 20, w: 144, h: 152 }, time);
    // crystal cluster
    const crystals = [[260, 170, 18, '#c9a7ff'], [286, 178, 12, '#a685e0'], [242, 180, 9, '#e0c8ff'], [430, 172, 16, '#b795ec'], [452, 180, 10, '#d7bcff']];
    for (const [x, y, h, color] of crystals) {
      poly(ctx, [[x, y], [x + 7, y - h], [x + 14, y]], color);
      poly(ctx, [[x + 3, y], [x + 7, y - h + 3], [x + 9, y]], 'rgba(255,255,255,.32)');
    }
    const glow = ctx.createRadialGradient(268, 140, 4, 268, 140, 60);
    glow.addColorStop(0, 'rgba(201, 167, 255, .25)');
    glow.addColorStop(1, 'rgba(201, 167, 255, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(200, 80, 140, 120);
    codeChips(ctx, [['SELECT name', '#c9a7ff'], ['FROM students', '#8fe3b0'], ['WHERE city = 星港', '#ffd166']], 316, 76, 25);
    fireflies(ctx, rand, 24, 210, 460, 60, 170);
    return;
  }

  if (courseId === 'data') {
    skyBands(ctx, ['#0e1630', '#16203f', '#232b52', '#3a3964', '#5a4a6b'], 146);
    stars(ctx, rand, 120, 132);
    // constellation
    const pts = [[300, 44], [340, 66], [386, 40], [428, 74], [456, 48], [404, 96]];
    ctx.strokeStyle = 'rgba(255, 226, 160, .35)';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    for (const [x, y] of pts) px(ctx, x - 1, y - 1, 3, 3, '#ffe7a8');
    // moon
    px(ctx, 390, 24, 20, 20, '#f5e5bd');
    px(ctx, 398, 21, 12, 26, '#f5e5bd');
    px(ctx, 386, 28, 28, 12, '#f5e5bd');
    px(ctx, 396, 22, 12, 12, '#16203f');
    hills(ctx, 126, ['#2c3350', '#232940', '#1b2131']);
    grass(ctx, rand, 144);
    drawBuilding(ctx, { kind: 'data', x: 30, y: 18, w: 144, h: 152 }, time);
    drawTree(ctx, { x: 206, y: 176, variant: 'pine', size: 1.3, seed: 1 }, time);
    drawTree(ctx, { x: 444, y: 184, variant: 'pine', size: 1.1, seed: 2 }, time);
    // floating numbers
    ctx.font = '8px "Cascadia Mono", monospace';
    ctx.textBaseline = 'middle';
    const nums = ['12', '5', '20', 'max', '8'];
    nums.forEach((text, i) => {
      const x = 286 + (i * 34) % 140;
      const y = 116 + i * 11;
      const float = Math.sin(time * 0.0013 + i * 2) * 2;
      ctx.fillStyle = i === 3 ? '#ffd166' : 'rgba(207, 232, 217, .72)';
      ctx.fillText(text, x, y + float);
    });
    fireflies(ctx, rand, 20, 200, 460, 80, 170);
    return;
  }

  if (courseId === 'lua') {
    skyBands(ctx, ['#2a2436', '#463647', '#7a4f49', '#b06d54', '#d99366'], 142);
    hills(ctx, 120, ['#4b4142', '#3c3833', '#2f312a']);
    grass(ctx, rand, 140);
    drawBuilding(ctx, { kind: 'tent', x: 190, y: 96, w: 96, h: 76 }, time);
    // campfire
    px(ctx, 146, 176, 22, 4, '#4c3828');
    px(ctx, 150, 172, 4, 6, '#7b4a2c');
    px(ctx, 160, 171, 4, 7, '#6b3f25');
    px(ctx, 154, 160, 6, 12, '#f08a4b');
    px(ctx, 156, 152, 4, 14, '#ffcf72');
    px(ctx, 157, 148, 2, 6, '#ffe8a3');
    const fire = ctx.createRadialGradient(158, 162, 2, 158, 162, 38);
    fire.addColorStop(0, 'rgba(255, 180, 90, .28)');
    fire.addColorStop(1, 'rgba(255, 180, 90, 0)');
    ctx.fillStyle = fire;
    ctx.fillRect(110, 120, 100, 80);
    drawTree(ctx, { x: 64, y: 178, variant: 'pine', size: 1.25, seed: 4 }, time);
    drawTree(ctx, { x: 424, y: 182, variant: 'oak', size: 1.15, seed: 5 }, time);
    fireflies(ctx, rand, 26, 100, 440, 60, 170);
    return;
  }

  if (courseId === 'ml') {
    skyBands(ctx, ['#2b3a54', '#41586d', '#6b8b8e', '#a7b99b', '#d6c79c'], 142);
    hills(ctx, 126, ['#4f6b5c', '#3f5a4c', '#31493e']);
    grass(ctx, rand, 142);
    drawBuilding(ctx, { kind: 'greenhouse', x: 180, y: 42, w: 112, h: 128 }, time);
    drawTree(ctx, { x: 96, y: 178, variant: 'birch', size: 1.05, seed: 6 }, time);
    drawTree(ctx, { x: 424, y: 182, variant: 'gold', size: 1.2, seed: 7 }, time);
    fireflies(ctx, rand, 16, 120, 430, 60, 170);
    return;
  }

  if (courseId === 'c') {
    skyBands(ctx, ['#2c3540', '#48555a', '#7d7d63', '#b7996a', '#e0c48f'], 142);
    hills(ctx, 122, ['#4c5a4d', '#3a4b40', '#2a3b33']);
    grass(ctx, rand, 140);
    ctx.fillStyle = '#446f78';
    ctx.beginPath();
    ctx.ellipse(336, 186, 88, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    px(ctx, 278, 178, 26, 1, '#78a8ae');
    px(ctx, 340, 188, 34, 1, '#5d96a2');
    drawBuilding(ctx, { kind: 'home', x: 150, y: 28, w: 118, h: 132 }, time);
    const cxW = 300;
    const cyW = 150;
    const wheel = 22;
    ctx.strokeStyle = '#6f4c30';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cxW, cyW, wheel, 0, Math.PI * 2);
    ctx.stroke();
    const spin = time * 0.0012;
    for (let i = 0; i < 8; i++) {
      const angle = spin + (i * Math.PI) / 4;
      px(ctx, cxW + Math.cos(angle) * wheel - 1, cyW + Math.sin(angle) * wheel - 1, 4, 4, '#8a6038');
    }
    px(ctx, cxW - 2, cyW - 30, 4, 12, '#5d422c');
    drawTree(ctx, { x: 88, y: 178, variant: 'birch', size: 1.05, seed: 8 }, time);
    drawBush(ctx, { x: 416, y: 184, size: 0.9, seed: 9 }, time);
    fireflies(ctx, rand, 12, 100, 420, 60, 170);
    return;
  }

  if (courseId === 'java') {
    skyBands(ctx, ['#3a3350', '#5d4a5a', '#8a5f58', '#c98c62', '#e7b77c'], 142);
    hills(ctx, 120, ['#4e5a45', '#3c4a38', '#2c3a2c']);
    grass(ctx, rand, 140);
    drawBuilding(ctx, { kind: 'sql', x: 34, y: 20, w: 144, h: 152 }, time);
    for (let i = 0; i < 3; i++) {
      const bx = 300 + i * 44;
      drawTree(ctx, { x: bx, y: 182, variant: 'oak', size: 1.0, seed: i + 11 }, time);
      px(ctx, bx - 8, 158, 2, 2, '#d96f62');
      px(ctx, bx + 4, 164, 2, 2, '#c95f52');
      px(ctx, bx + 10, 154, 2, 2, '#e88f7a');
    }
    // steaming cup
    px(ctx, 232, 174, 12, 9, '#e8dbc2');
    px(ctx, 232, 174, 12, 2, '#f6eeda');
    px(ctx, 244, 177, 3, 4, '#d9c8a8');
    px(ctx, 235, 171, 1, 2, '#f0e1c8');
    px(ctx, 239, 169, 1, 3, '#f0e1c8');
    fireflies(ctx, rand, 12, 120, 430, 60, 170);
    return;
  }

  // fallback: home at dusk
  skyBands(ctx, ['#33304b', '#5a4b60', '#966764', '#cf946c', '#ecc389'], 140);
  hills(ctx, 120, ['#4c5a4d', '#3a4b40', '#2a3b33']);
  grass(ctx, rand, 140);
  drawBuilding(ctx, { kind: 'home', x: 190, y: 30, w: 112, h: 128 }, time);
  fireflies(ctx, rand, 14, 120, 400, 60, 170);
}

export function drawWelcomeScene(canvas, time = 0) {
  if (!canvas) return;
  const ctx = setup(canvas);
  const rand = mulberry32(0xc0ffee);
  skyBands(ctx, ['#171b33', '#232846', '#3a3553', '#624c5b', '#9c6b5f', '#cf9369'], 132);
  stars(ctx, rand, 90, 100);
  px(ctx, 392, 26, 20, 20, '#f5e3b5');
  px(ctx, 399, 22, 12, 28, '#f5e3b5');
  px(ctx, 386, 30, 30, 12, '#f5e3b5');
  hills(ctx, 118, ['#2f3c40', '#273433', '#1f2b2a']);
  grass(ctx, rand, 132);
  // lake
  ctx.fillStyle = '#3f6c7a';
  ctx.beginPath();
  ctx.ellipse(96, 176, 78, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  px(ctx, 64, 168, 30, 1, '#6fa6b0');
  px(ctx, 116, 180, 22, 1, '#5d96a2');
  // path
  px(ctx, 262, 168, 96, 22, '#b59468');
  px(ctx, 262, 170, 96, 3, '#d0b087');
  drawBuilding(ctx, { kind: 'home', x: 230, y: 34, w: 112, h: 128 }, time);
  drawTree(ctx, { x: 186, y: 176, variant: 'gold', size: 1.35, seed: 2 }, time);
  drawTree(ctx, { x: 404, y: 184, variant: 'pine', size: 1.25, seed: 4 }, time);
  drawTree(ctx, { x: 70, y: 158, variant: 'birch', size: 1.0, seed: 1 }, time);
  drawBush(ctx, { x: 330, y: 190, size: 0.9, seed: 2 }, time);
  drawBush(ctx, { x: 374, y: 196, size: 0.8, seed: 5 }, time);
  drawFountain(ctx, { x: 190, y: 198 }, time);
  fireflies(ctx, rand, 30, 100, 440, 60, 180);
  // title-ish sparkles
  for (let i = 0; i < 8; i++) {
    const x = 300 + rand() * 140;
    const y = 48 + rand() * 50;
    px(ctx, x, y, 1, 1, '#ffe9a8');
  }
}
