import { levelInfo } from '../data/progression.js';
import { FURNITURE, WALLPAPERS } from '../data/furniture.js';
import { renderFurnitureIcon, drawAvatar } from '../game/sprites.js';

const ROT_LABEL = ['正面', '向右', '背面', '向左'];

function slotName(id) {
  return FURNITURE[id]?.name || id;
}

export function createHUD(saveManager, handlers = {}) {
  const els = {
    screen: document.getElementById('game-screen'),
    name: document.getElementById('hud-name'),
    level: document.getElementById('hud-level'),
    xpFill: document.getElementById('hud-xp-fill'),
    xpLabel: document.getElementById('hud-xp-label'),
    coins: document.getElementById('hud-coins'),
    adminChip: document.getElementById('admin-chip'),
    quest: document.getElementById('quest-chip'),
    questText: document.getElementById('quest-text'),
    questProgress: document.getElementById('quest-progress'),
    zone: document.getElementById('zone-chip'),
    clock: document.getElementById('hud-clock'),
    clockIcon: document.getElementById('clock-icon'),
    clockPhase: document.getElementById('hud-phase'),
    clockChip: document.getElementById('clock-chip'),
    saveState: document.getElementById('save-state'),
    prompt: document.getElementById('interact-prompt'),
    promptText: document.getElementById('interact-text'),
    toasts: document.getElementById('toast-stack'),
    overview: document.getElementById('overview-launcher'),
    hint: document.getElementById('controls-hint'),
    hintToggle: document.getElementById('hint-toggle'),
    avatar: document.getElementById('avatar-canvas'),
    editBar: document.getElementById('edit-bar')
  };

  let promptCache = null;
  let zoneCache = null;
  let clockCache = '';
  let hintCollapsed = false;
  els.prompt.style.transform = 'translate(-50%, -100%)';

  function refreshQuest() {
    const task = saveManager.questSummary();
    if (!task) {
      els.quest.hidden = true;
      return;
    }
    els.quest.hidden = false;
    const { state, target } = task;
    els.questText.textContent = state.progress >= target ? `${task.title} · 可领取` : task.title;
    els.questProgress.textContent = `${state.progress}/${target}`;
  }

  function refresh() {
    const save = saveManager.save;
    const info = levelInfo(save.xp);
    els.name.textContent = save.player.name;
    els.level.textContent = `Lv.${info.level}`;
    els.xpFill.style.width = `${Math.round(info.progress * 100)}%`;
    els.xpLabel.textContent = info.label;
    els.coins.textContent = String(save.coins);
    refreshQuest();
  }

  function toast(message, kind = '') {
    if (!message) return;
    const node = document.createElement('div');
    node.className = `toast${kind === 'reward' ? ' is-reward' : kind === 'warn' ? ' is-warn' : ''}`;
    node.textContent = message;
    els.toasts.appendChild(node);
    while (els.toasts.children.length > 4) els.toasts.firstElementChild.remove();
    setTimeout(() => {
      node.classList.add('is-out');
      setTimeout(() => node.remove(), 320);
    }, 3400);
  }

  function setPrompt(text, x, y) {
    if (!text) {
      if (promptCache !== null) {
        els.prompt.hidden = true;
        promptCache = null;
      }
      return;
    }
    if (promptCache !== text || els.prompt.hidden) {
      els.promptText.textContent = text;
      els.prompt.hidden = false;
      promptCache = text;
    }
    if (Number.isFinite(x) && Number.isFinite(y)) {
      els.prompt.style.left = `${x}px`;
      els.prompt.style.top = `${y}px`;
    }
  }

  function setZone(text) {
    if (!text || text === zoneCache) return;
    zoneCache = text;
    els.zone.textContent = text;
  }

  function setTime(clock, label, phase) {
    if (!els.clock) return;
    const key = `${clock}|${label}|${phase}`;
    if (key === clockCache) return;
    clockCache = key;
    els.clock.textContent = clock;
    els.clockPhase.textContent = label;
    els.clockChip.classList.toggle('is-night', phase === 'night');
    els.clockChip.classList.toggle('is-dusk', phase === 'dusk' || phase === 'dawn');
    const icons = { night: '☾', dusk: '◒', dawn: '◐', sunset: '☀' };
    els.clockIcon.textContent = icons[phase] || '☀';
  }

  function setSaveState(text, saving = false) {
    els.saveState.textContent = text;
    els.saveState.classList.toggle('is-saving', Boolean(saving));
  }

  function setAvatar(palette) {
    if (els.avatar && palette) drawAvatar(els.avatar, palette);
  }

  function setAdmin(isAdmin) {
    if (!els.adminChip) return;
    els.adminChip.hidden = !isAdmin;
  }

  function setHintsHidden(hidden) {
    hintCollapsed = Boolean(hidden);
    els.hint.classList.toggle('is-min', hintCollapsed);
    els.hint.setAttribute('aria-hidden', hidden ? 'true' : 'false');
  }

  function showEditBar({ entries, selectedId, rot = 0, wallpaper = 'warm', onSelect, onRotate, onRemove, onDone, onWallpaper }) {
    els.editBar.hidden = false;
    const selected = selectedId && (entries.find((e) => e.id === selectedId)) ? selectedId : null;
    const slots = entries.map((entry) => {
      const def = FURNITURE[entry.id];
      if (!def) return '';
      return `
        <button type="button" class="inv-slot${entry.id === selected ? ' is-active' : ''}${entry.count <= 0 ? ' count-0' : ''}" data-furniture="${entry.id}" title="${def.desc}">
          <canvas data-icon="${entry.id}" width="64" height="64"></canvas>
          <span class="inv-name">${def.name}</span>
          <span class="inv-count">×${entry.count}</span>
        </button>`;
    }).join('');
    const wallSwatches = WALLPAPERS.map((paper) => `
      <button type="button" class="wall-swatch${paper.id === wallpaper ? ' is-active' : ''}" data-wallpaper="${paper.id}" title="换上「${paper.name}」墙纸">
        <i style="background:${paper.wall};box-shadow:inset 0 -5px 0 ${paper.wain}"></i>
        <b>${paper.name}</b>
      </button>`).join('');

    els.editBar.innerHTML = `
      <div class="edit-head">
        <div class="edit-title">布置房间 <span>WASD 移动光标 · E 放置 · R 旋转 · X 收回 · F 完成</span></div>
        <div class="edit-actions">
          <button type="button" class="mini-btn" data-edit="rotate">旋转 R</button>
          <button type="button" class="mini-btn" data-edit="remove">收回 X</button>
          <button type="button" class="mini-btn is-primary" data-edit="done">完成 F</button>
        </div>
      </div>
      <div class="wall-strip">
        <span class="wall-label">墙面</span>
        <div class="wall-swatches">${wallSwatches}</div>
      </div>
      ${entries.length ? `<div class="inventory-strip">${slots}</div>` : '<div class="inv-empty">行囊里还没有家具。墙纸可以随时换，家具等课程和任务慢慢带回来。</div>'}
      <div class="edit-help">
        ${selected ? `已选：<b>${slotName(selected)}</b> · 朝向：${ROT_LABEL[rot % 4]} · 左键放置，右键收回` : '点击下方家具选择，或按数字键 1–9 快速选择；点击墙纸可直接换墙面'}
      </div>`;

    for (const canvas of els.editBar.querySelectorAll('canvas[data-icon]')) {
      renderFurnitureIcon(canvas, canvas.dataset.icon, 0);
    }
    els.editBar.querySelectorAll('[data-furniture]').forEach((button) => {
      button.addEventListener('click', () => onSelect?.(button.dataset.furniture));
    });
    els.editBar.querySelectorAll('[data-wallpaper]').forEach((button) => {
      button.addEventListener('click', () => onWallpaper?.(button.dataset.wallpaper));
    });
    els.editBar.querySelector('[data-edit="rotate"]')?.addEventListener('click', () => onRotate?.());
    els.editBar.querySelector('[data-edit="remove"]')?.addEventListener('click', () => onRemove?.());
    els.editBar.querySelector('[data-edit="done"]')?.addEventListener('click', () => onDone?.());

    const activeWall = els.editBar.querySelector('.wall-swatch.is-active');
    const wallRow = activeWall?.closest('.wall-swatches');
    if (activeWall && wallRow) {
      const rowRect = wallRow.getBoundingClientRect();
      const activeRect = activeWall.getBoundingClientRect();
      if (activeRect.left < rowRect.left || activeRect.right > rowRect.right - 2) {
        wallRow.scrollLeft += activeRect.left - rowRect.left - 8;
      }
    }
  }

  function hideEditBar() {
    els.editBar.hidden = true;
    els.editBar.innerHTML = '';
  }

  function bind() {
    els.overview.addEventListener('click', () => handlers.openOverview?.());
    els.quest.addEventListener('click', () => handlers.openTasks?.());
    els.hintToggle.addEventListener('click', () => {
      setHintsHidden(!hintCollapsed);
      handlers.setHintCollapsed?.(hintCollapsed);
    });
  }

  const unsubscribe = saveManager.on((type, payload) => {
    switch (type) {
      case 'change':
      case 'lesson-complete':
      case 'task-claimed':
      case 'inventory':
        refresh();
        break;
      case 'tasks':
        refreshQuest();
        break;
      case 'tasks-reset':
        refreshQuest();
        toast('日历翻过一页，新的每日任务已经贴到任务板上。', 'reward');
        break;
      case 'level-up':
        refresh();
        toast(`升级了！你现在是 Lv.${payload.level}，小镇又多了一点新可能。`, 'reward');
        break;
      case 'saving':
        setSaveState('保存中…', true);
        break;
      case 'saved':
        setSaveState('已保存', false);
        break;
      case 'save-error':
        setSaveState('保存失败', true);
        toast('存档保存失败，请检查浏览器的本地存储权限。', 'warn');
        break;
      default:
        break;
    }
  });

  bind();
  refresh();

  return {
    refresh,
    toast,
    setPrompt,
    setZone,
    setTime,
    setSaveState,
    setAvatar,
    setAdmin,
    setHintsHidden,
    showEditBar,
    hideEditBar,
    destroy() {
      unsubscribe();
    }
  };
}
