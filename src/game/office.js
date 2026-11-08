import { drawPlayer, paletteForName } from './sprites.js';
import {
  courseOffice, getOfficeState, officeRank, officeTitle, deskSpotFor
} from '../data/office.js';

export const OFFICE_W = 640;
export const OFFICE_H = 640;

const BOSS_DESK = { x: 514, y: 168, w: 86, h: 30 };
const PRIVATE_DESK = { x: 72, y: 190, w: 84, h: 28 };
const MEETING_TABLE = { x: 82, y: 520, w: 116, h: 46 };
const SOFA = { x: 446, y: 520, w: 104, h: 30 };
const COFFEE_TABLE = { x: 478, y: 566, w: 44, h: 20 };
const PRINTER = { x: 280, y: 516, w: 34, h: 26 };
const COOLER = { x: 348, y: 540, w: 20, h: 34 };

const DESK_SPOTS = {
  intern: { x: 250, y: 384, deskX: 214, deskY: 348 },
  window: { x: 338, y: 312, deskX: 310, deskY: 282 },
  lead: { x: 240, y: 300, deskX: 216, deskY: 266 },
  director: { x: 120, y: 236, deskX: 86, deskY: 206 }
};

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

function roundRect(ctx, x, y, w, h, r, fill, stroke = '') {
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
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function wrap(ctx, text, maxWidth) {
  const out = [];
  let line = '';
  for (const ch of String(text || '')) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      out.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out.slice(0, 4);
}

function drawBubble(ctx, x, y, speaker, text, accent) {
  ctx.save();
  ctx.font = '8px "Microsoft YaHei", system-ui, sans-serif';
  const lines = wrap(ctx, text, 124);
  const width = Math.min(138, Math.max(50, ctx.measureText(speaker).width + 18, ...lines.map((l) => ctx.measureText(l).width + 12)));
  const height = 15 + lines.length * 9;
  const bx = Math.max(8, Math.min(474 - width, x - width / 2));
  const by = Math.max(8, y - height - 24);
  roundRect(ctx, bx + 1, by + 2, width, height, 5, 'rgba(4, 8, 16, 0.36)');
  roundRect(ctx, bx, by, width, height, 5, '#fffaf0');
  ctx.fillStyle = accent || '#9b6137';
  ctx.fillText(speaker, bx + 6, by + 9);
  ctx.fillStyle = '#3a3028';
  lines.forEach((line, i) => ctx.fillText(line, bx + 6, by + 19 + i * 9));
  ctx.beginPath();
  ctx.moveTo(x - 3, by + height);
  ctx.lineTo(x + 4, by + height);
  ctx.lineTo(x, by + height + 5);
  ctx.closePath();
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  ctx.restore();
}

function drawWindow(ctx, camera, time, viewH, day, company) {
  const x = 48 - camera.x;
  const y = 8 - camera.y;
  const w = 544;
  const h = 118;
  ctx.save();
  // frame shadow
  roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 5, '#111722');
  roundRect(ctx, x, y, w, h, 3, '#26364c');
  // sky visible through the glass
  ctx.beginPath();
  ctx.rect(x + 5, y + 5, w - 10, h - 10);
  ctx.clip();
  const night = Boolean(day?.night || day?.darkness > 0.45);
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  if (night) {
    grad.addColorStop(0, '#0b1224');
    grad.addColorStop(0.5, '#243153');
    grad.addColorStop(1, '#4b4b67');
  } else {
    grad.addColorStop(0, '#8dcbe0');
    grad.addColorStop(0.6, '#e6d4b4');
    grad.addColorStop(1, '#f6e5c9');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(x + 5, y + 5, w - 10, h - 10);

  const t = time * 0.001;
  // clouds
  ctx.globalAlpha = night ? 0.18 : 0.5;
  for (let i = 0; i < 5; i++) {
    const cx = x + 20 + ((i * 139 + t * 6) % (w - 30));
    const cy = y + 18 + (i % 3) * 24;
    ctx.fillStyle = night ? '#a9b8dc' : '#fff8ec';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22 + (i % 2) * 10, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // skyline
  const rand = mulberry32(0x0ff1ce);
  for (let i = 0; i < 18; i++) {
    const bx = x + (i * 34) % (w - 20);
    const bw = 14 + rand() * 20;
    const bh = 28 + rand() * 64;
    const by = y + h - 8 - bh;
    rect(ctx, bx, by, bw, bh, night ? '#182238' : '#7d94ac');
    for (let wy = by + 5; wy < y + h - 12; wy += 8) {
      for (let wx = bx + 3; wx < bx + bw - 3; wx += 6) {
        if (rand() > 0.5) {
          rect(ctx, wx, wy, 2, 3, night ? '#f6d899' : '#dbe9f2');
        }
      }
    }
    if (i === 5 || i === 12) {
      rect(ctx, bx + bw / 2 - 1, by - 9, 2, 9, night ? '#39445e' : '#5d6e85');
      if (Math.sin(t * 2 + i) > 0) rect(ctx, bx + bw / 2 - 2, by - 11, 4, 3, '#ffcf6f');
    }
  }
  // reflection streaks
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i % 2 ? company.color : '#ffffff';
    ctx.fillRect(x + 30 + i * 130, y + 5, 18, h - 10);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // mullions
  rect(ctx, x + w / 2 - 2, y, 4, h, '#1b2838');
  rect(ctx, x + w / 3 - 1, y, 2, h, '#1b2838');
  rect(ctx, x + (w * 2) / 3 - 1, y, 2, h, '#1b2838');
  rect(ctx, x, y + h / 2 - 1, w, 2, '#1b2838');
  rect(ctx, x, y + h - 5, w, 5, '#1a2434');
  // warm interior light spill
  const spill = ctx.createLinearGradient(0, y + h, 0, y + h + 80);
  spill.addColorStop(0, 'rgba(255, 220, 160, 0.14)');
  spill.addColorStop(1, 'rgba(255, 220, 160, 0)');
  ctx.fillStyle = spill;
  ctx.fillRect(x - 10, y + h, w + 20, 90);
}

function drawWall(ctx, camera, company, time) {
  const x = -camera.x;
  const y = 0 - camera.y;
  rect(ctx, x, y, OFFICE_W, 140, '#242b3a');
  rect(ctx, x, y + 132, OFFICE_W, 8, '#161d29');
  // wall panels
  for (let px = 0; px < OFFICE_W; px += 64) {
    rect(ctx, x + px + 4, y + 4, 56, 126, '#2a3244');
    rect(ctx, x + px + 4, y + 4, 56, 2, '#323b50');
  }
  // company plaque
  const plaqueW = 160;
  const px = 640 - plaqueW - 22 - camera.x;
  const py = 114 - camera.y;
  roundRect(ctx, px, py, plaqueW, 18, 3, '#161d29');
  rect(ctx, px, py + 15, plaqueW, 3, company.color);
  ctx.save();
  ctx.font = 'bold 8px "Microsoft YaHei", system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillStyle = company.color;
  ctx.fillText(company.company, px + plaqueW - 8, py + 11);
  ctx.restore();
  // clock
  const cx = 70 - camera.x;
  const cy = 124 - camera.y;
  ctx.fillStyle = '#151b26';
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e7dec8';
  ctx.lineWidth = 1;
  ctx.stroke();
  const angle = (time * 0.0004) % (Math.PI * 2);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * 6, cy + Math.sin(angle) * 6);
  ctx.stroke();
}

function drawFloor(ctx, camera) {
  const x = -camera.x;
  const y = 140 - camera.y;
  rect(ctx, x, y, OFFICE_W, OFFICE_H - 140, '#3a3f4c');
  // carpet
  rect(ctx, x + 20, y + 8, OFFICE_W - 40, OFFICE_H - 160, '#4a4f5c');
  rect(ctx, x + 20, y + 8, OFFICE_W - 40, 3, '#575d6c');
  const camX = Math.round(camera.x);
  const camY = Math.round(camera.y);
  ctx.globalAlpha = 0.12;
  for (let gx = -((camX + 20) % 48); gx < 640; gx += 48) {
    rect(ctx, gx, y + 8, 1, OFFICE_H - 160, '#20242e');
  }
  for (let gy = -((camY + 140) % 48); gy < 640 - 140; gy += 48) {
    rect(ctx, 20 - camX, gy, 600, 1, '#20242e');
  }
  ctx.globalAlpha = 1;
  // walkway runner
  rect(ctx, 300 - camX, y + 140, 44, 330, '#6b5b4a');
  rect(ctx, 300 - camX, y + 140, 44, 3, '#8a7562');
  rect(ctx, 300 - camX, y + 140, 3, 330, '#8a7562');
  rect(ctx, 341 - camX, y + 140, 3, 330, '#8a7562');
}

function drawGlassRoom(ctx, camera, room, color) {
  const x = room.x - camera.x;
  const y = room.y - camera.y;
  rect(ctx, x, y, room.w, room.h, 'rgba(120, 180, 210, 0.10)');
  rect(ctx, x, y, room.w, 5, 'rgba(170, 214, 232, 0.5)');
  rect(ctx, x, y, 5, room.h, 'rgba(170, 214, 232, 0.5)');
  rect(ctx, x + room.w - 5, y, 5, room.h, 'rgba(170, 214, 232, 0.5)');
  rect(ctx, x, y + room.h - 5, room.w, 5, 'rgba(170, 214, 232, 0.5)');
  // door gap hint
  if (room.door) {
    const dx = room.door.x - camera.x;
    const dy = room.door.y - camera.y;
    rect(ctx, dx, dy, room.door.w, room.door.h, '#3a3f4c');
    rect(ctx, dx, dy, room.door.w, 2, color);
  }
}

function drawDesk(ctx, camera, x, y, w, time, accent, playerDesk, night) {
  const sx = x - camera.x;
  const sy = y - camera.y;
  if (sx + w < -60 || sx > 700) return;
  rect(ctx, sx + 3, sy + 10, w, 20, 'rgba(8, 10, 16, 0.28)');
  roundRect(ctx, sx, sy, w, 18, 3, '#8b6f52');
  rect(ctx, sx, sy + 15, w, 3, '#5d4938');
  // legs
  rect(ctx, sx + 5, sy + 18, 5, 22, '#3a322c');
  rect(ctx, sx + w - 10, sy + 18, 5, 22, '#3a322c');
  // monitor
  const mx = sx + 12;
  const my = sy - 18;
  rect(ctx, mx, my, 30, 18, '#1b2029');
  rect(ctx, mx + 2, my + 2, 26, 13, night ? '#74c7b2' : '#456b80');
  rect(ctx, mx + 12, my + 18, 6, 4, '#2a3039');
  // keyboard
  rect(ctx, sx + 48, sy + 5, 20, 6, '#d7d0c0');
  rect(ctx, sx + 50, sy + 7, 16, 2, '#9d9688');
  // mug / papers
  rect(ctx, sx + w - 22, sy + 6, 7, 7, '#d96b5f');
  rect(ctx, sx + w - 20, sy + 13, 3, 2, '#b9544a');
  rect(ctx, sx + w - 34, sy + 4, 9, 7, '#f2ead8');
  // chair
  rect(ctx, sx + w / 2 - 8, sy + 34, 16, 8, '#2d3340');
  rect(ctx, sx + w / 2 - 8, sy + 40, 3, 9, '#222833');
  // player desk glow
  if (playerDesk) {
    const pulse = 0.4 + Math.sin(time * 0.004) * 0.18;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(sx - 3, sy - 20, w + 6, 44);
    ctx.globalAlpha = 1;
    rect(ctx, sx + w / 2 - 6, sy - 28, 12, 4, accent);
  }
}

function drawBossDesk(ctx, camera, time, night) {
  const x = BOSS_DESK.x - camera.x;
  const y = BOSS_DESK.y - camera.y;
  rect(ctx, x + 3, y + 9, BOSS_DESK.w, 20, 'rgba(8, 10, 16, 0.3)');
  roundRect(ctx, x, y, BOSS_DESK.w, 20, 3, '#5c4635');
  rect(ctx, x, y + 16, BOSS_DESK.w, 4, '#3f3128');
  rect(ctx, x + 8, y + 20, 5, 20, '#2e2620');
  rect(ctx, x + BOSS_DESK.w - 13, y + 20, 5, 20, '#2e2620');
  rect(ctx, x + 8, y - 16, 24, 16, '#171c24');
  rect(ctx, x + 10, y - 14, 20, 11, night ? '#8fe3b0' : '#527a7d');
  rect(ctx, x + 36, y + 4, 20, 5, '#efe5d2');
  rect(ctx, x + BOSS_DESK.w - 20, y - 6, 9, 8, '#efe5d2');
  rect(ctx, x + BOSS_DESK.w - 18, y - 4, 5, 1, '#8f8270');
  // nameplate
  roundRect(ctx, x + BOSS_DESK.w / 2 - 16, y - 4, 32, 6, 1, '#d8b46b');
  ctx.save();
  ctx.fillStyle = '#5a4229';
  ctx.font = '4px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS', x + BOSS_DESK.w / 2, y);
  ctx.restore();
}

