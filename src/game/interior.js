import { TILE, px } from './pixel.js';
import { FURNITURE, BOOK_QUOTES, furnitureSize, wallpaperById } from '../data/furniture.js';
import { drawFurniture } from './sprites.js';
import { skyGradient } from './daynight.js';

export const ROOM_COLS = 20;
export const ROOM_ROWS = 12;
export const ROOM_W = ROOM_COLS * TILE;
export const ROOM_H = ROOM_ROWS * TILE;
export const WALL_H = 44;
const BOTTOM_WALL = 10;
const ROOM_TOTAL_H = WALL_H + ROOM_H + BOTTOM_WALL;
const FRAME = 8;

const DOOR_X = 160;
const DOOR_Y = WALL_H + ROOM_H;

export function roomLayout(viewW, viewH = 270) {
  const ox = Math.round((viewW - ROOM_W) / 2);
  const oy = Math.round((viewH - ROOM_TOTAL_H) / 2);
  return { ox, oy, floorX: ox, floorY: oy + WALL_H, totalH: ROOM_TOTAL_H };
}

function itemRect(item) {
  const size = furnitureSize(item.id, item.rot);
  return {
    x: item.x * TILE,
    y: WALL_H + item.y * TILE,
    w: size.w * TILE,
    h: size.h * TILE,
    cols: size.w,
    rows: size.h
  };
}

function rectOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function pointRectDistance(x, y, r) {
  const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
  const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

function nightSky(day) {
  return day && Number.isFinite(day.darkness) ? day : { phase: 'dusk', darkness: 0.4, hours: 18.4 };
}

function drawCelestial(ctx, x, y, sun) {
  if (sun) {
    px(ctx, x - 2, y - 1, 5, 3, '#ffe9b0');
    px(ctx, x - 1, y - 2, 3, 5, '#ffe9b0');
    px(ctx, x, y - 1, 1, 3, '#fff7d8');
    return;
  }
  px(ctx, x - 2, y, 4, 2, '#efe8d2');
  px(ctx, x - 1, y - 2, 2, 5, '#efe8d2');
  px(ctx, x, y - 1, 2, 1, '#efe8d2');
  px(ctx, x + 1, y - 1, 2, 2, 'rgba(40, 48, 78, .9)');
}

function wallLighting(ctx, time, day) {
  const sky = nightSky(day);
  const wx = 62;
  const wy = 7;
  const ww = 66;
  const wh = 31;
  px(ctx, wx - 3, wy - 3, ww + 6, wh + 6, '#6d4b33');
  px(ctx, wx - 2, wy - 2, ww + 4, wh + 4, '#8f6645');
  const [top, mid, low] = skyGradient(sky);
  const grad = ctx.createLinearGradient(0, wy, 0, wy + wh);
  grad.addColorStop(0, top);
  grad.addColorStop(0.62, mid);
  grad.addColorStop(1, low);
  ctx.fillStyle = grad;
  ctx.fillRect(wx, wy, ww, wh);

  // stars fade in with the dark
  const starAlpha = Math.max(0, Math.min(1, (sky.darkness - 0.28) * 2.1));
  if (starAlpha > 0.02) {
    ctx.globalAlpha = starAlpha;
    const stars = [[8, 5], [20, 9], [47, 4], [55, 12], [34, 14], [12, 18], [58, 20], [26, 21], [61, 9]];
    for (let i = 0; i < stars.length; i++) {
      const [sx, sy] = stars[i];
      if (Math.sin(time * 0.001 + i * 1.7) > -0.35) px(ctx, wx + sx, wy + sy, 1, 1, '#f4e8c9');
    }
    ctx.globalAlpha = 1;
  }

  // sun or moon arcs across the window
  const hours = Number.isFinite(sky.hours) ? sky.hours : 18;
  const sunUp = sky.darkness < 0.55;
  const span = sunUp ? 13.4 : 11.4;
  const since = sunUp ? (hours - 5.6 + 24) % 24 : (hours - 18.8 + 24) % 24;
  if (since <= span) {
    const f = since / span;
    const cx = wx + 7 + f * (ww - 14);
    const cy = wy + wh - 5 - Math.sin(f * Math.PI) * (wh - 14);
    drawCelestial(ctx, cx, cy, sunUp);
  }

  // hills, tinted by the hour
  const hillTop = sky.darkness > 0.55 ? '#28334a' : sky.darkness > 0.3 ? '#3f4c5c' : '#547052';
  ctx.fillStyle = hillTop;
  ctx.beginPath();
  ctx.moveTo(wx, wy + wh);
  ctx.lineTo(wx, wy + wh - 8);
  ctx.lineTo(wx + 18, wy + wh - 15);
  ctx.lineTo(wx + 36, wy + wh - 7);
  ctx.lineTo(wx + 52, wy + wh - 14);
  ctx.lineTo(wx + ww, wy + wh - 6);
  ctx.lineTo(wx + ww, wy + wh);
  ctx.fill();
  px(ctx, wx, wy + wh - 4, ww, 4, sky.darkness > 0.55 ? '#1c2438' : 'rgba(52, 66, 58, .55)');

  // warm light spilling from the room onto the sill after dark
  if (sky.darkness > 0.4) {
    ctx.globalAlpha = Math.min(0.5, (sky.darkness - 0.4) * 0.8);
    px(ctx, wx, wy + wh - 2, ww, 2, '#e8b978');
    ctx.globalAlpha = 1;
  }

  // muntins
  px(ctx, wx + ww / 2 - 1, wy, 2, wh, '#7c5539');
  px(ctx, wx, wy + 15, ww, 2, '#7c5539');
  // curtains
  px(ctx, wx - 12, wy - 5, 9, wh + 12, '#a85f50');
  px(ctx, wx - 10, wy - 4, 5, wh + 9, '#c07a63');
  px(ctx, wx + ww + 3, wy - 5, 9, wh + 12, '#a85f50');
  px(ctx, wx + ww + 5, wy - 4, 5, wh + 9, '#c07a63');
  px(ctx, wx - 14, wy - 8, ww + 28, 3, '#5f4130');
  // sill
  px(ctx, wx - 5, wy + wh + 3, ww + 10, 4, '#8a6040');
  px(ctx, wx - 5, wy + wh + 3, ww + 10, 1, '#b98d5f');
}

function drawWallClock(ctx, day) {
  const cx = 158;
  const cy = 20;
  px(ctx, cx - 10, cy - 10, 20, 20, '#5a4130');
  px(ctx, cx - 9, cy - 9, 18, 18, '#d8b787');
  px(ctx, cx - 8, cy - 8, 16, 16, '#f6ead0');
  px(ctx, cx - 8, cy - 8, 16, 1, 'rgba(255, 255, 255, .5)');
  for (let i = 0; i < 4; i++) {
    const a = (Math.PI / 2) * i;
    px(ctx, cx + Math.round(Math.cos(a) * 6) - 1, cy + Math.round(Math.sin(a) * 6) - 1, 1, 1, '#8a6b4a');
  }
  const hours = Number.isFinite(day?.hours) ? day.hours : 16.6;
  const hourAngle = ((hours % 12) / 12) * Math.PI * 2 - Math.PI / 2;
  const minuteAngle = ((hours % 1) * 2) * Math.PI - Math.PI / 2;
  const hand = (angle, len, color, size = 1) => {
    for (let r = 1; r <= len; r++) {
      px(ctx, cx + Math.round(Math.cos(angle) * r), cy + Math.round(Math.sin(angle) * r), size, size, color);
    }
  };
  hand(hourAngle, 4, '#4b3a28');
  hand(minuteAngle, 6, '#8a5f3d');
  px(ctx, cx - 1, cy - 1, 2, 2, '#8a5f3d');
}

function drawWall(ctx, time, day, wallpaper = 'warm') {
  const paper = wallpaperById(wallpaper);
  px(ctx, 0, 0, ROOM_W, WALL_H, paper.wall);
  if (paper.motif === 'stripe') {
    for (let x = 0; x < ROOM_W; x += 16) {
      px(ctx, x, 0, 1, WALL_H, paper.stripe);
      px(ctx, x + 8, 0, 1, WALL_H, paper.faint);
    }
  } else if (paper.motif === 'dot') {
    for (let y = 7; y < WALL_H - 14; y += 14) {
      for (let x = 8 + ((y / 14) % 2) * 8; x < ROOM_W; x += 24) {
        px(ctx, x, y, 2, 2, paper.stripe);
        px(ctx, x, y, 1, 1, paper.faint);
      }
    }
  } else if (paper.motif === 'panel') {
    for (let x = 0; x < ROOM_W; x += 32) {
      px(ctx, x, 0, 16, WALL_H, paper.stripe);
      px(ctx, x + 16, 0, 1, WALL_H, paper.faint);
    }
  } else if (paper.motif === 'petal') {
    for (let y = 10; y < WALL_H - 14; y += 17) {
      for (let x = 12 + ((y / 17) % 2) * 11; x < ROOM_W; x += 27) {
        px(ctx, x, y, 2, 1, paper.stripe);
        px(ctx, x - 1, y + 1, 1, 1, paper.faint);
        px(ctx, x + 2, y + 1, 1, 1, paper.faint);
      }
    }
  } else if (paper.motif === 'star') {
    const stars = [[14, 8], [38, 20], [88, 9], [140, 24], [181, 6], [246, 12], [306, 22], [270, 6]];
    for (const [sx, sy] of stars) {
      px(ctx, sx, sy, 1, 3, paper.faint);
      px(ctx, sx - 1, sy + 1, 3, 1, paper.faint);
    }
  } else if (paper.motif === 'check') {
    for (let y = 0; y < WALL_H - 13; y += 8) {
      for (let x = 0; x < ROOM_W; x += 8) {
        if ((x / 8 + y / 8) % 2 === 0) px(ctx, x, y, 8, 8, paper.faint);
      }
    }
  }
  px(ctx, 0, 0, ROOM_W, 4, paper.top);
  px(ctx, 0, WALL_H - 13, ROOM_W, 13, paper.wain);
  px(ctx, 0, WALL_H - 13, ROOM_W, 2, paper.wainHi);
  px(ctx, 0, WALL_H - 4, ROOM_W, 4, paper.wainLo);
  wallLighting(ctx, time, day);
  drawWallClock(ctx, day);

  // picture frame with tiny hills
  px(ctx, 188, 8, 46, 30, '#6e4b33');
  px(ctx, 190, 10, 42, 26, '#f0dfba');
  px(ctx, 191, 11, 40, 24, '#a9c7cf');
  px(ctx, 191, 25, 40, 10, '#88a86f');
  px(ctx, 200, 17, 10, 8, '#6d8a5c');
  px(ctx, 218, 20, 12, 5, '#5b7953');
  px(ctx, 192, 27, 38, 1, '#c3d9d2');
  px(ctx, 205, 15, 2, 2, '#f7e8b2');

  // shelf with books and a little plant
  px(ctx, 252, 28, 48, 4, '#8a613f');
  px(ctx, 254, 15, 4, 13, '#7a4f43');
  px(ctx, 259, 17, 4, 11, '#4f6d57');
  px(ctx, 264, 14, 5, 14, '#b07a4a');
  px(ctx, 270, 18, 3, 10, '#6c7fa8');
  px(ctx, 284, 18, 8, 6, '#a35f45');
  px(ctx, 286, 12, 4, 6, '#6f9c5c');
  px(ctx, 283, 11, 3, 4, '#88b36e');
  px(ctx, 252, 32, 48, 1, 'rgba(90, 61, 40, .4)');
  // tiny gold trim on the shelf edge
  px(ctx, 252, 27, 48, 1, '#b98d5f');
}

function drawFixedStove(ctx, time) {
  const x = 16;
  const y = WALL_H + 16;
  px(ctx, x + 2, y + 30, 44, 4, 'rgba(40, 28, 22, .28)');
  px(ctx, x, y + 8, 48, 24, '#6f4a3a');
  px(ctx, x + 1, y + 9, 46, 22, '#8c5d49');
  px(ctx, x + 2, y + 10, 44, 6, '#a8735a');
  for (let r = 0; r < 3; r++) {
    const by = y + 16 + r * 6;
    px(ctx, x + 2, by, 44, 1, 'rgba(74, 44, 33, .4)');
    for (let i = 0; i < 3; i++) {
      px(ctx, x + 8 + i * 14 + (r % 2) * 7, by - 5, 1, 5, 'rgba(74, 44, 33, .28)');
    }
  }
  px(ctx, x, y + 4, 48, 6, '#4c3b34');
  px(ctx, x + 1, y + 5, 46, 3, '#6b5449');
  px(ctx, x + 9, y + 18, 15, 11, '#38241f');
  px(ctx, x + 10, y + 19, 13, 9, '#592f26');
  const flick = Math.round(Math.sin(time * 0.011) * 1.4);
  px(ctx, x + 12, y + 22, 9, 6, '#d9773f');
  px(ctx, x + 13, y + 20 + flick, 7, 5, '#f2a54a');
  px(ctx, x + 15, y + 23, 3, 3, '#ffd887');
  px(ctx, x + 26, y - 2, 16, 9, '#424b55');
  px(ctx, x + 27, y - 1, 14, 3, '#66707c');
  px(ctx, x + 28, y - 3, 12, 2, '#2f363d');
  px(ctx, x + 24, y + 1, 3, 2, '#2f363d');
  px(ctx, x + 41, y + 1, 4, 2, '#2f363d');
  const steam = Math.sin(time * 0.0032);
  if (steam > -0.25) {
    ctx.globalAlpha = 0.42 + steam * 0.2;
    px(ctx, x + 30, y - 8, 1, 4, '#eef3ee');
    px(ctx, x + 33, y - 12, 1, 5, '#eef3ee');
    px(ctx, x + 36, y - 8, 1, 3, '#eef3ee');
    ctx.globalAlpha = 1;
  }
  px(ctx, x + 40, y + 20, 4, 1, '#d8b174');
  px(ctx, x + 42, y + 21, 1, 2, '#d8b174');
}

function drawFixedRadio(ctx, time) {
  const x = 256;
  const y = WALL_H + 16;
  px(ctx, x + 2, y + 30, 44, 4, 'rgba(40, 28, 22, .28)');
  px(ctx, x, y + 13, 48, 19, '#5c4430');
  px(ctx, x + 1, y + 14, 46, 17, '#8a6444');
  px(ctx, x + 2, y + 15, 44, 4, '#a87d54');
  px(ctx, x + 4, y + 21, 18, 8, '#6f4d33');
  px(ctx, x + 5, y + 22, 16, 6, '#7f5a3c');
  px(ctx, x + 26, y + 21, 18, 8, '#6f4d33');
  px(ctx, x + 27, y + 22, 16, 6, '#7f5a3c');
  px(ctx, x + 34, y + 24, 2, 2, '#d8b174');
  px(ctx, x + 8, y + 3, 32, 11, '#3f342c');
  px(ctx, x + 9, y + 4, 30, 3, '#6a5746');
  px(ctx, x + 14, y + 7, 12, 6, '#2b2b35');
  px(ctx, x + 17, y + 8, 6, 4, '#7c7488');
  px(ctx, x + 19, y + 9, 2, 1, '#d8b174');
  px(ctx, x + 28, y + 6, 1, 5, '#c7a879');
  px(ctx, x + 29, y + 6, 3, 1, '#c7a879');
  const note = (time * 0.0012) % 1;
  ctx.globalAlpha = Math.max(0, 1 - note) * 0.7;
  px(ctx, x + 40, y - Math.round(note * 12), 1, 4, '#f2e7cd');
  px(ctx, x + 41, y - Math.round(note * 12), 2, 1, '#f2e7cd');
  ctx.globalAlpha = 1;
}

const FIXED_FURNITURE = [
  {
    id: 'stove', x: 16, y: WALL_H + 16, w: 48, h: 32, sortY: WALL_H + 48,
    draw: drawFixedStove
  },
  {
    id: 'radio', x: 256, y: WALL_H + 16, w: 48, h: 32, sortY: WALL_H + 48,
    draw: drawFixedRadio
  }
];

const FIXED_SOLIDS = FIXED_FURNITURE.map(({ x, y, w, h }) => ({ x, y, w, h }));

function fixedSpots(day) {
  const phase = day?.phase || 'day';
  const stoveLine = phase === 'night'
    ? '炉火压得很低，水壶还温着。你把掌心凑近一点，困意也被烘得软软的。'
    : phase === 'dawn'
      ? '炉子上坐着一小壶水，刚冒第一缕白气。今天也会是慢慢来的好天气。'
      : '水壶咕嘟咕嘟响，炉火把砖缝照成暖橘色。你听见木头轻轻炸开的声音。';
  const radioLines = [
    '你给唱片机上紧发条，一小段叮叮咚咚的调子从铜喇叭里溜了出来。',
    '唱针落下去，屋子里忽然多了一点旧木头的香气和很轻的节拍。',
    '唱片转了一圈又一圈，像把窗外走得很慢的云也卷了进来。'
  ];
  return [
    {
      id: 'home-stove', type: 'stove', x: 40, y: WALL_H + 54, r: 28,
      label: '看看炉上的水壶', flavor: stoveLine, fx: '暖', fxTone: 'warm'
    },
    {
      id: 'home-radio', type: 'radio', x: 280, y: WALL_H + 54, r: 28,
      label: '给唱片机上上发条',
      flavor: radioLines[Math.floor(Date.now() / 9000) % radioLines.length],
      fx: '♪', fxTone: 'arcane'
    }
  ];
}

function drawFloor(ctx) {
  px(ctx, 0, WALL_H, ROOM_W, ROOM_H, '#a87c52');
  const rows = ROOM_H / 12;
  for (let r = 0; r < rows; r++) {
    const y = WALL_H + r * 12;
    px(ctx, 0, y, ROOM_W, 12, r % 2 ? '#ad8156' : '#a2764d');
    px(ctx, 0, y, ROOM_W, 1, '#8c6340');
    const offset = (r % 3) * 42;
    for (let x = -offset; x < ROOM_W; x += 84) {
      px(ctx, x + 40, y + 1, 1, 11, 'rgba(120, 82, 50, .5)');
      px(ctx, x + 4, y + 2, 16, 1, 'rgba(206, 166, 118, .35)');
    }
    if (r % 3 === 0) {
      px(ctx, 120 + (r * 37) % 160, y + 4, 3, 3, '#8a613e');
      px(ctx, 122 + (r * 37) % 160, y + 5, 1, 1, '#6f4c31');
    }
  }
  // side walls / baseboards
  px(ctx, 0, WALL_H, 7, ROOM_H, '#6f4f38');
  px(ctx, 1, WALL_H, 2, ROOM_H, '#8d6a4b');
  px(ctx, ROOM_W - 7, WALL_H, 7, ROOM_H, '#6f4f38');
  px(ctx, ROOM_W - 3, WALL_H, 2, ROOM_H, '#8d6a4b');
  // floor edge shadows
  px(ctx, 7, WALL_H, ROOM_W - 14, 3, 'rgba(80, 53, 34, .25)');
  px(ctx, 7, WALL_H + ROOM_H - 3, ROOM_W - 14, 3, 'rgba(80, 53, 34, .2)');
}

function drawBottomWall(ctx) {
  const y = WALL_H + ROOM_H;
  px(ctx, 0, y, ROOM_W, BOTTOM_WALL, '#7a5a40');
  px(ctx, 0, y, ROOM_W, 2, '#b0875f');
  // door opening + welcome mat
  px(ctx, DOOR_X - 26, y - 1, 52, BOTTOM_WALL + 1, '#5c4130');
  px(ctx, DOOR_X - 24, y + 1, 48, BOTTOM_WALL - 2, '#3d2c21');
  px(ctx, DOOR_X - 22, y + 6, 44, 5, '#c49a6a');
  px(ctx, DOOR_X - 20, y + 7, 40, 3, '#d6b083');
  px(ctx, DOOR_X - 22, y + 6, 44, 1, '#e3c397');
}

function drawRugMat(ctx) {
  // lit doorway mat
  const y = WALL_H + ROOM_H - 12;
  px(ctx, DOOR_X - 24, y, 48, 11, '#b58a5e');
  px(ctx, DOOR_X - 22, y + 1, 44, 9, '#caa172');
  px(ctx, DOOR_X - 22, y + 1, 44, 1, '#dcb78a');
  px(ctx, DOOR_X - 18, y + 4, 36, 1, 'rgba(122, 85, 53, .5)');
}

function drawAmbient(ctx, viewW, viewH, layout, lampOn, day, time = 0) {
  const { ox, oy } = layout;
  const darkness = Number.isFinite(day?.darkness) ? day.darkness : 0;
  const cx = ox + DOOR_X;
  const cy = oy + WALL_H + ROOM_H * 0.55;

  // night settles into the room even while the lamp is off
  const tint = 0.04 + darkness * (lampOn ? 0.1 : 0.26);
  if (tint > 0.01) {
    ctx.fillStyle = `rgba(19, 27, 56, ${tint.toFixed(3)})`;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  if (lampOn) {
    const pulse = 0.92 + Math.sin(time * 0.0022) * 0.08;
    const glow = ctx.createRadialGradient(cx, cy, 20, cx, cy, 195);
    glow.addColorStop(0, `rgba(255, 209, 130, ${(0.14 + darkness * 0.12) * pulse})`);
    glow.addColorStop(0.55, `rgba(255, 186, 104, ${(0.05 + darkness * 0.06) * pulse})`);
    glow.addColorStop(1, 'rgba(120, 70, 30, 0.02)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, viewW, viewH);
  } else if (darkness > 0.16) {
    // moonlight pools under the window
    const wx = ox + 95;
    const wy = oy + WALL_H + 16;
    const moon = ctx.createRadialGradient(wx, wy, 6, wx, wy, 104);
    moon.addColorStop(0, `rgba(150, 178, 224, ${0.06 + darkness * 0.1})`);
    moon.addColorStop(1, 'rgba(90, 116, 170, 0)');
    ctx.fillStyle = moon;
    ctx.fillRect(wx - 108, wy - 108, 216, 216);
  }

  // soft vignette
  const vg = ctx.createRadialGradient(viewW / 2, viewH / 2, viewW * 0.28, viewW / 2, viewH / 2, viewW * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(5, 8, 14, .34)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, viewW, viewH);
}

function drawDust(ctx, time, layout) {
  for (let i = 0; i < 12; i++) {
    const x = layout.ox + 20 + ((i * 53 + time * 0.004 * (8 + i)) % (ROOM_W - 40));
    const y = layout.oy + WALL_H + 20 + Math.sin(time * 0.0007 + i * 1.9) * 24 + (i * 13) % 80;
    const a = 0.12 + Math.sin(time * 0.001 + i) * 0.08;
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    px(ctx, x, y, 1, 1, '#ffe8b0');
  }
  ctx.globalAlpha = 1;
}

function drawGoldCursor(ctx, tx, ty, w, h, color, pulse) {
  const x = tx * TILE;
  const y = WALL_H + ty * TILE;
  const W = w * TILE;
  const H = h * TILE;
  ctx.globalAlpha = 0.85;
  px(ctx, x, y, W, 1, color);
  px(ctx, x, y + H - 1, W, 1, color);
  px(ctx, x, y, 1, H, color);
  px(ctx, x + W - 1, y, 1, H, color);
  ctx.globalAlpha = pulse;
  px(ctx, x + 2, y + 2, 3, 1, color);
  px(ctx, x + 2, y + 2, 1, 3, color);
  px(ctx, x + W - 5, y + H - 3, 3, 1, color);
  px(ctx, x + W - 3, y + H - 5, 1, 3, color);
  ctx.globalAlpha = 1;
}

function wallInteractables(day) {
  const phase = day?.phase || 'day';
  const clock = day?.clock || '16:36';
  const windowByPhase = {
    night: {
      label: '看看窗外的星空',
      flavor: '窗外的星星排成一小把勺子。路灯把巷子照成暖黄色，有只夜鸟轻轻叫了一声。'
    },
    dawn: {
      label: '看看窗外的清晨',
      flavor: '天边刚亮起一条浅浅的金色，树影像还没睡醒。屋外的空气一定凉凉的。'
    },
    dusk: {
      label: '看看窗外的晚霞',
      flavor: '晚霞把玻璃染成橘粉色，归鸟从窗前掠过。再过一会儿，路灯就要亮了。'
    }
  };
  const dayFlavor = phase === 'morning'
    ? '晨光斜斜地落进来，院子里的露水还没干。'
    : phase === 'noon'
      ? '日头正高，窗外的云白得发亮。'
      : phase === 'afternoon'
        ? '云慢慢地走，树把影子铺在草地上。'
        : '窗外亮亮的，风把树叶翻了个面。';
  const clockLine = phase === 'night'
    ? '小镇安静下来，连指针都走得很轻。'
    : phase === 'dawn'
      ? '再过一会儿，面包房就会飘出香味。'
      : phase === 'dusk'
        ? '该把屋里的灯打开了。'
        : '日头正好，适合出门走走。';
  return [
    {
      id: 'home-window', type: 'flavor', x: 95, y: WALL_H + 3, r: 27,
      label: windowByPhase[phase]?.label || '看看窗外的天色',
      flavor: windowByPhase[phase]?.flavor || dayFlavor,
      fx: '窗', fxTone: 'water'
    },
    {
      id: 'home-clock', type: 'flavor', x: 158, y: WALL_H + 2, r: 24,
      label: `看看挂钟 · ${clock}`,
      flavor: `现在是 ${clock}。${clockLine}`,
      fx: '时', fxTone: 'warm'
    },
    {
      id: 'home-picture', type: 'flavor', x: 211, y: WALL_H + 2, r: 24,
      label: '看看墙上的画',
      flavor: '画里是小镇还没盖房子时的样子：一片山坡，一条很细的小路，和很远的一盏灯。',
      fx: '画', fxTone: 'arcane'
    },
    {
      id: 'home-shelf', type: 'flavor', x: 276, y: WALL_H + 2, r: 24,
      label: '翻翻书架',
      flavor: BOOK_QUOTES[Math.floor(Math.random() * BOOK_QUOTES.length)],
      fx: '书', fxTone: 'arcane'
    }
  ];
}

export function createInterior() {
  const entry = { x: DOOR_X, y: WALL_H + ROOM_H - 30, dir: 'up' };
  const exitAnchor = { x: DOOR_X, y: WALL_H + ROOM_H - 4, r: 30, id: 'door', type: 'door', label: '离开公寓', fx: '门', fxTone: 'warm' };

  const api = {
    entry,
    exitAnchor,
    itemRect,

    layout(viewW, viewH = 270) {
      return roomLayout(viewW, viewH);
    },

    canStand(x, y, items) {
      if (x < 12 || x > ROOM_W - 12) return false;
      if (y < WALL_H + 8 || y > WALL_H + ROOM_H - 2) return false;
      const box = { x: x - 5, y: y - 7, w: 10, h: 7 };
      for (const solid of FIXED_SOLIDS) {
        if (rectOverlap(box, solid)) return false;
      }
      for (const item of items) {
        const def = FURNITURE[item.id];
        if (!def || !def.solid) continue;
        if (rectOverlap(box, itemRect(item))) return false;
      }
      return true;
    },

    canPlace(id, tx, ty, rot, items, player) {
      const def = FURNITURE[id];
      if (!def) return { ok: false, reason: '没有这件家具。' };
      const size = furnitureSize(id, rot);
      if (tx < 1 || ty < 1 || tx + size.w > ROOM_COLS - 1 || ty + size.h > ROOM_ROWS) {
        return { ok: false, reason: '这里放不下，换个位置试试。' };
      }
      if (ty + size.h > ROOM_ROWS - 1 && tx < 11 && tx + size.w > 8) {
        return { ok: false, reason: '门口要留一条能走的路。' };
      }
      const rect = { x: tx * TILE, y: WALL_H + ty * TILE, w: size.w * TILE, h: size.h * TILE };
      for (const solid of FIXED_SOLIDS) {
        if (rectOverlap(rect, solid)) return { ok: false, reason: '这里固定着一件家具。' };
      }
      for (const item of items) {
        const other = itemRect(item);
        if (!rectOverlap(rect, other)) continue;
        const otherSolid = Boolean(FURNITURE[item.id]?.solid);
        const thisSolid = Boolean(def.solid);
        if (otherSolid && thisSolid) return { ok: false, reason: '这里已经有家具了。' };
        if (!otherSolid && !thisSolid) return { ok: false, reason: '地毯不能叠在一起。' };
      }
      if (player) {
        const pbox = { x: player.x - 5, y: player.y - 7, w: 10, h: 7 };
        if (rectOverlap(pbox, rect)) return { ok: false, reason: '先走开一点，再放这里。' };
      }
      return { ok: true };
    },

    itemAt(tx, ty, items) {
      const x = tx * TILE;
      const y = WALL_H + ty * TILE;
      let rug = null;
      for (const item of items) {
        const r = itemRect(item);
        if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) {
          if (FURNITURE[item.id]?.solid) return item;
          rug = item;
        }
      }
      return rug;
    },

    nearestInteractable(player, items, day) {
      let best = null;
      let bestDist = Infinity;
      const doorDist = pointRectDistance(player.x, player.y, { x: DOOR_X - 24, y: WALL_H + ROOM_H - 14, w: 48, h: 14 });
      if (doorDist <= exitAnchor.r) {
        best = { ...exitAnchor, dist: doorDist };
        bestDist = doorDist;
      }
      for (const spot of wallInteractables(day)) {
        const dist = Math.hypot(player.x - spot.x, player.y - spot.y);
        if (dist > spot.r || dist >= bestDist) continue;
        best = { ...spot, dist };
        bestDist = dist;
      }
      for (const spot of fixedSpots(day)) {
        const dist = Math.hypot(player.x - spot.x, player.y - spot.y);
        if (dist > spot.r || dist >= bestDist) continue;
        best = { ...spot, dist };
        bestDist = dist;
      }
      for (const item of items) {
        const def = FURNITURE[item.id];
        if (!def) continue;
        const rect = itemRect(item);
        const dist = pointRectDistance(player.x, player.y, rect);
        if (dist > 19) continue;
        if (dist < bestDist) {
          best = {
            id: 'furniture',
            type: 'furniture',
            uid: item.uid,
            itemId: item.id,
            x: rect.x + rect.w / 2,
            y: rect.y + rect.h,
            r: 22,
            label: `${def.name} · ${def.interact.label}`,
            dist
          };
          bestDist = dist;
        }
      }
      return best;
    },

    render(ctx, time, state) {
      const { viewW, viewH = 270, player, items, ghost, editMode, lampOn, reduceMotion, day, drawPlayer } = state;
      const layout = roomLayout(viewW, viewH);
      const { ox, oy } = layout;
      ctx.fillStyle = '#090c14';
      ctx.fillRect(0, 0, viewW, viewH);

      ctx.save();
      ctx.translate(ox, oy);
      // outer timber frame
      px(ctx, -FRAME - 2, -FRAME - 2, ROOM_W + FRAME * 2 + 4, ROOM_TOTAL_H + FRAME * 2 + 4, '#2a1d15');
      px(ctx, -FRAME, -FRAME, ROOM_W + FRAME * 2, ROOM_TOTAL_H + FRAME * 2, '#5a4130');
      px(ctx, -FRAME + 2, -FRAME + 2, ROOM_W + FRAME * 2 - 4, ROOM_TOTAL_H + FRAME * 2 - 4, '#3f2d21');
      px(ctx, -3, -3, ROOM_W + 6, ROOM_TOTAL_H + 6, '#2b1e16');

      drawWall(ctx, time, day, state.wallpaper);
      drawFloor(ctx);
      drawBottomWall(ctx);
      drawRugMat(ctx);

      // rugs first
      const rugs = items.filter((i) => !FURNITURE[i.id]?.solid).sort((a, b) => a.y - b.y);
      for (const item of rugs) {
        drawFurniture(ctx, item.id, item.x * TILE, WALL_H + item.y * TILE, item.rot, time);
      }

      if (editMode) {
        const pulse = 0.35 + Math.sin(time * 0.004) * 0.2;
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = '#8fe3b0';
        for (let ty = 1; ty < ROOM_ROWS; ty++) {
          for (let tx = 1; tx < ROOM_COLS - 1; tx++) {
            if ((tx + ty) % 2 === 0) ctx.fillRect(tx * TILE, WALL_H + ty * TILE, TILE, TILE);
          }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = 'rgba(143, 227, 176, .16)';
        for (let ty = 1; ty <= ROOM_ROWS; ty++) {
          px(ctx, TILE, WALL_H + ty * TILE, (ROOM_COLS - 2) * TILE, 1, 'rgba(143, 227, 176, .13)');
        }
        for (let tx = 1; tx <= ROOM_COLS - 1; tx++) {
          px(ctx, tx * TILE, WALL_H + TILE, 1, (ROOM_ROWS - 1) * TILE, 'rgba(143, 227, 176, .13)');
        }
        ctx.globalAlpha = pulse;
        px(ctx, DOOR_X - 24, WALL_H + ROOM_H - 20, 48, 1, '#ffd166');
        ctx.globalAlpha = 1;
      }

      const solids = items.filter((i) => FURNITURE[i.id]?.solid);
      const drawables = solids.map((item) => {
        const r = itemRect(item);
        return {
          sortY: r.y + r.h,
          draw: () => drawFurniture(ctx, item.id, item.x * TILE, WALL_H + item.y * TILE, item.rot, time)
        };
      });
      for (const fixed of FIXED_FURNITURE) {
        drawables.push({ sortY: fixed.sortY, draw: () => fixed.draw(ctx, time) });
      }
      if (player) {
        drawables.push({
          sortY: player.lying ? 1e6 : player.sitting ? player.y + 8 : player.y,
          draw: () => drawPlayer(ctx)
        });
      }
      for (const actor of state.extraActors || []) {
        drawables.push({
          sortY: actor.lying ? 1e6 : actor.sitting ? actor.y + 8 : actor.y,
          draw: () => state.drawPeer?.(ctx, actor)
        });
      }
      drawables.sort((a, b) => a.sortY - b.sortY);
      for (const d of drawables) d.draw();

      if (editMode && ghost) {
        const size = furnitureSize(ghost.id, ghost.rot);
        const x = ghost.tx * TILE;
        const y = WALL_H + ghost.ty * TILE;
        const w = size.w * TILE;
        const h = size.h * TILE;
        ctx.globalAlpha = 0.34;
        ctx.fillStyle = ghost.valid ? '#8fe3b0' : '#ff7b88';
        ctx.fillRect(x, y, w, h);
        ctx.globalAlpha = 0.62;
        drawFurniture(ctx, ghost.id, x, y, ghost.rot, time);
        ctx.globalAlpha = 1;
        drawGoldCursor(ctx, ghost.tx, ghost.ty, size.w, size.h, ghost.valid ? '#8fe3b0' : '#ff7b88', 0.4);
      }

      ctx.restore();

      drawAmbient(ctx, viewW, viewH, layout, lampOn, day, time);
      if (!reduceMotion) drawDust(ctx, time, layout);
      // cursor stays readable above the ambient wash
      if (editMode && ghost) {
        ctx.save();
        ctx.translate(ox, oy);
        const size = furnitureSize(ghost.id, ghost.rot);
        drawGoldCursor(ctx, ghost.tx, ghost.ty, size.w, size.h, ghost.valid ? '#b8f7cf' : '#ffb1ba', 0.5);
        ctx.restore();
      }
      return layout;
    }
  };

  return api;
}
