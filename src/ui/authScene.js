function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

export function mountAuthBackdrop(canvas) {
  const ctx = canvas.getContext('2d');
  let raf = 0;
  let visible = false;
  let width = 480;
  let height = 270;
  let last = 0;
  let nextShoot = 3000 + Math.random() * 4000;
  const rand = mulberry32(20261028);

  const stars = Array.from({ length: 90 }, () => ({
    x: rand(),
    y: rand() * 0.5,
    s: rand() > 0.86 ? 2 : 1,
    p: rand() * Math.PI * 2,
    sp: 0.6 + rand() * 1.8
  }));
  const flies = Array.from({ length: 22 }, () => ({
    x: 0.05 + rand() * 0.9,
    y: 0.58 + rand() * 0.3,
    p: rand() * Math.PI * 2,
    sp: 0.3 + rand() * 0.9,
    r: 0.010 + rand() * 0.018
  }));
  const trees = [];
  for (let layer = 0; layer < 3; layer++) {
    const count = 16 + layer * 7;
    for (let i = 0; i < count; i++) {
      trees.push({
        layer,
        x: rand(),
        w: 0.035 + rand() * 0.035,
        h: 0.09 + rand() * 0.09,
        tone: rand()
      });
    }
  }
  trees.sort((a, b) => a.layer - b.layer);

  function resize() {
    const ratio = window.innerWidth / Math.max(1, window.innerHeight);
    height = 270;
    width = Math.round(height * ratio);
    if (width < 430) {
      width = 430;
      height = Math.min(560, Math.round(width / Math.max(0.42, ratio)));
    } else if (width > 760) {
      width = 760;
    }
    width = Math.max(430, width);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function drawSky(time) {
    const bands = [
      ['#0b1020', 0], ['#101830', 0.22], ['#1a2440', 0.38],
      ['#313353', 0.5], ['#5a4a63', 0.6], ['#8a6869', 0.67], ['#c98f70', 0.72]
    ];
    for (const [color, y] of bands) {
      px(ctx, 0, y * height, width, height, color);
    }
    const grad = ctx.createLinearGradient(0, 0, 0, height * 0.75);
    grad.addColorStop(0, 'rgba(8, 11, 23, 0.55)');
    grad.addColorStop(0.5, 'rgba(10, 14, 28, 0)');
    grad.addColorStop(1, 'rgba(10, 14, 28, 0.1)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    for (const st of stars) {
      const a = 0.45 + Math.sin(time * 0.001 * st.sp + st.p) * 0.4;
      ctx.fillStyle = `rgba(255, 240, 208, ${Math.max(0.06, a)})`;
      ctx.fillRect(Math.round(st.x * width), Math.round(st.y * height), st.s, st.s);
    }

    const mx = Math.round(width * 0.75);
    const my = Math.round(height * 0.2);
    ctx.fillStyle = 'rgba(255, 244, 210, 0.08)';
    ctx.beginPath();
    ctx.arc(mx, my, 30, 0, Math.PI * 2);
    ctx.fill();
    px(ctx, mx - 11, my - 11, 22, 22, '#f8edc9');
    px(ctx, mx - 13, my - 6, 26, 12, '#f8edc9');
    px(ctx, mx - 6, my - 13, 12, 26, '#f8edc9');
    px(ctx, mx - 9, my - 9, 18, 18, '#f4e5b9');
    px(ctx, mx - 4, my - 4, 4, 3, '#dcc99b');
    px(ctx, mx + 3, my + 3, 3, 3, '#dcc99b');
    px(ctx, mx - 7, my + 5, 2, 2, '#e3d1a4');

    const shoot = (time % 12000) < 420;
    if (shoot) {
      const p = (time % 12000) / 420;
      const sx = width * 0.18 + p * width * 0.24;
      const sy = height * 0.12 + p * height * 0.1;
      ctx.strokeStyle = `rgba(255, 248, 220, ${0.8 * (1 - p)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 18, sy - 8);
      ctx.stroke();
    }
  }

  function drawCloud(x, y, scale, alpha) {
    ctx.fillStyle = `rgba(20, 26, 47, ${alpha})`;
    const parts = [
      [0, 0, 30, 5], [6, -4, 22, 5], [14, -7, 14, 5], [-8, -2, 16, 4]
    ];
    for (const [dx, dy, w, h] of parts) {
      ctx.fillRect(Math.round(x + dx * scale), Math.round(y + dy * scale), Math.round(w * scale), Math.round(h * scale));
    }
  }

  function drawMountains() {
    const baseY = height * 0.64;
    ctx.fillStyle = '#3c3a55';
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(width * 0.08, baseY - 32);
    ctx.lineTo(width * 0.16, baseY - 12);
    ctx.lineTo(width * 0.27, baseY - 46);
    ctx.lineTo(width * 0.36, baseY - 16);
    ctx.lineTo(width * 0.47, baseY - 34);
    ctx.lineTo(width * 0.58, baseY - 8);
    ctx.lineTo(width * 0.68, baseY - 40);
    ctx.lineTo(width * 0.78, baseY - 14);
    ctx.lineTo(width * 0.9, baseY - 30);
    ctx.lineTo(width, baseY - 10);
    ctx.lineTo(width, baseY + 10);
    ctx.lineTo(0, baseY + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(233, 210, 210, 0.18)';
    ctx.beginPath();
    ctx.moveTo(width * 0.08, baseY - 32);
    ctx.lineTo(width * 0.105, baseY - 23);
    ctx.lineTo(width * 0.125, baseY - 26);
    ctx.lineTo(width * 0.16, baseY - 12);
    ctx.lineTo(width * 0.12, baseY - 12);
    ctx.closePath();
    ctx.fill();

    const base2 = height * 0.7;
    ctx.fillStyle = '#272b42';
    ctx.beginPath();
    ctx.moveTo(0, base2);
    ctx.lineTo(width * 0.12, base2 - 20);
    ctx.lineTo(width * 0.24, base2 - 6);
    ctx.lineTo(width * 0.38, base2 - 28);
    ctx.lineTo(width * 0.52, base2 - 4);
    ctx.lineTo(width * 0.63, base2 - 18);
    ctx.lineTo(width * 0.74, base2 - 8);
    ctx.lineTo(width * 0.87, base2 - 24);
    ctx.lineTo(width, base2 - 6);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
  }

  function drawTree(x, groundY, w, h, color, detailed) {
    const trunkW = Math.max(1, Math.round(w * 0.14));
    px(ctx, x - trunkW / 2, groundY - h * 0.35, trunkW, h * 0.35, '#151a27');
    const layers = 4;
    for (let i = 0; i < layers; i++) {
      const t = i / layers;
      const lw = w * (1 - t * 0.6);
      const ly = groundY - h * 0.3 - t * h * 0.7;
      const lh = h * 0.28;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x - lw / 2, ly + lh);
      ctx.lineTo(x, ly);
      ctx.lineTo(x + lw / 2, ly + lh);
      ctx.closePath();
      ctx.fill();
      if (detailed) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.moveTo(x, ly);
        ctx.lineTo(x + lw * 0.1, ly + lh * 0.6);
        ctx.lineTo(x, ly + lh * 0.4);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawTrees() {
    const groundY = height * 0.76;
    for (const t of trees) {
      const cols = ['#141c2b', '#182233', '#1d283a'];
      const x = t.x * width;
      const yy = groundY + t.layer * 8 + (t.tone - 0.5) * 6;
      drawTree(x, yy, t.w * width, t.h * height, cols[t.layer], t.layer === 2);
    }
  }

  function drawLake(time) {
    const y = height * 0.78;
    const grad = ctx.createLinearGradient(0, y, 0, height);
    grad.addColorStop(0, '#1b2842');
    grad.addColorStop(1, '#0b1322');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, width, height - y);
    for (let i = 0; i < 16; i++) {
      const yy = y + 4 + i * 5;
      const w = (0.04 + ((i * 37) % 17) / 100) * width;
      const x = (0.56 + Math.sin(i * 2.1) * 0.18 + Math.sin(time * 0.0004 + i) * 0.006) * width;
      ctx.fillStyle = `rgba(226, 174, 126, ${0.06 + (i % 3) * 0.02})`;
      ctx.fillRect(x, yy, w, 1);
    }
    const moonX = width * 0.75;
    for (let i = 0; i < 10; i++) {
      const w = 26 - i * 2;
      ctx.fillStyle = `rgba(248, 237, 201, ${0.1 - i * 0.008})`;
      ctx.fillRect(moonX - w / 2, y + 10 + i * 3, w, 1);
    }
  }

  function drawCabin(time) {
    const x = width * 0.255;
    const y = height * 0.735;
    const w = 82;
    const h = 46;
    ctx.save();
    ctx.translate(Math.round(x - w / 2), Math.round(y - h));

    px(ctx, 0, 20, w, h - 8, '#3a2f30');
    px(ctx, 2, 24, w - 4, h - 14, '#5a443b');
    px(ctx, 2, 24, w - 4, 5, '#6c5145');
    for (let i = 0; i < 3; i++) {
      px(ctx, 8 + i * 24, 33, 16, 9, '#241d24');
      px(ctx, 9 + i * 24, 34, 14, 7, i === 1 ? '#ffcf7d' : '#7a684f');
      if (i === 1) {
        px(ctx, 12 + i * 24, 36, 3, 3, '#fff0c2');
      }
    }
    px(ctx, 34, 45, 14, 21, '#2a2024');
    px(ctx, 35, 46, 12, 20, '#3c2a2c');
    px(ctx, 41, 54, 2, 2, '#e5b95e');
    px(ctx, 40, 48, 2, 30, '#18141a');
    px(ctx, 51, 29, 18, 12, '#18141a');
    px(ctx, 52, 30, 16, 10, '#ffd98b');
    px(ctx, 54, 30, 1, 10, '#241d24');
    px(ctx, 59, 30, 1, 10, '#241d24');
    px(ctx, 65, 30, 1, 10, '#241d24');
    ctx.fillStyle = '#2a2026';
    ctx.beginPath();
    ctx.moveTo(-8, 22);
    ctx.lineTo(w * 0.22, 3);
    ctx.lineTo(w * 0.78, 3);
    ctx.lineTo(w + 8, 22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a2d33';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(2 + i * 19, 13 - i, 14, 2);
    }
    px(ctx, 16, -8, 7, 14, '#2c2430');
    px(ctx, 18, -10, 3, 2, '#544451');
    const t = time * 0.001;
    for (let i = 0; i < 6; i++) {
      const p = ((t * 0.35 + i * 0.16) % 1);
      const sx = 19 + Math.sin((p + i) * 5) * 5 + p * 6;
      const sy = -12 - p * 34;
      const alpha = (1 - p) * 0.24;
      const s = 2 + Math.floor(p * 3);
      ctx.fillStyle = `rgba(210, 200, 205, ${alpha})`;
      ctx.fillRect(Math.round(sx), Math.round(sy), s, s);
    }
    const glow = ctx.createRadialGradient(44, 34, 2, 44, 34, 34);
    glow.addColorStop(0, 'rgba(255, 205, 120, 0.22)');
    glow.addColorStop(1, 'rgba(255, 205, 120, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-30, -10, w + 60, h + 40);
    ctx.restore();
  }

  function drawPath() {
    ctx.fillStyle = '#18202c';
    ctx.beginPath();
    ctx.moveTo(width * 0.24, height * 0.78);
    ctx.lineTo(width * 0.32, height * 0.78);
    ctx.lineTo(width * 0.46, height);
    ctx.lineTo(width * 0.2, height);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      const x = width * (0.27 + t * 0.13 + Math.sin(i * 1.7) * 0.008);
      const y = height * (0.8 + t * 0.19);
      px(ctx, x, y, 5 - t * 2, 2, i % 3 === 0 ? '#3e4450' : '#2a303c');
    }
  }

  function drawFlowers() {
    const spots = [
      [0.08, 0.88, '#8fe3b0'], [0.14, 0.94, '#c9a7ff'], [0.36, 0.9, '#ffd166'],
      [0.42, 0.96, '#ff9f90'], [0.62, 0.93, '#8fe3b0'], [0.7, 0.88, '#ffd166'],
      [0.86, 0.95, '#c9a7ff'], [0.54, 0.87, '#ff9f90']
    ];
    for (const [fx, fy, c] of spots) {
      const x = fx * width;
      const y = fy * height;
      px(ctx, x + 1, y + 2, 1, 3, '#2e4a37');
      px(ctx, x, y, 3, 2, c);
      px(ctx, x + 1, y - 1, 1, 1, c);
    }
  }

  function drawFireflies(time) {
    for (const f of flies) {
      const x = (f.x + Math.sin(time * 0.00035 * f.sp + f.p) * f.r) * width;
      const y = (f.y + Math.cos(time * 0.0005 * f.sp + f.p * 1.4) * f.r * 0.6) * height;
      const glow = 0.35 + Math.sin(time * 0.002 * f.sp + f.p) * 0.3;
      ctx.fillStyle = `rgba(255, 219, 130, ${Math.max(0.05, glow * 0.16)})`;
      ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
      ctx.fillStyle = `rgba(255, 235, 170, ${Math.max(0.1, glow)})`;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  function draw(time) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    drawSky(time);
    drawCloud(width * 0.14, height * 0.3, 1.4, 0.24);
    drawCloud(width * 0.58, height * 0.24, 0.9, 0.18);
    drawMountains();
    drawTrees();
    drawLake(time);
    drawPath();
    drawCabin(time);
    drawFlowers();
    drawFireflies(time);
    const vig = ctx.createLinearGradient(0, 0, 0, height);
    vig.addColorStop(0, 'rgba(5, 8, 16, 0.3)');
    vig.addColorStop(0.55, 'rgba(5, 8, 16, 0.04)');
    vig.addColorStop(1, 'rgba(5, 8, 16, 0.32)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }

  function loop(now) {
    if (!visible) return;
    raf = requestAnimationFrame(loop);
    if (now - last < 33) return;
    last = now;
    draw(now);
  }

  resize();
  draw(0);
  window.addEventListener('resize', () => {
    resize();
    if (visible) draw(performance.now());
  });

  return {
    show() {
      if (visible) return;
      visible = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    },
    hide() {
      visible = false;
      cancelAnimationFrame(raf);
    }
  };
}