function drawMeeting(ctx, camera, time, night) {
  const x = MEETING_TABLE.x - camera.x;
  const y = MEETING_TABLE.y - camera.y;
  rect(ctx, 40 - camera.x, 480 - camera.y, 200, 3, '#8ecae6');
  rect(ctx, 40 - camera.x, 480 - camera.y, 3, 128, 'rgba(142,202,230,0.35)');
  // whiteboard
  rect(ctx, 54 - camera.x, 492 - camera.y, 66, 30, '#e9eef2');
  rect(ctx, 57 - camera.x, 496 - camera.y, 46, 2, '#7d8793');
  rect(ctx, 57 - camera.x, 501 - camera.y, 56, 2, '#7d8793');
  rect(ctx, 57 - camera.x, 506 - camera.y, 34, 2, '#7d8793');
  rect(ctx, 54 - camera.x, 522 - camera.y, 66, 2, '#8d98a4');
  // table
  roundRect(ctx, x, y, MEETING_TABLE.w, MEETING_TABLE.h, 8, '#6f5947');
  rect(ctx, x + 6, y + 4, MEETING_TABLE.w - 12, MEETING_TABLE.h - 8, '#8f745b');
  // chairs
  for (let i = 0; i < 3; i++) {
    rect(ctx, x + 10 + i * 38, y - 12, 20, 9, '#2f3746');
    rect(ctx, x + 10 + i * 38, y + MEETING_TABLE.h + 3, 20, 9, '#2f3746');
  }
  // papers
  rect(ctx, x + 18, y + 12, 18, 10, '#f5eddc');
  rect(ctx, x + 54, y + 18, 16, 9, '#f5eddc');
  rect(ctx, x + 90, y + 10, 14, 10, '#f5eddc');
  // laptop
  rect(ctx, x + 78, y + 20, 20, 12, '#202733');
  rect(ctx, x + 80, y + 22, 16, 8, night ? '#8ecae6' : '#4a6a7f');
}

