const W = 160;
const H = 66;
const GROUND = 50;

const THEMES = {
  python: { sky: ['#0a1520', '#153138'], ground: '#14251d', accent: '#8fe3b0', soft: '#d9f7a6', label: 'PYTHON' },
  web: { sky: ['#191426', '#33243b'], ground: '#241b2a', accent: '#8ecae6', soft: '#f3b7c8', label: 'WEB' },
  sql: { sky: ['#100f21', '#211c42'], ground: '#19162f', accent: '#c9a7ff', soft: '#ffd166', label: 'SQL' },
  data: { sky: ['#081226', '#14233f'], ground: '#121d2d', accent: '#ffd166', soft: '#8ecae6', label: 'DATA' }
};

function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function line(ctx, x0, y0, x1, y1, color) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    rect(ctx, x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps, 1, 1, color);
  }
}

function drawBackdrop(ctx, time, theme) {
  for (let i = 0; i < H; i++) {
    const t = i / H;
    const top = theme.sky[0];
    const bottom = theme.sky[1];
    ctx.fillStyle = i < GROUND ? (t < 0.55 ? top : bottom) : theme.ground;
    ctx.fillRect(0, i, W, 1);
  }
  for (let i = 0; i < 34; i++) {
    const x = (i * 47 + 13) % W;
    const y = (i * 17 + 5) % 36;
    const tw = (Math.sin(time * 0.0014 + i * 1.3) + 1) / 2;
    ctx.globalAlpha = 0.15 + tw * 0.6;
    rect(ctx, x, y, 1, 1, i % 6 === 0 ? theme.soft : '#dfeaff');
  }
  ctx.globalAlpha = 1;
  rect(ctx, 0, GROUND, W, H - GROUND, theme.ground);
  rect(ctx, 0, GROUND, W, 1, 'rgba(255,255,255,.12)');
  for (let x = 3; x < W; x += 9) {
    rect(ctx, x, GROUND + 5 + (x % 4), 4, 1, 'rgba(255,255,255,.05)');
  }
}

function drawFigure(ctx, x, y, theme, time, scale = 1) {
  const bob = Math.sin(time * 0.002) * 0.6;
  rect(ctx, x - 3 * scale, y - 9 * scale + bob, 6 * scale, 6 * scale, '#2a3448');
  rect(ctx, x - 2 * scale, y - 12 * scale + bob, 4 * scale, 4 * scale, '#f0cfae');
  rect(ctx, x - 2 * scale, y - 13 * scale + bob, 4 * scale, 1.4 * scale, '#2b241f');
  rect(ctx, x - 3 * scale, y - 3 * scale, 2 * scale, 3 * scale, '#3b4b63');
  rect(ctx, x + scale, y - 3 * scale, 2 * scale, 3 * scale, '#3b4b63');
  rect(ctx, x - 3 * scale, y - 8 * scale + bob, 1 * scale, 4 * scale, theme.accent);
}

function drawPython(ctx, time, slide, theme) {
  // big tree
  rect(ctx, 16, 28, 6, 23, '#3c2c24');
  rect(ctx, 18, 29, 2, 22, '#543d2e');
  for (let i = 0; i < 7; i++) {
    const sway = Math.sin(time * 0.0016 + i) * 1.4;
    rect(ctx, 8 + i * 2.6 + sway, 22 - Math.abs(i - 3) * 1.5, 7, 4, i % 2 ? '#2f6d56' : '#3f8a6b');
  }
  // snake around the trunk
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const x = 19 + Math.sin(t * Math.PI * 2 + time * 0.0012) * 7;
    const y = 45 - t * 20;
    rect(ctx, x, y, 2, 2, i === 11 ? '#d9f7a6' : i % 2 ? '#4f9f77' : '#2f6d56');
    if (i === 11) rect(ctx, x + 1, y, 1, 1, '#1d2636');
  }
  if (slide >= 1) {
    // terminal pedestal
    rect(ctx, 118, 38, 24, 12, '#222b39');
    rect(ctx, 120, 33, 20, 8, '#334154');
    rect(ctx, 122, 34, 16, 5, '#0b1118');
    const bx = 123 + (Math.floor(time / 400) % 6) * 2;
    rect(ctx, 123, 36, Math.min(13, bx - 122), 1, '#8fe3b0');
    if (slide >= 2) {
      const icons = [[105, 20], [128, 16], [145, 26], [94, 32]];
      icons.forEach(([x, y], i) => {
        const fy = y + Math.sin(time * 0.002 + i) * 1.5;
        ctx.globalAlpha = 0.8;
        rect(ctx, x, fy, 4, 4, i % 2 ? theme.soft : theme.accent);
        rect(ctx, x + 1, fy + 1, 2, 2, '#10161f');
        ctx.globalAlpha = 1;
      });
    }
  }
  if (slide >= 3) {
    rect(ctx, 78, 43, 14, 7, '#7b5138');
    rect(ctx, 79, 40, 12, 4, '#a56f4b');
    rect(ctx, 83, 38, 4, 2, '#ffd166');
    rect(ctx, 92, 45, 8, 5, '#52647e');
    rect(ctx, 93, 43, 6, 2, '#7f98bd');
  }
  drawFigure(ctx, 64, GROUND + 1, theme, time);
}

