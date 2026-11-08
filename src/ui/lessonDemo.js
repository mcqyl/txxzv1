import { drawPlayer, paletteForName } from '../game/sprites.js';

const W = 120;
const H = 44;
const GROUND = 34;
const START_X = 15;
const GOAL_X = 103;

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function mix(time, speed, min, max) {
  return min + (Math.sin(time * speed) + 1) / 2 * (max - min);
}

function drawSky(ctx, time, courseId) {
  const skies = {
    python: ['#0d1a22', '#132b31'],
    web: ['#221a2c', '#39283b'],
    sql: ['#141327', '#242048'],
    data: ['#0b1426', '#172341']
  };
  const [top, bottom] = skies[courseId] || skies.python;
  for (let i = 0; i < H; i++) {
    const t = i / H;
    ctx.fillStyle = i < GROUND ? (t < 0.6 ? top : bottom) : '#101820';
    ctx.fillRect(0, i, W, 1);
  }
  const stars = courseId === 'web' ? 12 : 22;
  for (let i = 0; i < stars; i++) {
    const x = (i * 37 + 11) % W;
    const y = (i * 13 + 3) % 22;
    const twinkle = (Math.sin(time * 0.0012 + i * 1.7) + 1) / 2;
    ctx.globalAlpha = 0.2 + twinkle * 0.65;
    rect(ctx, x, y, 1, 1, i % 5 === 0 ? '#ffd166' : '#d7e9ff');
  }
  ctx.globalAlpha = 1;
  rect(ctx, 0, GROUND, W, H - GROUND, '#17251f');
  rect(ctx, 0, GROUND, W, 1, '#2c4638');
  rect(ctx, 0, H - 4, W, 4, '#0e1714');
  for (let x = 2; x < W; x += 7) {
    rect(ctx, x, GROUND + 4 + (x % 3), 3, 1, '#21352b');
  }
}

function drawPythonScene(ctx, time, x, result) {
  rect(ctx, 24, 19, 4, 15, '#4a3428');
  rect(ctx, 25, 19, 1, 15, '#614636');
  for (let i = 0; i < 5; i++) {
    const sway = Math.sin(time * 0.0014 + i) * 1.5;
    rect(ctx, 18 + i * 3 + sway, 14 - (i % 2), 5, 3, i % 2 ? '#2f6d56' : '#3f8a6b');
  }
  rect(ctx, 21, 17, 7, 2, '#285b49');
  // fireflies
  for (let i = 0; i < 7; i++) {
    const fx = 32 + ((i * 19 + time * 0.006 * (i % 2 ? 1 : -1)) % 60 + 60) % 60;
    const fy = 13 + (i * 7) % 14 + Math.sin(time * 0.002 + i) * 1.5;
    ctx.globalAlpha = 0.35 + (Math.sin(time * 0.004 + i) + 1) / 4;
    rect(ctx, fx, fy, 1, 1, '#d9f7a6');
  }
  ctx.globalAlpha = 1;
  // little terminal rock near the goal
  rect(ctx, 87, 27, 14, 7, '#2a3442');
  rect(ctx, 88, 26, 12, 6, '#3b4b5c');
  rect(ctx, 90, 28, 8, 3, '#0c1117');
  const cursorOn = Math.floor(time / 420) % 2 === 0;
  rect(ctx, 96, 29, 1, 1, cursorOn ? '#8fe3b0' : '#2f5d47');
  if (result === 'success') {
    for (let i = 0; i < 6; i++) {
      const hx = 90 + i * 2;
      const hy = 25 - Math.abs(Math.sin(time * 0.003 + i)) * 4;
      rect(ctx, hx, hy, 1, 1, '#ffd166');
    }
  }
}

function drawWebScene(ctx, time) {
  // workshop frame
  rect(ctx, 66, 17, 30, 17, '#1c1722');
  rect(ctx, 67, 18, 28, 15, '#2a2230');
  rect(ctx, 68, 28, 26, 6, '#6b4c38');
  rect(ctx, 68, 28, 26, 1, '#8a6449');
  rect(ctx, 70, 21, 9, 7, '#3f3348');
  rect(ctx, 81, 21, 11, 7, '#44364e');
  // roof under construction
  for (let i = 0; i < 5; i++) {
    const off = i * 3;
    rect(ctx, 65 + off, 17 - i * 2, 32 - off * 2, 2, i % 2 ? '#8f4f4a' : '#a75f57');
  }
  // paint bucket + spark
  rect(ctx, 57, 30, 5, 4, '#455a7c');
  rect(ctx, 58, 29, 3, 1, '#7f98bd');
  const paint = Math.floor(time / 500) % 2 === 0;
  rect(ctx, 59, 34, 1, 1, paint ? '#8ecae6' : '#f4e8ce');
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 3; i++) {
    const sx = 62 + i * 2;
    const sy = 24 - Math.sin(time * 0.003 + i) * 2;
    rect(ctx, sx, sy, 1, 3, '#ffd166');
  }
  ctx.globalAlpha = 1;
}