function drawRest(ctx, camera, time, night) {
  const x = 400 - camera.x;
  const y = 470 - camera.y;
  rect(ctx, x, y, 200, 3, '#c9b6ff');
  // rug
  rect(ctx, 414 - camera.x, 500 - camera.y, 172, 100, '#4b4359');
  for (let i = 0; i < 5; i++) {
    rect(ctx, 424 - camera.x + i * 32, 510 - camera.y, 18, 2, '#5d5470');
  }
  // sofa
  const sx = SOFA.x - camera.x;
  const sy = SOFA.y - camera.y;
  roundRect(ctx, sx, sy, SOFA.w, SOFA.h, 6, '#6d5a7b');
  roundRect(ctx, sx + 5, sy + 4, SOFA.w - 10, SOFA.h - 10, 4, '#8a7399');
  rect(ctx, sx + 10, sy + 7, 38, 12, '#a58fb2');
  rect(ctx, sx + 54, sy + 7, 38, 12, '#a58fb2');
  // coffee table
  roundRect(ctx, COFFEE_TABLE.x - camera.x, COFFEE_TABLE.y - camera.y, COFFEE_TABLE.w, COFFEE_TABLE.h, 4, '#6f5947');
  rect(ctx, COFFEE_TABLE.x - camera.x + 6, COFFEE_TABLE.y - camera.y + 4, 8, 6, '#e9eef2');
  rect(ctx, COFFEE_TABLE.x - camera.x + 20, COFFEE_TABLE.y - camera.y + 5, 7, 7, '#d96b5f');
  // plant
  rect(ctx, 590 - camera.x, 588 - camera.y, 12, 14, '#535b68');
  ctx.fillStyle = night ? '#2c6b4e' : '#5a9e62';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(594 - camera.x + (i - 2) * 4, 582 - camera.y - (i % 2) * 6, 5, 9, (i - 2) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  // snack shelf
  rect(ctx, 410 - camera.x, 596 - camera.y, 52, 12, '#4c5362');
  for (let i = 0; i < 4; i++) {
    rect(ctx, 414 - camera.x + i * 11, 590 - camera.y, 7, 8, i % 2 ? '#f0c987' : '#8ecae6');
  }
}

function drawPrinter(ctx, camera, time, night) {
  const x = PRINTER.x - camera.x;
  const y = PRINTER.y - camera.y;
  rect(ctx, x + 2, y + 24, PRINTER.w, 6, 'rgba(8, 10, 16, 0.25)');
  rect(ctx, x, y, PRINTER.w, 24, '#474f5e');
  rect(ctx, x + 3, y + 4, PRINTER.w - 6, 8, '#2e3542');
  rect(ctx, x + 5, y + 6, PRINTER.w - 10, 4, '#5d6878');
  rect(ctx, x + 8, y + 15, 16, 6, '#d7d0c0');
  const blink = Math.sin(time * 0.005) > 0.55;
  if (blink) rect(ctx, x + PRINTER.w - 7, y + 3, 2, 2, '#8fe3b0');
  // output tray
  rect(ctx, x + 7, y + 24, 20, 5, '#262c37');
  rect(ctx, x + 9, y + 22, 16, 4, '#f2ead8');
}

function drawCooler(ctx, camera, time, night) {
  const x = COOLER.x - camera.x;
  const y = COOLER.y - camera.y;
  rect(ctx, x + 2, y + 26, COOLER.w, 6, 'rgba(8, 10, 16, 0.24)');
  rect(ctx, x + 4, y + 8, 12, 20, '#d7dde5');
  rect(ctx, x + 6, y + 10, 8, 9, night ? '#7fc9e0' : '#8fd2e8');
  rect(ctx, x + 7, y, 6, 9, night ? '#5aa7c4' : '#6fb7d4');
  rect(ctx, x + 5, y - 2, 10, 3, '#7fc9e0');
  rect(ctx, x + 6, y + 20, 8, 3, '#4a5361');
  if (night) {
    ctx.globalAlpha = 0.22;
    rect(ctx, x + 2, y + 26, 16, 8, '#8fd2e8');
    ctx.globalAlpha = 1;
  }
}

function drawElevator(ctx, camera, time, night) {
  const x = 286 - camera.x;
  const y = 604 - camera.y;
  rect(ctx, x, y, 68, 36, '#1a202b');
  rect(ctx, x + 3, y + 3, 62, 33, '#2d3545');
  rect(ctx, x + 8, y + 7, 24, 25, '#3e485b');
  rect(ctx, x + 36, y + 7, 24, 25, '#3e485b');
  rect(ctx, x + 33, y + 7, 2, 25, '#1a202b');
  const lit = Math.sin(time * 0.002) > -0.2;
  if (lit) rect(ctx, x + 31, y + 1, 6, 2, '#8fe3b0');
  ctx.save();
  ctx.fillStyle = '#9fb3c8';
  ctx.font = '6px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('电梯 · E 下班', x + 34, y - 5);
  ctx.restore();
}

function drawFloorLabel(ctx, camera, x, y, text, color) {
  ctx.save();
  ctx.font = 'bold 7px "Microsoft YaHei", system-ui, sans-serif';
  ctx.textAlign = 'center';
  const w = ctx.measureText(text).width + 10;
  roundRect(ctx, x - camera.x - w / 2, y - camera.y - 8, w, 12, 3, 'rgba(10, 15, 24, 0.55)');
  ctx.fillStyle = color || '#c9d4e8';
  ctx.fillText(text, x - camera.x, y - camera.y);
  ctx.restore();
}

export function createOfficeWorld() {
  const npcs = [];
  let conversation = null;
  let convoTimer = 0;
  let convoIndex = 0;
  let talkTimer = 6;
  let lastRequest = 0;
  let currentCourse = 'python';

  const world = {
    width: OFFICE_W,
    height: OFFICE_H,
    entry: { x: 320, y: 588, dir: 'up' },
    meetingSpot: { x: 140, y: 584, dir: 'up' },

    setCourse(courseId) {
      if (currentCourse === courseId && npcs.length) return;
      currentCourse = courseId;
      const info = courseOffice(courseId);
      const seeds = [
        { name: info.npcNames[0] || '小满', x: 190, y: 430, x0: 120, x1: 270, y0: 424, y1: 462, dir: 'right', ai: false },
        { name: info.npcNames[1] || '阿杉', x: 470, y: 370, x0: 400, x1: 560, y0: 352, y1: 446, dir: 'left', ai: false },
        { name: info.npcNames[2] || '灯灯', x: 500, y: 480, x0: 420, x1: 570, y0: 464, y1: 500, dir: 'left', ai: false },
        { name: '小语', x: 330, y: 470, x0: 250, x1: 440, y0: 458, y1: 500, dir: 'right', ai: true }
      ];
      npcs.length = 0;
      seeds.forEach((seed, index) => {
        npcs.push({
          id: `office-npc-${index}`,
          name: seed.name,
          ai: seed.ai,
          x: seed.x,
          y: seed.y,
          x0: seed.x0,
          x1: seed.x1,
          y0: seed.y0,
          y1: seed.y1,
          dir: seed.dir,
          speed: 18 + index * 4,
          pause: 0.5 + index * 0.7,
          frame: 0,
          walk: index * 1.7,
          moving: false,
          palette: paletteForName(seed.name),
          targetX: seed.x,
          targetY: seed.y
        });
      });
      conversation = null;
      talkTimer = 5;
    },

    resetConversation() {
      conversation = null;
      convoIndex = 0;
    },

    canStand(x, y) {
      if (x < 32 || x > OFFICE_W - 32 || y < 150 || y > 610) return false;
      const box = { x0: x - 5, x1: x + 5, y0: y - 8, y1: y };
      for (const s of solidsFor(currentCourse)) {
        if (box.x1 > s.x && box.x0 < s.x + s.w && box.y1 > s.y && box.y0 < s.y + s.h) return false;
      }
      return true;
    },

    playerDesk(courseId, rankStage) {
      if (rankStage >= 3) return { x: 120, y: 236, deskX: 86, deskY: 206, private: true };
      if (rankStage === 2) return { x: 352, y: 322, deskX: 310, deskY: 282 };
      return { x: 205, y: 388, deskX: 168, deskY: 348 };
    },

    labels(courseId, rankStage) {
      const desk = this.playerDesk(courseId, rankStage);
      return [
        { id: 'office-desk', x: desk.x, y: desk.y - 26, text: rankStage >= 3 ? '我的办公室' : '我的工位', sub: 'E 接任务', locked: false },
        { id: 'office-boss', x: 548, y: 290, text: '老板办公室', sub: 'E 汇报 / 晋升', locked: false },
        { id: 'office-meeting', x: 140, y: 610, text: '会议室', sub: 'E 听小剧情', locked: false },
        { id: 'office-rest', x: 530, y: 610, text: '休息区', sub: 'E 坐一会', locked: false }
      ];
    },

    interactables(courseId, save) {
      const state = getOfficeState(save, courseId);
      const rank = officeRank(state);
      const desk = this.playerDesk(courseId, rank.stage || 0);
      const list = [
        { id: 'office-desk', type: 'office', kind: 'desk', x: desk.x, y: desk.y, r: 42, label: '坐到工位 · 接下今天的任务', fx: '工', fxTone: 'quest' },
        { id: 'office-boss', type: 'office', kind: 'boss', x: 548, y: 238, r: 66, label: state.hired ? '和老板聊聊 · 汇报进度' : '和老板面试', fx: '谈', fxTone: 'arcane' },
        { id: 'office-printer', type: 'office', kind: 'printer', x: 297, y: 546, r: 38, label: '用打印机打一份任务单', fx: '印', fxTone: 'muted' },
        { id: 'office-cooler', type: 'office', kind: 'cooler', x: 358, y: 566, r: 38, label: '在饮水机前歇口气', fx: '水', fxTone: 'water' },
        { id: 'office-meeting', type: 'office', kind: 'meeting', x: 140, y: 580, r: 52, label: '旁听会议室的站会', fx: '会', fxTone: 'arcane' },
        { id: 'office-rest', type: 'office', kind: 'rest', x: 500, y: 574, r: 46, label: '在休息区坐一会', fx: '歇', fxTone: 'nature' },
        { id: 'office-window', type: 'office', kind: 'window', x: 320, y: 158, r: 50, label: '看看落地窗外的城市', fx: '窗', fxTone: 'warm' },
        { id: 'office-exit', type: 'office', kind: 'exit', x: 320, y: 602, r: 40, label: '离开公寓', fx: '梯', fxTone: 'muted' }
      ];
      if (rank.stage >= 3) {
        list.push({
          id: 'office-private', type: 'office', kind: 'desk', x: 120, y: 240, r: 46, label: '坐进自己的办公室', fx: '室', fxTone: 'quest'
        });
      }
      return list;
    },

    nearestInteractable(player, courseId, save) {
      const list = this.interactables(courseId, save);
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
      const chatter = state.getChatter?.(state.chatterKind || 'office');
      if (!conversation && chatter?.lines?.length && talkTimer <= 0) {
        startConversation(chatter);
      }
      if (!conversation) {
        talkTimer -= dt;
        if (talkTimer < -12 && Date.now() - lastRequest > 20000) {
          lastRequest = Date.now();
          state.ensureChatter?.('office');
          talkTimer = 4;
        }
      }

      for (const npc of npcs) {
        if (conversation?.roles.has(npc.id)) {
          npc.moving = false;
          continue;
        }
        if (npc.pause > 0) {
          npc.pause -= dt;
          npc.moving = false;
          continue;
        }
        if (npc.targetX == null || Math.hypot(npc.targetX - npc.x, npc.targetY - npc.y) < 4) {
          npc.targetX = npc.x0 + Math.random() * (npc.x1 - npc.x0);
          npc.targetY = npc.y0 + Math.random() * (npc.y1 - npc.y0);
          npc.pause = 1.2 + Math.random() * 3.4;
        }
        const dx = npc.targetX - npc.x;
        const dy = npc.targetY - npc.y;
        const dist = Math.hypot(dx, dy) || 1;
        const step = npc.speed * dt * (state.reduceMotion ? 0.65 : 1);
        if (dist > step) {
          npc.x += (dx / dist) * step;
          npc.y += (dy / dist) * step;
          npc.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
          npc.moving = true;
          npc.walk += dt * 6.2;
          npc.frame = Math.floor(npc.walk) % 4;
        } else {
          npc.x = npc.targetX;
          npc.y = npc.targetY;
          npc.moving = false;
          npc.pause = 1.5 + Math.random() * 4;
        }
      }

      if (conversation) {
        convoTimer -= dt;
        if (convoTimer <= 0) {
          convoIndex += 1;
          if (convoIndex >= conversation.lines.length) {
            conversation = null;
            convoIndex = 0;
            talkTimer = 16 + Math.random() * 12;
          } else {
            convoTimer = 3.2;
          }
        }
      }
    },

    draw(ctx, camera, time, state) {
      const { player, save, viewW, viewH, extraActors = [], courseId } = state;
      const info = courseOffice(courseId);
      const day = state.day || { night: false, darkness: 0 };
      const night = Boolean(day.night || day.darkness > 0.45);
      const camX = Math.round(camera.x);
      const camY = Math.round(camera.y);
      const stage = Math.max(0, Number(state.rankStage) || 0);
      const desk = this.playerDesk(courseId, stage);

      rect(ctx, 0, 0, viewW, viewH, night ? '#10151f' : '#262c3a');
      drawWindow(ctx, camera, time, viewH, day, info);
      drawWall(ctx, camera, info, time);
      drawFloor(ctx, camera);

      // rooms
      drawGlassRoom(ctx, camera, {
        x: 430, y: 146, w: 178, h: 146,
        door: { x: 430, y: 220, w: 6, h: 48 }
      }, info.color);
      drawGlassRoom(ctx, camera, {
        x: 30, y: 146, w: 172, h: 146,
        door: { x: 196, y: 220, w: 6, h: 48 }
      }, '#c9b6ff');
      drawFloorLabel(ctx, camera, 520, 164, '老板办公室', info.color);
      drawFloorLabel(ctx, camera, 116, 164, stage >= 3 ? '我的办公室' : '资料室', '#c9b6ff');
      drawBossDesk(ctx, camera, time, night);
      drawDesk(ctx, camera, PRIVATE_DESK.x, PRIVATE_DESK.y, PRIVATE_DESK.w, time, '#c9b6ff', stage >= 3, night);

      // public desks
      const deskRows = [
        { x: 70, y: 348, w: 74 },
        { x: 168, y: 348, w: 74 },
        { x: 290, y: 348, w: 74 },
        { x: 70, y: 420, w: 74 },
        { x: 168, y: 420, w: 74 },
        { x: 290, y: 420, w: 74 }
      ];
      for (const d of deskRows) {
        const playerHere = stage < 2 && d.x === desk.deskX && d.y === desk.deskY;
        drawDesk(ctx, camera, d.x, d.y, d.w, time, info.color, playerHere, night);
      }
      // window desk for stage 2
      drawDesk(ctx, camera, 310, 282, 84, time, info.color, stage === 2, night);

      drawMeeting(ctx, camera, time, night);
      drawRest(ctx, camera, time, night);
      drawPrinter(ctx, camera, time, night);
      drawCooler(ctx, camera, time, night);
      drawElevator(ctx, camera, time, night);
      drawFloorLabel(ctx, camera, 140, 610, '会议室', '#8ecae6');
      drawFloorLabel(ctx, camera, 530, 610, '休息区', '#c9b6ff');
      drawFloorLabel(ctx, camera, 297, 548, '打印机', '#b8c2d1');
      drawFloorLabel(ctx, camera, 358, 542, '饮水机', '#8fd2e8');
      drawFloorLabel(ctx, camera, 320, 180, '落地窗 · 城市天际线', '#e8d6b2');

      // ambient glow from screens
      if (night) {
        ctx.globalAlpha = 0.12;
        rect(ctx, 60 - camX, 330 - camY, 320, 20, info.color);
        rect(ctx, 300 - camX, 260 - camY, 100, 20, '#8ecae6');
        ctx.globalAlpha = 1;
      }

      const renderables = [];
      for (const npc of npcs) {
        renderables.push({
          sortY: npc.y,
          draw: () => {
            drawPlayer(ctx, npc.x - camX, npc.y - camY, npc.dir, npc.frame, npc.palette, npc.moving);
            if (npc.ai) {
              rect(ctx, npc.x - camX - 9, npc.y - camY - 34, 18, 8, info.color);
              ctx.save();
              ctx.fillStyle = '#101722';
              ctx.font = 'bold 5px "Microsoft YaHei", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('AI', npc.x - camX, npc.y - camY - 28);
              ctx.restore();
            }
          }
        });
      }
      // boss
      renderables.push({
        sortY: 208,
        draw: () => drawPlayer(ctx, 548 - camX, 208 - camY, 'down', 0, paletteForName(info.boss), false)
      });
      if (player) {
        renderables.push({ sortY: player.y, draw: () => state.drawPlayer?.(ctx, camera) });
      }
      for (const actor of extraActors) {
        renderables.push({ sortY: actor.y, draw: () => state.drawPeer?.(ctx, actor, camera) });
      }
      renderables.sort((a, b) => a.sortY - b.sortY);
      for (const item of renderables) item.draw();

      // AI story bubbles
      if (conversation) {
        const line = conversation.lines[convoIndex];
        const npcId = conversation.speakerFor(convoIndex);
        const npc = npcs.find((n) => n.id === npcId);
        if (npc && line) {
          drawBubble(ctx, npc.x - camX, npc.y - camY - 24, line.speaker || npc.name, line.text, info.color);
        }
      }

      // own title plaque near player
      if (state.rankTitle) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 15, 24, 0.55)';
        const text = `${state.playerName || '你'} · ${state.rankTitle}`;
        ctx.font = 'bold 7px "Microsoft YaHei", sans-serif';
        const w = ctx.measureText(text).width + 12;
        roundRect(ctx, 640 - w - 12 - camX, 18 - camY, w, 14, 3, 'rgba(10, 15, 24, 0.55)');
        ctx.fillStyle = info.color;
        ctx.textAlign = 'center';
        ctx.fillText(text, 640 - w / 2 - 12 - camX, 28 - camY);
        ctx.restore();
      }
    }
  };

  function solidsFor(courseId) {
    const state = getOfficeState({ office: {} }, courseId);
    return [
      { x: 430, y: 146, w: 178, h: 5 },
      { x: 430, y: 146, w: 5, h: 74 },
      { x: 430, y: 268, w: 5, h: 24 },
      { x: 603, y: 146, w: 5, h: 146 },
      { x: 430, y: 287, w: 178, h: 5 },
      { x: 30, y: 146, w: 172, h: 5 },
      { x: 30, y: 146, w: 5, h: 146 },
      { x: 197, y: 146, w: 5, h: 74 },
      { x: 197, y: 268, w: 5, h: 24 },
      { x: 30, y: 287, w: 172, h: 5 },
      { x: 40, y: 480, w: 110, h: 5 },
      { x: 200, y: 480, w: 40, h: 5 },
      { x: 40, y: 480, w: 5, h: 130 },
      { x: 235, y: 480, w: 5, h: 130 },
      ...BOSS_DESK_SOLID,
      ...PRIVATE_DESK_SOLID,
      ...MEETING_SOLID,
      ...SOFA_SOLID,
      ...COFFEE_SOLID,
      ...PRINTER_SOLID,
      ...COOLER_SOLID,
      ...deskSolids(courseId, state.stage)
    ];
  }

  function startConversation(chatter) {
    const lines = (chatter.lines || []).slice(0, 5);
    if (!lines.length || !npcs.length) return;
    const aiNpc = npcs.find((npc) => npc.ai) || npcs[0];
    const others = npcs.filter((npc) => npc !== aiNpc);
    const partners = others
      .map((npc) => ({ npc, d: Math.hypot(npc.x - aiNpc.x, npc.y - aiNpc.y) }))
      .sort((a, b) => a.d - b.d)
      .map((item) => item.npc);
    const lineNpcs = lines.map((line, index) => {
      const named = npcs.find((npc) => line.speaker && npc.name && line.speaker.includes(npc.name));
      if (named) return named;
      if (String(line.speaker || '').includes('小语')) return aiNpc;
      return (index % 2 === 0 ? aiNpc : partners[0]) || aiNpc;
    });
    const roles = new Set(lineNpcs.map((npc) => npc.id));
    lineNpcs.forEach((npc, index) => {
      if (index === 0) return;
      const prev = lineNpcs[index - 1];
      if (prev && prev !== npc) {
        npc.dir = prev.x >= npc.x ? 'right' : 'left';
        prev.dir = npc.x >= prev.x ? 'right' : 'left';
      }
      npc.targetX = npc.x;
      npc.targetY = npc.y;
      npc.moving = false;
    });
    conversation = {
      title: chatter.title,
      lines,
      roles,
      speakerFor(index) {
        return lineNpcs[index % lineNpcs.length]?.id;
      }
    };
    convoIndex = 0;
    convoTimer = 3.2;
    talkTimer = 999;
  }

  return world;
}