function drawWeb(ctx, time, slide, theme) {
  // drawing desk
  rect(ctx, 22, 39, 30, 3, '#6b4c38');
  rect(ctx, 25, 42, 3, 8, '#54382a');
  rect(ctx, 46, 42, 3, 8, '#54382a');
  rect(ctx, 26, 34, 14, 5, '#f2e5cc');
  rect(ctx, 28, 35, 10, 1, '#9d8f78');
  rect(ctx, 28, 37, 7, 1, '#9d8f78');
  if (slide >= 1) {
    // stacked tags
    const blocks = [
      [70, 38, 20, 5, '#a75f57'], [72, 32, 16, 5, '#8ecae6'], [74, 26, 12, 5, '#8fe3b0']
    ];
    blocks.forEach(([x, y, w, h, c], i) => {
      const drop = slide >= 2 ? 0 : Math.max(0, 1 - time / 900) * (10 + i * 5);
      rect(ctx, x, y - drop, w, h, c);
      rect(ctx, x + 1, y + 1 - drop, w - 2, 1, 'rgba(255,255,255,.35)');
    });
    if (slide >= 2) {
      // painted roof
      for (let i = 0; i < 6; i++) {
        rect(ctx, 92 + i * 2, 41 - i * 2, 20 - i * 3, 2, i % 2 ? '#b9715f' : '#d08a72');
      }
      rect(ctx, 98, 42, 12, 8, '#7a5137');
      rect(ctx, 102, 45, 4, 5, '#ffd166');
      rect(ctx, 93, 46, 3, 2, theme.accent);
      const spark = (Math.sin(time * 0.004) + 1) / 2;
      ctx.globalAlpha = 0.4 + spark * 0.6;
      rect(ctx, 108, 39, 1, 3, '#ffd166');
      rect(ctx, 107, 40, 3, 1, '#ffd166');
      ctx.globalAlpha = 1;
    }
  }
  if (slide >= 3) {
    // browser window
    rect(ctx, 122, 24, 30, 22, '#d7dee9');
    rect(ctx, 122, 24, 30, 4, '#455a7c');
    rect(ctx, 124, 25, 2, 2, '#f3b7c8');
    rect(ctx, 127, 25, 2, 2, '#ffd166');
    rect(ctx, 130, 25, 2, 2, '#8fe3b0');
    rect(ctx, 125, 31, 24, 12, '#fbf2dd');
    rect(ctx, 134, 34, 6, 5, '#a56f4b');
    rect(ctx, 132, 32, 10, 2, '#b9715f');
  }
  drawFigure(ctx, 60, GROUND + 1, theme, time);
}