function drawSqlScene(ctx, time, result) {
  const pillars = [33, 51, 69];
  pillars.forEach((x, i) => {
    const glow = result === 'success' ? 0.9 : 0.35 + (Math.sin(time * 0.0018 + i) + 1) * 0.18;
    ctx.globalAlpha = glow;
    rect(ctx, x, 20, 7, 14, '#31285c');
    rect(ctx, x + 1, 18, 5, 16, '#4a3d84');
    rect(ctx, x + 2, 21, 3, 10, i === 1 && result === 'success' ? '#ffd166' : '#9a86e0');
    rect(ctx, x + 3, 17, 1, 2, '#d8ccff');
    ctx.globalAlpha = 1;
  });
  // floating record cards
  for (let i = 0; i < 4; i++) {
    const fx = 30 + ((i * 23 + time * 0.01) % 55);
    const fy = 12 + Math.sin(time * 0.0016 + i) * 3;
    ctx.globalAlpha = 0.35;
    rect(ctx, fx, fy, 5, 4, '#7f6bb5');
    rect(ctx, fx + 1, fy + 1, 3, 1, '#d8ccff');
    ctx.globalAlpha = 1;
  }
  if (result === 'success') {
    rect(ctx, 32, 16, 1, 1, '#ffd166');
    rect(ctx, 52, 12, 1, 1, '#ffd166');
    rect(ctx, 71, 18, 1, 1, '#ffd166');
  }
}

function drawDataScene(ctx, time, result) {
  // observatory telescope
  rect(ctx, 31, 30, 8, 2, '#52647e');
  rect(ctx, 34, 21, 2, 10, '#6d809b');
  rect(ctx, 33, 18, 10, 4, '#8fa7c6');
  rect(ctx, 41, 17, 4, 3, '#c6d8ef');
  const tilt = Math.sin(time * 0.0008) * 0.6;
  ctx.save();
  ctx.translate(40, 20);
  ctx.rotate(tilt);
  rect(ctx, -8, -1, 12, 3, '#8fa7c6');
  ctx.restore();
  // growing bars
  const bars = [5, 9, 7, 12, 10];
  bars.forEach((h, i) => {
    const grow = result === 'success' ? 1 : Math.min(1, time / 1400);
    const bh = Math.max(1, Math.round(h * grow));
    rect(ctx, 60 + i * 4, GROUND - bh, 3, bh, i === 3 ? '#ffd166' : '#5c8f83');
  });
  // constellation
  const pts = [[22, 8], [28, 4], [36, 7], [45, 3], [52, 8]];
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < pts.length; i++) {
    rect(ctx, pts[i][0], pts[i][1], 1, 1, '#d7e9ff');
    if (i) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let s = 0; s <= steps; s++) {
        rect(ctx, x0 + (x1 - x0) * s / steps, y0 + (y1 - y0) * s / steps, 1, 1, '#5f7aa8');
      }
    }
  }
  ctx.globalAlpha = 1;
}

function drawDefaultScene(ctx, time) {
  rect(ctx, 30, 22, 2, 12, '#52647e');
  rect(ctx, 22, 18, 18, 5, '#6b7f55');
  for (let i = 0; i < 4; i++) {
    rect(ctx, 76 + i * 5, GROUND - 4 - i * 2, 3, 4 + i * 2, '#5c8f83');
  }
}

function drawGoal(ctx, time, success) {
  rect(ctx, GOAL_X, 22, 1, 12, '#8b7355');
  rect(ctx, GOAL_X + 1, 22, 7, 4, success ? '#8fe3b0' : '#d7c6a7');
  const wave = Math.floor(time / 240) % 2;
  if (wave) rect(ctx, GOAL_X + 6, 23, 1, 2, success ? '#5cb98a' : '#b9a98c');
  rect(ctx, GOAL_X - 2, GROUND - 1, 5, 1, '#31251c');
}

function drawConfetti(ctx, time) {
  const colors = ['#ffd166', '#8fe3b0', '#8ecae6', '#f3b7c8', '#fbf2dd'];
  for (let i = 0; i < 24; i++) {
    const life = ((time * 0.06 + i * 37) % 900) / 900;
    const x = 40 + (i * 31) % 70 + Math.sin(time * 0.003 + i) * 2;
    const y = 6 + life * 26;
    ctx.globalAlpha = 1 - life * 0.7;
    rect(ctx, x, y, 1, 1, colors[i % colors.length]);
  }
  ctx.globalAlpha = 1;
}

