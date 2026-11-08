import { clamp, px } from './pixel.js';
import { createCity } from './city.js';
import { createOfficeWorld } from './office.js';
import { createInterior, WALL_H, ROOM_COLS, ROOM_ROWS } from './interior.js';
import { getOfficeState, officeRank, courseOffice } from '../data/office.js';
import { createDayCycle } from './daynight.js';
import { paletteForName, drawPlayer } from './sprites.js';
import { drawBoat } from './worldArt.js';
import { sfx } from '../core/audio.js';
import { FURNITURE, BOOK_QUOTES, furnitureSize, WALLPAPERS } from '../data/furniture.js';
import { GATE_LEVEL, levelInfo } from '../data/progression.js';

const WALK_SPEED = 76;
const BOAT_SPEED = 56;
const RUN_MULT = 1.65;
const VIEW_H = 270;
const MIN_VIEW_W = 430;
const MAX_VIEW_W = 840;
const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'
]);

const FISH_TABLE = [
  { id: 'crucian', name: '鲫鱼', weight: 30, min: 8, max: 24 },
  { id: 'carp', name: '小鲤鱼', weight: 26, min: 12, max: 36 },
  { id: 'perch', name: '鲈鱼', weight: 18, min: 18, max: 42 },
  { id: 'catfish', name: '鲇鱼', weight: 12, min: 24, max: 58 },
  { id: 'sunfish', name: '太阳鱼', weight: 8, min: 6, max: 16 },
  { id: 'koi', name: '锦鲤', weight: 4, min: 20, max: 46 },
  { id: 'boot', name: '一只旧靴子', weight: 2, min: 20, max: 28, joke: true }
];
const FISH_TOTAL_WEIGHT = FISH_TABLE.reduce((sum, fish) => sum + fish.weight, 0);

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable;
}