function drawSql(ctx, time, slide, theme) {
  const pillars = [38, 62, 86, 110];
  pillars.forEach((x, i) => {
    rect(ctx, x, 28, 10, 22, '#2a2452');
    rect(ctx, x + 1, 26, 8, 24, '#3d3470');
    ctx.globalAlpha = 0.5 + (Math.sin(time * 0.0017 + i) + 1) * 0.2;
    rect(ctx, x + 3, 30, 4, 14, i === slide % 4 ? theme.soft : theme.accent);
    ctx.globalAlpha = 1;
    rect(ctx, x + 4, 24, 2, 2, '#e0d6ff');
  });
  if (slide >= 0) {
    for (let i = 0; i < 3; i++) {
      const width = 16 + i * 9;
      const x = 57 - width / 2;
      const y = 15 + i * 3;
      ctx.globalAlpha = 0.16;
      rect(ctx, x, y, width, 2, theme.accent);
      rect(ctx, x, y + 4, width, 2, theme.accent);
      ctx.globalAlpha = 1;
    }
  }
  if (slide >= 1) {
    // query beam
    const scan = 32 + (Math.sin(time * 0.0016) + 1) / 2 * 80;
    ctx.globalAlpha = 0.5;
    rect(ctx, scan, 18, 1, 30, theme.soft);
    ctx.globalAlpha = 1;
  }
  if (slide >= 2) {
    for (let i = 0; i < 5; i++) {
      const fx = 24 + ((i * 31 + time * 0.012) % 110);
      const fy = 10 + (i * 9) % 22 + Math.sin(time * 0.002 + i) * 1.5;
      ctx.globalAlpha = 0.55;
      rect(ctx, fx, fy, 6, 4, '#56488f');
      rect(ctx, fx + 1, fy + 1, 4, 1, '#d8ccff');
      ctx.globalAlpha = 1;
    }
  }
  if (slide >= 3) {
    // archive door
    rect(ctx, 122, 24, 22, 26, '#241f45');
    rect(ctx, 124, 26, 18, 24, '#4a3d84');
    rect(ctx, 132, 26, 1, 24, '#241f45');
    rect(ctx, 134, 38, 1, 3, '#ffd166');
  }
  drawFigure(ctx, 76, GROUND + 1, theme, time);
}

function drawData(ctx, time, slide, theme) {
  // stars/constellation
  const pts = [[20, 12], [30, 7], [41, 12], [52, 6], [64, 11]];
  pts.forEach(([x, y], i) => {
    rect(ctx, x, y, 1, 1, '#dfeaff');
    if (i) line(ctx, pts[i - 1][0], pts[i - 1][1], x, y, 'rgba(143,227,176,.35)');
  });
  // observatory
  rect(ctx, 104, 33, 28, 17, '#2c3550');
  rect(ctx, 108, 27, 20, 7, '#3c4867');
  rect(ctx, 112, 23, 12, 5, '#52647e');
  const tilt = Math.sin(time * 0.0007) * 0.8;
  ctx.save();
  ctx.translate(118, 22);
  ctx.rotate(tilt);
  rect(ctx, -2, -2, 16, 3, '#8fa7c6');
  ctx.restore();
  if (slide >= 1) {
    // list of numbers
    const cols = slide >= 2 ? 5 : 3;
    for (let i = 0; i < cols; i++) {
      const h = (6 + i * 3) * (slide >= 2 ? Math.min(1, time / 1000) : 0.5);
      rect(ctx, 32 + i * 7, GROUND - h, 5, h, i === cols - 1 ? theme.soft : '#5c8f83');
    }
  }
  if (slide >= 3) {
    rect(ctx, 38, 36, 30, 9, '#7b5138');
    rect(ctx, 40, 33, 26, 5, '#a56f4b');
    rect(ctx, 45, 38, 3, 4, '#ffd166');
    rect(ctx, 54, 38, 3, 4, '#ffd166');
    rect(ctx, 62, 38, 3, 4, '#ffd166');
  }
  drawFigure(ctx, 88, GROUND + 1, theme, time);
}

