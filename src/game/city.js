import { drawPlayer, paletteForName } from './sprites.js';
import { OFFICE_COURSES, TOWER_ORDER, officeTitle } from '../data/office.js';

export const CITY_W = 1180;
export const CITY_H = 780;

const SIDEWALK_TOP = { y: 310, h: 92 };
const ROAD = { y: 402, h: 120 };
const SIDEWALK_BOTTOM = { y: 522, h: 88 };

const CROSSWALK = { start: 540, end: 651 };
const TRAFFIC_TIMING = { green: 22, yellow: 4, red: 18 };
const CAR_SEEDS = [
  { y: 424, color: '#d96b5f', dir: 1, speed: 70 },
  { y: 466, color: '#6f9fd8', dir: -1, speed: 58 },
  { y: 488, color: '#e0b35f', dir: 1, speed: 82 }
];

const TOWER_LAYOUT = [
  { courseId: 'python', x: 72, y: 34, w: 238, h: 278, doorX: 191, sign: '蟒蛇云端' },
  { courseId: 'web', x: 430, y: 10, w: 262, h: 302, doorX: 561, sign: '起源网络' },
  { courseId: 'data', x: 806, y: 46, w: 238, h: 266, doorX: 925, sign: '北岭数据' }
];

const BOTTOM_FACADES = [
  { x: 40, y: 648, w: 190, h: 140, color: '#2a3040', lit: '#f0c987' },
  { x: 360, y: 664, w: 240, h: 124, color: '#252b3a', lit: '#8ecae6' },
  { x: 700, y: 650, w: 210, h: 138, color: '#2b2a3a', lit: '#c9b6ff' },
  { x: 990, y: 670, w: 170, h: 118, color: '#242c34', lit: '#8fe3b0' }
];

const PROPS = [
  { type: 'bench', x: 300, y: 556, w: 54, h: 18 },
  { type: 'bench', x: 720, y: 366, w: 54, h: 18 },
  { type: 'lamp', x: 122, y: 352, w: 12, h: 14 },
  { type: 'lamp', x: 394, y: 352, w: 12, h: 14 },
  { type: 'lamp', x: 744, y: 352, w: 12, h: 14 },
  { type: 'lamp', x: 1062, y: 352, w: 12, h: 14 },
  { type: 'lamp', x: 260, y: 570, w: 12, h: 14 },
  { type: 'lamp', x: 660, y: 570, w: 12, h: 14 },
  { type: 'lamp', x: 1010, y: 570, w: 12, h: 14 },
  { type: 'tree', x: 96, y: 560, w: 18, h: 16 },
  { type: 'tree', x: 820, y: 574, w: 18, h: 16 },
  { type: 'tree', x: 1110, y: 360, w: 18, h: 16 },
  { type: 'hydrant', x: 452, y: 568, w: 10, h: 12 },
  { type: 'traffic', x: 520, y: 398, w: 12, h: 8 },
  { type: 'traffic', x: 642, y: 512, w: 12, h: 8 }
];

const KIOSK = { x: 336, y: 582, w: 118, h: 64 };
const CART = { x: 548, y: 566, w: 106, h: 52 };
const HOME = { x: 76, y: 610, w: 190, h: 82, doorX: 171 };
const BUS_STOP = { x: 946, y: 554, w: 104, h: 58 };

const NPC_SEEDS = [
  { name: '银杏', lane: 'top', x: 240, speed: 24, color: '#d9b48f' },
  { name: '小北', lane: 'top', x: 610, speed: 31, color: '#9ec5d9' },
  { name: '阿梨', lane: 'top', x: 990, speed: 22, color: '#d3a6c8' },
  { name: '纸鸢', lane: 'bottom', x: 330, speed: 27, color: '#b9c98f' },
  { name: '路人甲', lane: 'bottom', x: 690, speed: 33, color: '#c7b39a' },
  { name: '小署', lane: 'bottom', x: 1050, speed: 21, color: '#a7a9d6' },
  { name: '咖啡客', lane: 'top', x: 80, speed: 19, color: '#c8a57c' }
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function roundRect(ctx, x, y, w, h, r, fill) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const char of String(text || '')) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function drawBubble(ctx, x, y, speaker, text, night, viewW = 470) {
  ctx.save();
  ctx.font = '8px "Microsoft YaHei", system-ui, sans-serif';
  const maxW = 118;
  const lines = wrapText(ctx, text, maxW - 12);
  const width = Math.min(maxW, Math.max(40, ctx.measureText(speaker).width + 20, ...lines.map((l) => ctx.measureText(l).width + 12)));
  const height = 15 + lines.length * 9;
  const bx = Math.max(6, Math.min(viewW - width - 6, x - width / 2));
  const by = Math.max(8, y - height - 18);
  roundRect(ctx, bx + 1, by + 2, width, height, 5, 'rgba(4, 8, 16, 0.35)');
  roundRect(ctx, bx, by, width, height, 5, night ? '#171b2c' : '#fffaf0');
  ctx.fillStyle = night ? '#8fe3b0' : '#b06a3c';
  ctx.fillText(speaker, bx + 6, by + 9);
  ctx.fillStyle = night ? '#e8ecff' : '#3a3028';
  lines.forEach((line, i) => ctx.fillText(line, bx + 6, by + 19 + i * 9));
  ctx.beginPath();
  ctx.moveTo(x - 3, by + height);
  ctx.lineTo(x + 4, by + height);
  ctx.lineTo(x, by + height + 5);
  ctx.closePath();
  ctx.fillStyle = night ? '#171b2c' : '#fffaf0';
  ctx.fill();
  ctx.restore();
}