function drawBubble(ctx, x, y, kind, time) {
  const w = kind === 'success' ? 8 : 10;
  const h = 8;
  const left = Math.max(2, Math.min(W - w - 2, x - w / 2));
  const top = Math.max(2, y - h);
  rect(ctx, left + 1, top, w, h, '#f7edd7');
  rect(ctx, left, top + 1, w + 2, h - 2, '#f7edd7');
  rect(ctx, left + 4, top + h, 2, 2, '#f7edd7');
  if (kind === 'success') {
    rect(ctx, left + 3, top + 3, 1, 1, '#2f6d56');
    rect(ctx, left + 4, top + 4, 1, 1, '#2f6d56');
    rect(ctx, left + 5, top + 3, 1, 1, '#2f6d56');
    rect(ctx, left + 6, top + 2, 1, 1, '#2f6d56');
    rect(ctx, left + 7, top + 1, 1, 1, '#2f6d56');
  } else {
    const blink = Math.floor(time / 300) % 2 === 0;
    rect(ctx, left + 4, top + 1, 2, 4, blink ? '#b9544f' : '#d9776f');
    rect(ctx, left + 4, top + 6, 2, 1, '#b9544f');
  }
}

export function createDemoStage(canvas, { playerName = '小苔' } = {}) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const palette = paletteForName(playerName);
  let courseId = 'python';
  let demo = 'default';
  let mode = 'idle';
  let startedAt = 0;
  let targetX = START_X;
  let result = null;
  let stage = 0;
  let raf = 0;
  let destroyed = false;

  function frame(now) {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (!ctx) return;
    ctx.save();
    ctx.scale(4, 4);
    drawSky(ctx, now, courseId);
    if (courseId === 'python') drawPythonScene(ctx, now, 0, result);
    else if (courseId === 'web') drawWebScene(ctx, now);
    else if (courseId === 'sql') drawSqlScene(ctx, now, result);
    else if (courseId === 'data') drawDataScene(ctx, now, result);
    else drawDefaultScene(ctx, now);

    drawGoal(ctx, now, result === 'success');
    const elapsed = now - startedAt;
    let x = START_X;
    let moving = false;
    if (mode === 'run') {
      const p = Math.min(1, elapsed / 900);
      const ease = 1 - Math.pow(1 - p, 3);
      x = START_X + (targetX - START_X) * ease;
      moving = p < 0.96;
    } else if (mode === 'done') {
      x = targetX;
    }
    if (mode === 'result' && result === 'fail') {
      x = targetX + Math.sin(elapsed * 0.035) * 0.9;
    }
    if (mode === 'result' && result === 'success') {
      x = targetX + Math.sin(elapsed * 0.006) * 1.2;
    }
    const frameIndex = Math.floor(now / 130) % 4;
    const facing = targetX >= START_X ? 'right' : 'left';
    drawPlayer(ctx, x, GROUND + 1, facing, frameIndex, palette, moving);
    // progress markers
    for (let i = 0; i < 8; i++) {
      const mx = START_X + (GOAL_X - START_X) * (i / 8);
      const reached = progressReached(mx, x);
      rect(ctx, mx, GROUND + 2, 1, 1, reached ? '#8fe3b0' : '#2f4a3c');
    }
    if (mode === 'result' && result === 'success') {
      drawConfetti(ctx, now);
      drawBubble(ctx, x, 10 + Math.sin(now * 0.005) * 1.5, 'success', now);
      for (let i = 0; i < 5; i++) {
        const sx = x - 8 + i * 4;
        const sy = 13 - Math.abs(Math.sin(now * 0.006 + i)) * 5;
        rect(ctx, sx, sy, 1, 1, i % 2 ? '#ffd166' : '#fff6e2');
      }
    } else if (mode === 'result' && result === 'fail') {
      drawBubble(ctx, x, 12, 'fail', now);
      const stopX = Math.max(18, Math.min(98, x));
      ctx.globalAlpha = 0.8;
      rect(ctx, stopX - 2, GROUND - 1, 4, 1, '#d9776f');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function progressReached(markerX, x) {
    return markerX <= x + 0.5;
  }

  function setLesson(course, lesson, meta) {
    courseId = course?.id || 'python';
    demo = meta?.demo || 'default';
    mode = 'idle';
    result = null;
    stage = 0;
    targetX = START_X;
    startedAt = performance.now();
  }

  function run({ passed, stage: stopStage = 0.5 }) {
    result = passed ? 'success' : 'fail';
    stage = Math.max(0, Math.min(1, stopStage));
    targetX = passed ? GOAL_X - 4 : START_X + (GOAL_X - START_X) * Math.max(0.22, stage);
    startedAt = performance.now();
    mode = 'run';
    setTimeout(() => {
      if (!destroyed && mode === 'run') mode = 'result';
    }, 930);
  }

  function reset() {
    mode = 'idle';
    result = null;
    targetX = START_X;
    stage = 0;
    startedAt = performance.now();
  }

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(raf);
  }

  startedAt = performance.now();
  raf = requestAnimationFrame(frame);
  return {
    setLesson,
    run,
    reset,
    destroy,
    get demo() {
      return demo;
    },
    get courseId() {
      return courseId;
    },
    get mode() {
      return mode;
    }
  };
}