export function showCourseStory(host, course, story, { onDone } = {}) {
  if (!host || !story?.slides?.length) {
    onDone?.({ skipped: false });
    return null;
  }
  const theme = THEMES[story.art] || THEMES.python;
  const overlay = document.createElement('div');
  overlay.className = 'lesson-story';
  document.body.classList.add('is-story-open');
  overlay.innerHTML = `
    <div class="story-shell">
      <header class="story-top">
        <span class="story-brand">苔溪故事课 · ${theme.label}</span>
        <button type="button" class="story-skip" data-story="skip">跳过故事</button>
      </header>
      <div class="story-stage-wrap">
        <canvas class="story-canvas" width="${W * 4}" height="${H * 4}" aria-hidden="true"></canvas>
        <span class="story-year" data-story-year></span>
        <div class="story-chapter">
          <p class="story-subtitle">${story.subtitle || ''}</p>
          <h2 data-story-title></h2>
          <p class="story-text" data-story-text></p>
        </div>
      </div>
      <footer class="story-foot">
        <div class="story-dots" data-story-dots></div>
        <div class="story-actions">
          <button type="button" class="story-btn" data-story="prev">上一步</button>
          <button type="button" class="story-btn is-primary" data-story="next">下一步</button>
        </div>
      </footer>
    </div>`;
  host.appendChild(overlay);

  const canvas = overlay.querySelector('.story-canvas');
  const ctx = canvas?.getContext('2d');
  const yearEl = overlay.querySelector('[data-story-year]');
  const titleEl = overlay.querySelector('[data-story-title]');
  const textEl = overlay.querySelector('[data-story-text]');
  const dotsEl = overlay.querySelector('[data-story-dots]');
  const prevBtn = overlay.querySelector('[data-story="prev"]');
  const nextBtn = overlay.querySelector('[data-story="next"]');
  let index = 0;
  let raf = 0;
  let typeTimer = 0;
  let fullText = '';
  let typed = 0;
  let slideAt = performance.now();
  let finished = false;

  if (ctx) ctx.imageSmoothingEnabled = false;

  function renderDots() {
    dotsEl.innerHTML = story.slides.map((_, i) => `<i class="${i === index ? 'is-on' : ''}"></i>`).join('');
  }

  function startTyping(text) {
    clearInterval(typeTimer);
    fullText = text;
    typed = 0;
    textEl.textContent = '';
    textEl.classList.add('is-typing');
    typeTimer = setInterval(() => {
      typed += 2;
      textEl.textContent = fullText.slice(0, typed);
      if (typed >= fullText.length) {
        clearInterval(typeTimer);
        typeTimer = 0;
        textEl.classList.remove('is-typing');
      }
    }, 24);
  }

  function finishTyping() {
    if (!typeTimer) return false;
    clearInterval(typeTimer);
    typeTimer = 0;
    textEl.textContent = fullText;
    textEl.classList.remove('is-typing');
    return true;
  }

  function finish() {
    if (finished) return;
    finished = true;
    cleanup();
    onDone?.({ skipped: false });
  }

  function showSlide(nextIndex) {
    if (nextIndex < 0 || nextIndex >= story.slides.length) return;
    index = nextIndex;
    slideAt = performance.now();
    const slide = story.slides[index];
    yearEl.textContent = slide.year;
    titleEl.textContent = slide.title;
    startTyping(slide.text);
    renderDots();
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === story.slides.length - 1 ? '开始学习 →' : '下一步';
    overlay.classList.remove('is-entering');
    void overlay.offsetWidth;
    overlay.classList.add('is-entering');
  }

  function next() {
    if (finishTyping()) return;
    if (index < story.slides.length - 1) showSlide(index + 1);
    else finish();
  }

  function prev() {
    if (finishTyping()) return;
    if (index > 0) showSlide(index - 1);
  }

  function skip() {
    if (finished) return;
    finished = true;
    cleanup();
    onDone?.({ skipped: true });
  }

  function frame(now) {
    if (finished || !ctx || !canvas.isConnected) return;
    raf = requestAnimationFrame(frame);
    const t = now - slideAt;
    ctx.save();
    ctx.scale(4, 4);
    drawBackdrop(ctx, now, theme);
    const art = story.art;
    if (art === 'python') drawPython(ctx, now, index, theme);
    else if (art === 'web') drawWeb(ctx, now, index, theme);
    else if (art === 'sql') drawSql(ctx, now, index, theme);
    else drawData(ctx, now, index, theme);
    ctx.restore();
    if (t < 400) {
      overlay.style.setProperty('--story-glow', String(1 - t / 400));
    }
  }

  function onKey(event) {
    if (finished) return;
    if (event.key === 'ArrowRight' || event.key === 'Enter') {
      event.preventDefault();
      next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      skip();
    }
  }

  function cleanup() {
    cancelAnimationFrame(raf);
    clearInterval(typeTimer);
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('is-story-open');
    overlay.remove();
  }

  overlay.addEventListener('click', (event) => {
    const action = event.target.closest('[data-story]')?.dataset.story;
    if (action === 'next') next();
    else if (action === 'prev') prev();
    else if (action === 'skip') skip();
  });
  document.addEventListener('keydown', onKey);

  showSlide(0);
  raf = requestAnimationFrame(frame);
  return { close: skip };
}