function drawFarSkyline(ctx, camera, viewW, viewH, time, night) {
  const baseY = Math.max(90, Math.min(170, 140 - camera.y * 0.08));
  const offset = -((camera.x * 0.16) % 180);
  const rand = mulberry32(0x51c17);
  ctx.save();
  for (let i = -1; i < Math.ceil(viewW / 180) + 2; i++) {
    const x = offset + i * 180;
    for (let j = 0; j < 4; j++) {
      const w = 22 + rand() * 34;
      const h = 45 + rand() * 96;
      const bx = x + j * 42 + rand() * 12;
      const by = baseY - h;
      rect(ctx, bx, by, w, h + 40, night ? '#101728' : '#8da1b8');
      ctx.globalAlpha = night ? 0.5 : 0.36;
      for (let wy = by + 8; wy < baseY - 10; wy += 9) {
        for (let wx = bx + 4; wx < bx + w - 4; wx += 7) {
          if (rand() > 0.55) rect(ctx, wx, wy, 2, 3, night ? '#ffe6a8' : '#d9e6ef');
        }
      }
      ctx.globalAlpha = 1;
    }
  }
  // sun / moon shimmer
  const t = time * 0.001;
  ctx.globalAlpha = night ? 0.6 : 0.45;
  ctx.fillStyle = night ? '#dfe8ff' : '#ffe9b8';
  ctx.beginPath();
  ctx.arc(viewW - 54 + Math.sin(t * 0.1) * 4, 38, night ? 11 : 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // haze
  const grad = ctx.createLinearGradient(0, baseY - 80, 0, baseY + 50);
  grad.addColorStop(0, 'rgba(255, 214, 168, 0)');
  grad.addColorStop(1, night ? 'rgba(18, 24, 44, 0.5)' : 'rgba(255, 224, 190, 0.5)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, baseY - 80, viewW, 140);
  ctx.restore();
}

function drawStreet(ctx, camera, viewW, viewH, time, night) {
  const camX = Math.round(camera.x);
  const camY = Math.round(camera.y);
  const topY = SIDEWALK_TOP.y - camY;
  const roadY = ROAD.y - camY;
  const bottomY = SIDEWALK_BOTTOM.y - camY;

  rect(ctx, 0, topY, viewW, SIDEWALK_TOP.h, night ? '#2b3040' : '#cfc6b5');
  rect(ctx, 0, roadY, viewW, ROAD.h, night ? '#141925' : '#3a3f4c');
  rect(ctx, 0, bottomY, viewW, SIDEWALK_BOTTOM.h, night ? '#2b3040' : '#cfc6b5');

  // curb shadow
  rect(ctx, 0, topY + SIDEWALK_TOP.h - 5, viewW, 5, night ? '#1b2030' : '#a99f8f');
  rect(ctx, 0, bottomY, viewW, 5, night ? '#1b2030' : '#a99f8f');

  // pavement tile lines
  ctx.globalAlpha = night ? 0.18 : 0.28;
  for (let x = -((camX * 1) % 32); x < viewW; x += 32) {
    rect(ctx, x, topY, 1, SIDEWALK_TOP.h, '#6e7280');
    rect(ctx, x, bottomY, 1, SIDEWALK_BOTTOM.h, '#6e7280');
  }
  for (let y = topY + 16; y < topY + SIDEWALK_TOP.h; y += 22) {
    rect(ctx, 0, y, viewW, 1, '#7c8290');
  }
  for (let y = bottomY + 16; y < bottomY + SIDEWALK_BOTTOM.h; y += 22) {
    rect(ctx, 0, y, viewW, 1, '#7c8290');
  }
  ctx.globalAlpha = 1;

  // road lane markings
  const dashY = roadY + ROAD.h / 2 - 2;
  for (let x = -((camX * 1) % 78); x < viewW; x += 78) {
    rect(ctx, x, dashY, 34, 4, night ? '#7a7458' : '#e7d9a7');
  }
  rect(ctx, 0, roadY + 8, viewW, 2, night ? '#262b39' : '#565d6c');
  rect(ctx, 0, roadY + ROAD.h - 10, viewW, 2, night ? '#262b39' : '#565d6c');

  // crosswalk
  const cwX = 540 - camX;
  for (let i = 0; i < 7; i++) {
    rect(ctx, cwX + i * 17, roadY + 8, 9, ROAD.h - 16, night ? '#cfc6b5' : '#f2ead8');
  }

  // puddle reflections
  ctx.globalAlpha = night ? 0.32 : 0.16;
  const t = time * 0.001;
  for (let i = 0; i < 6; i++) {
    const x = ((i * 213 + 40) - camX * 1) % (viewW + 80) - 40;
    const y = roadY + 24 + (i % 3) * 30;
    ctx.fillStyle = i % 2 ? '#8ecae6' : '#ffe6a8';
    ctx.beginPath();
    ctx.ellipse(x + Math.sin(t + i) * 3, y, 16 + (i % 3) * 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawCars(ctx, camera, viewW, cars, night) {
  const camX = Math.round(camera.x);
  for (const car of cars) {
    const x = car.x - camX;
    if (x < -90 || x > viewW + 90) continue;
    const y = car.y - camera.y;
    rect(ctx, x, y, 40, 13, night ? '#131722' : 'rgba(20,24,34,0.28)');
    rect(ctx, x + 2, y - 1, 36, 11, car.color);
    rect(ctx, x + 7, y - 6, 22, 7, car.color);
    rect(ctx, x + 9, y - 5, 8, 5, night ? '#9fd8e8' : '#cde9ef');
    rect(ctx, x + 20, y - 5, 7, 5, night ? '#9fd8e8' : '#cde9ef');
    rect(ctx, x + 5, y + 10, 7, 3, '#171a22');
    rect(ctx, x + 28, y + 10, 7, 3, '#171a22');
    rect(ctx, x + (car.dir > 0 ? 37 : 0), y + 2, 3, 4, night ? '#ffe6a8' : '#fff3c4');
    rect(ctx, x + (car.dir > 0 ? 0 : 39), y + 2, car.braking ? 2 : 1, 4, car.braking ? '#ff6a55' : '#d95f4e');
  }
}

function drawTower(ctx, tower, camera, time, night) {
  const info = OFFICE_COURSES[tower.courseId];
  const x = tower.x - camera.x;
  const y = tower.y - camera.y;
  const w = tower.w;
  const h = tower.h;
  if (x + w < -80 || x > 640 || y + h < -80 || y > 420) return;
  const accent = info.color;
  const rand = mulberry32(tower.x * 31 + tower.y);
  const t = time * 0.001;

  // shadow / glow
  ctx.globalAlpha = night ? 0.32 : 0.18;
  rect(ctx, x + 7, y + 12, w, h, '#070a12');
  ctx.globalAlpha = 1;

  // body
  rect(ctx, x, y, w, h, night ? '#1b2130' : '#39465c');
  rect(ctx, x + 6, y + 6, w - 12, h - 12, night ? '#232b3d' : '#44536c');
  rect(ctx, x + 12, y + 12, w - 24, h - 24, night ? '#1a2233' : '#354256');

  // vertical glass strips
  ctx.globalAlpha = 0.9;
  for (let sx = x + 18; sx < x + w - 16; sx += 18) {
    rect(ctx, sx, y + 18, 8, h - 48, night ? '#151c2b' : '#2e3a4d');
  }
  ctx.globalAlpha = 1;

  // windows
  for (let wy = y + 24; wy < y + h - 54; wy += 16) {
    for (let wx = x + 20; wx < x + w - 20; wx += 18) {
      const lit = night && rand() > 0.48;
      const warm = rand() > 0.35;
      rect(ctx, wx, wy, 9, 8, lit ? (warm ? '#f5d590' : '#a8d9e8') : (night ? '#101624' : '#52647d'));
      if (night && !lit) {
        ctx.globalAlpha = 0.18;
        rect(ctx, wx + 2, wy + 1, 3, 2, accent);
        ctx.globalAlpha = 1;
      }
    }
  }

  // crown / rooftop
  rect(ctx, x + 12, y + 8, w - 24, 6, accent);
  rect(ctx, x + 24, y - 8, w - 48, 16, night ? '#1a2231' : '#3e4b60');
  const blink = Math.sin(t * 2.2 + tower.x) > 0.4;
  rect(ctx, x + w / 2 - 2, y - 24, 4, 18, '#2c3444');
  if (blink) rect(ctx, x + w / 2 - 3, y - 28, 6, 6, '#ffcf6f');

  // logo panel
  const signW = Math.min(w - 44, 152);
  const signX = x + (w - signW) / 2;
  const signY = y + h * 0.34;
  roundRect(ctx, signX, signY, signW, 42, 4, night ? '#0f1420' : '#222b3a');
  rect(ctx, signX, signY + 39, signW, 3, accent);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 11px "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText(tower.sign, signX + signW / 2, signY + 17);
  ctx.fillStyle = night ? '#c9d4e8' : '#e7edf7';
  ctx.font = '7px "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText(`${info.company} · ${info.tagline.split(' · ')[0]}`, signX + signW / 2, signY + 30);
  ctx.restore();

  // entrance
  const doorW = 58;
  const doorX = tower.doorX - doorW / 2 - camera.x;
  rect(ctx, doorX - 5, y + h - 48, doorW + 10, 48, night ? '#10151f' : '#283140');
  rect(ctx, doorX, y + h - 42, doorW, 42, night ? '#e3c98c' : '#c8d9e8');
  rect(ctx, doorX + 4, y + h - 38, doorW - 8, 38, night ? '#f7e4ad' : '#9fc4d8');
  rect(ctx, doorX + doorW / 2 - 1, y + h - 40, 2, 40, '#39404f');
  rect(ctx, doorX + 10, y + h - 34, 16, 24, night ? '#1c2534' : '#6b899f');
  rect(ctx, doorX + doorW - 26, y + h - 34, 16, 24, night ? '#1c2534' : '#6b899f');
  rect(ctx, doorX - 12, y + h - 4, doorW + 24, 8, night ? '#171d29' : '#b7ad9c');
  rect(ctx, doorX - 18, y + h + 2, doorW + 36, 4, night ? '#0f1420' : '#9f9585');

  // course ribbon
  roundRect(ctx, x + 10, y + h - 66, 30, 16, 3, accent);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#101722';
  ctx.font = 'bold 8px "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText(tower.courseId === 'python' ? 'PY' : tower.courseId === 'web' ? 'WEB' : 'DATA', x + 25, y + h - 55);
  ctx.restore();

  // animated elevator marker
  const lightY = y + 30 + ((Math.sin(t * 1.4 + tower.x) + 1) / 2) * (h - 100);
  ctx.globalAlpha = 0.8;
  rect(ctx, x + w - 12, lightY, 4, 8, accent);
  ctx.globalAlpha = 1;

  // street-level accent lights
  if (night) {
    const grad = ctx.createRadialGradient(tower.doorX - camera.x, y + h, 10, tower.doorX - camera.x, y + h, 86);
    grad.addColorStop(0, `${accent}55`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(doorX - 90, y + h - 90, 180, 100);
  }
}

function drawFacade(ctx, facade, camera, time, night) {
  const x = facade.x - camera.x;
  const y = facade.y - camera.y;
  if (x + facade.w < -60 || x > 640) return;
  rect(ctx, x, y, facade.w, facade.h, facade.color);
  rect(ctx, x, y, facade.w, 7, night ? '#394052' : '#505a6e');
  for (let wy = y + 20; wy < y + facade.h - 20; wy += 22) {
    for (let wx = x + 12; wx < x + facade.w - 12; wx += 24) {
      const lit = night && ((wx + wy) % 3 === 0);
      rect(ctx, wx, wy, 13, 10, lit ? facade.lit : night ? '#151b27' : '#3a4354');
    }
  }
  // awning
  const awning = ['#b9574f', '#4d7f9e', '#7b6fb0', '#c08d4c'][facade.x % 4];
  rect(ctx, x + 10, y + facade.h - 40, facade.w - 20, 10, awning);
  for (let i = 0; i < 6; i++) {
    rect(ctx, x + 14 + i * ((facade.w - 28) / 6), y + facade.h - 30, 8, 4, night ? '#1a2030' : '#e7dfcd');
  }
  rect(ctx, x + 18, y + facade.h - 24, facade.w - 36, 24, night ? '#10151f' : '#2a3241');
}

function drawKiosk(ctx, camera, time, night) {
  const x = KIOSK.x - camera.x;
  const y = KIOSK.y - camera.y;
  rect(ctx, x + 5, y + 12, KIOSK.w, KIOSK.h - 12, night ? 'rgba(0,0,0,0.3)' : 'rgba(40,36,30,0.2)');
  rect(ctx, x, y, KIOSK.w, KIOSK.h - 12, night ? '#263043' : '#8a5a45');
  rect(ctx, x + 5, y + 5, KIOSK.w - 10, KIOSK.h - 32, night ? '#1a2231' : '#d7b98c');
  rect(ctx, x + 9, y + 10, KIOSK.w - 18, 22, night ? '#101720' : '#2f3b4d');
  ctx.save();
  ctx.fillStyle = night ? '#f0c987' : '#ffe7ad';
  ctx.font = 'bold 9px "Microsoft YaHei", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('今日任务', x + KIOSK.w / 2, y + 25);
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    rect(ctx, x + 12 + i * 27, y + 38, 20, 12, night ? '#dfe8ff' : '#fdf8e8');
    rect(ctx, x + 16 + i * 27, y + 42, 12, 1, '#8a7b63');
    rect(ctx, x + 16 + i * 27, y + 46, 8, 1, '#8a7b63');
  }
  rect(ctx, x + 8, y + KIOSK.h - 12, KIOSK.w - 16, 12, night ? '#171d29' : '#6b4a38');
  if (night) {
    rect(ctx, x + 14, y - 2, 6, 4, '#ffe6a8');
    rect(ctx, x + KIOSK.w - 20, y - 2, 6, 4, '#ffe6a8');
  }
}

function drawCart(ctx, camera, time, night) {
  const x = CART.x - camera.x;
  const y = CART.y - camera.y;
  const t = time * 0.001;
  rect(ctx, x, y + 8, CART.w, CART.h - 8, night ? '#2b3040' : '#7a5b42');
  rect(ctx, x + 6, y, CART.w - 12, 34, night ? '#3a3340' : '#a87651');
  rect(ctx, x + 10, y + 4, CART.w - 20, 8, ['#d96b5f', '#8ecae6', '#f0c987'][Math.floor(t / 2) % 3]);
  for (let i = 0; i < 3; i++) {
    rect(ctx, x + 14 + i * 28, y + 16, 20, 12, '#f2e6cf');
    rect(ctx, x + 17 + i * 28, y + 19, 14, 2, '#8a5a45');
  }
  rect(ctx, x + 12, y + CART.h - 10, 12, 10, '#1b1e27');
  rect(ctx, x + CART.w - 26, y + CART.h - 10, 12, 10, '#1b1e27');
  if (night) {
    const wobble = Math.sin(t * 3) * 1;
    rect(ctx, x + CART.w / 2 - 1, y - 2 + wobble, 2, 4, '#ffe6a8');
  }
}

function drawHome(ctx, camera, time, night) {
  const x = HOME.x - camera.x;
  const y = HOME.y - camera.y;
  rect(ctx, x, y + 18, HOME.w, HOME.h - 8, night ? '#23283a' : '#5a4b45');
  rect(ctx, x + 6, y, HOME.w - 12, 30, night ? '#30354a' : '#6d5b52');
  rect(ctx, x + 12, y + 26, 34, 22, night ? '#f0c987' : '#9fd8e8');
  rect(ctx, x + 60, y + 26, 34, 22, night ? '#f0c987' : '#9fd8e8');
  rect(ctx, x + 112, y + 26, 34, 22, night ? '#f0c987' : '#9fd8e8');
  rect(ctx, x + 60, y + 56, 44, 26, night ? '#161b26' : '#2f2928');
  rect(ctx, x + 66, y + 62, 32, 20, night ? '#e6c987' : '#c9a977');
  rect(ctx, x + 96, y + 72, 3, 3, '#ffd36f');
  ctx.save();
  ctx.fillStyle = night ? '#c9d4e8' : '#f6efe2';
  ctx.font = 'bold 9px "Microsoft YaHei", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('我的公寓', x + HOME.w / 2, y + 15);
  ctx.restore();
  // houseplant
  rect(ctx, x + HOME.w - 22, y + 56, 10, 12, '#3c6b4a');
  rect(ctx, x + HOME.w - 25, y + 50, 4, 10, '#67a66e');
  rect(ctx, x + HOME.w - 18, y + 48, 4, 12, '#67a66e');
}

function drawBusStop(ctx, camera, time, night) {
  const x = BUS_STOP.x - camera.x;
  const y = BUS_STOP.y - camera.y;
  rect(ctx, x, y, BUS_STOP.w, 4, night ? '#3a4354' : '#5f6b7d');
  rect(ctx, x + 6, y + 4, 4, BUS_STOP.h - 4, '#4b5669');
  rect(ctx, x + BUS_STOP.w - 10, y + 4, 4, BUS_STOP.h - 4, '#4b5669');
  rect(ctx, x + 10, y + 8, BUS_STOP.w - 20, 30, night ? 'rgba(142,202,230,0.22)' : 'rgba(220,240,250,0.5)');
  rect(ctx, x + 14, y + 12, BUS_STOP.w - 28, 22, night ? '#1a2231' : '#e8f2f7');
  ctx.save();
  ctx.fillStyle = night ? '#8ecae6' : '#42657a';
  ctx.font = 'bold 9px "Microsoft YaHei", system-ui, sans-serif';
  ctx.fillText('星港北站', x + 20, y + 26);
  ctx.restore();
  rect(ctx, x + 12, y + 42, BUS_STOP.w - 24, 3, '#78849a');
}

function drawProp(ctx, prop, camera, time, night, lightPhase) {
  const x = prop.x - camera.x;
  const y = prop.y - camera.y;
  if (prop.type === 'bench') {
    rect(ctx, x, y, prop.w, 7, night ? '#5a4a3c' : '#a8794f');
    rect(ctx, x + 3, y + 7, 4, 8, '#3b3129');
    rect(ctx, x + prop.w - 7, y + 7, 4, 8, '#3b3129');
    rect(ctx, x, y - 6, prop.w, 4, night ? '#4b3d32' : '#8f6543');
  } else if (prop.type === 'lamp') {
    rect(ctx, x + 4, y - 54, 3, 54, '#2d3340');
    rect(ctx, x + 1, y - 58, 9, 5, '#3a4252');
    if (night) {
      const glow = ctx.createRadialGradient(x + 5, y - 58, 2, x + 5, y - 58, 34);
      glow.addColorStop(0, 'rgba(255, 219, 145, 0.38)');
      glow.addColorStop(1, 'rgba(255, 219, 145, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 30, y - 90, 70, 70);
      rect(ctx, x + 3, y - 60, 5, 3, '#ffe6a8');
    }
  } else if (prop.type === 'tree') {
    rect(ctx, x + 6, y - 2, 5, 18, '#4c3a2c');
    ctx.fillStyle = night ? '#245440' : '#5c9c62';
    ctx.beginPath();
    ctx.arc(x + 9, y - 14, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = night ? '#2f6b50' : '#7fbf82';
    ctx.beginPath();
    ctx.arc(x + 3, y - 20, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (prop.type === 'hydrant') {
    rect(ctx, x + 2, y - 8, 6, 12, '#b95045');
    rect(ctx, x, y - 5, 10, 3, '#d96b5f');
  } else if (prop.type === 'traffic') {
    rect(ctx, x + 4, y - 32, 4, 32, '#2f3542');
    rect(ctx, x, y - 48, 13, 18, '#2a2f3a');
    const red = lightPhase === 'red';
    const yellow = lightPhase === 'yellow';
    const green = lightPhase === 'green';
    rect(ctx, x + 3, y - 45, 7, 3, red ? '#ff7866' : '#38404b');
    rect(ctx, x + 3, y - 40, 7, 3, yellow ? '#ffd166' : '#38404b');
    rect(ctx, x + 3, y - 35, 7, 3, green ? '#6fdc8c' : '#38404b');
    if (night && (red || yellow || green)) {
      const lampY = y - (red ? 43.5 : yellow ? 38.5 : 33.5);
      const glow = ctx.createRadialGradient(x + 6.5, lampY, 1, x + 6.5, lampY, 22);
      glow.addColorStop(0, red ? 'rgba(255, 120, 102, 0.4)' : yellow ? 'rgba(255, 209, 102, 0.4)' : 'rgba(111, 220, 140, 0.4)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - 18, lampY - 22, 50, 50);
    }
  }
}

export function createCity() {
  const rand = mulberry32(0x9e3779b9);
  const npcs = NPC_SEEDS.map((npc, index) => ({
    ...npc,
    id: `city-npc-${index}`,
    y: npc.lane === 'top' ? 342 + (index % 3) * 19 : 532 + (index % 3) * 18,
    dir: index % 2 ? 'left' : 'right',
    frame: 0,
    walk: 0,
    pause: rand() * 2,
    palette: paletteForName(npc.name),
    bubble: null,
    bubbleTimer: 0,
    speakerIndex: 0
  }));

  let talkTimer = 8;
  let conversation = null;
  let convoTimer = 0;
  let convoIndex = 0;
  let lastChatterRequest = 0;

  const cars = CAR_SEEDS.map((seed, index) => ({
    ...seed,
    x: seed.dir > 0 ? -140 - index * 240 : CITY_W + 120 + index * 210,
    braking: false
  }));
  let lightPhase = 'green';
  let lightTimer = TRAFFIC_TIMING.green;

  const towers = TOWER_LAYOUT.map((tower) => ({
    ...tower,
    id: `tower-${tower.courseId}`,
    info: OFFICE_COURSES[tower.courseId]
  }));

  const solids = [
    ...towers.map((t) => ({ x: t.x, y: t.y, w: t.w, h: t.h })),
    ...BOTTOM_FACADES.map((f) => ({ x: f.x, y: f.y, w: f.w, h: f.h })),
    { x: KIOSK.x, y: KIOSK.y, w: KIOSK.w, h: KIOSK.h },
    { x: CART.x, y: CART.y, w: CART.w, h: CART.h },
    { x: HOME.x, y: HOME.y, w: HOME.w, h: HOME.h },
    { x: BUS_STOP.x, y: BUS_STOP.y, w: BUS_STOP.w, h: BUS_STOP.h },
    ...PROPS.filter((p) => p.type !== 'traffic').map((p) => ({
      x: p.x - (p.type === 'tree' ? 2 : 2),
      y: p.type === 'lamp' ? p.y - 18 : p.y - 6,
      w: p.type === 'bench' ? p.w : p.type === 'tree' ? 22 : 10,
      h: p.type === 'bench' ? 16 : 12
    }))
  ];
  if (!solids.length) solids.push({ x: -100, y: -100, w: 1, h: 1 });

  const world = {
    width: CITY_W,
    height: CITY_H,
    entryFromHome: { x: HOME.doorX, y: 600, dir: 'down' },
    defaultSpawn: { x: 590, y: 366, dir: 'down' },
    boatDock: { x: 590, y: 500, dir: 'down' },
    dockRect: { x: 0, y: 0, w: 0, h: 0 },
    northGatePassage: {
      north: { x: 560, y: 340, dir: 'up' },
      south: { x: 560, y: 560, dir: 'down' }
    },

    canStand(x, y) {
      if (x < 54 || x > CITY_W - 54 || y < 322 || y > 612) return false;
      const box = { x0: x - 5, x1: x + 5, y0: y - 8, y1: y };
      for (const s of solids) {
        if (box.x1 > s.x && box.x0 < s.x + s.w && box.y1 > s.y && box.y0 < s.y + s.h) return false;
      }
      return true;
    },

    canBoat() {
      return false;
    },

    isLake() {
      return false;
    },

    spawn(save) {
      const p = save?.player;
      if (p && this.canStand(p.x, p.y)) {
        return { x: p.x, y: p.y, dir: p.dir || 'down' };
      }
      return { ...this.defaultSpawn };
    },

    towerSpot(courseId) {
      const tower = towers.find((t) => t.courseId === courseId) || towers[0];
      return { x: tower.doorX, y: 332, dir: 'up' };
    },

    zoneAt(x, y) {
      if (y < 402) {
        if (x < 330) return '代码大道 · 蟒蛇云端';
        if (x < 730) return '代码大道 · 起源网络';
        return '代码大道 · 北岭数据';
      }
      if (y < 522) return x > 520 && x < 650 ? '斑马线 · 星港北路' : '星港北路 · 车流';
      if (x < 310) return '公寓街角';
      if (x < 540) return '任务报亭';
      if (x < 760) return '咖啡推车';
      return '星港北站';
    },

    labels(save) {
      return towers.map((tower) => {
        const title = save?.office?.[tower.courseId]?.hired
          ? officeTitle(save, tower.courseId)
          : 'E 投递简历';
        return {
          id: tower.id,
          x: tower.doorX,
          y: 296,
          text: tower.info.tower,
          sub: `${tower.info.company} · ${title}`,
          locked: false
        };
      }).concat([
        {
          id: 'home-label',
          x: HOME.doorX,
          y: 606,
          text: '我的公寓',
          sub: 'E 回家 · H 快捷',
          locked: false
        },
        {
          id: 'kiosk-label',
          x: KIOSK.x + KIOSK.w / 2,
          y: KIOSK.y - 8,
          text: '任务报亭',
          sub: 'E 看看今天',
          locked: false
        }
      ]);
    },

    interactables(save) {
      const list = towers.map((tower) => ({
        id: tower.id,
        type: 'tower',
        courseId: tower.courseId,
        x: tower.doorX,
        y: 334,
        r: 54,
        label: save?.office?.[tower.courseId]?.hired
          ? `进入${tower.info.tower}上班`
          : `走进${tower.info.tower} · 面试`,
        fx: '聘',
        fxTone: 'quest'
      }));
      list.push({
        id: 'home', type: 'home', x: HOME.doorX, y: 605, r: 54, label: '回公寓休息', fx: '家', fxTone: 'warm'
      });
      list.push({
        id: 'task-kiosk', type: 'tasks', x: KIOSK.x + KIOSK.w / 2, y: KIOSK.y - 4, r: 48,
        label: '看看今天的任务', fx: '!', fxTone: 'quest'
      });
      list.push({
        id: 'coffee-cart', type: 'flavor', x: CART.x + CART.w / 2, y: CART.y - 2, r: 46,
        label: '买一杯热咖啡', flavor: '咖啡推车的老板递来一杯热拿铁：“上班前先暖手，代码也会好写一点。”', fx: '☕', fxTone: 'warm'
      });
      list.push({
        id: 'bus-stop', type: 'flavor', x: BUS_STOP.x + BUS_STOP.w / 2, y: BUS_STOP.y + 20, r: 46,
        label: '在站牌下等一会儿', flavor: '站牌上写着：下一班去往「北岭观星台」的车，晚点十七分钟。', fx: '站', fxTone: 'muted'
      });
      const benchLine = '你坐在长椅上，看着西装和外卖箱在斑马线两边来回穿梭。';
      for (const [index, bench] of PROPS.filter((p) => p.type === 'bench').entries()) {
        const seatY = bench.y + 1;
        const standY = bench.y + 18;
        list.push({
          id: `city-bench-${index}`,
          type: 'sit',
          x: bench.x + bench.w / 2,
          y: bench.y - 6,
          r: 46,
          label: '在长椅上坐下',
          flavor: index ? '长椅旁的行道树把灯光筛成一小片一小片，落在脚边。' : benchLine,
          fx: '憩',
          fxTone: 'nature',
          seats: [
            { x: bench.x + 14, y: seatY, dir: 'down', text: benchLine, stand: { x: bench.x + 14, y: standY } },
            { x: bench.x + bench.w - 14, y: seatY, dir: 'down', text: benchLine, stand: { x: bench.x + bench.w - 14, y: standY } }
          ]
        });
      }
      return list;
    },

    nearestInteractable(player, save) {
      const list = this.interactables(save);
      let best = null;
      let bestDist = Infinity;
      for (const it of list) {
        const d = Math.hypot(player.x - it.x, player.y - it.y);
        if (d <= it.r && d < bestDist) {
          best = it;
          bestDist = d;
        }
      }
      return best;
    },

    update(dt, state = {}) {
      const reduce = Boolean(state.reduceMotion);
      const chatter = state.getChatter?.('street');
      const talkSpeed = reduce ? 0.4 : 1;

      lightTimer -= dt;
      if (lightTimer <= 0) {
        if (lightPhase === 'green') {
          lightPhase = 'yellow';
          lightTimer = TRAFFIC_TIMING.yellow;
        } else if (lightPhase === 'yellow') {
          lightPhase = 'red';
          lightTimer = TRAFFIC_TIMING.red;
        } else {
          lightPhase = 'green';
          lightTimer = TRAFFIC_TIMING.green;
        }
      }
      for (const car of cars) {
        const step = car.speed * dt;
        const waiting = lightPhase !== 'green' && (car.dir > 0
          ? car.x + 40 <= CROSSWALK.start - 4
          : car.x >= CROSSWALK.end + 2);
        if (waiting) {
          car.x = car.dir > 0
            ? Math.min(car.x + step, CROSSWALK.start - 44)
            : Math.max(car.x - step, CROSSWALK.end + 2);
        } else {
          car.x += car.dir * step;
        }
        car.braking = waiting;
        if (car.dir > 0 && car.x > CITY_W + 140) car.x = -140;
        if (car.dir < 0 && car.x < -140) car.x = CITY_W + 80;
      }

      talkTimer -= dt;
      if (talkTimer <= 0 && !conversation) {
        if (chatter?.lines?.length) {
          startConversation(chatter, state.player);
          talkTimer = 999;
        } else if (Date.now() - lastChatterRequest > 18000) {
          lastChatterRequest = Date.now();
          state.ensureChatter?.('street');
          talkTimer = 8;
        }
      }

      for (const npc of npcs) {
        if (conversation) {
          const role = conversation.roles.get(npc.id);
          if (role) {
            npc.moving = false;
            continue;
          }
        }
        if (npc.pause > 0) {
          npc.pause -= dt;
          npc.moving = false;
          continue;
        }
        const speed = npc.speed * (reduce ? 0.7 : 1);
        npc.x += (npc.dir === 'right' ? 1 : -1) * speed * dt;
        const laneMin = 90;
        const laneMax = CITY_W - 110;
        if (npc.x < laneMin || npc.x > laneMax) {
          npc.dir = npc.dir === 'right' ? 'left' : 'right';
          npc.x = Math.max(laneMin, Math.min(laneMax, npc.x));
        }
        npc.moving = true;
        npc.walk += dt * 6.4;
        npc.frame = Math.floor(npc.walk) % 4;
        if (Math.random() < dt * 0.08) {
          npc.pause = 1.4 + Math.random() * 2.8;
        }
      }

      if (conversation) {
        convoTimer -= dt * talkSpeed;
        if (convoTimer <= 0) {
          convoIndex += 1;
          if (convoIndex >= conversation.lines.length) {
            conversation = null;
            convoIndex = 0;
            talkTimer = 15 + Math.random() * 12;
          } else {
            convoTimer = 4.2;
          }
        }
      }
    },

    draw(ctx, camera, time, state) {
      const { player, save, viewW, viewH, extraActors = [] } = state;
      const day = state.day || { darkness: 0, night: false };
      const night = Boolean(day.night || day.darkness > 0.45);
      const camX = Math.round(camera.x);
      const camY = Math.round(camera.y);

      // sky + distant skyline
      const sky = ctx.createLinearGradient(0, 0, 0, viewH);
      if (night) {
        sky.addColorStop(0, '#0a1020');
        sky.addColorStop(0.55, '#1b2440');
        sky.addColorStop(1, '#5b4b57');
      } else {
        sky.addColorStop(0, '#8fc8dd');
        sky.addColorStop(0.55, '#e8c9a8');
        sky.addColorStop(1, '#f6e3c8');
      }
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, viewW, viewH);
      drawFarSkyline(ctx, camera, viewW, viewH, time, night);
      drawStreet(ctx, camera, viewW, viewH, time, night);
      drawCars(ctx, camera, viewW, cars, night);

      const renderables = [];
      const drawInWorld = (fn) => () => {
        ctx.save();
        try {
          ctx.translate(-camX, -camY);
          fn();
        } finally {
          ctx.restore();
        }
      };
      for (const tower of towers) {
        if (tower.x + tower.w < camX - 120 || tower.x > camX + viewW + 120) continue;
        renderables.push({ sortY: tower.y + tower.h, draw: () => drawTower(ctx, tower, camera, time, night) });
      }
      // distant / side silhouettes
      renderables.push({
        sortY: 320,
        draw: drawInWorld(() => {
          rect(ctx, 330, 96, 74, 214, night ? '#1a2030' : '#687a92');
          rect(ctx, 342, 128, 50, 182, night ? '#20293b' : '#7b8ca3');
          for (let wy = 140; wy < 300; wy += 16) {
            for (let wx = 350; wx < 386; wx += 12) {
              if ((wx + wy) % 3) rect(ctx, wx, wy, 5, 6, night ? '#f0c987' : '#a7b7c7');
            }
          }
        })
      });
      renderables.push({
        sortY: 320,
        draw: drawInWorld(() => {
          rect(ctx, 724, 72, 62, 238, night ? '#1c2234' : '#70829a');
          for (let wy = 92; wy < 298; wy += 19) {
            for (let wx = 734; wx < 776; wx += 13) {
              if ((wx + wy) % 4) rect(ctx, wx, wy, 6, 6, night ? '#8ecae6' : '#a9bac9');
            }
          }
        })
      });
      for (const facade of BOTTOM_FACADES) {
        renderables.push({ sortY: facade.y + facade.h, draw: () => drawFacade(ctx, facade, camera, time, night) });
      }
      renderables.push({ sortY: HOME.y + HOME.h, draw: () => drawHome(ctx, camera, time, night) });
      renderables.push({ sortY: KIOSK.y + KIOSK.h, draw: () => drawKiosk(ctx, camera, time, night) });
      renderables.push({ sortY: CART.y + CART.h, draw: () => drawCart(ctx, camera, time, night) });
      renderables.push({ sortY: BUS_STOP.y + BUS_STOP.h, draw: () => drawBusStop(ctx, camera, time, night) });
      for (const prop of PROPS) {
        if (prop.x < camX - 80 || prop.x > camX + viewW + 80) continue;
        renderables.push({ sortY: prop.y, draw: () => drawProp(ctx, prop, camera, time, night, lightPhase) });
      }
      for (const npc of npcs) {
        renderables.push({
          sortY: npc.y,
          draw: () => drawPlayer(ctx, npc.x - camera.x, npc.y - camera.y, npc.dir, npc.frame, npc.palette, npc.moving)
        });
      }
      if (player) {
        renderables.push({ sortY: player.y, draw: () => state.drawPlayer?.(ctx, camera) });
      }
      for (const actor of extraActors) {
        renderables.push({ sortY: actor.y, draw: () => state.drawPeer?.(ctx, actor, camera) });
      }
      renderables.sort((a, b) => a.sortY - b.sortY);
      for (const item of renderables) item.draw();

      // speech bubbles for street stories
      if (conversation) {
        const line = conversation.lines[convoIndex];
        const npcId = conversation.roles.getSpeaker(convoIndex);
        const npc = npcs.find((n) => n.id === npcId);
        if (npc && line) {
          drawBubble(ctx, npc.x - camera.x, npc.y - camera.y - 22, line.speaker || npc.name, line.text, night, viewW);
        }
      }

      // night ambience
      if (night) {
        ctx.globalAlpha = 0.16;
        for (let i = 0; i < 12; i++) {
          const x = ((i * 137 + time * 0.012) % (viewW + 40)) - 20;
          const y = 30 + ((i * 53) % 110);
          rect(ctx, x, y, 2, 2, '#ffe9b8');
        }
        ctx.globalAlpha = 1;
      }
    }
  };

  function startConversation(chatter, player) {
    const lines = (chatter.lines || []).slice(0, 5);
    if (!lines.length) return;
    // pick a same-lane pair near the player so the story stays on screen
    const focusX = player?.x ?? CITY_W / 2;
    let a = null;
    let b = null;
    let best = Infinity;
    for (let i = 0; i < npcs.length; i++) {
      for (let j = i + 1; j < npcs.length; j++) {
        if (npcs[i].lane !== npcs[j].lane) continue;
        const d = Math.abs(npcs[i].x - npcs[j].x);
        const near = Math.abs((npcs[i].x + npcs[j].x) / 2 - focusX);
        const score = d + near * 0.6;
        if (score < best) {
          best = score;
          a = npcs[i];
          b = npcs[j];
        }
      }
    }
    a ||= npcs[0];
    b ||= npcs[1] || npcs[0];
    const roles = new Map();
    const speakers = [a, b];
    roles.set(a.id, 'a');
    if (b.id !== a.id) roles.set(b.id, 'b');
    if (b.id !== a.id) {
      a.dir = b.x >= a.x ? 'right' : 'left';
      b.dir = a.x >= b.x ? 'right' : 'left';
      a.moving = false;
      b.moving = false;
    }
    conversation = {
      title: chatter.title,
      lines,
      roles,
      getSpeaker(index) {
        return speakers[Math.min(speakers.length - 1, index % 2)].id;
      }
    };
    convoIndex = 0;
    convoTimer = 4.2;
    talkTimer = 999;
  }

  return world;
}

export function renderCityMap(canvas, save) {
  if (!canvas) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rectW = canvas.clientWidth || 520;
  const rectH = canvas.clientHeight || 260;
  canvas.width = Math.round(rectW * dpr);
  canvas.height = Math.round(rectH * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const pad = 16;
  const sx = (rectW - pad * 2) / CITY_W;
  const sy = (rectH - pad * 2) / CITY_H;
  const s = Math.min(sx, sy);
  const ox = pad + (rectW - pad * 2 - CITY_W * s) / 2;
  const oy = pad + (rectH - pad * 2 - CITY_H * s) / 2;

  rect(ctx, 0, 0, rectW, rectH, '#0e1420');
  rect(ctx, ox, oy, CITY_W * s, CITY_H * s, '#1b2432');
  rect(ctx, ox, oy + 310 * s, CITY_W * s, 92 * s, '#3b4252');
  rect(ctx, ox, oy + 402 * s, CITY_W * s, 120 * s, '#20232c');
  rect(ctx, ox, oy + 522 * s, CITY_W * s, 88 * s, '#3b4252');
  for (let i = 0; i < 7; i++) {
    rect(ctx, ox + (540 + i * 17) * s, oy + 410 * s, 9 * s, 104 * s, '#d8d0bd');
  }
  for (const tower of TOWER_LAYOUT) {
    const info = OFFICE_COURSES[tower.courseId];
    rect(ctx, ox + tower.x * s, oy + tower.y * s, tower.w * s, tower.h * s, '#2c3648');
    rect(ctx, ox + tower.x * s, oy + (tower.y + 8) * s, tower.w * s, 6 * s, info.color);
    ctx.save();
    ctx.fillStyle = info.color;
    ctx.font = `${Math.max(7, 10 * s)}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(tower.sign, ox + (tower.x + tower.w / 2) * s, oy + (tower.y + tower.h * 0.5) * s);
    ctx.restore();
  }
  rect(ctx, ox + HOME.x * s, oy + HOME.y * s, HOME.w * s, HOME.h * s, '#57463e');
  rect(ctx, ox + KIOSK.x * s, oy + KIOSK.y * s, KIOSK.w * s, KIOSK.h * s, '#8a5a45');
  rect(ctx, ox + CART.x * s, oy + CART.y * s, CART.w * s, CART.h * s, '#a87651');
  const p = save?.player;
  if (p) {
    const px = ox + Math.max(0, Math.min(CITY_W, p.x)) * s;
    const py = oy + Math.max(0, Math.min(CITY_H, p.y)) * s;
    rect(ctx, px - 3, py - 3, 6, 6, '#ffd166');
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.save();
  ctx.fillStyle = '#8f9db0';
  ctx.font = '8px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('代码大道', ox + 8, oy + (SIDEWALK_TOP.y + 12) * s);
  ctx.fillText('星港北路', ox + 8, oy + (ROAD.y + 16) * s);
  ctx.restore();
}
