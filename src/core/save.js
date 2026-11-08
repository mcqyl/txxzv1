import { DB } from './db.js';
import { FURNITURE, STARTER_INVENTORY, STARTER_ROOM } from '../data/furniture.js';
import {
  MAINLINE_TASKS, buildDailyTasks, checkinRewards, getMainlineTask, getTaskDef, todayKey
} from '../data/tasks.js';
import { COURSE_MAP } from '../data/courses.js';
import { levelInfo } from '../data/progression.js';

export const SAVE_VERSION = 1;

function uid(prefix = 'item') {
  const rand = crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createDefaultSave(user) {
  const now = new Date().toISOString();
  return {
    version: SAVE_VERSION,
    userId: user.id,
    player: {
      name: user.username,
      x: 48 * 16 + 8,
      y: 34 * 16 + 8,
      scene: 'town',
      officeId: null,
      dir: 'down'
    },
    office: {},
    xp: 0,
    coins: 20,
    inventory: clone(STARTER_INVENTORY),
    room: clone(STARTER_ROOM),
    progress: {},
    tasks: buildDailyTasks(todayKey()),
    flags: {
      tutorialSeen: false,
      northGateOpen: false,
      eastGateOpen: false,
      homeVisited: false,
      completedCourses: {},
      storySeen: {},
      totalLessons: 0,
      totalPlaced: 0,
      townInteractions: 0
    },
    counters: {
      lessonsStarted: 0,
      lessonsCompleted: 0
    },
    checkin: { last: '', streak: 0, total: 0 },
    items: { skipCards: 0 },
    mainline: { claimed: {} },
    createdAt: now,
    updatedAt: now,
    lastPlayedAt: now,
    multiplayer: {
      mode: 'local',
      playerId: user.id,
      roomId: null,
      serverId: null
    }
  };
}

function mergeSave(base, loaded) {
  if (!loaded) return base;
  const out = { ...base, ...loaded };
  out.player = { ...base.player, ...(loaded.player || {}) };
  out.flags = { ...base.flags, ...(loaded.flags || {}) };
  out.counters = { ...base.counters, ...(loaded.counters || {}) };
  out.inventory = { ...base.inventory, ...(loaded.inventory || {}) };
  out.room = {
    ...base.room,
    ...(loaded.room || {}),
    items: Array.isArray(loaded.room?.items) ? loaded.room.items : base.room.items
  };
  out.progress = loaded.progress && typeof loaded.progress === 'object' ? loaded.progress : {};
  out.office = loaded.office && typeof loaded.office === 'object' ? { ...loaded.office } : {};
  out.tasks = loaded.tasks || base.tasks;
  out.checkin = { ...base.checkin, ...(loaded.checkin || {}) };
  out.items = { ...base.items, ...(loaded.items || {}) };
  out.mainline = {
    ...base.mainline,
    ...(loaded.mainline || {}),
    claimed: { ...base.mainline.claimed, ...(loaded.mainline?.claimed || {}) }
  };
  out.multiplayer = { ...base.multiplayer, ...(loaded.multiplayer || {}) };
  out.version = SAVE_VERSION;
  return out;
}

export class SaveManager {
  constructor(user, save) {
    this.user = user;
    this.save = mergeSave(createDefaultSave(user), save);
    this.listeners = new Set();
    this.dirty = false;
    this.saveTimer = null;
    this.saving = false;
    this.ensureDailyTasks(true);
    this.save.lastPlayedAt = new Date().toISOString();
  }

  static async load(user) {
    let stored = null;
    try {
      stored = await DB.getSave(user.id);
    } catch (err) {
      console.warn('[save] 读取存档失败，将创建新存档', err);
    }
    const manager = new SaveManager(user, stored);
    if (!stored) {
      await manager.saveNow(true);
    }
    return manager;
  }

  on(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(type, payload = {}) {
    for (const listener of this.listeners) {
      try {
        listener(type, payload, this);
      } catch (err) {
        console.error('[save] listener error', err);
      }
    }
  }

  get level() {
    return levelInfo(this.save.xp);
  }

  ensureDailyTasks(silent = false) {
    const key = todayKey();
    if (!this.save.tasks || this.save.tasks.date !== key) {
      const oldItems = this.save.tasks?.date === key ? this.save.tasks.items : null;
      this.save.tasks = buildDailyTasks(key, oldItems);
      this.markDirty();
      if (!silent) this.emit('tasks-reset');
      return true;
    }
    return false;
  }

  activeTasks() {
    this.ensureDailyTasks(true);
    const entries = Object.entries(this.save.tasks.items || {});
    return entries
      .map(([id, state]) => {
        const def = getTaskDef(id);
        return def ? { ...def, state } : null;
      })
      .filter(Boolean);
  }

  questSummary() {
    const tasks = this.activeTasks();
    const next = tasks.find((t) => !t.state.claimed && t.state.progress < t.target) ||
      tasks.find((t) => !t.state.claimed);
    if (!next) return null;
    return next;
  }

  bumpTask(event, amount = 1) {
    this.ensureDailyTasks(true);
    let changed = false;
    for (const [id, state] of Object.entries(this.save.tasks.items || {})) {
      const def = getTaskDef(id);
      if (!def || def.event !== event || state.claimed) continue;
      if (state.progress >= def.target) continue;
      state.progress = Math.min(def.target, state.progress + amount);
      changed = true;
    }
    if (changed) {
      this.markDirty();
      this.emit('tasks', { event });
    }
  }

  claimTask(taskId) {
    this.ensureDailyTasks(true);
    const def = getTaskDef(taskId);
    const state = this.save.tasks.items?.[taskId];
    if (!def || !state) return { ok: false, error: '这张任务单不在今天的名单里。' };
    if (state.claimed) return { ok: false, error: '奖励已经领过了。' };
    if (state.progress < def.target) return { ok: false, error: '任务还没有完成。' };
    const before = this.level.level;
    state.claimed = true;
    const xpGain = def.rewards.xp || 0;
    if (xpGain) this.save.xp += xpGain;
    this.save.coins += def.rewards.coins || 0;
    if (def.rewards.furniture) this.addFurniture(def.rewards.furniture, 1, { silent: true });
    const after = this.level.level;
    this.markDirty();
    this.emit('task-claimed', { taskId, rewards: def.rewards });
    this.emit('change', { reason: 'claim' });
    if (after > before) this.emit('level-up', { from: before, to: after, level: after });
    return { ok: true, rewards: def.rewards, levelUps: after - before };
  }

  checkinPreview() {
    const today = todayKey();
    const checkin = this.save.checkin || {};
    const done = checkin.last === today;
    let nextStreak = checkin.streak || 0;
    if (!done) {
      const yesterday = todayKey(new Date(Date.now() - 86400000));
      nextStreak = checkin.last === yesterday ? (checkin.streak || 0) + 1 : 1;
    }
    return {
      done,
      streak: checkin.streak || 0,
      nextStreak,
      total: checkin.total || 0,
      rewards: checkinRewards(nextStreak || 1)
    };
  }

  claimCheckin() {
    const preview = this.checkinPreview();
    if (preview.done) return { ok: false, error: '今天已经签到过了，明天再来吧。' };
    const before = this.level.level;
    const rewards = preview.rewards;
    this.save.checkin = {
      last: todayKey(),
      streak: preview.nextStreak,
      total: (this.save.checkin?.total || 0) + 1
    };
    this.save.coins += rewards.coins;
    this.save.xp += rewards.xp;
    this.addSkipCards(rewards.skipCards, { silent: true });
    if (rewards.furniture) this.addFurniture(rewards.furniture, 1, { silent: true });
    const after = this.level.level;
    this.markDirty();
    this.emit('checkin', { rewards, streak: preview.nextStreak });
    this.emit('change', { reason: 'checkin' });
    if (after > before) this.emit('level-up', { from: before, to: after, level: after });
    return { ok: true, rewards, streak: preview.nextStreak, levelUps: after - before };
  }

  addSkipCards(count = 1, opts = {}) {
    this.save.items ||= {};
    this.save.items.skipCards = (this.save.items.skipCards || 0) + count;
    this.markDirty();
    if (!opts.silent) this.emit('skip-cards', { count });
  }

  skipCardCount() {
    return Math.max(0, Number(this.save.items?.skipCards) || 0);
  }

  mainlineTasks() {
    return MAINLINE_TASKS.map((def) => {
      const course = COURSE_MAP[def.courseId];
      if (!course) return null;
      const done = this.courseDoneCount(course);
      const total = course.lessons.length;
      const claimed = Boolean(this.save.mainline?.claimed?.[def.id]);
      return {
        ...def,
        course,
        done,
        total,
        claimed,
        ready: done >= total && !claimed
      };
    }).filter(Boolean);
  }

  claimMainline(taskId) {
    const def = getMainlineTask(taskId);
    if (!def) return { ok: false, error: '没有找到这条主线任务。' };
    const course = COURSE_MAP[def.courseId];
    if (!course) return { ok: false, error: '这条主线暂时找不到对应的课程。' };
    this.save.mainline ||= { claimed: {} };
    this.save.mainline.claimed ||= {};
    if (this.save.mainline.claimed[taskId]) return { ok: false, error: '这条主线的奖励已经领过了。' };
    const done = this.courseDoneCount(course);
    if (done < course.lessons.length) {
      return { ok: false, error: `还差 ${course.lessons.length - done} 节课，继续加油。` };
    }
    const before = this.level.level;
    this.save.mainline.claimed[taskId] = new Date().toISOString();
    this.save.coins += def.rewards.coins || 0;
    this.save.xp += def.rewards.xp || 0;
    if (def.rewards.skipCards) this.addSkipCards(def.rewards.skipCards, { silent: true });
    if (def.rewards.furniture) this.addFurniture(def.rewards.furniture, 1, { silent: true });
    const after = this.level.level;
    this.markDirty();
    this.emit('mainline-claimed', { taskId, rewards: def.rewards });
    this.emit('change', { reason: 'mainline' });
    if (after > before) this.emit('level-up', { from: before, to: after, level: after });
    return { ok: true, rewards: def.rewards, levelUps: after - before };
  }

  skipLesson(course, lesson) {
    if (this.skipCardCount() <= 0) return { ok: false, error: '行囊里还没有跳关卡。每天签到可以领一张。' };
    const progress = this.save.progress[course.id] || (this.save.progress[course.id] = {});
    if (progress[lesson.id]?.done) return { ok: false, error: '这一课已经完成了。' };
    const timestamp = new Date().toISOString();
    this.save.items.skipCards -= 1;
    progress[lesson.id] = {
      done: true,
      skipped: true,
      attempts: progress[lesson.id]?.attempts || 0,
      completedAt: timestamp,
      lastAt: timestamp
    };
    this.save.counters.lessonsCompleted = (this.save.counters.lessonsCompleted || 0) + 1;
    this.save.flags.totalLessons = (this.save.flags.totalLessons || 0) + 1;
    this.markDirty();
    this.emit('lesson-skip', { course, lesson });
    this.emit('change', { reason: 'skip' });
    return { ok: true, remaining: this.save.items.skipCards };
  }

  addFurniture(id, count = 1, opts = {}) {
    if (!FURNITURE[id]) return false;
    this.save.inventory[id] = (this.save.inventory[id] || 0) + count;
    this.markDirty();
    if (!opts.silent) this.emit('inventory', { id, count });
    return true;
  }

  takeFurniture(id, count = 1) {
    const have = this.save.inventory[id] || 0;
    if (have < count) return false;
    this.save.inventory[id] = have - count;
    if (this.save.inventory[id] <= 0) delete this.save.inventory[id];
    this.markDirty();
    this.emit('inventory', { id, count: -count });
    return true;
  }

  placeFurniture(id, x, y, rot) {
    if ((this.save.inventory[id] || 0) <= 0) return { ok: false, error: '行囊里没有这件家具。' };
    this.takeFurniture(id, 1);
    const item = { uid: uid('room'), id, x, y, rot: rot % 4 };
    this.save.room.items.push(item);
    this.save.flags.totalPlaced = (this.save.flags.totalPlaced || 0) + 1;
    this.bumpTask('furniturePlaced');
    this.markDirty();
    this.emit('room', { action: 'place', item });
    return { ok: true, item };
  }

  removeRoomItem(itemUid) {
    const idx = this.save.room.items.findIndex((i) => i.uid === itemUid);
    if (idx === -1) return { ok: false, error: '没有找到这件家具。' };
    const [item] = this.save.room.items.splice(idx, 1);
    this.addFurniture(item.id, 1, { silent: true });
    this.markDirty();
    this.emit('room', { action: 'remove', item });
    return { ok: true, item };
  }

  setRoomSetting(key, value) {
    this.save.room[key] = value;
    this.markDirty();
    this.emit('room', { action: 'setting', key, value });
  }

  recordTownInteraction() {
    this.save.flags.townInteractions = (this.save.flags.townInteractions || 0) + 1;
    this.bumpTask('townInteract');
    this.markDirty();
  }

  completeLesson(course, lesson) {
    const courseProgress = this.save.progress[course.id] || (this.save.progress[course.id] = {});
    const previous = courseProgress[lesson.id];
    const firstTime = !previous?.done;
    const timestamp = new Date().toISOString();
    courseProgress[lesson.id] = {
      done: true,
      attempts: (previous?.attempts || 0) + 1,
      completedAt: previous?.completedAt || timestamp,
      lastAt: timestamp
    };
    this.save.counters.lessonsCompleted = (this.save.counters.lessonsCompleted || 0) + 1;

    let xpGain = 0;
    let coinGain = 0;
    let item = null;
    let levelUps = 0;
    let courseComplete = false;
    let bonus = null;

    if (firstTime) {
      this.save.flags.totalLessons = (this.save.flags.totalLessons || 0) + 1;
      const before = this.level.level;
      xpGain = lesson.xp || 0;
      coinGain = lesson.coins || 0;
      this.save.xp += xpGain;
      this.save.coins += coinGain;
      if (lesson.rewardItem && FURNITURE[lesson.rewardItem]) {
        this.addFurniture(lesson.rewardItem, 1, { silent: true });
        item = lesson.rewardItem;
      }
      const done = course.lessons.every((l) => courseProgress[l.id]?.done);
      if (done && !this.save.flags.completedCourses[course.id]) {
        courseComplete = true;
        this.save.flags.completedCourses[course.id] = timestamp;
        bonus = { coins: 120, xp: 60 };
        this.save.coins += bonus.coins;
        this.save.xp += bonus.xp;
      }
      const after = this.level.level;
      levelUps = after - before;
      this.bumpTask('lessonComplete', 1);
    } else {
      coinGain = 10;
      this.save.coins += coinGain;
    }

    this.markDirty();
    this.emit('lesson-complete', { course, lesson, firstTime });
    this.emit('change', { reason: 'lesson' });
    if (levelUps > 0) {
      this.emit('level-up', { from: this.level.level - levelUps, to: this.level.level, level: this.level.level });
    }
    return { firstTime, xpGain, coinGain, item, levelUps, courseComplete, bonus };
  }

  isLessonDone(courseId, lessonId) {
    return Boolean(this.save.progress[courseId]?.[lessonId]?.done);
  }

  courseDoneCount(course) {
    const progress = this.save.progress[course.id] || {};
    return course.lessons.filter((l) => progress[l.id]?.done).length;
  }

  markDirty() {
    this.dirty = true;
    this.emit('dirty');
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveNow(), 700);
  }

  async saveNow(force = false) {
    if (this.saving) return;
    if (!this.dirty && !force) return;
    clearTimeout(this.saveTimer);
    this.saving = true;
    this.emit('saving');
    try {
      this.save.updatedAt = new Date().toISOString();
      this.save.player.scene = this.save.player.scene || 'town';
      await DB.putSave(clone(this.save));
      this.dirty = false;
      this.emit('saved', { at: new Date() });
    } catch (err) {
      console.error('[save] 保存失败', err);
      this.emit('save-error', { error: err });
    } finally {
      this.saving = false;
    }
  }

  setPlayerPosition(x, y, dir) {
    this.save.player.x = Math.round(x);
    this.save.player.y = Math.round(y);
    if (dir) this.save.player.dir = dir;
    this.dirty = true;
  }

  setScene(scene, x, y) {
    this.save.player.scene = scene;
    if (Number.isFinite(x)) this.save.player.x = Math.round(x);
    if (Number.isFinite(y)) this.save.player.y = Math.round(y);
    this.markDirty();
  }
}
