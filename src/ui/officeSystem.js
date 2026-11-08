import { COURSE_MAP } from '../data/courses.js';
import {
  OFFICE_COURSES, OFFICE_RANKS, courseOffice, getOfficeState, officeRank,
  nextOfficeRank, promotionReady, promotionProgress, salaryOf, deskSpotFor,
  fallbackTask
} from '../data/office.js';
import { sfx } from '../core/audio.js';

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function createOfficeSystem({ saveManager, hud, lesson, panels, game, net }) {
  let hudEl = null;
  let overlayEl = null;
  let currentCourseId = null;
  let interview = null;
  let busy = false;
  let storyOpen = false;
  let meetingOverride = null;
  let chatter = { street: null, office: null, meeting: null };
  const chatterInflight = new Set();
  const chatterTried = new Map();
  const handledTasks = new Set();
  let taskSeq = 0;

  const save = () => saveManager.save;

  function stateFor(courseId = currentCourseId) {
    return getOfficeState(save(), courseId || 'python');
  }

  function infoFor(courseId = currentCourseId) {
    return courseOffice(courseId || 'python');
  }

  function rankFor(courseId = currentCourseId) {
    return officeRank(stateFor(courseId));
  }

  function titleFor(courseId = currentCourseId) {
    return rankFor(courseId).title;
  }

  /* ---------------- HUD ---------------- */

  function mountHud() {
    if (hudEl) return;
    const screen = document.getElementById('game-screen');
    if (!screen) return;
    hudEl = document.createElement('div');
    hudEl.id = 'office-hud';
    hudEl.className = 'office-hud';
    hudEl.hidden = true;
    hudEl.innerHTML = `
      <div class="office-hud-head">
        <span class="office-badge" data-office-badge>EMPLOYEE</span>
        <span class="office-rank" data-office-rank>实习生</span>
      </div>
      <p class="office-company" data-office-company>蟒蛇云科</p>
      <div class="office-stats">
        <span><i>任务</i><b data-office-tasks>0</b></span>
        <span><i>绩效</i><b data-office-merit>0</b></span>
        <span><i>月薪</i><b data-office-salary>¥0</b></span>
      </div>
      <div class="office-progress">
        <div class="office-progress-track"><i data-office-progress-bar></i></div>
        <p data-office-progress-text>再完成 3 个任务可晋升</p>
      </div>
      <div class="office-log">
        <header><span>办公室动态</span><b data-office-log-title>正在八卦…</b></header>
        <ul data-office-log><li>同事们正在工位间走动。</li></ul>
      </div>
      <div class="office-actions">
        <button type="button" class="btn btn-mint" data-office-act="task">接任务</button>
        <button type="button" class="btn btn-ghost" data-office-act="promote" hidden>申请晋升</button>
        <button type="button" class="btn btn-ghost" data-office-act="leave">离开公寓</button>
      </div>`;
    screen.appendChild(hudEl);
    hudEl.querySelector('[data-office-act="task"]')?.addEventListener('click', () => startTask());
    hudEl.querySelector('[data-office-act="promote"]')?.addEventListener('click', () => openPromotion());
    hudEl.querySelector('[data-office-act="leave"]')?.addEventListener('click', () => game.exitOffice?.());
  }

  function updateHud() {
    if (!hudEl) return;
    const courseId = currentCourseId;
    if (!courseId) {
      hudEl.hidden = true;
      return;
    }
    const state = stateFor(courseId);
    const info = infoFor(courseId);
    const rank = officeRank(state);
    const promo = promotionProgress(state);
    const hired = Boolean(state.hired);
    hudEl.hidden = game.scene !== 'office';
    if (hudEl.hidden) return;
    hudEl.dataset.course = courseId;
    hudEl.querySelector('[data-office-badge]').textContent = hired ? rank.en : 'CANDIDATE';
    hudEl.querySelector('[data-office-badge]').style.setProperty('--office-accent', info.color);
    hudEl.querySelector('[data-office-rank]').textContent = hired ? rank.title : '应聘中';
    hudEl.querySelector('[data-office-company]').textContent = `${info.company} · ${info.floor}`;
    hudEl.querySelector('[data-office-tasks]').textContent = hired ? state.tasksDone : 0;
    hudEl.querySelector('[data-office-merit]').textContent = hired ? state.merit : 0;
    hudEl.querySelector('[data-office-salary]').textContent = hired ? `¥${salaryOf(state).toLocaleString('zh-CN')}` : '面议';
    hudEl.querySelector('[data-office-progress-bar]').style.width = `${hired ? Math.round(promo.ratio * 100) : 0}%`;
    hudEl.querySelector('[data-office-progress-bar]').style.background = info.color;
    hudEl.querySelector('[data-office-progress-text]').textContent = hired ? promo.text : '先通过老板的面试，才能领到工位。';
    const promoteBtn = hudEl.querySelector('[data-office-act="promote"]');
    promoteBtn.hidden = !hired || !promotionReady(state);
    promoteBtn.textContent = nextOfficeRank(state) ? `申请晋升 ${nextOfficeRank(state).title}` : '已是领导';
    const taskBtn = hudEl.querySelector('[data-office-act="task"]');
    if (taskBtn) taskBtn.textContent = hired ? '接任务' : '去面试';
  }

  function pushLog(title, lines) {
    if (!hudEl || !lines?.length) return;
    const titleEl = hudEl.querySelector('[data-office-log-title]');
    const list = hudEl.querySelector('[data-office-log]');
    if (!titleEl || !list) return;
    titleEl.textContent = title || '办公室动态';
    list.innerHTML = '';
    for (const line of lines.slice(-5)) {
      const li = document.createElement('li');
      const b = document.createElement('b');
      b.textContent = line.speaker || '同事';
      const span = document.createElement('span');
      span.textContent = line.text || '';
      li.appendChild(b);
      li.appendChild(span);
      list.appendChild(li);
    }
    list.scrollTop = list.scrollHeight;
  }

  /* ---------------- overlays ---------------- */

  function overlayOpen() {
    return Boolean(overlayEl) || storyOpen;
  }

  function closeOverlay() {
    if (!overlayEl) return;
    overlayEl.remove();
    overlayEl = null;
    busy = false;
    if (game.scene === 'office') updateHud();
  }

  function showOverlay(html, { wide = false, dismissible = true } = {}) {
    closeOverlay();
    overlayEl = document.createElement('div');
    overlayEl.className = 'office-overlay';
    overlayEl.innerHTML = `<div class="office-panel${wide ? ' is-wide' : ''}">${html}</div>`;
    document.body.appendChild(overlayEl);
    if (dismissible) {
      overlayEl.addEventListener('click', (event) => {
        if (event.target === overlayEl && !busy) closeOverlay();
      });
    }
    return overlayEl;
  }

  function loadingOverlay(title, sub) {
    const el = showOverlay(`
      <div class="office-loading">
        <div class="office-spinner"></div>
        <h2>${esc(title)}</h2>
        <p>${esc(sub)}</p>
        <span>老板思考时请别关掉页面 · 最长等待约 90 秒</span>
      </div>`, { dismissible: false });
    return el;
  }

  function bossPanel({ kicker, title, body, actions = '', extra = '' }) {
    const info = infoFor();
    return `
      <div class="office-boss-card">
        <header class="office-boss-head">
          <div class="office-boss-seal" style="--office-accent:${info.color}">${esc(info.boss.slice(0, 1))}</div>
          <div>
            <p class="office-kicker">${esc(kicker)}</p>
            <h2>${esc(title)}</h2>
            <span class="office-boss-meta">${esc(info.company)} · ${esc(info.boss)}（${esc(info.bossTitle)}）</span>
          </div>
          <button type="button" class="office-close" data-office-close aria-label="关闭">×</button>
        </header>
        <div class="office-card-body">${body}</div>
        ${extra}
        <footer class="office-card-actions">${actions}</footer>
      </div>`;
  }

  /* ---------------- AI helpers ---------------- */

  async function officeRequest(path, body, timeout = 125000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(`/api/office/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error || '办公室的 AI 暂时没有回应。');
      }
      return data;
    } catch (err) {
      if (err?.name === 'AbortError') throw new Error('等待太久了，老板可能去开会了。再试一次吧。');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  async function ensureChatter(kind = 'office', { force = false } = {}) {
    const courseId = currentCourseId || (kind === 'street' ? 'python' : null);
    if (!courseId) return null;
    const mapKind = meetingOverride && kind === 'meeting' ? 'meeting' : kind;
    const cacheKey = `${mapKind}:${courseId}`;
    if (!force && chatter[mapKind]) return chatter[mapKind];
    if (chatterInflight.has(cacheKey)) return null;
    const last = chatterTried.get(cacheKey) || 0;
    if (!force && Date.now() - last < 15000) return null;
    chatterTried.set(cacheKey, Date.now());
    chatterInflight.add(cacheKey);
    try {
      const state = getOfficeState(save(), courseId);
      const data = await officeRequest('npc', {
        kind: mapKind,
        courseId,
        rank: state.stage,
        tasksDone: state.tasksDone
      }, 125000);
      if (data?.ok && Array.isArray(data.lines) && data.lines.length) {
        chatter[mapKind] = { title: data.title || '办公室一角', lines: data.lines, fallback: Boolean(data.fallback) };
        if (mapKind === 'office') pushLog(chatter[mapKind].title, chatter[mapKind].lines);
        return chatter[mapKind];
      }
    } catch (err) {
      console.warn('[office] 小剧情请求失败', err.message);
    } finally {
      chatterInflight.delete(cacheKey);
    }
    return null;
  }

  function getChatter(kind = 'office') {
    if (kind === 'meeting') {
      return meetingOverride || chatter.meeting;
    }
    return chatter[kind] || null;
  }

  /* ---------------- interview ---------------- */

  function beginInterview() {
    const courseId = currentCourseId;
    if (!courseId) return;
    const state = stateFor(courseId);
    if (state.hired) return;
    const info = infoFor(courseId);
    interview = {
      courseId,
      round: 1,
      maxRounds: 3,
      question: '',
      difficulty: 1,
      asked: [],
      scores: [],
      history: [],
      stage: 'intro',
      offer: false
    };
    const el = showOverlay(bossPanel({
      kicker: 'INTERVIEW · 面试',
      title: `应聘 ${info.tagline}`,
      body: `
        <div class="office-dialog" data-office-dialog>
          <div class="office-line is-boss"><b>${esc(info.boss)}</b><span>正在整理面试资料…</span></div>
        </div>
        <div class="office-interview-progress">
          <span data-office-round>第 1 / 3 轮</span>
          <span class="office-thinking" data-office-thinking>老板正在思考开场问题…</span>
        </div>
        <div class="office-answer">
          <textarea data-office-answer maxlength="800" placeholder="用自己的话回答老板的问题…"></textarea>
          <div class="office-answer-foot">
            <span data-office-ambient>别紧张，说清楚你的思路就好。</span>
            <button type="button" class="btn btn-primary" data-office-send disabled>回答</button>
          </div>
        </div>`,
      actions: `
        <button type="button" class="btn btn-ghost" data-office-leave>离开大厦</button>`,
      dismissible: false
    }), { wide: true, dismissible: false });
    el.querySelector('[data-office-close]')?.remove();
    el.querySelector('[data-office-leave]')?.addEventListener('click', () => {
      closeOverlay();
      game.exitOffice?.();
    });
    el.querySelector('[data-office-answer]')?.addEventListener('input', (event) => {
      const send = el.querySelector('[data-office-send]');
      if (send) send.disabled = busy || !event.target.value.trim();
    });
    el.querySelector('[data-office-send]')?.addEventListener('click', submitAnswer);
    el.querySelector('[data-office-answer]')?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        submitAnswer();
      }
    });
    requestOpeningQuestion(el);
  }

  async function requestOpeningQuestion(el) {
    busy = true;
    const send = el.querySelector('[data-office-send]');
    if (send) send.disabled = true;
    try {
      const data = await officeRequest('interview', {
        action: 'start',
        courseId: currentCourseId,
        playerName: save().player.name
      }, 125000);
      if (!overlayEl) return;
      const reply = data.reply || '欢迎来到我们公司。';
      const question = data.question || '先说说你为什么想加入我们。';
      interview.question = question;
      interview.difficulty = clamp(Number(data.difficulty) || 1, 1, 2);
      interview.stage = 'answer';
      appendLine(el, 'boss', infoFor().boss, reply);
      appendLine(el, 'boss', infoFor().boss, question);
      el.querySelector('[data-office-thinking]').textContent = data.fallback ? '面试题库已准备好（AI 暂时忙碌，先用题库）' : '老板在等你的回答';
      el.querySelector('[data-office-ambient]').textContent = 'Ctrl + Enter 也可以发送回答。';
    } catch (err) {
      if (!overlayEl) return;
      const q = '如果由你来做这份工作，你最先想弄清楚的一件事是什么？';
      interview.question = q;
      interview.difficulty = 1;
      interview.stage = 'answer';
      appendLine(el, 'boss', infoFor().boss, '今天先聊几个基础问题，别紧张。');
      appendLine(el, 'boss', infoFor().boss, q);
      el.querySelector('[data-office-thinking]').textContent = '面试题已就绪';
      el.querySelector('[data-office-ambient]').textContent = err.message || '老板在等你的回答。';
    } finally {
      busy = false;
      if (overlayEl) {
        const sendBtn = overlayEl.querySelector('[data-office-send]');
        const textarea = overlayEl.querySelector('[data-office-answer]');
        if (sendBtn) sendBtn.disabled = !textarea?.value.trim();
        textarea?.focus();
      }
    }
  }

  function appendLine(el, role, speaker, text) {
    const log = el.querySelector('[data-office-dialog]');
    if (!log) return;
    const row = document.createElement('div');
    row.className = `office-line ${role === 'you' ? 'is-you' : role === 'system' ? 'is-system' : 'is-boss'}`;
    if (role === 'system') {
      row.textContent = text;
    } else {
      const b = document.createElement('b');
      b.textContent = speaker;
      const span = document.createElement('span');
      span.textContent = text;
      row.appendChild(b);
      row.appendChild(span);
    }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    if (interview?.history) {
      interview.history.push({ role: role === 'you' ? '求职者' : '老板', text });
      if (interview.history.length > 10) interview.history.shift();
    }
  }

  async function submitAnswer() {
    if (!interview || busy || interview.stage !== 'answer' || interview.offer) return;
    const el = overlayEl;
    if (!el) return;
    const textarea = el.querySelector('[data-office-answer]');
    const answer = textarea?.value.trim() || '';
    if (!answer) return;
    busy = true;
    el.querySelector('[data-office-send]').disabled = true;
    el.querySelector('[data-office-thinking]').textContent = '老板正在评估你的回答…';
    el.querySelector('[data-office-ambient]').textContent = '这一步可能要等 10-90 秒，AI 正在思考。';
    appendLine(el, 'you', save().player.name, answer);
    interview.history.push({ role: '求职者', text: answer });
    if (textarea) textarea.value = '';
    try {
      const data = await officeRequest('interview', {
        action: 'answer',
        courseId: currentCourseId,
        playerName: save().player.name,
        question: interview.question,
        answer,
        difficulty: interview.difficulty,
        asked: interview.asked,
        history: interview.history.slice(-8)
      }, 125000);
      if (!overlayEl) return;
      interview.scores.push(Number(data.score) || 0);
      interview.difficulty = clamp(Number(data.difficulty) || interview.difficulty, 1, 2);
      if (data.feedback) appendLine(el, 'boss', infoFor().boss, data.feedback);
      if (interview.round >= interview.maxRounds) {
        finishInterview();
        return;
      }
      interview.round += 1;
      interview.question = data.question || '再说说你会怎样验证自己的答案。';
      if (data.questionId) interview.asked.push(data.questionId);
      appendLine(el, 'boss', infoFor().boss, `下一题：${interview.question}`);
      el.querySelector('[data-office-round]').textContent = `第 ${interview.round} / ${interview.maxRounds} 轮`;
      el.querySelector('[data-office-thinking]').textContent = data.fallback ? '题库继续（AI 暂时忙碌）' : '老板在等你的回答';
      el.querySelector('[data-office-ambient]').textContent = 'Ctrl + Enter 也可以发送回答。';
    } catch (err) {
      if (!overlayEl) return;
      appendLine(el, 'system', '', err.message || '老板刚才走神了，再答一次吧。');
      el.querySelector('[data-office-thinking]').textContent = '可以再试一次';
      el.querySelector('[data-office-ambient]').textContent = '回答没有发送成功，内容还在。';
      if (textarea) textarea.value = answer;
    } finally {
      busy = false;
      if (overlayEl) {
        const sendBtn = overlayEl.querySelector('[data-office-send]');
        const area = overlayEl.querySelector('[data-office-answer]');
        if (sendBtn) sendBtn.disabled = interview?.offer ? false : !area?.value.trim();
        area?.focus();
      }
    }
  }

  function finishInterview() {
    const el = overlayEl;
    if (!el || !interview) return;
    const avg = interview.scores.length
      ? interview.scores.reduce((sum, n) => sum + n, 0) / interview.scores.length
      : 60;

    const state = stateFor();
    state.hired = true;
    state.hiredAt = new Date().toISOString();
    state.stage = 0;
    state.difficulty = clamp(1 + (avg >= 85 ? 1 : 0), 1, 2);
    state.tasksDone = state.tasksDone || 0;
    state.merit = Math.max(0, state.merit || 0);
    saveManager.markDirty();
    interview.offer = true;
    interview.stage = 'offer';
    const info = infoFor();
    const desk = deskSpotFor(0);
    appendLine(el, 'system', '', `录用通知：${info.company} · ${info.tagline}`);
    appendLine(el, 'boss', info.boss, `平均评分 ${Math.round(avg)}。明天来 ${info.floor} 报到——不，就现在吧，我带你去看工位。`);
    el.querySelector('[data-office-thinking]').textContent = '面试通过';
    el.querySelector('[data-office-ambient]').textContent = `你的工位在 ${info.floor} 的开放办公区。`;
    const send = el.querySelector('[data-office-send]');
    send.textContent = '去我的工位';
    send.disabled = false;
    send.onclick = () => {
      closeOverlay();
      game.teleportInOffice?.(desk.x, desk.y);
      updateHud();
      pushLog('入职第一天', [
        { speaker: info.boss, text: `欢迎加入，${save().player.name}。先从第一个任务开始。` },
        { speaker: '小语', text: '新同事的工位在窗边第二排，我带你去。' }
      ]);
      hud?.toast?.(`你被${info.company}录用了，现在是实习生。`, 'reward');
      sfx.reward?.();
      ensureChatter('office', { force: true });
    };
    el.querySelector('[data-office-answer]').disabled = true;
  }

  /* ---------------- tasks ---------------- */

  function showTaskLoading() {
    loadingOverlay('老板正在出题', 'AI 会根据你的职位和当前难度，从题库里挑一道合适的工位任务。');
  }

  async function startTask() {
    if (!currentCourseId || busy) return;
    const state = stateFor();
    if (!state.hired) {
      beginInterview();
      return;
    }
    if (!lesson) {
      hud?.toast?.('暂时打不开任务面板，请刷新后再试。', 'warn');
      return;
    }
    busy = true;
    showTaskLoading();
    const info = infoFor();
    try {
      let task;
      try {
        const data = await officeRequest('task', {
          courseId: currentCourseId,
          rank: state.stage,
          difficulty: state.difficulty,
          tasksDone: state.tasksDone
        }, 125000);
        task = data?.task;
        if (!task) throw new Error(data?.error || '老板没写出题目。');
      } catch (err) {
        console.warn('[office] AI 出题失败，使用本地题库', err.message);
        task = fallbackTask(currentCourseId, state.difficulty);
        hud?.toast?.('AI 暂时忙，先从题库里拿了一道题。', 'warn');
      }
      closeOverlay();
      busy = false;
      playTask(task, info);
    } catch (err) {
      closeOverlay();
      busy = false;
      hud?.toast?.(err.message || '任务准备失败，请稍后再试。', 'warn');
    }
  }

  function playTask(task, info) {
    taskSeq += 1;
    const real = COURSE_MAP[currentCourseId];
    const courseType = task.type === 'web' ? 'web' : 'python';
    const lessonId = `office-task-${currentCourseId}-${Date.now()}-${taskSeq}`;
    const lessonDef = {
      id: lessonId,
      title: task.title || '工位任务',
      minutes: task.minutes || 8,
      xp: task.xp || 35,
      coins: task.coins || 40,
      intro: `<p>${esc(task.brief || '完成老板交代的小任务。')}</p>`,
      hint: task.hint || '先运行一次，再根据输出调整。',
      starter: task.starter || '',
      expected: task.expected,
      checks: task.checks,
      cssChecks: task.cssChecks,
      scriptChecks: task.scriptChecks,
      meta: {
        concept: task.concept || (courseType === 'web' ? 'HTML / CSS / JS' : 'Python'),
        level: clamp(Number(task.difficulty) || 1, 1, 5),
        focus: task.focus || '把老板的需求拆成可以运行的一小步。',
        syntax: task.syntax || '',
        steps: task.steps?.length ? task.steps : ['读懂需求', '写出最小可运行版本', '运行并检查输出']
      }
    };
    const marker = {
      id: 'office-marker',
      title: '工位档案',
      minutes: 1,
      xp: 0,
      coins: 0,
      intro: '<p>这里记录工位任务的完成情况。</p>',
      starter: '',
      expected: ''
    };
    const course = {
      id: `office-${currentCourseId}`,
      type: courseType,
      name: `${info.company} · 工位任务`,
      en: 'OFFICE TASK',
      tagline: `${info.company} · ${rankFor().title}`,
      color: info.color,
      building: 'office',
      short: info.tagline,
      desc: info.intro,
      intro: `<p>${esc(info.intro)}</p>`,
      teacher: `${info.boss}（${info.bossTitle}）`,
      lessons: [marker, lessonDef]
    };
    lesson.open(course, lessonId, { skipStory: true });
  }

  function handleLessonComplete(payload) {
    const course = payload?.course;
    const lessonDef = payload?.lesson;
    if (!course || !lessonDef) return;
    if (!String(course.id || '').startsWith('office-')) return;
    if (!String(lessonDef.id || '').startsWith('office-task-')) return;
    if (handledTasks.has(lessonDef.id)) return;
    handledTasks.add(lessonDef.id);
    const courseId = course.id.replace('office-', '');
    const state = getOfficeState(save(), courseId);
    state.tasksDone += 1;
    state.merit += 12 + clamp(Number(lessonDef.meta?.level) || state.difficulty, 1, 5) * 4;
    state.lastTaskAt = new Date().toISOString();
    if (state.tasksDone % 2 === 0) {
      state.difficulty = clamp(state.difficulty + 1, 1, 5);
    }
    saveManager.markDirty();
    if (currentCourseId === courseId) {
      updateHud();
      pushLog('任务完成', [
        { speaker: infoFor(courseId).boss, text: '不错，任务单我看到了。绩效已经记上。' },
        { speaker: '小语', text: `已完成 ${state.tasksDone} 个任务，下一题难度 ${state.difficulty}/5。` }
      ]);
    }
    const ready = promotionReady(state);
    if (ready) {
      hud?.toast?.('绩效达标了，去老板办公室聊聊晋升吧。', 'reward');
    } else {
      hud?.toast?.(`任务完成，绩效 +${12 + state.difficulty * 4}。`, 'reward');
    }
  }

  /* ---------------- promotion / boss ---------------- */

  function openPromotion() {
    if (!currentCourseId) return;
    const state = stateFor();
    const next = nextOfficeRank(state);
    if (!next) {
      hud?.toast?.('你已经是部门领导了。', 'ok');
      return;
    }
    if (!promotionReady(state)) {
      hud?.toast?.(promotionProgress(state).text, 'warn');
      return;
    }
    const info = infoFor();
    const oldRank = officeRank(state);
    const el = showOverlay(bossPanel({
      kicker: `PROMOTION · ${oldRank.en} → ${next.en}`,
      title: `晋升为 ${next.title}`,
      body: `
        <div class="office-promo">
          <div class="office-promo-ranks">
            <div><span>现在</span><b>${esc(oldRank.title)}</b><i>¥${oldRank.salary.toLocaleString('zh-CN')}</i></div>
            <div class="office-promo-arrow">→</div>
            <div class="office-promo-next" style="--office-accent:${info.color}"><span>晋升后</span><b>${esc(next.title)}</b><i>¥${next.salary.toLocaleString('zh-CN')}</i></div>
          </div>
          <p>${esc(next.perk)}</p>
          <div class="office-promo-desk">新的办公位置：<b>${esc(next.desk)}</b></div>
        </div>`,
      actions: `
        <button type="button" class="btn btn-ghost" data-office-close>再等等</button>
        <button type="button" class="btn btn-primary" data-office-accept>接受晋升</button>`
    }));
    el.querySelector('[data-office-close]')?.addEventListener('click', closeOverlay);
    el.querySelector('[data-office-accept]')?.addEventListener('click', () => {
      state.stage = clamp(state.stage + 1, 0, OFFICE_RANKS.length - 1);
      state.merit += 30;
      state.difficulty = clamp(state.difficulty + 1, 1, 5);
      saveManager.markDirty();
      const desk = deskSpotFor(state.stage);
      closeOverlay();
      game.teleportInOffice?.(desk.x, desk.y);
      game.refreshOfficeState?.();
      updateHud();
      const newRank = officeRank(state);
      pushLog('晋升', [
        { speaker: info.boss, text: `${save().player.name}，从今天起你就是${newRank.title}了。` },
        { speaker: '小语', text: `办公位置升级为${newRank.desk}，任务难度也会跟着提高。` }
      ]);
      hud?.toast?.(`晋升为 ${newRank.title}，月薪 ¥${salaryOf(state).toLocaleString('zh-CN')}。`, 'reward');
      sfx.reward?.();
      ensureChatter('office', { force: true });
    });
  }

  function openBossDialog() {
    const state = stateFor();
    const info = infoFor();
    const promo = promotionProgress(state);
    const el = showOverlay(bossPanel({
      kicker: 'ONE-ON-ONE · 老板办公室',
      title: `${info.boss} 想和你聊聊`,
      body: `
        <div class="office-dialog">
          <div class="office-line is-boss"><b>${esc(info.boss)}</b><span>${esc(info.bossLine)}</span></div>
          <div class="office-line is-boss"><b>${esc(info.boss)}</b><span>你现在是${esc(officeRank(state).title)}，已完成 ${state.tasksDone} 个任务，绩效 ${state.merit}。</span></div>
          <div class="office-line is-system">${esc(promo.text)}</div>
        </div>`,
      actions: `
        <button type="button" class="btn btn-ghost" data-office-close>先回去工作</button>
        <button type="button" class="btn btn-mint" data-office-task>接一个任务</button>
        ${promotionReady(state) ? '<button type="button" class="btn btn-primary" data-office-promote>谈晋升</button>' : ''}`
    }));
    el.querySelector('[data-office-close]')?.addEventListener('click', closeOverlay);
    el.querySelector('[data-office-task]')?.addEventListener('click', () => {
      closeOverlay();
      startTask();
    });
    el.querySelector('[data-office-promote]')?.addEventListener('click', () => {
      closeOverlay();
      openPromotion();
    });
  }

  /* ---------------- office interactions ---------------- */

  function interact(it) {
    if (!it || it.type !== 'office') return;
    const state = stateFor();
    switch (it.kind) {
      case 'exit':
        game.exitOffice?.();
        break;
      case 'desk':
        if (!state.hired) beginInterview();
        else startTask();
        break;
      case 'boss':
        if (!state.hired) beginInterview();
        else if (promotionReady(state)) openPromotion();
        else openBossDialog();
        break;
      case 'printer':
        showPrinter();
        break;
      case 'cooler':
        restAtCooler();
        break;
      case 'meeting':
        openMeetingStory();
        break;
      case 'rest':
        restAtSofa();
        break;
      case 'window':
        lookOutside();
        break;
      default:
        break;
    }
  }

  function showPrinter() {
    const state = stateFor();
    const info = infoFor();
    showOverlay(bossPanel({
      kicker: 'PRINTER · 打印机',
      title: '任务单打印好了',
      body: `
        <div class="office-ticket">
          <span>${esc(info.company)} · ${esc(info.floor)}</span>
          <h3>${esc(save().player.name)} 的工作记录</h3>
          <p>职位：<b>${esc(officeRank(state).title)}</b> · 工位：<b>${esc(officeRank(state).desk)}</b></p>
          <p>已完成任务：<b>${state.tasksDone}</b> · 绩效：<b>${state.merit}</b> · 当前题目难度：<b>${state.difficulty}/5</b></p>
          <p>${esc(promotionProgress(state).text)}</p>
        </div>`,
      actions: '<button type="button" class="btn btn-primary" data-office-close>收好任务单</button>'
    }), { wide: true });
    overlayEl.querySelector('[data-office-close]')?.addEventListener('click', closeOverlay);
  }

  function restAtCooler() {
    const state = stateFor();
    hud?.toast?.('你在饮水机前接了杯水，顺手听了一段同事的闲聊。', 'ok');
    sfx.click?.();
    if (state.tasksDone === 0) {
      hud?.toast?.('刚入职的话，先去工位接一个任务吧。', 'warn');
    }
    ensureChatter('office');
  }

  function restAtSofa() {
    hud?.toast?.('你陷进休息区的沙发里，窗外的城市像一条缓慢发光的河。', 'ok');
    sfx.tick?.();
    ensureChatter('office');
  }

  function lookOutside() {
    const info = infoFor();
    showOverlay(bossPanel({
      kicker: 'CITY VIEW · 落地窗',
      title: '城市正在慢慢亮起来',
      body: `
        <div class="office-view">
          <div class="office-view-sky"></div>
          <p>${esc(info.intro)}</p>
          <p>玻璃上映出你的工位和身后的同事。远处，三座大楼的灯一层层亮起。</p>
        </div>`,
      actions: '<button type="button" class="btn btn-primary" data-office-close>回到工位</button>'
    }), { wide: true });
    overlayEl.querySelector('[data-office-close]')?.addEventListener('click', closeOverlay);
  }

  async function openMeetingStory() {
    if (!currentCourseId) return;
    storyOpen = true;
    const loading = showOverlay(bossPanel({
      kicker: 'MEETING · 会议室',
      title: '十分钟站会',
      body: '<div class="office-loading is-inline"><div class="office-spinner"></div><p>同事们正在把白板翻到新的一页…</p></div>',
      actions: '<button type="button" class="btn btn-ghost" data-office-close>先回去工作</button>'
    }), { wide: true });
    loading.querySelector('[data-office-close]')?.addEventListener('click', () => closeOverlay());
    let data = getChatter('meeting');
    if (!data) {
      data = await ensureChatter('meeting', { force: true }).catch(() => null);
    }
    if (!overlayEl) {
      storyOpen = false;
      return;
    }
    if (!data) {
      data = {
        title: '十分钟站会',
        lines: [
          { speaker: infoFor().boss, text: '今天只问三个问题：做了什么，卡在哪，下一步是什么。' },
          { speaker: '小语', text: '我把大家的问题记在白板上了，散会后可以接着看。' }
        ]
      };
    }
    meetingOverride = data;
    const body = `
      <div class="office-meeting-story">
        <p class="office-story-title">${esc(data.title)}</p>
        <div class="office-dialog">
          ${data.lines.map((line) => `<div class="office-line is-boss"><b>${esc(line.speaker)}</b><span>${esc(line.text)}</span></div>`).join('')}
        </div>
        <p class="office-story-foot">会议纪要已经记进办公室动态。</p>
      </div>`;
    const el = showOverlay(bossPanel({
      kicker: 'MEETING · 会议室',
      title: data.title || '十分钟站会',
      body,
      actions: `
        <button type="button" class="btn btn-ghost" data-office-close>回去工作</button>
        <button type="button" class="btn btn-mint" data-office-task>接下一个任务</button>`
    }), { wide: true });
    storyOpen = true;
    pushLog(data.title, data.lines);
    el.querySelector('[data-office-close]')?.addEventListener('click', () => closeOverlay());
    el.querySelector('[data-office-task]')?.addEventListener('click', () => {
      closeOverlay();
      startTask();
    });
  }

  /* ---------------- lifecycle ---------------- */

  function enterTower(courseId) {
    if (!OFFICE_COURSES[courseId]) return;
    currentCourseId = courseId;
    const state = stateFor(courseId);
    mountHud();
    game.enterOffice?.(courseId);
    setTimeout(() => {
      updateHud();
      ensureChatter('office');
      if (!state.hired) beginInterview();
      else hud?.toast?.(`你回到了${infoFor(courseId).company}，${officeRank(state).title}。`, 'ok');
    }, 240);
  }

  function handleSceneChange(scene) {
    mountHud();
    if (scene === 'office') {
      if (!currentCourseId) currentCourseId = game.officeCourse || 'python';
      updateHud();
      ensureChatter('office');
    } else {
      if (hudEl) hudEl.hidden = true;
      if (overlayEl) closeOverlay();
    }
  }

  function getOfficeContext() {
    if (game.scene !== 'office' || !currentCourseId) return null;
    const state = stateFor();
    return {
      courseId: currentCourseId,
      company: infoFor().company,
      rank: officeRank(state).title,
      tasksDone: state.tasksDone,
      merit: state.merit,
      difficulty: state.difficulty,
      salary: salaryOf(state),
      promotion: promotionProgress(state).text
    };
  }

  function refreshLocalTaskState() {
    if (currentCourseId && game.scene === 'office') updateHud();
  }

  const unsubscribe = saveManager.on((type, payload) => {
    if (type === 'lesson-complete') handleLessonComplete(payload);
    if (type === 'level-up') refreshLocalTaskState();
  });

  return {
    enterTower,
    handleSceneChange,
    interact,
    getChatter,
    ensureChatter,
    isOverlayOpen: overlayOpen,
    getOfficeContext,
    updateHud,
    closeOverlay,
    destroy() {
      unsubscribe?.();
      closeOverlay();
      hudEl?.remove();
      hudEl = null;
    }
  };
}
