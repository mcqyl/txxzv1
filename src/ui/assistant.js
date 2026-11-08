import { COURSES } from '../data/courses.js';
import { levelInfo } from '../data/progression.js';

const EMOTION_COLORS = {
  开心: '#ffd166',
  温柔: '#f3b7c8',
  俏皮: '#8ecae6',
  认真: '#8ecae6',
  鼓励: '#8fe3b0',
  惊讶: '#c9a7ff',
  平静: '#d7dee9',
  自豪: '#ffd166'
};

const ONCE_EVENTS = new Set(['first-meet', 'tutorial-done', 'home-enter', 'gate-open']);
const EVENT_COOLDOWN = {
  'lesson-success': 18000,
  'lesson-fail': 30000,
  'task-claimed': 15000,
  'ambient': 8 * 60 * 1000
};
const EVENT_PRIORITY = {
  'lesson-fail': 9,
  'lesson-success': 8,
  'gate-open': 7,
  'tutorial-done': 7,
  'home-enter': 6,
  'task-claimed': 5,
  'first-meet': 4,
  'ambient': 1
};

const BODY = [
  '................',
  '.......ll.......',
  '......lggl......',
  '.....lggggl.....',
  '....oooooooo....',
  '...osssssssso...',
  '..osssssssssso..',
  '..osssssssssso..',
  '..osssssssssso..',
  '..osssssssssso..',
  '..osssssssssso..',
  '..osssssssssso..',
  '..osssssssssso..',
  '...oSssssssSo...',
  '...oooooooooo...',
  '....oo....oo....'
];

const MOSS = [
  [6, 4, 'g'], [7, 4, 'g'], [8, 4, 'g'], [9, 4, 'g'], [10, 4, 'g'],
  [5, 5, 'g'], [6, 5, 'l'], [7, 5, 'g'], [8, 5, 'g'], [9, 5, 'g'], [10, 5, 'g'],
  [4, 6, 'm'], [5, 6, 'g'], [6, 6, 'l'], [7, 6, 'g'], [8, 6, 'g'], [9, 6, 'g'], [10, 6, 'g'], [11, 6, 'm'],
  [4, 7, 'm'], [5, 7, 'g'], [6, 7, 'g'], [7, 7, 'g'], [8, 7, 'g'], [9, 7, 'g'], [10, 7, 'm']
];

const PIXEL = {
  o: '#242c3d',
  s: '#c8d2de',
  S: '#98a6ba',
  d: '#76839a',
  g: '#6cc88e',
  l: '#b9f4c9',
  m: '#4f9f77',
  e: '#1d2636',
  w: '#fff6e2',
  c: '#eda28e',
  k: '#ffd166'
};

