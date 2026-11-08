import { SQL_TABLES, lessonFilename, lessonLanguage } from '../data/courses.js';
import { runPython, normalizeOutput } from '../engine/pylite.js';
import { runSQL, formatSQLResult, sameResult } from '../engine/minisql.js';
import { getCourseStory, getLessonMeta } from '../data/lessonMeta.js';
import { levelInfo } from '../data/progression.js';
import { showCourseStory } from './lessonStory.js';
import { createDemoStage } from './lessonDemo.js';
import { sfx } from '../core/audio.js';

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function plainText(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function expectedBox(course, lesson) {
  if (course.type === 'sql' && lesson.expect) {
    const { columns, rows } = lesson.expect;
    return `
      <div class="expected-box">
        <div class="expected-head"><span>期望结果</span><span>${columns.length} 列 · ${rows.length} 行</span></div>
        <div class="expected-table-wrap">
          <table class="result-table"><thead><tr>${columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>
        </div>
      </div>`;
  }
  if (course.type === 'python' && lesson.expected) {
    return `
      <div class="expected-box">
        <div class="expected-head"><span>期望输出</span><span>Python</span></div>
        <pre>${esc(lesson.expected)}</pre>
      </div>`;
  }
  if (lesson.goalList?.length) {
    return `
      <div class="expected-box">
        <div class="expected-head"><span>完成条件</span><span>全部勾上即可</span></div>
        <ul class="goal-list">${lesson.goalList.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>
      </div>`;
  }
  return '';
}

function evaluateWeb(code, lesson) {
  const doc = new DOMParser().parseFromString(`<!doctype html><html><body>${code}</body></html>`, 'text/html');
  const checks = [];
  for (const check of lesson.checks || []) {
    let pass = false;
    try {
      if (check.minCount) {
        pass = doc.querySelectorAll(check.selector).length >= check.minCount;
      } else {
        const el = doc.querySelector(check.selector);
        pass = Boolean(el) && (!check.textIncludes || (el.textContent || '').includes(check.textIncludes));
      }
    } catch {
      pass = false;
    }
    checks.push({ label: check.label || check.selector, pass });
  }
  const regexCheck = (pattern) => {
    try {
      return new RegExp(pattern, 's').test(code);
    } catch {
      return false;
    }
  };
  for (const check of lesson.cssChecks || []) {
    checks.push({ label: check.label || 'CSS 样式', pass: regexCheck(check.pattern) });
  }
  for (const check of lesson.scriptChecks || []) {
    checks.push({ label: check.label || 'JavaScript 行为', pass: regexCheck(check.pattern) });
  }
  return { ok: checks.every((c) => c.pass), checks };
}

function levelDots(level) {
  const n = Math.max(1, Math.min(5, Number(level) || 1));
  return Array.from({ length: 5 }, (_, i) => `<i class="${i < n ? 'is-on' : ''}"></i>`).join('');
}

export function createLessonRunner({ saveManager, hud, panels, onAssist }) {
  const root = document.getElementById('lesson-root');
  const modalRoot = document.getElementById('modal-root');
  let current = null;
  let draftTimer = 0;
  let demo = null;
  let tutorAbort = null;

  function draftKey(course, lesson) {
    return `mossbrook.draft.${saveManager.user.id}.${course.id}.${lesson.id}`;
  }

  function readDraft(course, lesson) {
    try {
      return localStorage.getItem(draftKey(course, lesson));
    } catch {
      return null;
    }
  }

  function writeDraft() {
    if (!current) return;
    const { course, lesson } = current;
    const editor = root.querySelector('.code-input');
    if (!editor) return;
    try {
      const value = editor.value;
      if (!value.trim() || value === lesson.starter) localStorage.removeItem(draftKey(course, lesson));
      else localStorage.setItem(draftKey(course, lesson), value);
    } catch {
      /* storage is optional */
    }
  }

  function flushDraft() {
    clearTimeout(draftTimer);
    writeDraft();
  }

  function scheduleDraft() {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(writeDraft, 350);
  }

  function storySeen(courseId) {
    return Boolean(saveManager.save.flags?.storySeen?.[courseId]);
  }

  function markStorySeen(courseId) {
    saveManager.save.flags ||= {};
    saveManager.save.flags.storySeen ||= {};
    saveManager.save.flags.storySeen[courseId] = new Date().toISOString();
    saveManager.markDirty();
  }

  /* ---------------- shell ---------------- */

  function shell(course, lesson, index) {
    const done = saveManager.courseDoneCount(course);
    const total = course.lessons.length;
    const ratio = total ? Math.round((done / total) * 100) : 0;
    const meta = lesson.meta || getLessonMeta(lesson.id);
    const officeTask = String(course.id || '').startsWith('office-');
    const skipCount = saveManager.skipCardCount();
    const language = lessonLanguage(course);
    const kicker = course.tagline.toUpperCase().includes(language.toUpperCase())
      ? course.tagline
      : `${course.tagline} · ${language}`;

    return `
      <div class="lesson-shell">
        <header class="lesson-bar">
          <button type="button" class="lesson-back" data-act="back" aria-label="回到课程">← <span>课程</span></button>
          <div class="lesson-bar-info">
            <p class="lesson-bar-course">${esc(course.name)}<span>${esc(lessonLanguage(course))}</span></p>
            <p class="lesson-bar-title">${officeTask ? `工位任务 · ${esc(lesson.title)}` : `第 ${index + 1} 课 · ${esc(lesson.title)}`}</p>
          </div>
          <div class="lesson-progress-wrap">
            <div class="lesson-progress-track"><i data-progress-bar style="width:${ratio}%"></i></div>
            <span class="lesson-progress-label" data-progress-label>${done}/${total}</span>
          </div>
          <div class="lesson-bar-actions">
            ${officeTask ? '<span class="lesson-chip is-office">工位任务 · 老板指派</span>' : `
              <button type="button" class="lesson-chip" data-act="story">故事</button>
              <button type="button" class="lesson-chip is-skip${skipCount ? '' : ' is-empty'}" data-act="skip">跳关 <b data-skip-count>×${skipCount}</b></button>`}
          </div>
        </header>

        <div class="lesson-main">
          <aside class="lesson-teach">
            <div class="lesson-zone-head">
              <span class="zone-badge">教学区</span>
              <span class="zone-hint">先读理论，再看示例，最后动手</span>
            </div>
            <div class="lesson-teach-scroll" data-teach-scroll>
              <p class="lesson-kicker">${esc(kicker)}</p>
              <h2 class="lesson-title">${esc(lesson.title)}</h2>
              <div class="lesson-tags">
                <span class="lesson-concept">${esc(meta.concept)}</span>
                <span class="lesson-difficulty" title="难度 ${meta.level}/5">${levelDots(meta.level)}</span>
                <span class="lesson-reward">首通 +${lesson.xp} XP · +${lesson.coins} 铜币</span>
              </div>

              <section class="theory-card">
                <header><i>理论</i><span>核心概念</span></header>
                <p>${esc(meta.focus)}</p>
                ${meta.syntax ? `
                  <div class="theory-syntax">
                    <span>示例代码</span>
                    <pre>${esc(meta.syntax)}</pre>
                  </div>` : ''}
              </section>

              <ol class="theory-steps">
                ${meta.steps.map((step, i) => `
                  <li><span>${String(i + 1).padStart(2, '0')}</span><p>${esc(step)}</p></li>`).join('')}
              </ol>

              <section class="theory-goal">
                <header><i>目标</i><span>做到这些就能通过</span></header>
                ${expectedBox(course, lesson) || '<p class="theory-empty">按示例写出代码，运行后提交检测。</p>'}
              </section>

              <details class="lesson-lore">
                <summary>老师想对你说 <span>课程导览 · 可展开</span></summary>
                <div class="lesson-rich">${lesson.intro}</div>
                ${lesson.hint ? `<div class="lesson-hint-box"><b>老师的小纸条</b><br>${lesson.hint}</div>` : ''}
              </details>

              <section class="lesson-checks" data-checks hidden></section>

              <section class="tutor-card" data-tutor data-state="idle">
                <header>
                  <span class="tutor-face" aria-hidden="true">芋</span>
                  <div><b>芋丸</b><span data-tutor-state>在旁边看着</span></div>
                </header>
                <p class="tutor-text" data-tutor-text>我会在旁边看着。先自己试一次，卡住了就点下面的按钮。</p>
                <p class="tutor-ai" data-tutor-ai hidden></p>
                <div class="tutor-actions">
                  <button type="button" class="tutor-btn is-ref" data-act="reveal" hidden>看参考写法</button>
                  <button type="button" class="tutor-btn" data-act="ask">让芋丸看看我的代码</button>
                </div>
                <pre class="tutor-ref" data-tutor-ref hidden>${esc(meta.syntax || '')}</pre>
              </section>
            </div>

            <div class="lesson-demo">
              <div class="demo-head">
                <b>演示小人</b>
                <span data-demo-state>等待你运行</span>
                <button type="button" class="demo-replay" data-act="demo-replay" title="重播演示" aria-label="重播演示">↻</button>
              </div>
              <canvas data-demo-canvas width="480" height="176" aria-hidden="true"></canvas>
              <p class="demo-caption" data-demo-caption>运行后，小人会替你把代码走一遍。</p>
            </div>
          </aside>

          <section class="lesson-play">
            <div class="lesson-zone-head is-play">
              <span class="zone-badge">操作区</span>
              <span class="zone-hint">在下面写代码 · Ctrl + Enter 运行 · Ctrl + S 提交</span>
            </div>
            <div class="editor-head">
              <span class="file-tab"><i></i>${esc(lessonFilename(course))}</span>
              <div class="editor-tools">
                <button type="button" class="editor-tool" data-act="reset">重置代码</button>
                <button type="button" class="editor-tool" data-act="top">回到理论</button>
              </div>
            </div>
            <div class="editor-area">
              <div class="line-gutter" aria-hidden="true"></div>
              <textarea class="code-input" spellcheck="false" autocomplete="off" autocapitalize="off" wrap="off" aria-label="代码编辑器"></textarea>
            </div>
            <div class="terminal-pane" data-terminal>
              <div class="terminal-head"><b>${course.type === 'web' ? '网页预览' : '控制台'}</b><span class="term-status">等待运行</span></div>
              <div class="terminal-body"><span class="term-muted">// 按 Ctrl + Enter 或点击「运行」，看看代码会做什么。</span></div>
              <div class="terminal-preview"><iframe title="网页预览" sandbox="allow-scripts"></iframe></div>
            </div>
            <div class="editor-actions">
              <button type="button" class="btn btn-mint" data-act="run">运行</button>
              <span class="run-hint" data-feedback>写好后运行一次，再提交检测。</span>
              <span class="spacer"></span>
              <button type="button" class="lesson-ask" data-act="ask">芋丸提示</button>
              <button type="button" class="btn btn-primary" data-act="submit">提交检测</button>
            </div>
          </section>
        </div>
      </div>`;
  }

  /* ---------------- editor plumbing ---------------- */

  function updateGutter() {
    const editor = root.querySelector('.code-input');
    const gutter = root.querySelector('.line-gutter');
    if (!editor || !gutter) return;
    const count = editor.value.split('\n').length;
    let html = '';
    for (let i = 1; i <= count; i++) html += `<span>${i}</span>`;
    gutter.innerHTML = html;
    gutter.scrollTop = editor.scrollTop;
  }

  function setTerm(html) {
    const body = root.querySelector('.terminal-body');
    if (body) body.innerHTML = html;
  }

  function setStatus(text, kind = '') {
    const el = root.querySelector('.term-status');
    if (!el) return;
    el.textContent = text;
    el.className = `term-status${kind === 'ok' ? ' is-ok' : kind === 'err' ? ' is-err' : ''}`;
  }

  function feedback(text, kind = '') {
    const el = root.querySelector('[data-feedback]');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-ok', kind === 'ok');
    el.classList.toggle('is-err', kind === 'err');
  }

  function renderChecks(checks) {
    const box = root.querySelector('[data-checks]');
    if (!box) return;
    box.hidden = false;
    const passed = checks.filter((check) => check.pass).length;
    box.innerHTML = `
      <p class="checks-head">自检结果 · ${passed}/${checks.length}</p>
      <ul class="checks-list">
        ${checks.map((check) => `<li class="${check.pass ? 'is-ok' : 'is-no'}"><span>${check.pass ? '✓' : '·'}</span>${esc(check.label)}</li>`).join('')}
      </ul>`;
  }

  function updatePreview(code) {
    const pane = root.querySelector('[data-terminal]');
    if (!pane) return;
    const iframe = pane.querySelector('iframe');
    pane.classList.add('show-preview');
    setStatus('预览已更新', 'ok');
    if (iframe) {
      iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>
        html, body { margin: 0; }
        body { font-family: "Segoe UI", "Microsoft YaHei", system-ui, sans-serif; padding: 18px; background: #fffdf8; color: #2a2a2a; }
        button { font: inherit; padding: 6px 14px; cursor: pointer; }
      </style></head><body>${code}<script>
        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape') {
            event.preventDefault();
            parent.postMessage({ type: 'mossbrook:preview-escape' }, '*');
          } else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            parent.postMessage({ type: 'mossbrook:preview-run' }, '*');
          }
        });
      <\/script></body></html>`;
    }
  }

  function refreshProgress() {
    if (!current) return;
    const done = saveManager.courseDoneCount(current.course);
    const total = current.course.lessons.length;
    const bar = root.querySelector('[data-progress-bar]');
    const label = root.querySelector('[data-progress-label]');
    if (bar) bar.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
    if (label) label.textContent = `${done}/${total}`;
  }

  function updateSkipButton() {
    const count = saveManager.skipCardCount();
    const label = root.querySelector('[data-skip-count]');
    const button = root.querySelector('[data-act="skip"]');
    if (label) label.textContent = `×${count}`;
    button?.classList.toggle('is-empty', count <= 0);
  }

  /* ---------------- story ---------------- */

  function openStory(force = false) {
    if (!current || current.story) return;
    if (String(current.course.id).startsWith('office-')) return;
    const story = getCourseStory(current.course.id);
    if (!story) {
      hud.toast?.('这门课的故事还在写。', 'warn');
      return;
    }
    if (!force && storySeen(current.course.id)) return;
    const active = current;
    active.story = showCourseStory(root, active.course, story, {
      onDone: () => {
        if (current !== active) return;
        active.story = null;
        root.classList.remove('is-story-open');
        if (!storySeen(active.course.id)) markStorySeen(active.course.id);
        const editor = root.querySelector('.code-input');
        editor?.focus({ preventScroll: true });
      }
    });
    if (active.story) root.classList.add('is-story-open');
  }

  function closeStory() {
    if (!current?.story) return;
    const story = current.story;
    current.story = null;
    root.classList.remove('is-story-open');
    story.close?.();
  }

  /* ---------------- demo stage ---------------- */

  function setDemoState(state, caption) {
    const stateEl = root.querySelector('[data-demo-state]');
    const capEl = root.querySelector('[data-demo-caption]');
    if (stateEl && state !== null) stateEl.textContent = state;
    if (capEl && caption) capEl.textContent = caption;
  }

  function runDemo(passed, stage, reason = '') {
    if (!current) return;
    current.lastDemo = { passed, stage, reason };
    demo?.run({ passed, stage });
    if (passed) {
      setDemoState('抵达终点 · 通过', '代码一路跑通，小人替你走到了终点。');
    } else {
      const pct = Math.round(Math.max(0.22, Math.min(1, stage)) * 100);
      const where = plainText(reason).slice(0, 42);
      setDemoState(`半路停下 · ${pct}%`, where ? `小人在出错的地方停下：${where}` : '小人在半路停下，检查代码后重试。');
    }
  }

  /* ---------------- tutor ---------------- */

  function renderTutor() {
    if (!current) return;
    const card = root.querySelector('[data-tutor]');
    if (!card) return;
    const { meta } = current;
    const stateEl = card.querySelector('[data-tutor-state]');
    const textEl = card.querySelector('[data-tutor-text]');
    const aiEl = card.querySelector('[data-tutor-ai]');
    const refBtn = card.querySelector('[data-act="reveal"]');
    const refEl = card.querySelector('[data-tutor-ref]');
    const askBtn = card.querySelector('.tutor-actions [data-act="ask"]');

    let state = '在旁边看着';
    let text = '先读左边的理论和示例，再自己写一遍。出错也没关系——第二次卡住时我会开口。';
    if (current.failures === 1) {
      state = '记下了第一个错误';
      text = '第一次出错很正常。把终端的报错从上往下读一遍，只改最小的那一处，再运行一次。';
    }
    if (current.hintLevel > 0) {
      const hint = meta.tutor[Math.min(current.hintLevel - 1, meta.tutor.length - 1)];
      state = `提示 ${Math.min(current.hintLevel, meta.tutor.length)}/${meta.tutor.length}`;
      text = hint;
    }
    if (current.aiBusy) {
      state = '正在看你的代码…';
    } else if (current.aiText) {
      state = '芋丸介入';
    }
    card.dataset.state = current.aiBusy ? 'thinking' : current.hintLevel > 0 ? 'hinting' : current.failures ? 'watching' : 'idle';
    if (stateEl) stateEl.textContent = state;
    if (textEl) textEl.textContent = text;
    if (aiEl) {
      aiEl.hidden = !current.aiText && !current.aiBusy;
      aiEl.textContent = current.aiBusy ? '让我看看你写的代码，别急……' : current.aiText;
      aiEl.classList.toggle('is-thinking', current.aiBusy);
    }
    if (refBtn) refBtn.hidden = !(current.revealRef && meta.syntax);
    if (refEl) refEl.hidden = !current.revealRef || !meta.syntax;
    if (askBtn) {
      askBtn.disabled = current.aiBusy;
      askBtn.textContent = current.aiBusy ? '芋丸正在看…' : '让芋丸看看我的代码';
    }
  }

  function revealReference() {
    if (!current) return;
    current.revealRef = true;
    renderTutor();
    sfx.tick();
    feedback('参考写法已经展开。先照着敲一遍，再试着自己改。', 'ok');
  }

  function askTutor(scroll = false) {
    if (!current) return;
    requestStuck();
    if (scroll) {
      const card = root.querySelector('[data-tutor]');
      card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      card?.classList.add('is-flash');
      setTimeout(() => card?.classList.remove('is-flash'), 900);
    }
  }

  function stateForHint(code, failure) {
    const info = levelInfo(saveManager.save.xp);
    return {
      player: `${saveManager.save.player.name}，Lv.${info.level}`,
      place: '课程关卡',
      lesson: `${current.course.name} · ${current.lesson.title}`,
      concept: current.meta.concept,
      failures: current.failures,
      code: String(code || '').slice(0, 500),
      expected: current.lesson.expected || current.lesson.goalList?.join('；') || '',
      error: failure?.reason || '',
      failedChecks: failure?.failedChecks || []
    };
  }

  async function requestStuck(failure = null) {
    if (!current || current.aiBusy) return;
    const active = current;
    const editor = root.querySelector('.code-input');
    const code = editor?.value || '';
    const controller = new AbortController();
    tutorAbort = controller;
    active.aiBusy = true;
    active.aiText = '';
    renderTutor();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'tip',
          event: 'lesson-stuck',
          detail: {
            courseId: active.course.id,
            course: active.course.name,
            lessonId: active.lesson.id,
            lesson: active.lesson.title,
            concept: active.meta.concept,
            failures: active.failures,
            kind: failure?.kind || '还没有通过',
            reason: failure?.reason || '',
            failedChecks: failure?.failedChecks || [],
            code: code.slice(0, 600)
          },
          state: stateForHint(code, failure)
        }),
        signal: controller.signal
      });
      const data = await res.json().catch(() => null);
      if (current !== active) return;
      if (!res.ok || !data?.ok || !data.text) throw new Error();
      active.aiText = String(data.text).slice(0, 180);
    } catch {
      if (current !== active) return;
      active.aiText = '';
      if (active.hintLevel === 0) active.hintLevel = 1;
    } finally {
      clearTimeout(timer);
      if (tutorAbort === controller) tutorAbort = null;
      if (current === active) {
        active.aiBusy = false;
        renderTutor();
      }
    }
  }

  function abortTutor() {
    tutorAbort?.abort();
    tutorAbort = null;
    if (current) {
      current.aiBusy = false;
    }
  }

  function noteFailure(failure) {
    if (!current) return;
    current.failures += 1;
    if (current.failures === 1) {
      renderTutor();
      return;
    }
    current.hintLevel = Math.min(3, Math.max(current.hintLevel, current.failures - 1));
    if (current.hintLevel >= 2) current.revealRef = true;
    renderTutor();
    if (!current.aiText && !current.aiBusy) requestStuck(failure);
    const card = root.querySelector('[data-tutor]');
    card?.classList.add('is-flash');
    setTimeout(() => card?.classList.remove('is-flash'), 900);
  }

  /* ---------------- success ---------------- */

  function succeed() {
    if (!current || current.completed) return;
    current.completed = true;
    const { course, lesson, index } = current;
    const result = saveManager.completeLesson(course, lesson);
    refreshProgress();
    setStatus('通过检测', 'ok');
    const submitBtn = root.querySelector('[data-act="submit"]');
    if (submitBtn) {
      submitBtn.textContent = '已完成';
      submitBtn.disabled = true;
    }
    const nextLesson = course.lessons[index + 1] || null;
    panels.showReward({
      course,
      lesson,
      result,
      nextLesson,
      onNext: () => {
        if (nextLesson) open(course, nextLesson.id);
      },
      onCourse: () => {
        close();
        if (!String(course.id).startsWith('office-')) panels.openCourse(course.id);
      },
      onTown: () => close()
    });
    onAssist?.('lesson-success', {
      courseId: course.id,
      course: course.name,
      lessonId: lesson.id,
      lesson: lesson.title,
      firstTime: result.firstTime,
      xp: result.xpGain,
      coins: result.coinGain,
      levelUps: result.levelUps,
      courseComplete: result.courseComplete,
      nextLesson: nextLesson?.title || null
    });
  }

  /* ---------------- execute ---------------- */

  function pythonFailureStage(error, code) {
    const total = Math.max(1, code.split('\n').length);
    const match = String(error || '').match(/第\s*(\d+)\s*行/);
    if (!match) return 0.68;
    const line = Math.max(1, Math.min(total, Number(match[1])));
    return Math.max(0.2, Math.min(0.94, (line - 1) / total));
  }

  function execute(submit = false) {
    if (!current) return;
    const { course, lesson } = current;
    const editor = root.querySelector('.code-input');
    if (!editor) return;
    const code = editor.value;

    if (!code.trim()) {
      setTerm('<span class="term-err">编辑器还是空的，先写一点代码吧。</span>');
      setStatus('等待代码', 'err');
      feedback('编辑器还是空的。', 'err');
      sfx.error();
      return;
    }

    let passed = false;
    let message = '';
    let failure = null;
    let demoStage = 0.5;

    if (course.type === 'python') {
      const result = runPython(code);
      const output = result.output.join('\n');
      if (result.error) {
        const outputHtml = result.output.length ? `${esc(output)}\n` : '';
        setTerm(`${outputHtml}<span class="term-err">${esc(result.error)}</span>`);
        setStatus('运行出错', 'err');
        message = result.error;
        failure = { kind: '运行报错', reason: result.error };
        demoStage = pythonFailureStage(result.error, code);
        passed = false;
      } else {
        passed = normalizeOutput(output) === normalizeOutput(lesson.expected);
        setTerm(output ? esc(output) : '<span class="term-muted">（程序没有任何输出）</span>');
        setStatus(passed ? '输出一致' : '输出不一致', passed ? 'ok' : 'err');
        message = passed ? '输出和期望完全一致。' : '还差一点：逐行对照左侧的期望输出。';
        if (!passed) {
          failure = { kind: '输出不一致', reason: '程序输出和期望输出不完全一致' };
          demoStage = 0.72;
        }
      }
    } else if (course.type === 'sql') {
      const result = runSQL(code, SQL_TABLES);
      if (!result.ok) {
        setTerm(`<span class="term-err">${esc(result.error)}</span>`);
        setStatus('查询出错', 'err');
        message = result.error;
        failure = { kind: '查询报错', reason: result.error };
        demoStage = 0.34;
      } else {
        passed = sameResult(result, lesson.expect);
        setTerm(esc(formatSQLResult(result)));
        setStatus(passed ? '结果一致' : '结果不一致', passed ? 'ok' : 'err');
        message = passed ? '结果和档案里的一致。' : '结果还不一致：检查列、条件、排序或别名。';
        if (!passed) {
          failure = { kind: '结果不一致', reason: '查询结果的列或行和期望不一致' };
          demoStage = 0.58;
        }
      }
    } else {
      const result = evaluateWeb(code, lesson);
      updatePreview(code);
      renderChecks(result.checks);
      passed = result.ok;
      const passedChecks = result.checks.filter((check) => check.pass).length;
      demoStage = result.checks.length ? Math.max(0.22, passedChecks / result.checks.length) : 0.5;
      setStatus(passed ? '条件全部满足' : '还有条件未满足', passed ? 'ok' : 'err');
      message = passed ? '完成条件都满足了。可以在预览里再点一点确认交互。' : '看看左侧的自检结果，还有几项没勾上。';
      if (!passed) {
        failure = {
          kind: '网页自检未通过',
          reason: '还有完成条件没有满足',
          failedChecks: result.checks.filter((check) => !check.pass).map((check) => check.label).slice(0, 4)
        };
      }
    }

    if (submit) {
      if (passed) {
        runDemo(true, 1);
        renderTutor();
        if (current.completed) {
          feedback('这一课已经完成过了，可以继续下一课。', 'ok');
          sfx.tick();
        } else {
          feedback('通过检测！', 'ok');
          succeed();
        }
      } else {
        runDemo(false, demoStage, failure?.reason || message);
        feedback(message || '还没通过，再改改看。', 'err');
        sfx.error();
        noteFailure(failure);
        onAssist?.('lesson-fail', {
          courseId: course.id,
          course: course.name,
          lessonId: lesson.id,
          lesson: lesson.title,
          kind: failure?.kind || '未通过',
          reason: failure?.reason || message,
          failedChecks: failure?.failedChecks || [],
          hint: plainText(lesson.hint).slice(0, 140)
        });
      }
    } else {
      runDemo(passed, demoStage, failure?.reason || '');
      feedback(passed ? '看起来可以提交检测了。' : message, passed ? 'ok' : '');
      if (passed) sfx.tick();
    }
  }

  /* ---------------- reset ---------------- */

  function resetCode() {
    if (!current) return;
    const editor = root.querySelector('.code-input');
    if (!editor) return;
    editor.value = current.lesson.starter;
    try {
      localStorage.removeItem(draftKey(current.course, current.lesson));
    } catch {
      /* noop */
    }
    updateGutter();
    feedback('已经恢复到起始代码。');
    setStatus('等待运行');
    const pane = root.querySelector('[data-terminal]');
    pane?.classList.remove('show-preview');
    setTerm('<span class="term-muted">// 起始代码已经放回编辑器。</span>');
    root.querySelector('[data-checks]')?.setAttribute('hidden', '');
    demo?.reset();
    setDemoState('等待你运行', '运行后，小人会替你把代码走一遍。');
    editor.focus();
  }

  function insertText(text) {
    const editor = root.querySelector('.code-input');
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.slice(0, start) + text + editor.value.slice(end);
    editor.selectionStart = editor.selectionEnd = start + text.length;
    updateGutter();
    scheduleDraft();
  }

  function autoIndent() {
    const editor = root.querySelector('.code-input');
    if (!editor) return;
    const start = editor.selectionStart;
    const before = editor.value.slice(0, start);
    const line = before.slice(before.lastIndexOf('\n') + 1);
    const base = (line.match(/^[ \t]*/) || [''])[0];
    const extra = line.trimEnd().endsWith(':') ? '    ' : '';
    insertText(`\n${base}${extra}`);
  }

  /* ---------------- skip card ---------------- */

  function closeDialog() {
    root.querySelector('[data-dialog]')?.remove();
  }

  function openSkipDialog() {
    if (!current || root.querySelector('[data-dialog]')) return;
    const count = saveManager.skipCardCount();
    const dialog = document.createElement('div');
    dialog.className = 'lesson-dialog';
    dialog.dataset.dialog = '';
    dialog.innerHTML = `
      <div class="lesson-dialog-box" role="dialog" aria-modal="true" aria-label="使用跳关卡">
        <p class="dialog-kicker">SKIP CARD</p>
        <h3>${count > 0 ? '用一张跳关卡吗？' : '跳关卡用完了'}</h3>
        <p>${count > 0
          ? `「${esc(current.lesson.title)}」会被标记为完成，但不会发放首通奖励。你现在有 <b>${count}</b> 张跳关卡。`
          : '每天签到可以领一张跳关卡。今天的签到在任务面板里。'}</p>
        <div class="dialog-actions">
          <button type="button" class="lesson-dialog-btn" data-dialog-act="cancel">再想想</button>
          ${count > 0
            ? '<button type="button" class="lesson-dialog-btn is-danger" data-dialog-act="confirm">使用并前进</button>'
            : '<button type="button" class="lesson-dialog-btn is-danger" data-dialog-act="checkin">去签到</button>'}
        </div>
      </div>`;
    root.appendChild(dialog);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        closeDialog();
        return;
      }
      const action = event.target.closest('[data-dialog-act]')?.dataset.dialogAct;
      if (!action) return;
      if (action === 'cancel') {
        closeDialog();
        return;
      }
      if (action === 'checkin') {
        closeDialog();
        panels.openTasks();
        return;
      }
      if (action === 'confirm') useSkipCard();
    });
    sfx.open();
  }

  function useSkipCard() {
    if (!current) return;
    const active = current;
    const result = saveManager.skipLesson(active.course, active.lesson);
    if (!result.ok) {
      hud.toast(result.error, 'warn');
      closeDialog();
      updateSkipButton();
      return;
    }
    closeDialog();
    updateSkipButton();
    refreshProgress();
    hud.toast(`用掉一张跳关卡，「${active.lesson.title}」已标记完成。`, 'reward');
    setStatus('已跳过', 'ok');
    feedback('这一课用跳关卡跳过了。下一课继续加油。', 'ok');
    runDemo(true, 1);
    setDemoState('跳过关卡', '你使用了跳关卡，小人直接走到了终点。');
    active.completed = true;
    const nextLesson = active.course.lessons[active.index + 1] || null;
    setTimeout(() => {
      if (current !== active) return;
      if (nextLesson) open(active.course, nextLesson.id);
      else {
        close();
        if (!String(active.course.id).startsWith('office-')) panels.openCourse(active.course.id);
      }
    }, 800);
  }

  /* ---------------- bind ---------------- */

  function bind() {
    const editor = root.querySelector('.code-input');
    const gutter = root.querySelector('.line-gutter');

    root.querySelector('[data-act="back"]')?.addEventListener('click', () => {
      const courseId = current?.course.id;
      close();
      if (courseId && !String(courseId).startsWith('office-')) panels.openCourse(courseId);
    });
    root.querySelector('[data-act="story"]')?.addEventListener('click', () => openStory(true));
    root.querySelector('[data-act="skip"]')?.addEventListener('click', openSkipDialog);
    root.querySelector('[data-act="reset"]')?.addEventListener('click', resetCode);
    root.querySelector('[data-act="top"]')?.addEventListener('click', () => {
      root.querySelector('[data-teach-scroll]')?.scrollTo({ top: 0, behavior: 'smooth' });
      sfx.tick();
    });
    root.querySelector('[data-act="run"]')?.addEventListener('click', () => execute(false));
    root.querySelector('[data-act="submit"]')?.addEventListener('click', () => execute(true));
    root.querySelectorAll('[data-act="ask"]').forEach((button) => {
      button.addEventListener('click', () => askTutor(true));
    });
    root.querySelector('.tutor-card [data-act="reveal"]')?.addEventListener('click', revealReference);
    root.querySelector('[data-act="demo-replay"]')?.addEventListener('click', () => {
      if (!current?.lastDemo) {
        demo?.run({ passed: false, stage: 0.3 });
        setDemoState('演示中', '还没有运行记录，先按下「运行」吧。');
        return;
      }
      runDemo(current.lastDemo.passed, current.lastDemo.stage, current.lastDemo.reason);
    });

    editor?.addEventListener('input', () => {
      updateGutter();
      scheduleDraft();
      if (current?.completed) return;
      feedback('写好后运行一次，再提交检测。');
    });
    editor?.addEventListener('scroll', () => {
      if (gutter) gutter.scrollTop = editor.scrollTop;
    });
    editor?.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        insertText(current?.course.type === 'python' ? '    ' : '  ');
        return;
      }
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey &&
        current?.course.type === 'python') {
        event.preventDefault();
        autoIndent();
      }
    });
  }

  function onRootKeyDown(event) {
    if (!current) return;
    if (event.key === 'Escape') {
      if (root.querySelector('[data-dialog]')) {
        event.preventDefault();
        closeDialog();
        return;
      }
      if (current.story) return;
      if (!modalRoot.hidden) return;
      event.preventDefault();
      close();
      return;
    }
    if (!modalRoot.hidden || current.story) return;
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      execute(false);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      execute(true);
    }
  }

  root.addEventListener('keydown', onRootKeyDown);

  window.addEventListener('message', (event) => {
    if (!current) return;
    const iframe = root.querySelector('.terminal-preview iframe');
    if (!iframe || event.source !== iframe.contentWindow) return;
    const type = event.data?.type;
    if (type === 'mossbrook:preview-escape') {
      if (modalRoot.hidden && !current.story) close();
    } else if (type === 'mossbrook:preview-run') {
      execute(false);
    }
  });

  /* ---------------- lifecycle ---------------- */

  function destroyDemo() {
    demo?.destroy();
    demo = null;
  }

  function open(course, lessonId, options = {}) {
    const index = course.lessons.findIndex((l) => l.id === lessonId);
    if (index === -1) return;
    if (current) flushDraft();
    closeStory();
    closeDialog();
    abortTutor();
    destroyDemo();

    const lesson = course.lessons[index];
    current = {
      course,
      lesson,
      index,
      meta: lesson.meta || getLessonMeta(lesson.id),
      completed: saveManager.isLessonDone(course.id, lesson.id),
      failures: 0,
      hintLevel: 0,
      revealRef: false,
      aiBusy: false,
      aiText: '',
      lastDemo: null,
      story: null
    };
    root.hidden = false;
    document.body.classList.add('is-lesson-open');
    sfx.open();
    root.innerHTML = shell(course, lesson, index);
    const editor = root.querySelector('.code-input');
    editor.value = readDraft(course, lesson) ?? lesson.starter;
    bind();
    updateGutter();
    hud.setPrompt(null);
    renderTutor();
    if (current.completed) feedback('这一课已经完成，可以再练一次，也可以继续下一课。', 'ok');
    demo = createDemoStage(root.querySelector('[data-demo-canvas]'), {
      playerName: saveManager.save.player.name
    });
    demo.setLesson(course, lesson, current.meta);
    setDemoState('等待你运行', '运行后，小人会替你把代码走一遍。');
    if (!options.skipStory && !storySeen(course.id)) openStory(false);
    else setTimeout(() => editor.focus({ preventScroll: true }), 30);
    if (current.completed) {
      const submitBtn = root.querySelector('[data-act="submit"]');
      if (submitBtn) submitBtn.textContent = '再提交一次';
    }
  }

  function close() {
    if (!current) return;
    flushDraft();
    closeStory();
    closeDialog();
    abortTutor();
    destroyDemo();
    current.story = null;
    current = null;
    root.classList.remove('is-story-open');
    document.body.classList.remove('is-lesson-open');
    root.hidden = true;
    root.innerHTML = '';
    sfx.close();
    window.dispatchEvent(new Event('mossbrook:overlay-closed'));
  }

  return {
    open,
    close,
    isOpen() {
      return !root.hidden;
    },
    getContext() {
      if (!current) return null;
      return {
        courseId: current.course.id,
        courseName: current.course.name,
        lessonId: current.lesson.id,
        lessonTitle: current.lesson.title,
        index: current.index,
        total: current.course.lessons.length,
        completed: current.completed,
        concept: current.meta.concept,
        failures: current.failures
      };
    }
  };
}