export function createGame({ saveManager, hud, handlers = {}, reduceMotion = false }) {
  const stage = document.getElementById('game-stage');
  const canvas = document.getElementById('game-canvas');
  const labelsBox = document.getElementById('world-labels');
  const fxLayer = document.getElementById('fx-layer');
  const fadeLayer = document.getElementById('scene-fade');
  const gameScreen = document.getElementById('game-screen');
  const modalRoot = document.getElementById('modal-root');
  const lessonRoot = document.getElementById('lesson-root');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const town = createCity();
  const officeWorld = createOfficeWorld();
  const interior = createInterior();
  const palette = paletteForName(saveManager.save.player.name);
  const day = createDayCycle(16.6);
  let dayInfo = day.info();

  const player = { x: 0, y: 0, dir: 'down', moving: false, sitting: false, lying: false, boating: false, walkTime: 0, frame: 0 };
  const camera = { x: 0, y: 0 };
  const keys = new Set();
  const peerActors = new Map();
  const peerTags = new Map();
  const peerPalettes = new Map();
  const chatBubbles = new Map();
  const localPlayerId = saveManager.save.multiplayer?.playerId || saveManager.save.userId;
  let sitSpot = null;
  let lieSpot = null;
  let fishing = null;

  let viewW = 480;
  let viewH = VIEW_H;
  let renderScale = 1;
  let scene = 'town';
  let officeCourse = null;
  let running = false;
  let raf = 0;
  let lastTime = 0;
  let fading = false;
  let fadeWatchdog = 0;
  let reduce = Boolean(reduceMotion);
  let labelEntries = [];
  let nameTag = null;
  let visit = null;
  let visitReturn = null;
  let editMode = false;
  let ghost = null;
  let zoneTimer = 0;
  let positionTimer = 0;
  let stepTimer = 0;
  let interiorLayout = interior.layout(viewW, viewH);
  const loopErrorAt = new Map();

  function reportLoopError(where, err) {
    const message = `${where}: ${err?.message || err}`;
    const now = performance.now();
    if (now - (loopErrorAt.get(message) || 0) < 5000) return;
    loopErrorAt.set(message, now);
    console.error(`[mossbrook] ${where}`, err);
  }

  function resetCanvasState() {
    ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false;
  }

  function reclaimInput() {
    keys.clear();
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body) {
      const tag = active.tagName;
      if (tag === 'IFRAME' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT' || active.isContentEditable) {
        active.blur();
      }
    }
    window.focus();
    lastTime = 0;
    if (running) {
      resize();
      updateOverlayPositions();
    }
  }

  /* ---------------- overlays ---------------- */

  function isBlocked() {
    return !modalRoot.hidden ||
      !lessonRoot.hidden ||
      Boolean(handlers.isOfficeOverlayOpen?.()) ||
      Boolean(handlers.isAssistantChatOpen?.()) ||
      Boolean(handlers.isSocialChatOpen?.()) ||
      Boolean(handlers.isSocialPanelOpen?.());
  }

  function stageScale() {
    const rect = stage.getBoundingClientRect();
    return {
      rect,
      sx: rect.width / Math.max(1, viewW),
      sy: rect.height / Math.max(1, viewH)
    };
  }

  function officeViewportWidth() {
    return scene === 'office' ? Math.min(viewW, officeWorld.width) : viewW;
  }

  function officeOffsetX() {
    return scene === 'office' ? Math.max(0, (viewW - officeWorld.width) / 2) : 0;
  }

  function officeRankStage() {
    if (!officeCourse) return 0;
    return officeRank(getOfficeState(saveManager.save, officeCourse)).stage || 0;
  }

  function worldToScreen(x, y) {
    const { sx, sy } = stageScale();
    let wx = x;
    let wy = y;
    if (scene === 'town' || scene === 'office') {
      wx -= camera.x;
      wy -= camera.y;
      if (scene === 'office') wx += officeOffsetX();
    } else {
      wx += interiorLayout.ox;
      wy += interiorLayout.oy;
    }
    return { x: wx * sx, y: wy * sy, sx, sy, wx, wy };
  }

  function floatText(text, kind = '', at = null) {
    if (!text) return;
    const point = at || { x: player.x, y: player.y - 30 };
    const screen = worldToScreen(point.x, point.y);
    const node = document.createElement('div');
    node.className = `floating-text${kind ? ` ${kind}` : ''}`;
    node.textContent = text;
    node.style.left = `${screen.x}px`;
    node.style.top = `${screen.y}px`;
    fxLayer.appendChild(node);
    setTimeout(() => node.remove(), 1200);
  }

  const FX_TONES = {
    warm: '#ffd166',
    nature: '#a9dba8',
    water: '#8fd2e8',
    love: '#ffa8c0',
    arcane: '#c9b6ff',
    quest: '#ffe08a',
    muted: '#b9c3df'
  };

  const TYPE_FX = {
    home: ['家', 'warm'],
    door: ['门', 'warm'],
    course: ['课', 'quest'],
    tasks: ['!', 'quest'],
    map: ['路', 'quest'],
    gate: ['门', 'warm'],
    sit: ['憩', 'nature'],
    future: ['锁', 'muted'],
    stove: ['暖', 'warm'],
    radio: ['♪', 'arcane'],
    flavor: ['✦', 'nature']
  };

  const FURNITURE_FX = {
    sit: ['憩', 'nature'],
    rest: ['眠', 'arcane'],
    lamp: ['光', 'warm'],
    code: ['课', 'quest'],
    read: ['书', 'arcane'],
    table: ['木', 'warm'],
    rug: ['软', 'nature'],
    starRug: ['星', 'arcane'],
    water: ['露', 'water'],
    candle: ['焰', 'warm'],
    guitar: ['♪', 'arcane'],
    fish: ['鱼', 'water'],
    cat: ['喵', 'love'],
    storage: ['柜', 'warm']
  };

  function pulseAt(x, y, tone = 'warm') {
    if (reduceMotion) return;
    const screen = worldToScreen(x, y);
    const node = document.createElement('div');
    node.className = 'spot-pulse';
    node.style.left = `${screen.x}px`;
    node.style.top = `${screen.y}px`;
    node.style.setProperty('--pulse', FX_TONES[tone] || FX_TONES.warm);
    fxLayer.appendChild(node);
    setTimeout(() => node.remove(), 820);
  }

  function interactFx(x, y, glyph, tone = 'warm') {
    pulseAt(x, y, tone);
    if (glyph) floatText(glyph, `fx-${tone}`, { x, y: y - 26 });
  }

  function interactFeedback(it) {
    const fallback = TYPE_FX[it.type] || TYPE_FX.flavor;
    interactFx(it.x, it.y, it.fx || fallback[0], it.fxTone || fallback[1]);
  }

  function toast(text, kind = '') {
    hud.toast(text, kind);
  }

  /* ---------------- chat bubbles ---------------- */

  function updateChatBubblePositions(peerList = null) {
    if (!chatBubbles.size) return;
    const peers = peerList || renderPeers();
    const byId = new Map(peers.map((peer) => [peer.id, peer]));
    for (const [id, bubble] of chatBubbles) {
      let point;
      if (id === localPlayerId) {
        point = worldToScreen(player.x, player.y - (player.lying ? 48 : 34));
      } else {
        const peer = byId.get(id);
        if (!peer) {
          bubble.el.style.display = 'none';
          continue;
        }
        point = worldToScreen(peer.x, peer.y - (peer.lying ? 52 : 36));
      }
      const visible = point.wx > -80 && point.wx < viewW + 80 &&
        point.wy > -48 && point.wy < viewH + 42;
      bubble.el.style.display = visible ? '' : 'none';
      if (!visible) continue;
      bubble.el.style.left = `${point.x}px`;
      bubble.el.style.top = `${point.y}px`;
    }
  }

  function showChatBubble(message) {
    if (!message?.text) return;
    const id = String(message.fromId || '');
    if (!id) return;
    if (id !== localPlayerId && !activePeers().some((peer) => peer.id === id)) return;
    let bubble = chatBubbles.get(id);
    if (!bubble) {
      const el = document.createElement('div');
      el.className = 'chat-bubble';
      fxLayer.appendChild(el);
      bubble = { el, until: 0, fadeTimer: 0, removeTimer: 0 };
      chatBubbles.set(id, bubble);
    }
    bubble.el.innerHTML = '';
    if (id !== localPlayerId) {
      const name = document.createElement('span');
      name.className = 'chat-bubble-name';
      name.textContent = message.name || '旅人';
      bubble.el.appendChild(name);
    }
    const text = document.createElement('span');
    text.className = 'chat-bubble-text';
    text.textContent = String(message.text).slice(0, 120);
    bubble.el.appendChild(text);
    bubble.el.classList.remove('is-out');
    bubble.el.classList.add('is-on');
    bubble.until = Date.now() + 6500;
    clearTimeout(bubble.fadeTimer);
    clearTimeout(bubble.removeTimer);
    bubble.fadeTimer = setTimeout(() => {
      if (chatBubbles.get(id) !== bubble) return;
      bubble.el.classList.add('is-out');
      bubble.el.classList.remove('is-on');
      bubble.removeTimer = setTimeout(() => {
        if (chatBubbles.get(id) !== bubble) return;
        bubble.el.remove();
        chatBubbles.delete(id);
      }, 360);
    }, 6500);
    updateChatBubblePositions();
  }

  function clearChatBubbles() {
    for (const bubble of chatBubbles.values()) {
      clearTimeout(bubble.fadeTimer);
      clearTimeout(bubble.removeTimer);
      bubble.el.remove();
    }
    chatBubbles.clear();
  }

  /* ---------------- friends / visitors ---------------- */

  function activePeers() {
    if (handlers.getHideOthers?.()) return [];
    const peers = handlers.getPeers?.() || [];
    return peers.filter((peer) => {
      if (!peer || peer.scene !== scene) return false;
      if (scene === 'office') return peer.officeId === officeCourse;
      return true;
    });
  }

  function peerPalette(name) {
    if (!peerPalettes.has(name)) peerPalettes.set(name, paletteForName(name || '旅行者'));
    return peerPalettes.get(name);
  }

  function isHostPeer(peer) {
    return Boolean(visit) && !peer.hostName;
  }

  function updatePeerActors(dt) {
    const peers = activePeers();
    const alive = new Set();
    for (const peer of peers) {
      alive.add(peer.id);
      let actor = peerActors.get(peer.id);
      if (!actor) {
        actor = {
          x: peer.x,
          y: peer.y,
          tx: peer.x,
          ty: peer.y,
          dir: peer.dir,
          moving: Boolean(peer.moving),
          sitting: Boolean(peer.sitting),
          lying: Boolean(peer.lying),
          boat: Boolean(peer.boat),
          frame: 0,
          walk: 0
        };
        peerActors.set(peer.id, actor);
      }
      actor.tx = peer.x;
      actor.ty = peer.y;
      actor.dir = peer.dir || 'down';
      actor.moving = Boolean(peer.moving);
      actor.sitting = Boolean(peer.sitting);
      actor.lying = Boolean(peer.lying);
      actor.boat = Boolean(peer.boat);
      if (Math.hypot(actor.tx - actor.x, actor.ty - actor.y) > 180) {
        actor.x = actor.tx;
        actor.y = actor.ty;
      } else {
        const k = 1 - Math.exp(-dt * 13);
        actor.x += (actor.tx - actor.x) * k;
        actor.y += (actor.ty - actor.y) * k;
        if (Math.abs(actor.tx - actor.x) < 0.3) actor.x = actor.tx;
        if (Math.abs(actor.ty - actor.y) < 0.3) actor.y = actor.ty;
      }
      if (actor.moving && !actor.sitting) {
        actor.walk += dt * 7.2;
        actor.frame = Math.floor(actor.walk) % 4;
      } else {
        actor.frame = 0;
      }
    }
    for (const id of peerActors.keys()) {
      if (!alive.has(id)) peerActors.delete(id);
    }
  }

  function renderPeers() {
    return activePeers().map((peer) => {
      const actor = peerActors.get(peer.id);
      return {
        id: peer.id,
        name: peer.name,
        hostName: peer.hostName,
        officeTitle: peer.officeTitle || '',
        admin: Boolean(peer.admin),
        x: actor ? actor.x : peer.x,
        y: actor ? actor.y : peer.y,
        dir: actor ? actor.dir : peer.dir,
        frame: actor ? actor.frame : 0,
        moving: actor ? actor.moving : Boolean(peer.moving),
        sitting: actor ? actor.sitting : Boolean(peer.sitting),
        lying: actor ? actor.lying : Boolean(peer.lying),
        boat: actor ? actor.boat : Boolean(peer.boat),
        palette: peerPalette(peer.name)
      };
    });
  }

  function syncPeerTags(peers) {
    const alive = new Set();
    for (const peer of peers) {
      alive.add(peer.id);
      let tag = peerTags.get(peer.id);
      if (!tag || !tag.isConnected) {
        tag = document.createElement('div');
        tag.className = 'name-tag is-peer';
        labelsBox.appendChild(tag);
        peerTags.set(peer.id, tag);
      }
      const label = scene === 'office' && peer.officeTitle ? `${peer.name} · ${peer.officeTitle}` : peer.name;
      if (tag.textContent !== label) tag.textContent = label;
      tag.classList.toggle('is-host', isHostPeer(peer));
      tag.classList.toggle('is-admin', Boolean(peer.admin));
      tag.classList.toggle('is-office', scene === 'office');
      tag.title = peer.admin
        ? `${peer.name} · 小镇管理员`
        : scene === 'office' && peer.officeTitle ? `${peer.name} · ${peer.officeTitle}` : peer.name;
    }
    for (const [id, tag] of peerTags) {
      if (!alive.has(id)) {
        tag.remove();
        peerTags.delete(id);
      }
    }
  }

  /* ---------------- labels ---------------- */

  function syncLabels() {
    labelsBox.innerHTML = '';
    labelEntries = [];
    peerTags.clear();
    if (scene === 'town' || scene === 'office') {
      const list = scene === 'town'
        ? town.labels(saveManager.save)
        : officeWorld.labels(officeCourse || 'python', officeRankStage());
      for (const item of list) {
        const el = document.createElement('div');
        el.className = `place-label${item.locked ? ' is-locked' : ''}`;
        const name = document.createElement('span');
        name.textContent = item.text;
        el.appendChild(name);
        const sub = document.createElement('span');
        sub.className = 'label-sub';
        sub.textContent = item.sub;
        el.appendChild(sub);
        labelsBox.appendChild(el);
        labelEntries.push({ el, x: item.x, y: item.y });
      }
    }
    ensureNameTag();
  }

  function ensureNameTag() {
    nameTag = document.createElement('div');
    nameTag.className = 'name-tag';
    nameTag.textContent = saveManager.save.player.name;
    labelsBox.appendChild(nameTag);
  }

  function updateOverlayPositions() {
    const { sx, sy } = stageScale();
    if (scene === 'town' || scene === 'office') {
      const ox = officeOffsetX();
      for (const entry of labelEntries) {
        const x = entry.x - camera.x + ox;
        const y = entry.y - camera.y;
        const visible = x > -80 && x < viewW + 80 && y > -30 && y < viewH + 40;
        entry.el.style.display = visible ? '' : 'none';
        if (!visible) continue;
        entry.el.style.left = `${x * sx}px`;
        entry.el.style.top = `${y * sy}px`;
      }
    } else {
      for (const entry of labelEntries) entry.el.style.display = 'none';
    }
    if (!nameTag) return;
    const screen = worldToScreen(player.x, player.y - (player.lying ? 48 : 28));
    const width = nameTag.offsetWidth || 60;
    nameTag.style.left = `${screen.x}px`;
    nameTag.style.top = `${screen.y}px`;
    nameTag.style.opacity = screen.wx > -width && screen.wx < viewW + width && screen.wy > -20 && screen.wy < viewH + 30 ? '1' : '0';

    const peers = renderPeers();
    syncPeerTags(peers);
    for (const peer of peers) {
      const tag = peerTags.get(peer.id);
      if (!tag) continue;
      const point = worldToScreen(peer.x, peer.y - (peer.lying ? 50 : 30));
      const tagWidth = tag.offsetWidth || 60;
      const visible = point.wx > -tagWidth && point.wx < viewW + tagWidth && point.wy > -24 && point.wy < viewH + 30;
      tag.style.display = visible ? '' : 'none';
      if (!visible) continue;
      tag.style.left = `${point.x}px`;
      tag.style.top = `${point.y}px`;
    }
    updateChatBubblePositions(peers);
  }

  /* ---------------- scene / camera ---------------- */

  function updateCamera(dt = 0.016, snap = false) {
    if (scene !== 'town' && scene !== 'office') return;
    const world = scene === 'office' ? officeWorld : town;
    const vw = scene === 'office' ? officeViewportWidth() : viewW;
    const tx = clamp(player.x - vw / 2, 0, Math.max(0, world.width - vw));
    const ty = clamp(player.y - viewH / 2, 0, Math.max(0, world.height - viewH));
    if (snap) {
      camera.x = tx;
      camera.y = ty;
      return;
    }
    const k = 1 - Math.exp(-dt * 9);
    camera.x += (tx - camera.x) * k;
    camera.y += (ty - camera.y) * k;
    if (Math.abs(tx - camera.x) < 0.4) camera.x = tx;
    if (Math.abs(ty - camera.y) < 0.4) camera.y = ty;
  }

  function resize() {
    const rect = stage.getBoundingClientRect();
    const aspect = rect.width / Math.max(1, rect.height);
    const baseW = VIEW_H * aspect;
    if (baseW < MIN_VIEW_W) {
      viewW = MIN_VIEW_W;
      viewH = Math.round(MIN_VIEW_W / Math.max(0.4, aspect));
    } else if (baseW > MAX_VIEW_W) {
      viewW = MAX_VIEW_W;
      viewH = Math.round(MAX_VIEW_W / aspect);
    } else {
      viewW = Math.round(baseW);
      viewH = VIEW_H;
    }
    const dpr = window.devicePixelRatio || 1;
    const cssScale = Math.max(
      rect.width / Math.max(1, viewW),
      rect.height / Math.max(1, viewH)
    );
    renderScale = Math.max(1, Math.min(4, Math.ceil(dpr * cssScale)));
    canvas.width = Math.round(viewW * renderScale);
    canvas.height = Math.round(viewH * renderScale);
    ctx.imageSmoothingEnabled = false;
    interiorLayout = interior.layout(viewW, viewH);
    updateCamera(0.016, true);
  }

  function zoneText() {
    if (visit) return `${visit.hostName} 的小屋 · 做客中`;
    if (scene === 'home') return '我的小屋 · 室内';
    if (scene === 'office') {
      const info = courseOffice(officeCourse || 'python');
      const state = getOfficeState(saveManager.save, officeCourse);
      return `${info.company} · ${info.floor} · ${state.hired ? officeRank(state).title : '应聘中'}`;
    }
    if (player.boating) return '星港北路 · 兜风中';
    if (fishing) return '镜湖岸边 · 垂钓中';
    return town.zoneAt(player.x, player.y);
  }

  function updateZone() {
    hud.setZone(zoneText());
  }

  function updateClock() {
    dayInfo = day.info();
    hud.setTime(dayInfo.clock, dayInfo.label, dayInfo.phase);
    if (dayInfo.phaseChanged) {
      if (dayInfo.phase === 'dusk') sfx.dusk();
      else if (dayInfo.phase === 'night') sfx.night();
      else if (dayInfo.phase === 'dawn') sfx.dawn();
    }
  }

  function canStandAt(x, y) {
    if (scene === 'town') return town.canStand(x, y, saveManager.save);
    if (scene === 'office') return officeWorld.canStand(x, y);
    return interior.canStand(x, y, runtimeItems());
  }

  function findStandSpot(x, y) {
    const spots = [
      [0, 13], [0, -13], [14, 0], [-14, 0],
      [0, 22], [0, -22], [18, 10], [-18, 10]
    ];
    for (const [dx, dy] of spots) {
      if (canStandAt(x + dx, y + dy)) return { x: x + dx, y: y + dy };
    }
    return { x, y };
  }

  function sitDown(spot) {
    if (!spot) return;
    keys.clear();
    sitSpot = {
      x: spot.x,
      y: spot.y,
      dir: spot.dir || 'down',
      label: spot.label || '坐下',
      text: spot.text || '你坐下来，风从身边慢慢走过。',
      stand: spot.stand || null
    };
    player.x = spot.x;
    player.y = spot.y;
    player.dir = sitSpot.dir;
    player.moving = false;
    player.lying = false;
    lieSpot = null;
    player.sitting = true;
    sfx.sit();
    emitLocalState();
    refreshPrompt(true);
    if (sitSpot.text) toast(sitSpot.text);
  }

  function peerSeatTaken(seat) {
    const peers = handlers.getPeers?.() || [];
    return peers.some((peer) => peer && peer.scene === scene && peer.sitting &&
      Math.hypot(peer.x - seat.x, peer.y - seat.y) < 7);
  }

  function peerOnBed(rect) {
    const peers = handlers.getPeers?.() || [];
    return peers.some((peer) => peer && peer.scene === scene && peer.lying &&
      peer.x > rect.x - 4 && peer.x < rect.x + rect.w + 4 &&
      peer.y > rect.y - 20 && peer.y < rect.y + rect.h + 6);
  }

  function pickSeat(it) {
    if (!it) return null;
    if (!Array.isArray(it.seats) || !it.seats.length) return it.seat || null;
    const free = it.seats.filter((seat) => !peerSeatTaken(seat));
    if (!free.length) return null;
    free.sort((a, b) => Math.hypot(player.x - a.x, player.y - a.y) - Math.hypot(player.x - b.x, player.y - b.y));
    return free[0];
  }

  function standUp(quiet = false) {
    if (!player.sitting) return;
    const from = sitSpot || { x: player.x, y: player.y };
    const stand = from.stand && canStandAt(from.stand.x, from.stand.y)
      ? from.stand
      : findStandSpot(from.x, from.y);
    player.sitting = false;
    player.x = stand.x;
    player.y = stand.y;
    player.dir = 'down';
    player.moving = false;
    sitSpot = null;
    if (!quiet) sfx.stand();
    emitLocalState();
    refreshPrompt(true);
  }

  function lieDown(it) {
    const item = runtimeItems().find((entry) => entry.uid === it.uid);
    if (!item) return;
    const rect = interior.itemRect(item);
    keys.clear();
    lieSpot = {
      x: rect.x + rect.w / 2,
      y: rect.y + rect.h - 6,
      stand: { x: rect.x + rect.w / 2, y: rect.y + rect.h + 8 }
    };
    player.x = lieSpot.x;
    player.y = lieSpot.y;
    player.dir = 'down';
    player.moving = false;
    player.sitting = false;
    player.lying = true;
    sfx.sit();
    emitLocalState();
    refreshPrompt(true);
    toast('你躺进被窝，屋外的风把窗子吹得轻轻响。');
    floatText('Zzz');
  }

  function standLying(quiet = false) {
    if (!player.lying) return;
    const stand = lieSpot?.stand && canStandAt(lieSpot.stand.x, lieSpot.stand.y)
      ? lieSpot.stand
      : findStandSpot(player.x, player.y + 12);
    player.lying = false;
    player.x = stand.x;
    player.y = stand.y;
    player.dir = 'down';
    player.moving = false;
    lieSpot = null;
    if (!quiet) sfx.stand();
    emitLocalState();
    refreshPrompt(true);
  }

  /* ---------------- lake: fishing & boating ---------------- */

  function resetWaterState() {
    player.boating = false;
    fishing = null;
  }

  function startBoat() {
    if (player.boating || scene !== 'town') return;
    const spot = town.boatDock;
    keys.clear();
    player.boating = true;
    player.sitting = false;
    player.lying = false;
    player.x = spot.x;
    player.y = spot.y;
    player.dir = spot.dir || 'left';
    player.moving = false;
    player.walkTime = 0;
    fishing = null;
    sfx.splash();
    floatText('舟', 'fx-water', { x: player.x, y: player.y - 26 });
    toast('你跳上小船，握住了木桨。WASD 划船，E 靠岸下船。');
    emitLocalState();
    refreshPrompt(true);
  }

  function exitBoat() {
    if (!player.boating) return;
    let landing = null;
    for (const radius of [10, 18, 26, 34, 44, 56, 70, 86, 104, 124, 146]) {
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        const lx = player.x + Math.cos(a) * radius;
        const ly = player.y + Math.sin(a) * radius;
        if (town.canStand(lx, ly, saveManager.save)) {
          landing = { x: lx, y: ly };
          break;
        }
      }
      if (landing) break;
    }
    player.boating = false;
    player.moving = false;
    player.dir = 'down';
    if (landing) {
      player.x = landing.x;
      player.y = landing.y;
      toast('你把小船系在岸边，跳上了岸。');
    } else {
      const spot = town.entryFromHome;
      player.x = spot.x;
      player.y = spot.y;
      toast('岸边太挤了，一阵风把你送回了小屋门口。', 'warn');
    }
    sfx.splash();
    refreshPrompt(true);
    emitLocalState();
    persistPosition(true);
  }

  function startFishing(it) {
    if (player.boating || player.sitting || player.lying || scene !== 'town' || !it) return;
    keys.clear();
    const castX = it.cast?.x ?? it.x;
    const castY = it.cast?.y ?? it.y;
    fishing = {
      spotId: it.id,
      castX,
      castY,
      phase: 'wait',
      timer: 1.3 + Math.random() * 2.1
    };
    player.moving = false;
    if (Math.abs(castX - player.x) > 10) player.dir = castX < player.x ? 'left' : 'right';
    else player.dir = castY < player.y ? 'up' : 'down';
    sfx.splash();
    toast('你抛出鱼线，浮标在水面上轻轻晃。看到「！」时按 E 收竿。');
    refreshPrompt(true);
    emitLocalState();
  }

  function tickFishing(dt) {
    if (!fishing) return;
    fishing.timer -= dt;
    if (fishing.phase === 'wait') {
      if (fishing.timer <= 0) {
        fishing.phase = 'bite';
        fishing.timer = 1.35;
        sfx.bite();
        floatText('!', 'fx-quest', { x: fishing.castX, y: fishing.castY - 12 });
        refreshPrompt(true);
      }
      return;
    }
    if (fishing.timer <= 0) {
      fishing = null;
      toast('浮标猛地一沉，又慢慢浮起来——鱼把饵叼走了。', 'warn');
      refreshPrompt(true);
    }
  }

  function cancelFishing(quiet = false) {
    if (!fishing) return;
    fishing = null;
    if (!quiet) {
      sfx.close();
      toast('你收起了鱼竿。');
    }
    refreshPrompt(true);
  }

  function rollFish() {
    let roll = Math.random() * FISH_TOTAL_WEIGHT;
    let picked = FISH_TABLE[0];
    for (const fish of FISH_TABLE) {
      roll -= fish.weight;
      if (roll <= 0) {
        picked = fish;
        break;
      }
    }
    const size = Math.round(picked.min + Math.random() * Math.max(1, picked.max - picked.min));
    return { ...picked, size };
  }

  function catchFish() {
    if (!fishing) return;
    const castX = fishing.castX;
    const castY = fishing.castY;
    fishing = null;
    const fish = rollFish();
    const flags = saveManager.save.flags;
    flags.fishCaught = (flags.fishCaught || 0) + 1;
    const prevBest = flags.bestFish;
    const isBest = !fish.joke && (!prevBest || fish.size > prevBest.cm);
    if (isBest) flags.bestFish = { name: fish.name, cm: fish.size };
    saveManager.markDirty();
    saveManager.recordTownInteraction();
    sfx.reward();
    interactFx(castX, castY, '鱼', 'water');
    floatText(isBest ? '新纪录！' : `${fish.size} cm`, 'fx-water', { x: player.x, y: player.y - 34 });
    if (fish.joke) {
      toast(`钓上来${fish.name}，湿漉漉的，还带着一股湖水的味道。`, 'warn');
    } else if (isBest) {
      toast(`${fish.name}！${fish.size} 厘米——是你在镜湖的新纪录。`);
    } else {
      toast(`${fish.name}！${fish.size} 厘米，滑溜溜地跳进了鱼篓。`);
    }
    refreshPrompt(true);
    emitLocalState();
  }

  function drawFishingRig(context, cam, time) {
    if (!fishing) return;
    const flip = player.dir === 'left' ? -1 : 1;
    const handX = player.x - cam.x + flip * 6;
    const handY = player.y - cam.y - 16;
    const tipX = handX + flip * 8;
    const tipY = handY - 14;
    const bx = fishing.castX - cam.x;
    const by = fishing.castY - cam.y + (fishing.phase === 'bite' ? 2 : Math.sin(time * 0.003) * 1);
    context.strokeStyle = '#8a5f3d';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(handX, handY);
    context.lineTo(tipX, tipY);
    context.stroke();
    context.strokeStyle = 'rgba(245, 240, 220, .8)';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(tipX, tipY);
    context.quadraticCurveTo((tipX + bx) / 2, Math.max(tipY, by) - 8, bx, by);
    context.stroke();
    px(context, bx - 1, by - 2, 3, 3, '#f5f0dc');
    px(context, bx - 1, by, 3, 1, '#d95f4e');
    const ripple = fishing.phase === 'bite'
      ? 0.75
      : Math.sin(time * 0.004) > 0.6 ? 0.35 : 0;
    if (ripple > 0) {
      context.strokeStyle = `rgba(220, 245, 245, ${ripple})`;
      context.beginPath();
      context.ellipse(bx, by, 6, 2, 0, 0, Math.PI * 2);
      context.stroke();
    }
  }

  function contextSnapshot() {
    const it = nearestInteractable();
    return {
      scene,
      zone: zoneText(),
      time: dayInfo.clock,
      timeLabel: dayInfo.label,
      sitting: Boolean(player.sitting),
      visiting: visit ? { hostId: visit.hostId, hostName: visit.hostName } : null,
      nearby: it
        ? {
          type: it.type,
          label: it.label,
          courseId: it.courseId || null,
          locked: Boolean(it.locked)
        }
        : null,
      editMode,
      office: scene === 'office' && officeCourse ? {
        courseId: officeCourse,
        company: courseOffice(officeCourse).company,
        rank: officeRank(getOfficeState(saveManager.save, officeCourse)).title,
        stage: officeRankStage()
      } : null,
      player: { x: Math.round(player.x), y: Math.round(player.y) }
    };
  }

  function runtimeItems() {
    return visit ? visit.room.items : saveManager.save.room.items;
  }

  function emitLocalState() {
    const inOffice = scene === 'office' && officeCourse;
    handlers.onLocalState?.({
      scene,
      officeId: inOffice ? officeCourse : null,
      officeTitle: inOffice ? officeRank(getOfficeState(saveManager.save, officeCourse)).title : '',
      x: player.x,
      y: player.y,
      dir: player.dir,
      moving: player.moving,
      sitting: Boolean(player.sitting),
      lying: Boolean(player.lying),
      boat: Boolean(player.boating)
    });
  }

  function persistPosition(force = false) {
    if (visit || player.boating) return;
    const stored = saveManager.save.player;
    const sceneChanged = stored.scene !== scene;
    if (!force && !sceneChanged &&
      Math.abs(stored.x - player.x) < 3 &&
      Math.abs(stored.y - player.y) < 3) return;
    saveManager.setPlayerPosition(player.x, player.y, player.dir);
    saveManager.save.player.officeId = scene === 'office' ? officeCourse : null;
    saveManager.markDirty();
  }

  function fadeSwap(swap) {
    if (fading) return;
    fading = true;
    keys.clear();
    player.moving = false;
    hud.setPrompt(null);
    fadeLayer.classList.add('is-on');
    clearChatBubbles();
    clearTimeout(fadeWatchdog);
    fadeWatchdog = setTimeout(() => {
      if (!fading) return;
      console.warn('[mossbrook] scene fade watchdog released a stuck transition');
      fading = false;
      fadeLayer.classList.remove('is-on');
      refreshPrompt(true);
    }, 2600);
    setTimeout(() => {
      try {
        swap();
      } catch (err) {
        reportLoopError('fadeSwap', err);
      } finally {
        fxLayer.querySelectorAll('.floating-text, .spot-pulse').forEach((node) => node.remove());
        updateCamera(0.016, true);
        updateOverlayPositions();
        setTimeout(() => {
          fadeLayer.classList.remove('is-on');
          fading = false;
          clearTimeout(fadeWatchdog);
          refreshPrompt(true);
        }, 130);
      }
    }, 190);
  }

  function enterHome() {
    if (scene === 'home' || fading) return;
    const save = saveManager.save;
    const firstVisit = !save.flags.homeVisited;
    sfx.door();
    fadeSwap(() => {
      finishEdit(true);
      resetWaterState();
      scene = 'home';
      visit = null;
      player.x = interior.entry.x;
      player.y = interior.entry.y;
      player.dir = interior.entry.dir;
      player.moving = false;
      player.sitting = false;
      player.lying = false;
      sitSpot = null;
      lieSpot = null;
      peerActors.clear();
      saveManager.setScene('home', player.x, player.y);
      interiorLayout = interior.layout(viewW, viewH);
      syncLabels();
      updateZone();
      emitLocalState();
      handlers.onSceneChange?.('home', false);
      if (firstVisit) {
        save.flags.homeVisited = true;
        saveManager.markDirty();
        setTimeout(() => handlers.assistantTip?.('home-enter', {}), 700);
      }
    });
  }

  function exitHome() {
    if (scene !== 'home' || visit || fading) return;
    sfx.door();
    fadeSwap(() => {
      finishEdit(true);
      resetWaterState();
      scene = 'town';
      const spot = town.entryFromHome;
      player.x = spot.x;
      player.y = spot.y;
      player.dir = spot.dir;
      player.moving = false;
      player.sitting = false;
      player.lying = false;
      sitSpot = null;
      lieSpot = null;
      peerActors.clear();
      saveManager.setScene('town', player.x, player.y);
      syncLabels();
      updateZone();
      emitLocalState();
      handlers.onSceneChange?.('town', false);
    });
  }

  function enterOffice(courseId) {
    if (!courseId || fading) return;
    if (scene === 'office' && officeCourse === courseId) {
      refreshOfficeState();
      return;
    }
    sfx.door();
    fadeSwap(() => {
      finishEdit(true);
      resetWaterState();
      visit = null;
      visitReturn = null;
      officeCourse = courseId;
      officeWorld.setCourse(courseId);
      const state = getOfficeState(saveManager.save, courseId);
      const desk = officeWorld.playerDesk(courseId, officeRank(state).stage || 0);
      const spot = state.hired ? desk : officeWorld.entry;
      scene = 'office';
      player.x = spot.x;
      player.y = spot.y;
      player.dir = spot.dir || 'up';
      player.moving = false;
      player.sitting = false;
      player.lying = false;
      player.boating = false;
      sitSpot = null;
      lieSpot = null;
      fishing = null;
      peerActors.clear();
      saveManager.save.player.officeId = courseId;
      saveManager.setScene('office', player.x, player.y);
      camera.x = 0;
      camera.y = 0;
      syncLabels();
      updateZone();
      emitLocalState();
      handlers.onSceneChange?.('office', false);
    });
  }

  function exitOffice() {
    if (scene !== 'office' || fading) return;
    const courseId = officeCourse;
    sfx.door();
    fadeSwap(() => {
      finishEdit(true);
      resetWaterState();
      scene = 'town';
      const spot = town.towerSpot(courseId || 'python');
      player.x = spot.x;
      player.y = spot.y;
      player.dir = spot.dir || 'down';
      player.moving = false;
      player.sitting = false;
      player.lying = false;
      sitSpot = null;
      lieSpot = null;
      peerActors.clear();
      saveManager.save.player.officeId = null;
      saveManager.setScene('town', player.x, player.y);
      syncLabels();
      updateZone();
      emitLocalState();
      handlers.onSceneChange?.('town', false);
    });
  }

  function teleportInOffice(x, y) {
    if (scene !== 'office') return;
    const nx = Number(x);
    const ny = Number(y);
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) return;
    const spot = officeWorld.canStand(nx, ny) ? { x: nx, y: ny } : findStandSpot(nx, ny);
    player.x = spot.x;
    player.y = spot.y;
    player.moving = false;
    player.sitting = false;
    player.lying = false;
    sitSpot = null;
    lieSpot = null;
    updateCamera(0.016, true);
    persistPosition(true);
    refreshOfficeState();
    emitLocalState();
  }

  function refreshOfficeState() {
    if (scene !== 'office') return;
    syncLabels();
    updateCamera(0.016, true);
    updateOverlayPositions();
    updateZone();
    handlers.officeRefresh?.();
  }

  function enterGuestHome(payload) {
    if (!payload?.hostId) return;
    if (visit?.hostId === payload.hostId) {
      updateVisitRoom(payload.room);
      return;
    }
    if (fading) {
      setTimeout(() => enterGuestHome(payload), 280);
      return;
    }
    sfx.door();
    const back = scene === 'town'
      ? { x: player.x, y: player.y, dir: player.dir }
      : visitReturn;
    fadeSwap(() => {
      finishEdit(true);
      resetWaterState();
      visitReturn = back;
      scene = 'home';
      visit = {
        hostId: payload.hostId,
        hostName: payload.hostName || '朋友',
        room: payload.room || { items: [], lampOn: true, wallpaper: 'warm' }
      };
      player.x = payload.entry?.x ?? interior.entry.x;
      player.y = payload.entry?.y ?? interior.entry.y;
      player.dir = 'up';
      player.moving = false;
      player.sitting = false;
      player.lying = false;
      sitSpot = null;
      lieSpot = null;
      peerActors.clear();
      interiorLayout = interior.layout(viewW, viewH);
      syncLabels();
      updateZone();
      emitLocalState();
      handlers.onSceneChange?.('home', true);
    });
  }

  function leaveGuestHome(reason = 'left') {
    if (!visit) return;
    if (fading) {
      setTimeout(() => leaveGuestHome(reason), 280);
      return;
    }
    sfx.door();
    const hostName = visit.hostName;
    const back = visitReturn;
    fadeSwap(() => {
      finishEdit(true);
      resetWaterState();
      const stored = saveManager.save;
      const spot = back && town.canStand(back.x, back.y, stored) ? back : town.entryFromHome;
      visit = null;
      visitReturn = null;
      scene = 'town';
      player.x = spot.x;
      player.y = spot.y;
      player.dir = spot.dir || 'down';
      player.moving = false;
      player.sitting = false;
      player.lying = false;
      sitSpot = null;
      lieSpot = null;
      peerActors.clear();
      saveManager.setScene('town', player.x, player.y);
      syncLabels();
      updateZone();
      emitLocalState();
      handlers.onSceneChange?.('town', false);
      if (reason === 'host-left' || reason === 'host-ended' || reason === 'host-offline') {
        toast(`${hostName} 离开了小屋，你回到了大厅。`, 'warn');
      } else if (reason === 'lost') {
        toast('串门的连接断开了，你回到了大厅。', 'warn');
      }
    });
  }

  function updateVisitRoom(room) {
    if (!visit || !room) return;
    visit = { ...visit, room };
    refreshPrompt(true);
  }

  function teleportTo(payload) {
    if (!payload) return;
    const x = Number(payload.x);
    const y = Number(payload.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (fading) {
      setTimeout(() => teleportTo(payload), 280);
      return;
    }
    sfx.door();
    fadeSwap(() => {
      finishEdit(true);
      resetWaterState();
      visit = null;
      visitReturn = null;
      scene = 'town';
      const stored = saveManager.save;
      const spot = town.canStand(x, y, stored) ? { x, y } : findStandSpot(x, y);
      player.x = spot.x;
      player.y = spot.y;
      player.dir = 'down';
      player.moving = false;
      player.sitting = false;
      player.lying = false;
      sitSpot = null;
      lieSpot = null;
      peerActors.clear();
      saveManager.save.player.officeId = null;
      saveManager.setScene('town', player.x, player.y);
      syncLabels();
      updateZone();
      emitLocalState();
      handlers.onSceneChange?.('town', false);
    });
  }

  function ensureGate(silent = false) {
    const save = saveManager.save;
    const level = levelInfo(save.xp).level;
    if (level < GATE_LEVEL || save.flags.northGateOpen) return;
    save.flags.northGateOpen = true;
    saveManager.markDirty();
    syncLabels();
    if (!silent) {
      toast(`北门的木闩松开了。Lv.${level} 的你，可以沿着小路去北岭观星台了。`, 'reward');
      floatText('北门开启', 'is-xp');
      handlers.assistantTip?.('gate-open', { level });
    }
  }

  /* ---------------- interaction ---------------- */

  function nearestInteractable() {
    if (scene === 'town') return town.nearestInteractable(player, saveManager.save);
    if (scene === 'office') return officeWorld.nearestInteractable(player, officeCourse || 'python', saveManager.save);
    return interior.nearestInteractable(player, runtimeItems(), dayInfo);
  }

  function refreshPrompt() {
    if (fading || editMode || isBlocked()) {
      hud.setPrompt(null);
      return;
    }
    if (player.boating || fishing) {
      const point = worldToScreen(player.x, player.y - 22);
      const label = player.boating
        ? '靠岸下船'
        : fishing.phase === 'bite' ? '咬钩了！按 E 收竿' : '收竿';
      hud.setPrompt(label, point.x, point.y);
      return;
    }
    if (player.sitting || player.lying) {
      const point = worldToScreen(player.x, player.y - (player.lying ? 46 : 18));
      hud.setPrompt(player.lying ? '起身' : '站起来走走', point.x, point.y);
      return;
    }
    const it = nearestInteractable();
    if (!it) {
      hud.setPrompt(null);
      return;
    }
    const point = worldToScreen(it.x, it.y - 14);
    hud.setPrompt(it.label, point.x, point.y);
  }

  function useGate() {
    const save = saveManager.save;
    if (!save.flags.northGateOpen) {
      sfx.error();
      toast(`北门的木闩扣得很紧。升到 Lv.${GATE_LEVEL} 后，它就会为你打开。`, 'warn');
      return;
    }
    sfx.door();
    const north = player.y < 312;
    const spot = north ? town.northGatePassage.south : town.northGatePassage.north;
    fadeSwap(() => {
      player.x = spot.x;
      player.y = spot.y;
      player.dir = spot.dir;
      persistPosition(true);
    });
  }

  function furnitureFlavor(type) {
    switch (type) {
      case 'rest': return '你在小床上躺了一会儿，屋檐外的风把窗子吹得轻轻响。';
      case 'sit': return '你坐下来，木椅发出很轻的吱呀声。';
      case 'table': return '年轮一圈一圈，像把很多个夏天收在了一起。';
      case 'rug': return '毯子软软的，脚步都变轻了。';
      case 'starRug': return '你认出了三颗连成勺子形状的星星。';
      case 'water': return '水珠顺着叶脉滑下来，叶子轻轻抖了一下。';
      case 'candle': return '火苗晃了晃，把影子投在墙上。';
      case 'guitar': return '少了一根弦，但晚风还是被弹了出来。';
      case 'fish': return '两条小鱼同时转向，像在给你让路。';
      case 'cat': return '垫子还是温的。窗台上传来一声很轻的喵。';
      case 'storage': return '柜子里有陶罐碰撞的清脆声响，和一点旧纸的味道。';
      default: return '这件家具安静地待在原地。';
    }
  }

  function useFurniture(it) {
    const def = FURNITURE[it.itemId];
    if (!def) return;
    const [glyph, tone] = FURNITURE_FX[def.interact.type] || ['✦', 'nature'];
    switch (def.interact.type) {
      case 'sit': {
        const item = runtimeItems().find((entry) => entry.uid === it.uid);
        if (!item) break;
        const rect = interior.itemRect(item);
        interactFx(it.x, it.y, glyph, tone);
        sitDown({
          x: rect.x + rect.w / 2,
          y: rect.y + 10,
          dir: 'down',
          text: def.kind === 'chair' ? '你坐下来，房间一下子安静了。' : '你坐在蘑菇矮凳上，晃了晃脚。',
          stand: { x: rect.x + rect.w / 2, y: rect.y + rect.h + 9 }
        });
        break;
      }
      case 'rest': {
        const item = runtimeItems().find((entry) => entry.uid === it.uid);
        if (item && peerOnBed(interior.itemRect(item))) {
          interactFx(it.x, it.y, '满', 'muted');
          sfx.error();
          toast('床已经有人躺着了，等对方起来再躺吧。', 'warn');
          break;
        }
        pulseAt(it.x, it.y, tone);
        lieDown(it);
        break;
      }
      case 'lamp': {
        if (visit) {
          interactFx(it.x, it.y, glyph, tone);
          sfx.click();
          toast('灯由小屋主人控制，你轻轻碰了碰灯罩。');
          break;
        }
        const on = !saveManager.save.room.lampOn;
        saveManager.setRoomSetting('lampOn', on);
        interactFx(it.x, it.y, on ? '光' : '暗', tone);
        sfx.lamp();
        toast(on ? '灯亮了，屋子一下变得很暖。' : '灯熄了，窗外深蓝色的光落进来。');
        break;
      }
      case 'code':
        interactFx(it.x, it.y, glyph, tone);
        sfx.open();
        handlers.openCourses?.();
        break;
      case 'read':
        interactFx(it.x, it.y, glyph, tone);
        sfx.flavor();
        toast(BOOK_QUOTES[Math.floor(Math.random() * BOOK_QUOTES.length)]);
        break;
      default:
        interactFx(it.x, it.y, glyph, tone);
        sfx.flavor();
        toast(furnitureFlavor(def.interact.type));
        break;
    }
  }

  function interact() {
    if (fading || isBlocked()) return;
    if (editMode) return;
    if (player.boating) {
      exitBoat();
      return;
    }
    if (fishing) {
      if (fishing.phase === 'bite') catchFish();
      else cancelFishing();
      return;
    }
    if (player.lying) {
      standLying();
      return;
    }
    if (player.sitting) {
      standUp();
      return;
    }
    const it = nearestInteractable();
    if (!it) return;
    if (it.locked) {
      interactFx(it.x, it.y, '锁', 'muted');
      sfx.error();
      toast(it.lockText || '现在还过不去。', 'warn');
      return;
    }
    sfx.interact();
    switch (it.type) {
      case 'home':
        interactFeedback(it);
        enterHome();
        break;
      case 'door':
        interactFeedback(it);
        if (visit) handlers.leaveCabin?.();
        else exitHome();
        break;
      case 'course':
        interactFeedback(it);
        handlers.openCourse?.(it.courseId);
        break;
      case 'tower':
        interactFeedback(it);
        handlers.enterTower?.(it.courseId);
        break;
      case 'office':
        interactFeedback(it);
        handlers.officeInteract?.(it);
        break;
      case 'tasks':
        interactFeedback(it);
        handlers.openTasks?.();
        break;
      case 'fishing':
        interactFeedback(it);
        startFishing(it);
        break;
      case 'boat':
        interactFeedback(it);
        startBoat();
        break;
      case 'photo':
        saveManager.recordTownInteraction();
        interactFx(it.x, it.y, it.fx || '影', it.fxTone || 'love');
        sfx.click();
        floatText('咔嚓', 'fx-love', { x: it.x, y: it.y - 30 });
        toast('咔嚓——花瓣在风里落下来，这张照片一定很好看。');
        break;
      case 'stage':
        saveManager.recordTownInteraction();
        interactFx(it.x, it.y, it.fx || '♪', it.fxTone || 'arcane');
        sfx.music();
        toast('你站上小舞台哼了一小段曲子，音符顺着风飘过了广场。');
        break;
      case 'campfire':
        saveManager.recordTownInteraction();
        interactFx(it.x, it.y, it.fx || '火', it.fxTone || 'warm');
        sfx.fire();
        toast('篝火噼啪作响，暖意从手心一直漫到肩膀上。');
        break;
      case 'map':
        interactFeedback(it);
        handlers.openMap?.();
        break;
      case 'gate':
        interactFeedback(it);
        useGate();
        break;
      case 'sit': {
        const seat = pickSeat(it);
        if (!seat) {
          interactFx(it.x, it.y, '满', 'muted');
          sfx.error();
          toast('座位已满，等一会儿再坐吧。', 'warn');
          break;
        }
        interactFeedback(it);
        sfx.click();
        sitDown(seat);
        break;
      }
      case 'furniture':
        useFurniture(it);
        break;
      case 'stove':
        interactFeedback(it);
        sfx.fire();
        toast(it.flavor || '炉火暖暖的，屋里飘着一点木头香。');
        break;
      case 'radio':
        interactFeedback(it);
        sfx.music();
        toast(it.flavor || '唱片机转起来，一小段旧旧的调子填满了屋子。');
        break;
      case 'future':
        interactFeedback(it);
        sfx.error();
        toast(it.lockText || '还没开放。', 'warn');
        break;
      case 'flavor':
        saveManager.recordTownInteraction();
        interactFeedback(it);
        sfx.flavor();
        toast(it.flavor || '你在这儿站了一小会儿。');
        break;
      default:
        interactFeedback(it);
        break;
    }
  }

  /* ---------------- edit mode ---------------- */

  function inventoryEntries() {
    return Object.entries(saveManager.save.inventory)
      .filter(([id, count]) => count > 0 && FURNITURE[id])
      .map(([id, count]) => ({ id, count }));
  }

  function clampGhost() {
    if (!ghost) return;
    const size = furnitureSize(ghost.id, ghost.rot);
    ghost.tx = clamp(ghost.tx, 1, ROOM_COLS - 1 - size.w);
    ghost.ty = clamp(ghost.ty, 1, ROOM_ROWS - size.h);
  }

  function refreshGhostValidity() {
    if (!ghost) return;
    const result = interior.canPlace(ghost.id, ghost.tx, ghost.ty, ghost.rot, saveManager.save.room.items, player);
    ghost.valid = result.ok;
    ghost.reason = result.reason || '';
  }

  function refreshEditBar() {
    if (!editMode) return;
    hud.showEditBar({
      entries: inventoryEntries(),
      selectedId: ghost?.id || null,
      rot: ghost?.rot || 0,
      wallpaper: saveManager.save.room.wallpaper || 'warm',
      onSelect: selectFurniture,
      onRotate: rotateGhost,
      onRemove: removeAtCursor,
      onDone: finishEdit,
      onWallpaper: setWallpaper
    });
  }

  function setWallpaper(id) {
    if (visit) return;
    const paper = WALLPAPERS.find((entry) => entry.id === id);
    if (!paper) return;
    if ((saveManager.save.room.wallpaper || 'warm') === paper.id) {
      sfx.tick();
      return;
    }
    saveManager.setRoomSetting('wallpaper', paper.id);
    sfx.open();
    toast(`墙面换成了「${paper.name}」，小屋换了一种心情。`);
    refreshEditBar();
  }

  function startEdit() {
    if (scene !== 'home' || editMode) return;
    if (visit) {
      toast('做客的时候不能布置别人的小屋。回到大厅，再回自己家试试。');
      return;
    }
    const entries = inventoryEntries();
    editMode = true;
    gameScreen.classList.add('is-editing');
    keys.clear();
    player.moving = false;
    if (player.lying) {
      standLying(true);
    } else if (player.sitting) standUp(true);
    hud.setPrompt(null);
    sfx.open();
    ghost = null;
    if (entries.length) {
      ghost = {
        id: entries[0].id,
        tx: clamp(Math.floor(player.x / 16), 1, ROOM_COLS - 2),
        ty: clamp(Math.floor((player.y - WALL_H) / 16), 1, ROOM_ROWS - 2),
        rot: 0,
        valid: false,
        reason: ''
      };
      clampGhost();
      refreshGhostValidity();
    }
    refreshEditBar();
    toast(entries.length
      ? '布置模式：WASD 移动光标，E 放置，R 旋转，X 收回，F 完成；上方还能换墙纸。'
      : '行囊里暂时没有家具，先挑一款墙纸吧。按 F 完成。');
  }

  function finishEdit(silent = false) {
    if (!editMode) return;
    editMode = false;
    ghost = null;
    gameScreen.classList.remove('is-editing');
    hud.hideEditBar();
    if (!silent) {
      sfx.close();
      toast('房间布置好了，这就是你在苔溪的小窝。');
    }
    refreshPrompt(true);
  }

  function selectFurniture(id) {
    if (!editMode || !ghost || !FURNITURE[id]) return;
    if ((saveManager.save.inventory[id] || 0) <= 0) return;
    sfx.tick();
    ghost.id = id;
    ghost.rot = 0;
    clampGhost();
    refreshGhostValidity();
    refreshEditBar();
  }

  function rotateGhost() {
    if (!ghost) return;
    sfx.tick();
    ghost.rot = (ghost.rot + 1) % 4;
    clampGhost();
    refreshGhostValidity();
    refreshEditBar();
  }

  function moveGhost(dx, dy) {
    if (!ghost) return;
    ghost.tx += dx;
    ghost.ty += dy;
    clampGhost();
    refreshGhostValidity();
  }

  function placeGhost() {
    if (!editMode || !ghost) return;
    refreshGhostValidity();
    if (!ghost.valid) {
      sfx.error();
      toast(ghost.reason || '这里放不下。', 'warn');
      return;
    }
    const placed = saveManager.placeFurniture(ghost.id, ghost.tx, ghost.ty, ghost.rot);
    if (!placed.ok) {
      sfx.error();
      toast(placed.error || '没能放下这件家具。', 'warn');
      return;
    }
    sfx.place();
    floatText('放好啦', 'is-xp');
    toast(`${FURNITURE[ghost.id].name} 放好了。`);
    const entries = inventoryEntries();
    if (!entries.some((entry) => entry.id === ghost.id)) {
      if (!entries.length) {
        finishEdit(true);
        toast('行囊空了，这间屋子已经很有你的样子。', 'reward');
        return;
      }
      ghost.id = entries[0].id;
      ghost.rot = 0;
    }
    clampGhost();
    refreshGhostValidity();
    refreshEditBar();
  }

  function removeAtCursor() {
    if (!editMode || !ghost) return;
    const item = interior.itemAt(ghost.tx, ghost.ty, saveManager.save.room.items);
    if (!item) {
      toast('这里没有可以收回的家具。');
      return;
    }
    const result = saveManager.removeRoomItem(item.uid);
    if (!result.ok) {
      sfx.error();
      toast(result.error || '没能收回这件家具。', 'warn');
      return;
    }
    sfx.remove();
    toast(`已把 ${FURNITURE[item.id]?.name || '家具'} 收回行囊。`);
    refreshGhostValidity();
    refreshEditBar();
  }

  function tileFromEvent(event) {
    const { rect, sx, sy } = stageScale();
    const vx = ((event.clientX - rect.left) / Math.max(1, sx));
    const vy = ((event.clientY - rect.top) / Math.max(1, sy));
    const tx = Math.floor((vx - interiorLayout.ox) / 16);
    const ty = Math.floor((vy - interiorLayout.oy - WALL_H) / 16);
    if (tx < 1 || ty < 1 || tx >= ROOM_COLS || ty >= ROOM_ROWS) return null;
    return { tx, ty };
  }

  /* ---------------- input ---------------- */

  function onKeyDown(event) {
    if (gameScreen.hidden) return;
    if (isTypingTarget(event.target)) return;
    if (isBlocked()) return;

    const code = event.code;
    if (code === 'Tab') {
      event.preventDefault();
      handlers.openOverview?.();
      return;
    }
    if (code === 'Escape') {
      if (editMode) {
        event.preventDefault();
        finishEdit();
      }
      return;
    }
    if (editMode) {
      if (MOVE_KEYS.has(code)) {
        event.preventDefault();
        const map = {
          KeyW: [0, -1], ArrowUp: [0, -1],
          KeyS: [0, 1], ArrowDown: [0, 1],
          KeyA: [-1, 0], ArrowLeft: [-1, 0],
          KeyD: [1, 0], ArrowRight: [1, 0]
        };
        const [dx, dy] = map[code] || [0, 0];
        if (dx || dy) moveGhost(dx, dy);
        return;
      }
      if (code === 'KeyE' || code === 'Enter' || code === 'Space') {
        event.preventDefault();
        if (!event.repeat) placeGhost();
        return;
      }
      if (code === 'KeyR') {
        event.preventDefault();
        if (!event.repeat) rotateGhost();
        return;
      }
      if (code === 'KeyX' || code === 'Delete' || code === 'Backspace') {
        event.preventDefault();
        if (!event.repeat) removeAtCursor();
        return;
      }
      if (code === 'KeyF') {
        event.preventDefault();
        if (!event.repeat) finishEdit();
        return;
      }
      if (code.startsWith('Digit')) {
        const index = Number(code.slice(5)) - 1;
        const entries = inventoryEntries();
        if (entries[index]) {
          event.preventDefault();
          selectFurniture(entries[index].id);
        }
        return;
      }
      return;
    }

    if (code === 'KeyE') {
      event.preventDefault();
      interact();
      return;
    }
    if (code === 'KeyF' && scene === 'home') {
      event.preventDefault();
      startEdit();
      return;
    }
    if (code === 'KeyC') {
      event.preventDefault();
      handlers.openCourses?.();
      return;
    }
    if (code === 'KeyG') {
      event.preventDefault();
      handlers.openTasks?.();
      return;
    }
    if (code === 'KeyT') {
      event.preventDefault();
      handlers.openChat?.();
      return;
    }
    if (code === 'KeyO') {
      event.preventDefault();
      handlers.openFriends?.();
      return;
    }
    if (code === 'KeyM') {
      event.preventDefault();
      handlers.openMap?.();
      return;
    }
    if (code === 'KeyH' && scene === 'town') {
      event.preventDefault();
      enterHome();
      return;
    }
    if (MOVE_KEYS.has(code)) {
      event.preventDefault();
      keys.add(code);
    } else if (code === 'ShiftLeft' || code === 'ShiftRight') {
      keys.add(code);
    }
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onBlur() {
    keys.clear();
    player.moving = false;
  }

  function onPointerMove(event) {
    if (!editMode || !ghost) return;
    const tile = tileFromEvent(event);
    if (!tile || (tile.tx === ghost.tx && tile.ty === ghost.ty)) return;
    ghost.tx = tile.tx;
    ghost.ty = tile.ty;
    refreshGhostValidity();
  }

  function onCanvasDown(event) {
    if (!editMode || !ghost) return;
    const tile = tileFromEvent(event);
    if (!tile) return;
    event.preventDefault();
    ghost.tx = tile.tx;
    ghost.ty = tile.ty;
    refreshGhostValidity();
    if (event.button === 0) placeGhost();
    else if (event.button === 2) removeAtCursor();
  }

  function onContextMenu(event) {
    if (editMode) event.preventDefault();
  }

  function onBeforeUnload() {
    persistPosition(true);
    saveManager.saveNow(true);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      persistPosition(true);
      saveManager.saveNow(true);
    } else if (running) {
      lastTime = 0;
      resize();
      updateOverlayPositions();
    }
  }

  /* ---------------- update ---------------- */

  function update(dt) {
    updatePeerActors(dt);
    day.update(dt);
    updateClock();
    if (isBlocked() || fading) {
      player.moving = false;
      hud.setPrompt(null);
      emitLocalState();
      return;
    }

    if (fishing && !player.boating && !player.sitting && !player.lying) {
      let wantsMove = false;
      for (const code of MOVE_KEYS) {
        if (keys.has(code)) {
          wantsMove = true;
          break;
        }
      }
      if (!wantsMove) {
        tickFishing(dt);
        player.moving = false;
        tickWorld(dt);
        return;
      }
      cancelFishing(true);
    }

    if (player.boating) {
      let ix = 0;
      let iy = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) iy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) iy += 1;
      if (ix || iy) {
        const length = Math.hypot(ix, iy) || 1;
        ix /= length;
        iy /= length;
        const stepX = ix * BOAT_SPEED * dt;
        const stepY = iy * BOAT_SPEED * dt;
        let moved = false;
        if (stepX && town.canBoat(player.x + stepX, player.y)) {
          player.x += stepX;
          moved = true;
        }
        if (stepY && town.canBoat(player.x, player.y + stepY)) {
          player.y += stepY;
          moved = true;
        }
        player.moving = moved;
        if (moved) {
          player.walkTime += dt * 5.6;
          player.frame = Math.floor(player.walkTime) % 4;
          if (Math.abs(ix) > Math.abs(iy)) player.dir = ix < 0 ? 'left' : 'right';
          else if (Math.abs(iy) > 0.01) player.dir = iy < 0 ? 'up' : 'down';
          stepTimer += dt;
          if (stepTimer >= 1) {
            stepTimer = 0;
            sfx.splash();
          }
        } else {
          stepTimer = 0;
        }
      } else {
        player.moving = false;
        stepTimer = 0;
      }
    } else if (player.lying) {
      let wantsMove = false;
      for (const code of MOVE_KEYS) {
        if (keys.has(code)) {
          wantsMove = true;
          break;
        }
      }
      if (wantsMove) standLying();
      player.moving = false;
    } else if (player.sitting) {
      let wantsMove = false;
      for (const code of MOVE_KEYS) {
        if (keys.has(code)) {
          wantsMove = true;
          break;
        }
      }
      if (wantsMove) standUp();
      player.moving = false;
    } else if (!editMode) {
      let ix = 0;
      let iy = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) ix -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) ix += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) iy -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) iy += 1;
      if (ix || iy) {
        const length = Math.hypot(ix, iy) || 1;
        ix /= length;
        iy /= length;
        const running = keys.has('ShiftLeft') || keys.has('ShiftRight');
        const speed = WALK_SPEED * (running ? RUN_MULT : 1);
        const stepX = ix * speed * dt;
        const stepY = iy * speed * dt;
        const can = scene === 'town'
          ? (x, y) => town.canStand(x, y, saveManager.save)
          : scene === 'office'
            ? (x, y) => officeWorld.canStand(x, y)
            : (x, y) => interior.canStand(x, y, runtimeItems());
        let moved = false;
        if (stepX && can(player.x + stepX, player.y)) {
          player.x += stepX;
          moved = true;
        }
        if (stepY && can(player.x, player.y + stepY)) {
          player.y += stepY;
          moved = true;
        }
        player.moving = moved;
        if (moved) {
          player.walkTime += dt * (running ? 10.2 : 7.2);
          player.frame = Math.floor(player.walkTime) % 4;
          if (Math.abs(ix) > Math.abs(iy)) player.dir = ix < 0 ? 'left' : 'right';
          else if (Math.abs(iy) > 0.01) player.dir = iy < 0 ? 'up' : 'down';
          stepTimer += dt;
          if (stepTimer >= (running ? 0.26 : 0.38)) {
            stepTimer = 0;
            sfx.step();
          }
        } else {
          stepTimer = 0;
        }
      } else {
        player.moving = false;
        stepTimer = 0;
      }
    } else {
      player.moving = false;
    }

    tickWorld(dt);
  }

  function tickWorld(dt) {
    if (scene === 'town') {
      town.update(dt, {
        reduceMotion: reduce,
        player,
        getChatter: handlers.getChatter,
        ensureChatter: handlers.ensureChatter
      });
    } else if (scene === 'office') {
      officeWorld.update(dt, {
        reduceMotion: reduce,
        chatterKind: 'office',
        getChatter: handlers.getChatter,
        ensureChatter: handlers.ensureChatter
      });
    }
    updateCamera(dt);
    refreshPrompt();

    zoneTimer += dt;
    if (zoneTimer > 0.45) {
      zoneTimer = 0;
      updateZone();
    }
    positionTimer += dt;
    if (positionTimer > 1.8) {
      positionTimer = 0;
      persistPosition();
    }
    emitLocalState();
  }

  /* ---------------- render ---------------- */

  function render(time) {
    resetCanvasState();
    try {
      drawScene(time);
    } catch (err) {
      reportLoopError('render', err);
      resetCanvasState();
    }
    // 名字标签与场景分开刷新：即使某一帧绘制失败，输入反馈也不会一起停住
    updateOverlayPositions();
  }

  function drawScene(time) {
    const save = saveManager.save;
    const extraActors = renderPeers();
    if (scene === 'town') {
      town.draw(ctx, camera, time, {
        player,
        save,
        reduceMotion: reduce,
        viewW,
        viewH,
        day: dayInfo,
        extraActors,
        drawPlayer: (context, cam) => {
          if (player.boating) {
            drawBoat(context, { x: player.x - cam.x, y: player.y - cam.y }, time, player.moving);
          }
          drawPlayer(context, player.x - cam.x, player.y - cam.y, player.dir, player.frame, palette, player.moving, {
            sitting: player.sitting || player.boating,
            lying: player.lying
          });
          drawFishingRig(context, cam, time);
        },
        drawPeer: (context, actor, cam) => {
          if (actor.boat) {
            drawBoat(context, { x: actor.x - cam.x, y: actor.y - cam.y }, time, actor.moving);
          }
          drawPlayer(context, actor.x - cam.x, actor.y - cam.y, actor.dir, actor.frame, actor.palette, actor.moving, {
            sitting: actor.sitting || actor.boat,
            lying: actor.lying
          });
        }
      });
    } else if (scene === 'office') {
      const officeW = officeViewportWidth();
      const ox = officeOffsetX();
      ctx.fillStyle = dayInfo.night ? '#0b111b' : '#141c2a';
      ctx.fillRect(0, 0, viewW, viewH);
      ctx.save();
      ctx.translate(ox, 0);
      ctx.beginPath();
      ctx.rect(0, 0, officeW, viewH);
      ctx.clip();
      const officeState = getOfficeState(save, officeCourse || 'python');
      officeWorld.draw(ctx, camera, time, {
        player,
        save,
        viewW: officeW,
        viewH,
        day: dayInfo,
        extraActors,
        courseId: officeCourse || 'python',
        rankStage: officeRank(officeState).stage || 0,
        rankTitle: officeRank(officeState).title,
        playerName: save.player.name,
        drawPlayer: (context) => {
          drawPlayer(context, player.x - camera.x, player.y - camera.y, player.dir, player.frame, palette, player.moving, {
            sitting: player.sitting,
            lying: player.lying
          });
        },
        drawPeer: (context, actor) => {
          drawPlayer(context, actor.x - camera.x, actor.y - camera.y, actor.dir, actor.frame, actor.palette, actor.moving, {
            sitting: actor.sitting,
            lying: actor.lying
          });
        }
      });
      ctx.restore();
    } else {
      interiorLayout = interior.render(ctx, time, {
        viewW,
        viewH,
        player,
        items: runtimeItems(),
        ghost: editMode ? ghost : null,
        editMode,
        lampOn: visit ? visit.room.lampOn !== false : save.room.lampOn,
        wallpaper: visit ? visit.room.wallpaper : save.room.wallpaper,
        reduceMotion: reduce,
        day: dayInfo,
        extraActors,
        drawPlayer: (context) => {
          drawPlayer(context, player.x, player.y, player.dir, player.frame, palette, player.moving, {
            sitting: player.sitting,
            lying: player.lying
          });
        },
        drawPeer: (context, actor) => {
          drawPlayer(context, actor.x, actor.y, actor.dir, actor.frame, actor.palette, actor.moving, {
            sitting: actor.sitting,
            lying: actor.lying
          });
        }
      });
    }
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = lastTime ? Math.min(0.05, (now - lastTime) / 1000) : 0.016;
    lastTime = now;
    try {
      update(dt);
    } catch (err) {
      reportLoopError('update', err);
    }
    render(now);
  }

  /* ---------------- boot / teardown ---------------- */

  function initPlayer() {
    const save = saveManager.save;
    if (save.player.scene === 'office') {
      scene = 'office';
      officeCourse = ['python', 'web', 'data'].includes(save.player.officeId) ? save.player.officeId : 'python';
      officeWorld.setCourse(officeCourse);
      const state = getOfficeState(save, officeCourse);
      const desk = officeWorld.playerDesk(officeCourse, officeRank(state).stage || 0);
      const fallback = state.hired ? desk : officeWorld.entry;
      const x = Number.isFinite(save.player.x) ? save.player.x : fallback.x;
      const y = Number.isFinite(save.player.y) ? save.player.y : fallback.y;
      if (officeWorld.canStand(x, y)) {
        player.x = x;
        player.y = y;
      } else {
        player.x = fallback.x;
        player.y = fallback.y;
      }
      player.dir = save.player.dir || 'up';
      saveManager.save.player.officeId = officeCourse;
    } else if (save.player.scene === 'home') {
      scene = 'home';
      const x = Number.isFinite(save.player.x) ? save.player.x : interior.entry.x;
      const y = Number.isFinite(save.player.y) ? save.player.y : interior.entry.y;
      if (interior.canStand(x, y, save.room.items)) {
        player.x = x;
        player.y = y;
      } else {
        player.x = interior.entry.x;
        player.y = interior.entry.y;
      }
      player.dir = save.player.dir || 'up';
    } else {
      scene = 'town';
      const spot = town.spawn(save);
      player.x = spot.x;
      player.y = spot.y;
      player.dir = spot.dir;
    }
    player.frame = 0;
    player.walkTime = 0;
    player.boating = false;
    fishing = null;
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    initPlayer();
    updateCamera(0.016, true);
    syncLabels();
    updateZone();
    ensureGate(true);
    hud.setSaveState('已保存', false);
    handlers.onSceneChange?.(scene, Boolean(visit));
    emitLocalState();
    lastTime = 0;
    raf = requestAnimationFrame(frame);
  }

  function destroy() {
    running = false;
    cancelAnimationFrame(raf);
    persistPosition(true);
    hud.setPrompt(null);
    hud.hideEditBar();
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('resize', resize);
    window.removeEventListener('beforeunload', onBeforeUnload);
    window.removeEventListener('mossbrook:overlay-closed', reclaimInput);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    canvas.removeEventListener('mousemove', onPointerMove);
    canvas.removeEventListener('mousedown', onCanvasDown);
    canvas.removeEventListener('contextmenu', onContextMenu);
    labelsBox.innerHTML = '';
    fxLayer.innerHTML = '';
    labelEntries = [];
    nameTag = null;
  }

  const unsubscribe = saveManager.on((type) => {
    if (type === 'level-up' || type === 'lesson-complete' || type === 'task-claimed') {
      ensureGate();
      syncLabels();
    }
  });

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  window.addEventListener('resize', resize);
  window.addEventListener('beforeunload', onBeforeUnload);
  window.addEventListener('mossbrook:overlay-closed', reclaimInput);
  document.addEventListener('visibilitychange', onVisibilityChange);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('mousedown', onCanvasDown);
  canvas.addEventListener('contextmenu', onContextMenu);

  return {
    start,
    destroy,
    enterHome,
    exitHome,
    enterOffice,
    exitOffice,
    teleportInOffice,
    refreshOfficeState,
    enterGuestHome,
    leaveGuestHome,
    teleportTo,
    updateVisitRoom,
    isVisiting() {
      return Boolean(visit);
    },
    get visitHostId() {
      return visit?.hostId || null;
    },
    get visitHostName() {
      return visit?.hostName || null;
    },
    setReduceMotion(value) {
      reduce = Boolean(value);
    },
    get scene() {
      return scene;
    },
    get officeCourse() {
      return officeCourse;
    },
    get player() {
      return { ...player };
    },
    getContext() {
      return contextSnapshot();
    },
    showChatBubble,
    saveNow() {
      persistPosition(true);
      return saveManager.saveNow(true);
    },
    cleanupSubscription() {
      unsubscribe();
    }
  };
}