function drawSprite(canvas, time, emotion, speaking) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, 16, 16);
  const blink = time % 3600 < 130;

  for (let y = 0; y < BODY.length; y++) {
    const row = BODY[y];
    for (let x = 0; x < 16; x++) {
      const code = row[x] || '.';
      if (code === '.') continue;
      ctx.fillStyle = PIXEL[code] || PIXEL.s;
      ctx.fillRect(x, y, 1, 1);
    }
  }

  ctx.fillStyle = PIXEL.m;
  ctx.fillRect(5, 8, 1, 1);
  for (const [x, y, code] of MOSS) {
    ctx.fillStyle = PIXEL[code] || PIXEL.g;
    ctx.fillRect(x, y, 1, 1);
  }

  const px = (x, y, code) => {
    ctx.fillStyle = PIXEL[code] || PIXEL.e;
    ctx.fillRect(x, y, 1, 1);
  };

  const soft = ['温柔', '鼓励', '俏皮'].includes(emotion);
  const proud = emotion === '自豪';
  const happy = emotion === '开心' || proud;

  if (emotion === '惊讶') {
    for (const [x, y] of [[5, 9], [6, 9], [5, 10], [6, 10], [9, 9], [10, 9], [9, 10], [10, 10]]) px(x, y, 'e');
    px(5, 9, 'w');
    px(9, 9, 'w');
  } else if (happy || blink) {
    for (const [x, y] of [[5, 10], [6, 10], [9, 10], [10, 10], [4, 9], [11, 9]]) px(x, y, 'e');
  } else if (emotion === '认真') {
    for (const [x, y] of [[5, 9], [6, 9], [5, 10], [6, 10], [9, 9], [10, 9], [9, 10], [10, 10]]) px(x, y, 'e');
    px(5, 8, 'S');
    px(6, 8, 'S');
    px(9, 8, 'S');
    px(10, 8, 'S');
  } else {
    for (const [x, y] of [[5, 9], [6, 9], [5, 10], [6, 10], [9, 9], [10, 9], [9, 10], [10, 10]]) px(x, y, 'e');
    px(5, 9, 'w');
    px(9, 9, 'w');
  }

  if (soft || happy) {
    px(4, 11, 'c');
    px(11, 11, 'c');
  }

  if (emotion === '惊讶') {
    px(7, 12, 'e');
    px(8, 12, 'e');
  } else if (emotion === '认真') {
    for (let x = 6; x <= 9; x++) px(x, 12, 'e');
  } else if (emotion === '俏皮') {
    px(7, 12, 'e');
    px(8, 12, 'e');
    px(9, 11, 'e');
  } else if (happy) {
    for (let x = 6; x <= 9; x++) px(x, 12, 'e');
    px(5, 11, 'e');
    px(10, 11, 'e');
  } else {
    px(7, 12, 'e');
    px(8, 12, 'e');
  }

  if (proud) {
    px(13, 6, 'k');
    px(13, 7, 'k');
    px(2, 5, 'k');
    px(2, 6, 'k');
  }

  if (speaking) {
    const beat = Math.floor(time / 260) % 3;
    for (let i = 0; i <= beat; i++) px(14, 8 + i, 'k');
  }
}

