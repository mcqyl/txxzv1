import { COURSES, FUTURE_COURSES, getCourse } from '../data/courses.js';
import { FURNITURE } from '../data/furniture.js';
import { levelInfo } from '../data/progression.js';
import { drawCourseArt, drawWelcomeScene } from '../game/courseArt.js';
import { renderCityMap } from '../game/city.js';
import { courseOffice } from '../data/office.js';
import { sfx } from '../core/audio.js';

const ICON = {
  courses: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"/><path d="M8 7h8M8 10.5h5"/></svg>',
  tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/><path d="m15.5 16.5 1.5 1.5 2.5-3"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z"/><path d="M9 4v14M15 6v14"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/></svg>',
  help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.7 2.4c-.8.4-1.2 1-1.2 1.9"/><path d="M12 17h.01"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4.4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4.4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z"/></svg>'
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return '—';
  }
}

function modalHead({ kicker, title, sub = '' }) {
  return `
    <div class="modal-head">
      <div>
        <p class="modal-kicker">${kicker}</p>
        <h2 class="modal-title">${title}</h2>
        ${sub ? `<p class="modal-sub">${sub}</p>` : ''}
      </div>
      <button type="button" class="modal-close" aria-label="关闭">✕</button>
    </div>`;
}

function sqlTable(columns, rows) {
  return `<table class="result-table"><thead><tr>${columns
    .map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`)
    .join('')}</tbody></table>`;
}

export function createPanels({ saveManager, hud, actions = {}, getPrefs, setPref }) {
  const root = document.getElementById('modal-root');
  let taskTab = 'daily';
  const prefs = {
    reduceMotion: false,
    hintsHidden: false,
    assistantEnabled: true,
    assistantVoice: true,
    ...(getPrefs ? getPrefs() : {})
  };

  function openModal(html, { size = '' } = {}) {
    root.hidden = false;
    sfx.open();
    root.innerHTML = `<div class="modal${size ? ` ${size}` : ''}" role="dialog" aria-modal="true">${html}</div>`;
    const modal = root.querySelector('.modal');
    modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
    root.onclick = (event) => {
      if (event.target === root) closeModal();
    };
    return modal;
  }

  function closeModal() {
    if (root.hidden) return;
    root.hidden = true;
    root.innerHTML = '';
    root.onclick = null;
    sfx.close();
    window.dispatchEvent(new Event('mossbrook:overlay-closed'));
  }

  function modalFoot(note, buttons) {
    return `<div class="modal-foot"><span>${note}</span><div class="foot-actions">${buttons}</div></div>`;
  }

  /* ---------------- overview ---------------- */

  function openOverview() {
    const save = saveManager.save;
    const level = levelInfo(save.xp).level;
    const doneToday = Object.values(save.progress || {}).reduce((n, course) => (
      n + Object.values(course || {}).filter((l) => l?.done).length
    ), 0);
    const dailyReady = saveManager.activeTasks().filter((t) => !t.state.claimed && t.state.progress >= t.target).length;
    const mainReady = saveManager.mainlineTasks().filter((t) => t.ready).length;
    const checkinReady = !saveManager.checkinPreview().done;
    const tasksReady = dailyReady + mainReady + (checkinReady ? 1 : 0);
    const tile = (options) => `
      <button type="button" class="overview-tile${options.wide ? ' is-wide' : ''}" data-overview="${options.key}">
        <span class="overview-icon">${options.icon}</span>
        <span>
          <b>${options.title}</b>
          <small>${options.desc}</small>
        </span>
        <span class="tile-hotkey">${options.hotkey}</span>
      </button>`;

    const html = `
      ${modalHead({
        kicker: 'FEATURES · TAB',
        title: '功能全览',
        sub: '想做什么？小镇的入口都收在这张桌子上。按 Tab 可以随时打开这里。'
      })}
      <div class="modal-body">
        <div class="overview-grid">
          ${tile({ key: 'courses', icon: ICON.courses, title: '课程大厅', desc: '四门课程和它们的建筑，随时开始学习。', hotkey: 'C' })}
          ${tile({ key: 'tasks', icon: ICON.tasks, title: '任务与签到', desc: tasksReady ? `有 ${tasksReady} 份奖励可以领取。` : '每日任务、主线任务，还有今天的签到。', hotkey: 'G' })}
          ${tile({ key: 'map', icon: ICON.map, title: '小镇地图', desc: '湖泊、街巷、北门与未开放的小径。', hotkey: 'M' })}
          ${tile({ key: 'home', icon: ICON.home, title: '回到小屋', desc: '快速回到自己的房间，布置家具。', hotkey: 'H' })}
          ${tile({ key: 'welcome', icon: ICON.help, title: '玩法说明', desc: '按键、课程、家具和存档是怎么回事。', hotkey: 'INFO' })}
          ${tile({ key: 'settings', icon: ICON.settings, title: '设置与账号', desc: '动画、操作提示与退出登录。', hotkey: 'SET' })}
        </div>
        <div class="overview-aside">
          <span><b>${esc(save.player.name)}</b> · Lv.${level} · ${save.coins} 铜币 · 已完成 ${doneToday} 节课</span>
          <span><button type="button" class="overview-logout" data-overview="logout">退出登录</button></span>
        </div>
      </div>
      ${modalFoot('今日任务每日 0 点刷新。', '<button type="button" class="btn btn-ghost" data-close>稍后再看</button>')}`;

    const modal = openModal(html, { size: 'is-medium' });
    modal.querySelectorAll('[data-overview]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.overview;
        if (key === 'logout') {
          closeModal();
          actions.logout?.();
          return;
        }
        closeModal();
        if (key === 'courses') openCourses();
        else if (key === 'tasks') openTasks();
        else if (key === 'map') openMap();
        else if (key === 'welcome') openWelcome({ revisit: true });
        else if (key === 'settings') openSettings();
        else if (key === 'home') actions.goHome?.();
      });
    });
    modal.querySelector('[data-close]')?.addEventListener('click', closeModal);
  }

  /* ---------------- courses ---------------- */

  function courseCard(course, { future = false } = {}) {
    const save = saveManager.save;
    const level = levelInfo(save.xp).level;
    const locked = !future && Boolean(course.requiresLevel && level < course.requiresLevel);
    const done = future ? 0 : saveManager.courseDoneCount(course);
    const total = course.lessons?.length || 0;
    const complete = total > 0 && done === total;
    const ratio = total ? Math.round((done / total) * 100) : 0;
    const color = course.color || '#8fe3b0';
    const state = future
      ? '筹备中'
      : locked
        ? `Lv.${course.requiresLevel} 后开放`
        : complete
          ? '已完成 · 可以复习'
          : done
            ? '继续学习'
            : '还没有开始';

    return `
      <button type="button" class="course-card${locked || future ? ' is-locked' : ''}" data-course="${course.id}"${future ? ' data-future="1"' : ''}>
        <div class="course-art">
          <canvas data-art="${course.id}"></canvas>
          <span class="course-tagline">${esc(course.tagline || 'COMING SOON')}</span>
        </div>
        ${locked ? `<span class="lock-ribbon">Lv.${course.requiresLevel} 解锁</span>` : future ? '<span class="lock-ribbon">筹备中</span>' : ''}
        <div class="course-body">
          <div class="course-top">
            <span class="course-name">${esc(course.name)}</span>
            <span class="course-lv">${esc(course.en || 'SOON')}</span>
          </div>
          <p class="course-desc">${esc(future ? course.desc : course.short)}</p>
          ${future ? '' : `
            <div class="course-progress" style="--course-color:${color}">
              <span class="course-bar"><i style="width:${ratio}%"></i></span>
              <span>${done}/${total}</span>
            </div>`}
          <div class="course-foot">
            <span class="course-state${complete ? ' is-done' : ''}">${state}</span>
            <span class="btn-arrow">→</span>
          </div>
        </div>
      </button>`;
  }

  function openCourses() {
    const save = saveManager.save;
    const level = levelInfo(save.xp).level;
    const totalDone = COURSES.reduce((sum, c) => sum + saveManager.courseDoneCount(c), 0);
    const html = `
      ${modalHead({
        kicker: 'COURSE HALL · C',
        title: '课程大厅',
        sub: '每门课都在小镇里有一栋建筑。按顺序完成课程，就能沿着小路去看更远的地方。'
      })}
      <div class="modal-body">
        <div class="panel-grid cols-2">
          ${COURSES.map((course) => courseCard(course)).join('')}
          ${FUTURE_COURSES.map((course) => courseCard(course, { future: true })).join('')}
        </div>
        <p class="modal-sub" style="margin-top:16px">你现在是 Lv.${level} · 已完成 ${totalDone} 节课。数字花园在 Lv.${getCourse('data')?.requiresLevel || 3} 后亮灯。</p>
      </div>
      ${modalFoot('课程奖励：XP、铜币与家具，第一次完成时发放。', '<button type="button" class="btn btn-ghost" data-close>关上课程册</button>')}`;

    const modal = openModal(html);
    for (const canvas of modal.querySelectorAll('canvas[data-art]')) {
      drawCourseArt(canvas, canvas.dataset.art, 0);
    }
    modal.querySelectorAll('[data-course]').forEach((card) => {
      card.addEventListener('click', () => {
        const course = getCourse(card.dataset.course);
        if (!course) {
          const future = FUTURE_COURSES.find((c) => c.id === card.dataset.course);
          if (future) {
            closeModal();
            openFutureCourse(future.id);
          }
          return;
        }
        if (course.requiresLevel && level < course.requiresLevel) {
          hud.toast(`这栋建筑的灯还没亮。达到 Lv.${course.requiresLevel} 后就能进去了。`, 'warn');
          return;
        }
        openCourse(course.id);
      });
    });
    modal.querySelector('[data-close]')?.addEventListener('click', closeModal);
  }

  function openCourse(courseId) {
    const course = getCourse(courseId);
    if (!course) return;
    const save = saveManager.save;
    const level = levelInfo(save.xp).level;
    const locked = Boolean(course.requiresLevel && level < course.requiresLevel);
    const done = saveManager.courseDoneCount(course);
    const total = course.lessons.length;
    const nextIndex = course.lessons.findIndex((l) => !saveManager.isLessonDone(course.id, l.id));
    const totalMinutes = course.lessons.reduce((n, l) => n + (l.minutes || 0), 0);
    const totalXp = course.lessons.reduce((n, l) => n + (l.xp || 0), 0);
    const nextLesson = nextIndex === -1 ? course.lessons[0] : course.lessons[nextIndex];

    const rows = course.lessons.map((lesson, index) => {
      const isDone = saveManager.isLessonDone(course.id, lesson.id);
      const isNext = index === nextIndex;
      const available = isDone || isNext;
      const reward = lesson.rewardItem && FURNITURE[lesson.rewardItem] ? FURNITURE[lesson.rewardItem].name : '';
      return `
        <button type="button" class="lesson-row${isDone ? ' is-done' : ''}${isNext ? ' is-next' : ''}" data-lesson="${lesson.id}" ${available ? '' : 'data-locked="1"'}>
          <span class="lesson-index">${isDone ? '✓' : String(index + 1).padStart(2, '0')}</span>
          <span class="lesson-info">
            <b>${esc(lesson.title)}</b>
            <span>${lesson.minutes} 分钟 · +${lesson.xp} XP · +${lesson.coins} 铜币${reward ? ` · ${esc(reward)}` : ''}</span>
          </span>
          <span class="lesson-status">${isDone ? '再做一遍' : isNext ? '开始 →' : '按顺序解锁'}</span>
        </button>`;
    }).join('');

    const startLabel = locked
      ? `需要 Lv.${course.requiresLevel}`
      : done === total
        ? '再复习一遍'
        : nextIndex === 0 ? '开始第一课' : `继续第 ${nextIndex + 1} 课`;

    const html = `
      ${modalHead({
        kicker: `COURSE · ${course.tagline}`,
        title: esc(course.name),
        sub: course.short
      })}
      <div class="modal-body">
        <div class="course-hero">
          <div class="course-hero-art"><canvas data-hero-art="${course.id}"></canvas></div>
          <div class="course-hero-copy">
            <h3>${esc(course.name)}</h3>
            <p>${esc(course.desc)}</p>
            <div class="hero-meta">
              <span>${total} 课</span>
              <span>约 ${totalMinutes} 分钟</span>
              <span>+${totalXp} XP</span>
            </div>
            <p style="font-size:10.5px;color:var(--muted-2)">老师 · ${esc(course.teacher)} · 已完成 ${done}/${total}</p>
          </div>
        </div>
        ${locked ? `<div class="lesson-hint-box"><b>建筑还锁着</b>：${esc(course.lockText || `达到 Lv.${course.requiresLevel} 后开放。`)}</div>` : ''}
        <div class="lesson-list">${rows}</div>
      </div>
      ${modalFoot(
        level >= (course.requiresLevel || 0) ? `当前进度 ${done}/${total}` : `当前 Lv.${level}`,
        `<button type="button" class="btn btn-ghost" data-close>回到大厅</button>
         <button type="button" class="btn btn-primary" data-start ${locked ? 'disabled' : ''}>${startLabel}</button>`
      )}`;

    const modal = openModal(html);
    for (const canvas of modal.querySelectorAll('canvas[data-hero-art]')) {
      drawCourseArt(canvas, canvas.dataset.heroArt, 0);
    }
    modal.querySelectorAll('[data-lesson]').forEach((row) => {
      row.addEventListener('click', () => {
        if (locked) {
          hud.toast(`达到 Lv.${course.requiresLevel} 后，这栋建筑才会亮灯。`, 'warn');
          return;
        }
        if (row.dataset.locked) {
          hud.toast('按顺序来，先把上一课完成吧。', 'warn');
          return;
        }
        closeModal();
        actions.startLesson?.(course, row.dataset.lesson);
      });
    });
    modal.querySelector('[data-start]')?.addEventListener('click', () => {
      if (locked) return;
      closeModal();
      actions.startLesson?.(course, nextLesson.id);
    });
    modal.querySelector('[data-close]')?.addEventListener('click', closeModal);
  }

  function openFutureCourse(courseId) {
    const current = getCourse(courseId);
    if (current) {
      openCourse(current.id);
      return;
    }
    const course = FUTURE_COURSES.find((c) => c.id === courseId);
    if (!course) return;
    const html = `
      ${modalHead({
        kicker: 'COMING SOON · 筹备中的课程',
        title: esc(course.name),
        sub: '这条路还在铺石板，先看看门口的样子。'
      })}
      <div class="modal-body">
        <div class="course-hero">
          <div class="course-hero-art"><canvas data-hero-art="${course.id}"></canvas></div>
          <div class="course-hero-copy">
            <h3>${esc(course.name)}</h3>
            <p>${esc(course.desc)}</p>
            <div class="hero-meta">
              <span>筹备中</span>
              <span>${esc(course.tagline || 'COMING SOON')}</span>
            </div>
            <p style="font-size:10.5px;color:var(--muted-2)">老师还在路上，门缝里已经透出灯光。</p>
          </div>
        </div>
        <div class="lesson-hint-box"><b>门还锁着</b>：现在的课程大厅里有 Python、网页、SQL 和数据四门课。等这栋建筑亮灯，第一节课就会贴在这里。</div>
      </div>
      ${modalFoot('小镇会记得每一块新铺的石板。', '<button type="button" class="btn btn-ghost" data-close>回到大厅</button>')}`;
    const modal = openModal(html);
    for (const canvas of modal.querySelectorAll('canvas[data-hero-art]')) {
      drawCourseArt(canvas, canvas.dataset.heroArt, 0);
    }
    modal.querySelector('[data-close]')?.addEventListener('click', closeModal);
  }

  /* ---------------- tasks ---------------- */

  function openTasks(initialTab) {
    if (initialTab === 'daily' || initialTab === 'main') taskTab = initialTab;
    const save = saveManager.save;
    const tasks = saveManager.activeTasks();
    const ready = tasks.filter((t) => !t.state.claimed && t.state.progress >= t.target).length;
    const date = (save.tasks?.date || '').replaceAll('-', '.');
    const checkin = saveManager.checkinPreview();
    const mainlines = saveManager.mainlineTasks();
    const mainReady = mainlines.filter((item) => item.ready).length;
    const skipCount = saveManager.skipCardCount();

    const rewardText = (rewards) => {
      const bits = [];
      if (rewards.coins) bits.push(`${rewards.coins} 铜币`);
      if (rewards.xp) bits.push(`${rewards.xp} XP`);
      if (rewards.skipCards) bits.push(`跳关卡 ×${rewards.skipCards}`);
      if (rewards.furniture && FURNITURE[rewards.furniture]) bits.push(FURNITURE[rewards.furniture].name);
      return bits.join(' · ');
    };

    const rows = tasks.map((task) => {
      const progress = Math.min(task.state.progress, task.target);
      const done = progress >= task.target;
      const claimed = task.state.claimed;
      const pct = task.target ? Math.round((progress / task.target) * 100) : 0;
      const furniture = task.rewards.furniture && FURNITURE[task.rewards.furniture]
        ? FURNITURE[task.rewards.furniture].name
        : '';
      return `
        <div class="task-item${done && !claimed ? ' is-ready' : ''}${claimed ? ' is-claimed' : ''}">
          <div class="task-check">${claimed ? '✓' : done ? '!' : progress}</div>
          <div class="task-main">
            <b>${esc(task.title)}</b>
            <span>${esc(task.desc)}</span>
            <div class="task-progress-line"><i style="width:${pct}%"></i></div>
          </div>
          <div class="task-rewards">
            <span>${task.rewards.coins || 0} 铜币 · ${task.rewards.xp || 0} XP</span>
            ${furniture ? `<span>${esc(furniture)}</span>` : ''}
            ${claimed
              ? '<span style="color:var(--mint)">已领取</span>'
              : done
                ? `<button type="button" class="btn btn-small btn-mint" data-claim="${task.id}">领取奖励</button>`
                : `<span style="color:var(--muted-2)">${progress}/${task.target}</span>`}
          </div>
        </div>`;
    }).join('');

    const mainRows = mainlines.map((item) => {
      const pct = item.total ? Math.round((item.done / item.total) * 100) : 0;
      const color = item.course.color || '#8fe3b0';
      return `
        <div class="mainline-card${item.ready ? ' is-ready' : ''}${item.claimed ? ' is-claimed' : ''}" style="--course-color:${color}">
          <div class="mainline-head">
            <span class="mainline-badge">${esc(item.course.en || 'MAIN')}</span>
            <b>${esc(item.title)}</b>
            <span class="mainline-count">${item.done}/${item.total}</span>
          </div>
          <p>${esc(item.desc)}</p>
          <div class="task-progress-line is-wide"><i style="width:${pct}%"></i></div>
          <div class="mainline-foot">
            <span class="mainline-rewards">${rewardText(item.rewards)}</span>
            ${item.claimed
              ? '<span class="mainline-state">已领取</span>'
              : item.ready
                ? `<button type="button" class="btn btn-small btn-mint" data-main-claim="${item.id}">领取主线奖励</button>`
                : `<button type="button" class="btn btn-small btn-ghost" data-main-go="${item.courseId}">还差 ${item.total - item.done} 课</button>`}
          </div>
        </div>`;
    }).join('');

    const checkinChips = rewardText(checkin.rewards) || '铜币与经验';

    const html = `
      ${modalHead({
        kicker: 'QUEST BOARD · G',
        title: '任务与签到',
        sub: '每日任务每天刷新；每门课有一条主线任务，走完整门课就能领走更大的奖励。'
      })}
      <div class="modal-body">
        <div class="checkin-card${checkin.done ? ' is-done' : ''}">
          <div class="checkin-stamp"><b>SIGN</b><span>${date || 'TODAY'}</span></div>
          <div class="checkin-copy">
            <p><b>${checkin.done ? '今天的签到已经收好' : `连续签到 ${checkin.streak} 天，今天可以领第 ${checkin.nextStreak} 天`}</b></p>
            <p class="checkin-gifts">${esc(checkinChips)}${checkin.rewards.furniture ? ' · 每 7 天还有家具' : ''}</p>
          </div>
          <div class="checkin-action">
            ${checkin.done
              ? '<span class="checkin-done">✓ 已签到</span>'
              : '<button type="button" class="btn btn-mint btn-small" data-checkin>签到领取</button>'}
            <span class="checkin-skip">跳关卡 ×${skipCount}</span>
          </div>
        </div>

        <div class="task-tabs" role="tablist">
          <button type="button" class="task-tab${taskTab === 'daily' ? ' is-active' : ''}" data-task-tab="daily" role="tab" aria-selected="${taskTab === 'daily'}">
            每日任务<span class="task-tab-count">${ready}</span>
          </button>
          <button type="button" class="task-tab${taskTab === 'main' ? ' is-active' : ''}" data-task-tab="main" role="tab" aria-selected="${taskTab === 'main'}">
            主线任务<span class="task-tab-count">${mainReady}</span>
          </button>
          <span class="task-tab-note">跳关卡在关卡右上角使用</span>
        </div>

        <div data-task-pane="daily"${taskTab === 'daily' ? '' : ' hidden'}>
          <div class="task-summary">
            <div class="stamp">${date || 'TODAY'}</div>
            <p>今天有 <b>${tasks.length}</b> 件小事，其中 <b>${ready}</b> 件的奖励已经可以领取。完成课程、摆放家具、和镇上的物件打招呼都算。</p>
          </div>
          <div class="task-list">${rows}</div>
        </div>

        <div data-task-pane="main"${taskTab === 'main' ? '' : ' hidden'}>
          <p class="task-pane-note">主线任务随课程难度上升：每走完一门课，就能领走铜币、经验和跳关卡。</p>
          <div class="mainline-list">${mainRows}</div>
        </div>
      </div>
      ${modalFoot('每日任务在 0 点刷新，签到与主线进度会一直保留。', '<button type="button" class="btn btn-ghost" data-close>收好任务单</button>')}`;

    const modal = openModal(html, { size: 'is-medium' });
    modal.querySelectorAll('[data-task-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        taskTab = button.dataset.taskTab;
        modal.querySelectorAll('[data-task-tab]').forEach((tab) => {
          const on = tab === button;
          tab.classList.toggle('is-active', on);
          tab.setAttribute('aria-selected', String(on));
        });
        modal.querySelectorAll('[data-task-pane]').forEach((pane) => {
          pane.hidden = pane.dataset.taskPane !== taskTab;
        });
        sfx.tick();
      });
    });
    modal.querySelector('[data-checkin]')?.addEventListener('click', () => {
      const result = saveManager.claimCheckin();
      if (!result.ok) {
        hud.toast(result.error, 'warn');
        return;
      }
      const bits = [`${result.rewards.coins} 铜币`, `${result.rewards.xp} XP`, `跳关卡 ×${result.rewards.skipCards}`];
      if (result.rewards.furniture && FURNITURE[result.rewards.furniture]) {
        bits.push(FURNITURE[result.rewards.furniture].name);
      }
      hud.toast(`签到成功，连续 ${result.streak} 天。收下了 ${bits.join(' · ')}。`, 'reward');
      openTasks();
    });
    modal.querySelectorAll('[data-claim]').forEach((button) => {
      button.addEventListener('click', () => {
        const task = tasks.find((item) => item.id === button.dataset.claim);
        const result = saveManager.claimTask(button.dataset.claim);
        if (!result.ok) {
          hud.toast(result.error, 'warn');
          return;
        }
        const bits = [`${result.rewards.coins || 0} 铜币`];
        if (result.rewards.xp) bits.push(`${result.rewards.xp} XP`);
        if (result.rewards.furniture && FURNITURE[result.rewards.furniture]) {
          bits.push(FURNITURE[result.rewards.furniture].name);
        }
        hud.toast(`任务完成，收下了 ${bits.join(' · ')}。`, 'reward');
        actions.assistantTip?.('task-claimed', {
          taskId: button.dataset.claim,
          task: task?.title || '',
          coins: result.rewards.coins || 0,
          xp: result.rewards.xp || 0,
          furniture: result.rewards.furniture && FURNITURE[result.rewards.furniture]
            ? FURNITURE[result.rewards.furniture].name
            : null
        });
        openTasks();
      });
    });
    modal.querySelectorAll('[data-main-claim]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = mainlines.find((entry) => entry.id === button.dataset.mainClaim);
        const result = saveManager.claimMainline(button.dataset.mainClaim);
        if (!result.ok) {
          hud.toast(result.error, 'warn');
          return;
        }
        const bits = [`${result.rewards.coins || 0} 铜币`, `${result.rewards.xp || 0} XP`];
        if (result.rewards.skipCards) bits.push(`跳关卡 ×${result.rewards.skipCards}`);
        if (result.rewards.furniture && FURNITURE[result.rewards.furniture]) {
          bits.push(FURNITURE[result.rewards.furniture].name);
        }
        hud.toast(`主线「${item?.title || '课程'}」完成，收下了 ${bits.join(' · ')}。`, 'reward');
        openTasks('main');
      });
    });
    modal.querySelectorAll('[data-main-go]').forEach((button) => {
      button.addEventListener('click', () => {
        closeModal();
        openCourse(button.dataset.mainGo);
      });
    });
    modal.querySelector('[data-close]')?.addEventListener('click', closeModal);
  }

  /* ---------------- map ---------------- */

  function openMap() {
    const save = saveManager.save;
    const html = `
      ${modalHead({
        kicker: 'CITY MAP · M',
        title: '星港北路 · 城市地图',
        sub: '三座课程大楼沿代码大道排列，公寓在街角，任务是报亭和咖啡推车都在同一条街上。'
      })}
      <div class="modal-body">
        <div class="map-board"><canvas id="modal-map"></canvas></div>
        <div class="map-legend">
          <span><i style="background:#7fb3bc"></i>蟒蛇云端</span>
          <span><i style="background:#e8b86d"></i>起源网络</span>
          <span><i style="background:#9d8ad6"></i>北岭数据</span>
          <span><i style="background:#e0b884"></i>我的公寓</span>
          <span><i style="background:#8fe3b0"></i>任务报亭</span>
        </div>
        <p class="modal-sub" style="margin-top:12px">你现在在：<b style="color:var(--gold)">${esc(saveManager.save.player.scene === 'home' ? '我的小屋 · 室内' : saveManager.save.player.scene === 'office' ? `${courseOffice(saveManager.save.player.officeId).company} · 办公室` : '星港北路 · 城市')}</b>。黄色小方块是你。</p>
      </div>
      ${modalFoot('走进任意一座大楼，先和老板聊聊，再决定今天在哪里上班。', '<button type="button" class="btn btn-ghost" data-close>收起地图</button>')}`;
    const modal = openModal(html, { size: 'is-medium' });
    const canvas = modal.querySelector('#modal-map');
    if (canvas) renderCityMap(canvas, save);
    modal.querySelector('[data-close]')?.addEventListener('click', closeModal);
  }

  /* ---------------- welcome ---------------- */

  function openWelcome({ revisit = false } = {}) {
    const save = saveManager.save;
    const name = esc(save.player.name);
    const html = `
      ${modalHead({
        kicker: 'WELCOME TO MOSS BROOK',
        title: revisit ? '小镇生活指南' : `欢迎来到苔溪，${name}`,
        sub: revisit ? '这些是小镇里最常用的事情。' : '你的角色已经站在广场上了，先看看怎么在这里生活。'
      })}
      <div class="modal-body">
        <div class="welcome-art"><canvas id="welcome-canvas"></canvas></div>
        <div class="welcome-copy">
          <p>苔溪是一座很小的镇子：<b>课程</b>藏在四栋建筑里，<b>家</b>在广场西北角，<b>湖</b>在南边。走到门前按 <b>E</b> 就能进去学习或坐下。</p>
          <p>每完成一节新课，你会得到 XP、铜币和一件家具。家具会自动放进行囊，回到小屋按 <b>F</b> 就能铺开地毯、摆上椅子，把它布置成自己的样子。</p>
          <p>小镇里还能遇见别的旅人：按 <b>T</b> 和大家聊天，按 <b>O</b> 查看在线朋友；回到自己的小屋后，就能邀请朋友来做客。长椅、树桩和野餐毯可以坐下，天黑以后路灯会一盏盏亮起来。</p>
          <p>镜湖比从前更宽了：在北岸或南岸按 <b>E</b> 就能垂钓，钓上来的鱼大小各不相同；东岸的木栈桥边停着一艘小船，登船后可以用 <b>WASD</b> 划到湖心，按 <b>E</b> 靠岸。广场的喷泉换上了金色新装，花拱门、小舞台、篝火和风车花田也都在等你去看看。</p>
          <div class="welcome-keys">
            <span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 移动</span>
            <span><kbd>Shift</kbd> 快走</span>
            <span><kbd>E</kbd> 交互 / 放置</span>
            <span><kbd>F</kbd> 布置房间</span>
            <span><kbd>Tab</kbd> 功能全览</span>
            <span><kbd>C</kbd><kbd>G</kbd><kbd>M</kbd> 课程 / 任务 / 地图</span>
            <span><kbd>T</kbd> 聊天 <kbd>O</kbd> 在线朋友</span>
          </div>
        </div>
      </div>
      ${modalFoot('存档会自动保存在这台设备上。', `<button type="button" class="btn btn-primary" data-explore>${revisit ? '知道了' : '开始探索'}</button>`)}`;

    const modal = openModal(html, { size: 'is-medium' });
    const canvas = modal.querySelector('#welcome-canvas');
    let raf = 0;
    if (canvas) {
      const loop = (time) => {
        if (!canvas.isConnected || root.hidden) return;
        drawWelcomeScene(canvas, time);
        raf = requestAnimationFrame(loop);
      };
      drawWelcomeScene(canvas, 0);
      raf = requestAnimationFrame(loop);
    }
    modal.querySelector('[data-explore]')?.addEventListener('click', () => {
      if (!save.flags.tutorialSeen) {
        save.flags.tutorialSeen = true;
        saveManager.markDirty();
      }
      cancelAnimationFrame(raf);
      closeModal();
      if (!revisit) {
        hud.toast('广场上的风有点凉。先去看看那栋亮着灯的小屋吧。', '');
        actions.assistantTip?.('tutorial-done', {});
      }
    });
    modal.querySelector('.modal-close')?.addEventListener('click', () => cancelAnimationFrame(raf));
  }

  /* ---------------- settings ---------------- */

  function openSettings() {
    const save = saveManager.save;
    const level = levelInfo(save.xp).level;
    const currentPrefs = { ...prefs, ...(getPrefs ? getPrefs() : {}) };
    const descriptions = {
      reduceMotion: '关闭萤火虫、飘叶和水面动效，让画面更安静。',
      hintsHidden: '隐藏左下角的按键提示，需要时再展开。',
      assistantEnabled: '显示右上角的芋丸助手，会在上课、成功或卡住时主动提示。',
      assistantVoice: '让芋丸把提示和对话读出来（需要联网）。',
      soundEnabled: '脚步、坐下、聊天和新消息的小音效。',
      hideOthers: '在联机大厅里不显示其他玩家的角色与名字。'
    };
    const toggle = (key, label) => `
      <div class="settings-row">
        <div><b>${label}</b><span>${descriptions[key] || ''}</span></div>
        <button type="button" class="toggle-pill${currentPrefs[key] ? ' is-on' : ''}" data-toggle="${key}">${currentPrefs[key] ? '已开启' : '已关闭'}</button>
      </div>`;

    const html = `
      ${modalHead({
        kicker: 'SETTINGS · ACCOUNT',
        title: '设置与账号',
        sub: '这些偏好只影响这台设备，不同角色的存档彼此独立。'
      })}
      <div class="modal-body">
        ${toggle('reduceMotion', '减少动画')}
        ${toggle('hintsHidden', '隐藏操作提示')}
        ${toggle('soundEnabled', '音效')}
        ${toggle('assistantEnabled', '芋丸助手')}
        ${toggle('assistantVoice', '芋丸语音')}
        ${toggle('hideOthers', '不看其他玩家')}
        <div class="settings-row">
          <div><b>角色</b><span>${esc(save.player.name)} · 加入于 ${formatDate(save.createdAt)} · 当前 Lv.${level}</span></div>
          <span style="font-family:var(--font-mono);font-size:10px">${save.coins} 铜币</span>
        </div>
        <div class="settings-row">
          <div><b>本地存档</b><span>账号、存档都保存在浏览器 IndexedDB（不支持时退回 localStorage），不会上传到服务器。</span></div>
          <span style="font-family:var(--font-mono);font-size:10px">${save.updatedAt ? formatDate(save.updatedAt) : '—'}</span>
        </div>
        <div class="danger-zone">
          <b>离开小镇</b>
          <p>退出登录不会删除角色与存档。下次用同样的角色名和密码就可以回来。</p>
          <button type="button" class="btn btn-small btn-coral" data-logout>退出登录</button>
        </div>
      </div>
      ${modalFoot('苔溪小镇 · 联机版 v1.1', '<button type="button" class="btn btn-ghost" data-close>完成</button>')}`;

    const modal = openModal(html, { size: 'is-narrow' });
    modal.querySelectorAll('[data-toggle]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.toggle;
        currentPrefs[key] = !currentPrefs[key];
        prefs[key] = currentPrefs[key];
        setPref?.(key, currentPrefs[key]);
        button.classList.toggle('is-on', currentPrefs[key]);
        button.textContent = currentPrefs[key] ? '已开启' : '已关闭';
      });
    });
    modal.querySelector('[data-logout]')?.addEventListener('click', () => {
      closeModal();
      actions.logout?.();
    });
    modal.querySelector('[data-close]')?.addEventListener('click', closeModal);
  }

  /* ---------------- reward ---------------- */

  function showReward(data) {
    const { course, lesson, result, nextLesson } = data;
    const officeTask = String(course.id || '').startsWith('office-');
    const completeCourse = Boolean(result.courseComplete);
    const title = officeTask
      ? '工位任务完成！'
      : completeCourse ? '整门课程完成！' : result.firstTime ? '练习通过！' : '又认真练了一遍';
    const sub = officeTask
      ? `「${esc(lesson.title)}」已经提交给老板，绩效和薪水都会记在员工档案里。`
      : completeCourse
        ? `你把「${esc(course.name)}」的 ${course.lessons.length} 节课都走完了。老师 ${esc(course.teacher)} 在小镇门口挂了新的灯。`
        : result.firstTime
          ? `「${esc(lesson.title)}」第一次完成，奖励已经放进行囊。`
          : `「${esc(lesson.title)}」的复习完成，收下一点铜币吧。`;

    const chips = [];
    if (result.xpGain) chips.push(`<span><i>XP</i> +${result.xpGain}</span>`);
    if (result.coinGain) chips.push(`<span><i>铜币</i> +${result.coinGain}</span>`);
    if (result.item && FURNITURE[result.item]) {
      chips.push(`<span><i>家具</i> ${esc(FURNITURE[result.item].name)}</span>`);
    }
    if (result.bonus) {
      chips.push(`<span><i>课程奖励</i> +${result.bonus.xp} XP · +${result.bonus.coins} 铜币</span>`);
    }
    if (result.levelUps > 0) {
      chips.push(`<span><i>等级</i> 升到 Lv.${levelInfo(saveManager.save.xp).level}</span>`);
    }

    const buttons = officeTask
      ? '<button type="button" class="btn btn-primary" data-reward="town">回到办公室</button>'
      : [
        '<button type="button" class="btn btn-ghost" data-reward="town">回到小镇</button>',
        '<button type="button" class="btn btn-ghost" data-reward="course">看看课程</button>',
        nextLesson ? `<button type="button" class="btn btn-primary" data-reward="next">下一课：${esc(nextLesson.title)}</button>` : ''
      ].join('');

    const html = `
      <div class="modal-body">
        <div class="reward-box">
          <div class="reward-burst"><div>${completeCourse ? '★' : '✓'}</div></div>
          <h2 class="reward-title">${title}</h2>
          <p class="reward-sub">${sub}</p>
          <div class="reward-items">${chips.join('') || '<span><i>提示</i> 再试一次也有一点铜币</span>'}</div>
          <div class="foot-actions" style="justify-content:center;flex-wrap:wrap">${buttons}</div>
        </div>
      </div>`;

    const modal = openModal(html, { size: 'is-narrow' });
    modal.querySelectorAll('[data-reward]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.reward;
        closeModal();
        if (action === 'next') data.onNext?.();
        else if (action === 'course') data.onCourse?.();
        else data.onTown?.();
      });
    });
  }

  function onEscape(event) {
    if (event.key !== 'Escape' || root.hidden) return;
    event.preventDefault();
    closeModal();
  }

  document.addEventListener('keydown', onEscape);

  return {
    openOverview,
    openCourses,
    openCourse,
    openFutureCourse,
    openTasks,
    openMap,
    openWelcome,
    openSettings,
    showReward,
    closeModal,
    destroy() {
      document.removeEventListener('keydown', onEscape);
      closeModal();
    }
  };
}