const BOSS_DESK_SOLID = [{ x: BOSS_DESK.x, y: BOSS_DESK.y, w: BOSS_DESK.w, h: BOSS_DESK.h }];
const PRIVATE_DESK_SOLID = [{ x: PRIVATE_DESK.x, y: PRIVATE_DESK.y, w: PRIVATE_DESK.w, h: PRIVATE_DESK.h }];
const MEETING_SOLID = [{ x: MEETING_TABLE.x, y: MEETING_TABLE.y, w: MEETING_TABLE.w, h: MEETING_TABLE.h }];
const SOFA_SOLID = [{ x: SOFA.x, y: SOFA.y, w: SOFA.w, h: SOFA.h }];
const COFFEE_SOLID = [{ x: COFFEE_TABLE.x, y: COFFEE_TABLE.y, w: COFFEE_TABLE.w, h: COFFEE_TABLE.h }];
const PRINTER_SOLID = [{ x: PRINTER.x, y: PRINTER.y, w: PRINTER.w, h: PRINTER.h }];
const COOLER_SOLID = [{ x: COOLER.x, y: COOLER.y, w: COOLER.w, h: COOLER.h }];

function deskSolids(courseId, stage) {
  const rows = [
    { x: 70, y: 348, w: 74, h: 24 },
    { x: 168, y: 348, w: 74, h: 24 },
    { x: 290, y: 348, w: 74, h: 24 },
    { x: 70, y: 420, w: 74, h: 24 },
    { x: 168, y: 420, w: 74, h: 24 },
    { x: 290, y: 420, w: 74, h: 24 },
    { x: 310, y: 282, w: 84, h: 24 }
  ];
  return rows;
}