function stripSpeech(text) {
  return String(text || '')
    .replace(/[（(][^）)\n]{1,14}[）)]/g, '')
    .replace(/[*_`#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function decorateText(text) {
  return String(text || '')
    .replace(/\*\*/g, '')
    .replace(/^#+\s*/gm, '')
    .trim();
}

export function createAssistant({ saveManager, getContext, getPrefs }) {
  const gameScreen = document.getElementById('game-screen');
  const modalRoot = document.getElementById('modal-root');
  const initialPrefs = { assistantEnabled: true, assistantVoice: true, reduceMotion: false, ...(getPrefs?.() || {}) };

  let enabled = initialPrefs.assistantEnabled !== false;
  let voiceOn = initialPrefs.assistantVoice !== false;
  let started = false;
  let chatOpen = false;
  let chatBusy = false;
  let chatSeeded = false;
  let expression = initialPrefs.reduceMotion ? '平静' : '温柔';
  let expressionUntil = 0;
  let raf = 0;
  let lastPaint = 0;
  let speaking = false;

  const messages = [];
  const queue = [];
  const seenAt = new Map();
  let pending = null;
  let tipAbort = null;
  let ttsAbort = null;
  let ttsToken = 0;
  let audio = null;
  let audioUrl = null;
  let bubbleTimer = 0;
  let ambientTimer = 0;
  let pumpTimer = 0;
  let lastSpokeAt = Date.now();
  let activeTip = null;
  let speechResolver = null;
  let speechTimer = 0;

  const widget = document.createElement('div');
  widget.className = 'assistant-widget';
  widget.innerHTML = `
    <div class="assistant-bubble" hidden>
      <div class="assistant-bubble-head">
        <span class="assistant-bubble-name">芋丸</span>
        <span class="assistant-emotion" data-emotion>平静</span>
        <button type="button" class="assistant-bubble-close" data-act="dismiss" aria-label="收起提示">×</button>
      </div>
      <p class="assistant-bubble-text" data-line></p>
      <div class="assistant-bubble-foot">
        <button type="button" class="assistant-talk" data-act="talk">和芋丸聊聊</button>
        <span>点右上角的芋丸也能对话</span>
      </div>
    </div>
    <button type="button" class="assistant-orb" aria-label="打开芋丸 AI 助手">
      <span class="assistant-orb-glow" aria-hidden="true"></span>
      <canvas width="16" height="16" data-orb-canvas aria-hidden="true"></canvas>
      <span class="assistant-orb-label">芋丸<i>AI</i></span>
    </button>`;
  gameScreen.appendChild(widget);
  widget.hidden = !enabled;

  const chat = document.createElement('div');
  chat.className = 'assistant-chat';
  chat.setAttribute('role', 'dialog');
  chat.setAttribute('aria-label', '和芋丸对话');
  chat.hidden = true;
  chat.innerHTML = `
    <div class="assistant-chat-head">
      <span class="assistant-chat-portrait"><canvas width="16" height="16" data-chat-canvas aria-hidden="true"></canvas></span>
      <div class="assistant-chat-title"><b>芋丸</b><span>苔溪向导 · 看得见你的进度</span></div>
      <button type="button" class="assistant-chat-close" data-act="close" aria-label="关闭对话">×</button>
    </div>
    <div class="assistant-chat-log" data-log aria-live="polite"></div>
    <div class="assistant-chat-quick">
      <button type="button" data-prompt="我现在该做什么？">我现在该做什么？</button>
      <button type="button" data-prompt="这门课我卡住了，帮我看看。">课程卡住了</button>
      <button type="button" data-prompt="怎么布置小屋？">怎么布置小屋？</button>
    </div>
    <form class="assistant-chat-form" data-form>
      <input name="message" maxlength="200" autocomplete="off" placeholder="问问芋丸…" aria-label="给芋丸发消息" />
      <button type="submit">发送</button>
    </form>
    <p class="assistant-chat-note">对话时角色会停下来。芋丸会看到你的等级、所在位置和课程进度。</p>`;
  gameScreen.appendChild(chat);

  const bubble = widget.querySelector('.assistant-bubble');
  const bubbleLine = widget.querySelector('[data-line]');
  const emotionChip = widget.querySelector('[data-emotion]');
  const orb = widget.querySelector('.assistant-orb');
  const orbCanvas = widget.querySelector('[data-orb-canvas]');
  const chatCanvas = chat.querySelector('[data-chat-canvas]');
  const log = chat.querySelector('[data-log]');
  const form = chat.querySelector('[data-form]');
  const input = form.querySelector('input');
  const sendButton = form.querySelector('button');
  const closeButton = chat.querySelector('[data-act="close"]');

  /* ---------------- draggable orb ---------------- */

  const ASSISTANT_POS_KEY = 'mossbrook.assistantPos';

  function clampAssistantPos(left, top) {
    const rect = widget.getBoundingClientRect();
    const width = rect.width || 74;
    const height = rect.height || 74;
    return {
      left: Math.min(Math.max(6, window.innerWidth - width - 6), Math.max(6, left)),
      top: Math.min(Math.max(6, window.innerHeight - height - 6), Math.max(6, top))
    };
  }

  function placeAssistant(left, top, persist = false) {
    const pos = clampAssistantPos(left, top);
    widget.style.left = `${Math.round(pos.left)}px`;
    widget.style.top = `${Math.round(pos.top)}px`;
    widget.style.right = 'auto';
    widget.style.bottom = 'auto';
    if (persist) {
      try {
        localStorage.setItem(ASSISTANT_POS_KEY, JSON.stringify({
          left: Math.round(pos.left),
          top: Math.round(pos.top)
        }));
      } catch {
        /* storage is optional */
      }
    }
  }

  function restoreAssistantPos() {
    try {
      const saved = JSON.parse(localStorage.getItem(ASSISTANT_POS_KEY) || 'null');
      if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
        placeAssistant(saved.left, saved.top);
      }
    } catch {
      /* ignore corrupt position */
    }
  }

  restoreAssistantPos();
  window.addEventListener('resize', () => {
    if (!widget.style.left) return;
    placeAssistant(parseFloat(widget.style.left), parseFloat(widget.style.top));
  });

  let orbDrag = null;
  let suppressOrbClick = false;

  function endOrbDrag(event) {
    if (!orbDrag) return;
    if (event && event.pointerId !== undefined && event.pointerId !== orbDrag.id) return;
    const moved = orbDrag.moved;
    orbDrag = null;
    widget.classList.remove('is-dragging');
    if (!moved) return;
    suppressOrbClick = true;
    setTimeout(() => { suppressOrbClick = false; }, 380);
    placeAssistant(parseFloat(widget.style.left), parseFloat(widget.style.top), true);
  }

  orb.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const rect = widget.getBoundingClientRect();
    orbDrag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: rect.left,
      top: rect.top,
      moved: false
    };
    try {
      orb.setPointerCapture(event.pointerId);
    } catch {
      /* pointer capture is optional */
    }
  });

  orb.addEventListener('pointermove', (event) => {
    if (!orbDrag || event.pointerId !== orbDrag.id) return;
    const dx = event.clientX - orbDrag.x;
    const dy = event.clientY - orbDrag.y;
    if (!orbDrag.moved) {
      if (Math.hypot(dx, dy) < 5) return;
      orbDrag.moved = true;
      widget.classList.add('is-dragging');
    }
    event.preventDefault();
    placeAssistant(orbDrag.left + dx, orbDrag.top + dy);
  });

  orb.addEventListener('pointerup', endOrbDrag);
  orb.addEventListener('pointercancel', endOrbDrag);
  orb.addEventListener('lostpointercapture', endOrbDrag);

  function setExpression(value) {
    if (!value) return;
    expression = value;
    expressionUntil = Date.now() + 12000;
  }

  function setTone(value) {
    widget.style.setProperty('--assistant-tone', EMOTION_COLORS[value] || EMOTION_COLORS['平静']);
  }

  function paint(now) {
    raf = requestAnimationFrame(paint);
    if (now - lastPaint < 110) return;
    lastPaint = now;
    if (expressionUntil && now > expressionUntil) expression = '平静';
    if (enabled && !document.hidden) {
      drawSprite(orbCanvas, now, expression, speaking);
      if (chatOpen) drawSprite(chatCanvas, now, expression, speaking);
    }
  }

  function startLoop() {
    if (!raf) raf = requestAnimationFrame(paint);
  }

  function stopLoop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ---------------- state ---------------- */

  function buildState() {
    const save = saveManager.save;
    const info = levelInfo(save.xp);
    const ctx = (() => {
      try {
        return getContext?.() || {};
      } catch {
        return {};
      }
    })();

    const courses = [];
    let nextUp = null;
    for (const course of COURSES) {
      const done = saveManager.courseDoneCount(course);
      const total = course.lessons.length;
      const locked = Boolean(course.requiresLevel && info.level < course.requiresLevel);
      const nextLesson = course.lessons.find((lesson) => !saveManager.isLessonDone(course.id, lesson.id));
      if (!locked && !nextUp && nextLesson) nextUp = `${course.name} · ${nextLesson.title}`;
      courses.push(`${course.name}：${done}/${total}${nextLesson ? `，下一课「${nextLesson.title}」` : '，已完成'}${locked ? `（Lv.${course.requiresLevel} 解锁）` : ''}`);
    }

    const tasks = saveManager.activeTasks().map((task) => {
      const progress = Math.min(task.state.progress, task.target);
      const state = task.state.claimed ? '已领取' : progress >= task.target ? '可领取' : `${progress}/${task.target}`;
      return `${task.title}（${state}）`;
    });

    return {
      player: `${save.player.name}，Lv.${info.level}，${info.label}，${save.coins} 铜币`,
      place: `${ctx.scene === 'home' ? '小屋室内' : '小镇室外'}${ctx.zone ? ` · ${ctx.zone}` : ''}`,
      nearby: ctx.nearby?.label || '附近没有可交互物件',
      editing: Boolean(ctx.editMode),
      lesson: ctx.lesson
        ? `${ctx.lesson.courseName} · ${ctx.lesson.lessonTitle}（第 ${ctx.lesson.index + 1}/${ctx.lesson.total} 课，${ctx.lesson.completed ? '已完成' : '正在进行'}）`
        : '当前没有打开课程',
      nextUp: nextUp || '所有已开放课程都完成了，可以复习或布置小屋',
      courses,
      tasks,
      newPlayer: !save.flags.tutorialSeen || (save.flags.totalLessons || 0) === 0,
      gates: {
        北门: save.flags.northGateOpen ? '已打开' : `Lv.2 后打开（当前 Lv.${info.level}）`,
        北岭观星台: info.level >= 3 ? '已开放' : `Lv.3 后开放（当前 Lv.${info.level}）`
      },
      totals: {
        完成课程: save.flags.totalLessons || 0,
        摆放家具: save.flags.totalPlaced || 0,
        小镇互动: save.flags.townInteractions || 0
      }
    };
  }

  /* ---------------- bubble ---------------- */

  function hideBubble() {
    clearTimeout(bubbleTimer);
    bubble.hidden = true;
    widget.classList.remove('has-bubble');
    orb.setAttribute('aria-expanded', 'false');
  }

  function showBubble(text, emotion = '平静') {
    if (!enabled || !text) return;
    clearTimeout(bubbleTimer);
    const clean = decorateText(text);
    setTone(emotion);
    setExpression(emotion);
    bubbleLine.textContent = clean;
    emotionChip.textContent = emotion;
    bubble.hidden = false;
    widget.classList.add('has-bubble');
    orb.setAttribute('aria-expanded', 'true');
    bubbleTimer = setTimeout(hideBubble, 26000);
  }

  function localTip(event, detail = {}) {
    const state = buildState();
    if (event === 'lesson-fail') {
      const where = detail.lesson ? `「${detail.lesson}」` : '这一课';
      return {
        emotion: '鼓励',
        text: `别急，${where}先运行一次，把控制台输出和左侧的期望结果逐行对一下。${detail.hint ? `小提示：${detail.hint}` : '最容易出问题的通常是括号、缩进或条件里的一个小符号。'}`
      };
    }
    if (event === 'lesson-success') {
      const next = detail.nextLesson ? `下一课是「${detail.nextLesson}」，` : '';
      return {
        emotion: detail.courseComplete ? '自豪' : '开心',
        text: detail.courseComplete
          ? `整门课都被你走完了，真厉害！回小屋按 F 把新家具摆上，给自己留个纪念吧。`
          : `通过啦！${next}也可以先回小屋按 F 布置刚拿到的家具。`
      };
    }
    if (event === 'task-claimed') {
      return { emotion: '开心', text: '奖励收好啦。任务板每天清晨会换一张新纸，回广场时记得再看一眼。' };
    }
    if (event === 'home-enter') {
      return { emotion: '温柔', text: '到家啦。按 F 打开布置模式，WASD 挪动家具，E 放下，R 转方向。家具可以从课程和每日任务里带回来。' };
    }
    if (event === 'gate-open') {
      return { emotion: '开心', text: '北门的木闩松开了。沿着镇子北边的小路走，就能去北岭观星台看看。' };
    }
    if (event === 'tutorial-done') {
      return { emotion: '鼓励', text: `先沿着石板路往西走，去蟒蛇学堂上第一课吧。站在门口按 E 就能进去。你现在是 Lv.${state.player.match(/Lv\.(\d+)/)?.[1] || 1}。` };
    }
    if (event === 'ambient') {
      return { emotion: '温柔', text: `要是不知道做什么，可以去「${state.nextUp}」。按 Tab 能打开功能全览，课程、任务和地图都在里面。` };
    }
    return { emotion: '温柔', text: '我是芋丸，就住在你的右上角。迷路、卡课，或者不知道下一步做什么，点我聊聊就好。' };
  }

  async function requestTip(item) {
    const controller = new AbortController();
    tipAbort = controller;
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'tip',
          event: item.type,
          detail: item.detail,
          state: buildState()
        }),
        signal: controller.signal
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data.text) throw new Error(data?.error || '芋丸没有回答');
      return { text: data.text, emotion: data.emotion || '平静' };
    } finally {
      clearTimeout(timer);
      if (tipAbort === controller) tipAbort = null;
    }
  }

  function modalOpen() {
    return !modalRoot.hidden;
  }

  function canSpeakNow() {
    return !modalOpen() && !chatOpen;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function schedulePump(delay = 400) {
    clearTimeout(pumpTimer);
    pumpTimer = setTimeout(pump, delay);
  }

  function dwellTime(text) {
    return Math.min(9000, Math.max(3500, decorateText(text).length * 70));
  }

  async function pump() {
    if (!enabled || !started || chatOpen || modalOpen() || pending || activeTip || !queue.length) return;
    if (speechResolver) {
      schedulePump(1200);
      return;
    }
    const item = queue.shift();
    pending = item;

    if (!item.result) {
      widget.classList.add('is-thinking');
      try {
        item.result = await requestTip(item);
      } catch {
        item.result = localTip(item.type, item.detail);
      }
      widget.classList.remove('is-thinking');
    }

    if (pending !== item) return;
    pending = null;
    if (!enabled) return;
    if (!canSpeakNow()) {
      queue.unshift(item);
      return;
    }

    activeTip = item;
    showBubble(item.result.text, item.result.emotion);
    lastSpokeAt = Date.now();
    const startedAt = Date.now();
    await speak(item.result.text, item.result.emotion);
    if (activeTip !== item) return;
    const remaining = dwellTime(item.result.text) - (Date.now() - startedAt);
    if (remaining > 0) await sleep(remaining);
    if (activeTip !== item) return;
    activeTip = null;
    if (queue.length) schedulePump(400);
  }

  function notify(type, detail = {}) {
    if (!enabled || !started) return;
    if (!type) return;
    const now = Date.now();
    if (type === 'first-meet' && seenAt.has('tutorial-done')) return;
    const key = `${type}:${detail.lessonId || detail.taskId || ''}`;

    if (ONCE_EVENTS.has(type)) {
      if (seenAt.has(type)) return;
      seenAt.set(type, now);
    } else {
      const cooldown = EVENT_COOLDOWN[type] || 20000;
      const last = seenAt.get(key) || 0;
      if (now - last < cooldown) return;
      if (type === 'ambient' && now - lastSpokeAt < 6 * 60 * 1000) return;
      seenAt.set(key, now);
    }

    if (type === 'tutorial-done') {
      for (let i = queue.length - 1; i >= 0; i--) {
        if (queue[i].type === 'first-meet') queue.splice(i, 1);
      }
      if (pending?.type === 'first-meet') {
        tipAbort?.abort();
        tipAbort = null;
        pending = null;
        widget.classList.remove('is-thinking');
      }
      if (activeTip?.type === 'first-meet') {
        activeTip = null;
        hideBubble();
        stopAudio();
      }
    }

    queue.push({
      type,
      detail,
      priority: EVENT_PRIORITY[type] || 2,
      at: now
    });
    queue.sort((a, b) => b.priority - a.priority);
    if (queue.length > 3) queue.length = 3;
    pump();
  }

  /* ---------------- speech ---------------- */

  function setSpeaking(value) {
    speaking = Boolean(value);
    widget.classList.toggle('is-speaking', speaking);
  }

  function estimateSpeechMs(text) {
    return Math.min(30000, 1500 + String(text || '').length * 190);
  }

  function finishSpeech(token) {
    if (token !== ttsToken) return;
    clearTimeout(speechTimer);
    setSpeaking(false);
    const resolve = speechResolver;
    speechResolver = null;
    resolve?.();
  }

  function stopAudio() {
    const resolve = speechResolver;
    speechResolver = null;
    clearTimeout(speechTimer);
    ttsToken += 1;
    ttsAbort?.abort();
    ttsAbort = null;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      try {
        audio.pause();
      } catch {
        /* ignore */
      }
      audio = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      audioUrl = null;
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
    setSpeaking(false);
    resolve?.();
  }

  function speakLocal(text, token) {
    if (token !== ttsToken || !voiceOn || !('speechSynthesis' in window)) {
      finishSpeech(token);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = 1.04;
      utter.pitch = 1.08;
      utter.onstart = () => {
        if (token === ttsToken) setSpeaking(true);
      };
      utter.onend = () => finishSpeech(token);
      utter.onerror = () => finishSpeech(token);
      window.speechSynthesis.speak(utter);
      clearTimeout(speechTimer);
      speechTimer = setTimeout(() => finishSpeech(token), estimateSpeechMs(text) + 6000);
    } catch {
      finishSpeech(token);
    }
  }

  async function speakRequest(speech, emotion, token) {
    const controller = new AbortController();
    ttsAbort = controller;
    try {
      const res = await fetch('/api/assistant/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: speech, emotion }),
        signal: controller.signal
      });
      const data = await res.json().catch(() => null);
      if (token !== ttsToken || !enabled || !voiceOn) return;
      if (!res.ok || !data?.ok || !data.base64) throw new Error('语音没有返回');
      const binary = atob(data.base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/wav' });
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      audioUrl = URL.createObjectURL(blob);
      audio = new Audio(audioUrl);
      audio.onended = () => finishSpeech(token);
      audio.onerror = () => {
        if (token === ttsToken) speakLocal(speech, token);
      };
      setSpeaking(true);
      await audio.play().catch(() => {
        if (token === ttsToken) speakLocal(speech, token);
      });
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (token === ttsToken) speakLocal(speech, token);
    } finally {
      if (ttsAbort === controller) ttsAbort = null;
    }
  }

  function speak(text, emotion) {
    const speech = stripSpeech(text);
    if (!speech || !enabled || !voiceOn) return Promise.resolve();
    stopAudio();
    const token = ttsToken;
    const done = new Promise((resolve) => {
      speechResolver = resolve;
    });
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => finishSpeech(token), estimateSpeechMs(speech) + 18000);
    speakRequest(speech, emotion, token);
    return done;
  }

  /* ---------------- chat ---------------- */

  function localChatFallback(message, state) {
    const text = String(message || '');
    if (text.includes('布置') || text.includes('家具')) {
      return { emotion: '温柔', text: '回家以后按 F 进入布置模式，WASD 挪位置，E 放下，R 转身，X 收回。家具主要来自每节课的第一次完成和每日任务。' };
    }
    if (text.includes('卡') || text.includes('为什么')) {
      return { emotion: '鼓励', text: '先点「运行」看控制台，再把输出和左侧的期望结果逐行比对。Python 要注意括号、引号和缩进，SQL 则检查列名和条件。' };
    }
    return { emotion: '温柔', text: `芋丸这会儿没接上信号。你可以先去「${state.nextUp}」，或者按 Tab 看看功能全览，我一会儿再试试。` };
  }

  function seedChat() {
    if (chatSeeded) return;
    chatSeeded = true;
    const save = saveManager.save;
    messages.push({
      role: 'assistant',
      emotion: '温柔',
      text: `我是芋丸，就住在你的右上角。${save.player.name}，迷路了、卡课了，或者不知道下一步做什么，都可以问我。`,
      at: Date.now()
    });
  }

  function renderLog(typing = chatBusy) {
    log.innerHTML = '';
    for (const message of messages) {
      const item = document.createElement('div');
      item.className = `assistant-msg is-${message.role}`;
      if (message.role === 'assistant') {
        const name = document.createElement('span');
        name.className = 'assistant-msg-name';
        name.textContent = '芋丸';
        if (message.emotion) {
          const chip = document.createElement('i');
          chip.textContent = message.emotion;
          name.appendChild(chip);
        }
        item.appendChild(name);
      }
      const body = document.createElement('p');
      body.textContent = message.text;
      item.appendChild(body);
      log.appendChild(item);
    }
    if (typing) {
      const item = document.createElement('div');
      item.className = 'assistant-msg is-assistant is-typing';
      const dots = document.createElement('span');
      dots.className = 'assistant-typing';
      dots.innerHTML = '<i></i><i></i><i></i>';
      item.appendChild(dots);
      log.appendChild(item);
    }
    log.scrollTop = log.scrollHeight;
  }

  async function sendMessage(raw) {
    const text = String(raw || '').trim().slice(0, 200);
    if (!enabled || chatBusy || !text) return;
    const history = messages.slice(-8).map((message) => ({ role: message.role, text: message.text }));
    messages.push({ role: 'user', text, at: Date.now() });
    if (messages.length > 24) messages.splice(0, messages.length - 24);
    chatBusy = true;
    sendButton.disabled = true;
    input.value = '';
    renderLog(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 35000);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          message: text,
          history,
          state: buildState()
        }),
        signal: controller.signal
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data.text) throw new Error(data?.error || '芋丸没有回答');
      messages.push({ role: 'assistant', text: decorateText(data.text), emotion: data.emotion || '平静', at: Date.now() });
      setExpression(data.emotion || '平静');
      renderLog(false);
      speak(data.text, data.emotion || '平静');
    } catch {
      const fallback = localChatFallback(text, buildState());
      messages.push({ role: 'assistant', text: fallback.text, emotion: fallback.emotion, at: Date.now() });
      renderLog(false);
      speak(fallback.text, fallback.emotion);
    } finally {
      clearTimeout(timer);
      chatBusy = false;
      sendButton.disabled = false;
      if (messages.length > 24) messages.splice(0, messages.length - 24);
      renderLog(false);
      input.focus({ preventScroll: true });
    }
  }

  function openChat(focusPrompt = '') {
    if (!enabled) return;
    hideBubble();
    stopAudio();
    seedChat();
    chatOpen = true;
    widget.hidden = true;
    chat.hidden = false;
    renderLog();
    input.value = focusPrompt;
    setTimeout(() => input.focus({ preventScroll: true }), 30);
  }

  function closeChat() {
    if (!chatOpen) return;
    chatOpen = false;
    chat.hidden = true;
    widget.hidden = !enabled;
    if (input.value) input.value = '';
    setTimeout(() => {
      if (started && enabled) {
        startLoop();
        pump();
      }
    }, 60);
  }

  /* ---------------- wiring ---------------- */

  widget.querySelector('[data-act="talk"]')?.addEventListener('click', () => openChat());
  widget.querySelector('[data-act="dismiss"]')?.addEventListener('click', () => {
    hideBubble();
    stopAudio();
    if (activeTip) {
      activeTip = null;
      if (queue.length) schedulePump(250);
    }
  });
  orb.addEventListener('click', (event) => {
    if (suppressOrbClick) {
      event.preventDefault();
      event.stopPropagation();
      suppressOrbClick = false;
      return;
    }
    openChat();
  });
  orb.setAttribute('aria-expanded', 'false');
  closeButton.addEventListener('click', closeChat);
  chat.querySelectorAll('[data-prompt]').forEach((button) => {
    button.addEventListener('click', () => sendMessage(button.dataset.prompt));
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    sendMessage(input.value);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeChat();
    }
  });
  chat.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !chatBusy) {
      event.preventDefault();
      closeChat();
    }
  });
  widget.addEventListener('mouseenter', () => clearTimeout(bubbleTimer));
  widget.addEventListener('mouseleave', () => {
    if (!bubble.hidden) bubbleTimer = setTimeout(hideBubble, 8000);
  });

  const modalObserver = new MutationObserver(() => {
    if (!modalOpen()) pump();
  });
  modalObserver.observe(modalRoot, { attributes: true, attributeFilter: ['hidden'] });

  /* ---------------- lifecycle ---------------- */

  function setEnabled(value) {
    enabled = Boolean(value);
    if (!enabled) {
      queue.length = 0;
      activeTip = null;
      clearTimeout(pumpTimer);
      tipAbort?.abort();
      tipAbort = null;
      pending = null;
      closeChat();
      hideBubble();
      stopAudio();
      stopLoop();
      widget.hidden = true;
      chat.hidden = true;
      widget.classList.remove('is-thinking');
      return;
    }
    widget.hidden = false;
    chat.hidden = !chatOpen;
    startLoop();
    if (started) pump();
  }

  function setVoice(value) {
    voiceOn = Boolean(value);
    if (!voiceOn) stopAudio();
  }

  function setReduceMotion(value) {
    widget.classList.toggle('is-calm', Boolean(value));
    if (value) {
      expression = '平静';
      expressionUntil = 0;
    }
  }

  function start() {
    if (started) return;
    started = true;
    widget.hidden = !enabled;
    chat.hidden = true;
    setTone('温柔');
    setReduceMotion(initialPrefs.reduceMotion);
    if (!enabled) return;
    startLoop();
    setTimeout(() => notify('first-meet'), 2600);
    ambientTimer = setInterval(() => {
      if (!enabled || chatOpen || modalOpen() || pending || activeTip || queue.length) return;
      if (document.hidden) return;
      if (Date.now() - lastSpokeAt < 7 * 60 * 1000) return;
      notify('ambient');
    }, 60000);
  }

  function destroy() {
    started = false;
    enabled = false;
    clearTimeout(bubbleTimer);
    clearTimeout(pumpTimer);
    clearTimeout(speechTimer);
    clearInterval(ambientTimer);
    tipAbort?.abort();
    stopAudio();
    stopLoop();
    modalObserver.disconnect();
    widget.remove();
    chat.remove();
  }

  return {
    start,
    destroy,
    notify,
    setEnabled,
    setVoice,
    setReduceMotion,
    isChatOpen() {
      return chatOpen;
    },
    get enabled() {
      return enabled;
    }
  };
}
