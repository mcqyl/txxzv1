import { initAuth, restoreSession, logout, checkAccess, rememberBan, queueAuthNotice } from './core/auth.js';
import { SaveManager } from './core/save.js';
import { createNetworkAdapter } from './core/net.js';
import { sfx } from './core/audio.js';
import { createHUD } from './ui/hud.js';
import { createPanels } from './ui/panels.js';
import { createLessonRunner } from './ui/lesson.js';
import { createAssistant } from './ui/assistant.js';
import { createSocial } from './ui/social.js';
import { createOfficeSystem } from './ui/officeSystem.js';
import { createGame } from './game/game.js';
import { paletteForName } from './game/sprites.js';

const PREFS_KEY = 'mossbrook.prefs';
const DEFAULT_PREFS = {
  reduceMotion: false,
  hintsHidden: false,
  assistantEnabled: true,
  assistantVoice: true,
  hideOthers: false,
  soundEnabled: true
};

let auth = null;
let session = null;
let moderationExit = false;

function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return { ...DEFAULT_PREFS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function persistPrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* storage is optional */
  }
}

function hideSplash() {
  const splash = document.getElementById('boot-splash');
  if (!splash) return;
  splash.classList.add('is-gone');
  setTimeout(() => splash.remove(), 500);
}

function showLoginError(message) {
  const box = document.getElementById('login-error');
  if (box) box.textContent = message;
}

async function startGame(user) {
  if (session) return;
  const gameScreen = document.getElementById('game-screen');
  const authScreen = document.getElementById('auth-screen');
  authScreen.hidden = true;
  gameScreen.hidden = false;

  try {
    const saveManager = await SaveManager.load(user);
    const prefs = loadPrefs();
    sfx.setEnabled(prefs.soundEnabled !== false);
    let panels = null;
    let lesson = null;
    let assistant = null;
    let social = null;
    let officeSystem = null;
    const net = createNetworkAdapter(saveManager);

    const handleModeration = async (data) => {
      if (moderationExit) return;
      moderationExit = true;
      const banned = data?.action === 'ban';
      const byName = data?.byName || '小镇管理';
      const reason = String(data?.reason || '').trim();
      if (banned) {
        rememberBan({
          playerId: data?.playerId || saveManager.save.multiplayer?.playerId || saveManager.save.userId,
          username: data?.username || saveManager.save.player?.name || user.username,
          reason,
          by: byName
        });
      }
      queueAuthNotice(banned
        ? `你被 ${byName} 封禁了小镇${reason ? `，原因：${reason}` : ''}。这个角色暂时无法登录。`
        : `你被 ${byName} 请出了小镇${reason ? `，原因：${reason}` : ''}。重新登录就可以回来。`);
      try {
        if (session) await session.game.saveNow();
      } catch {
        /* autosave already ran */
      }
      logout();
      window.location.reload();
    };
    const unsubModeration = net.on('moderation', handleModeration);

    const hud = createHUD(saveManager, {
      openOverview: () => panels?.openOverview(),
      openTasks: () => panels?.openTasks(),
      setHintCollapsed: (hidden) => {
        prefs.hintsHidden = hidden;
        persistPrefs(prefs);
      }
    });
    hud.setAvatar(paletteForName(user.username));
    hud.setHintsHidden(Boolean(prefs.hintsHidden));

    panels = createPanels({
      saveManager,
      hud,
      getPrefs: () => ({ ...prefs }),
      setPref: (key, value) => {
        prefs[key] = value;
        persistPrefs(prefs);
        if (key === 'reduceMotion') {
          game?.setReduceMotion(value);
          assistant?.setReduceMotion(value);
        }
        if (key === 'hintsHidden') hud.setHintsHidden(value);
        if (key === 'assistantEnabled') assistant?.setEnabled(value);
        if (key === 'assistantVoice') assistant?.setVoice(value);
        if (key === 'soundEnabled') {
          sfx.setEnabled(value);
          if (value) sfx.click();
        }
        if (key === 'hideOthers') social?.refresh();
      },
      actions: {
        startLesson: (course, lessonId) => lesson?.open(course, lessonId),
        goHome: () => game?.enterHome(),
        assistantTip: (type, detail) => assistant?.notify(type, detail),
        logout: () => shutdown('logout')
      }
    });

    lesson = createLessonRunner({
      saveManager,
      hud,
      panels,
      onAssist: (type, detail) => assistant?.notify(type, detail)
    });

    const game = createGame({
      saveManager,
      hud,
      reduceMotion: Boolean(prefs.reduceMotion),
      handlers: {
        openOverview: () => panels.openOverview(),
        openCourses: () => panels.openCourses(),
        openCourse: (courseId) => panels.openCourse(courseId),
        openTasks: () => panels.openTasks(),
        openMap: () => panels.openMap(),
        openSettings: () => panels.openSettings(),
        assistantTip: (type, detail) => assistant?.notify(type, detail),
        isAssistantChatOpen: () => Boolean(assistant?.isChatOpen()),
        isSocialChatOpen: () => Boolean(social?.isChatOpen()),
        isSocialPanelOpen: () => Boolean(social?.isFriendsOpen()),
        openChat: () => social?.openChat(),
        openFriends: () => social?.openFriends(),
        leaveCabin: () => social?.leaveCabin(),
        enterTower: (courseId) => officeSystem?.enterTower(courseId),
        officeInteract: (it) => officeSystem?.interact(it),
        isOfficeOverlayOpen: () => Boolean(officeSystem?.isOverlayOpen()),
        getChatter: (kind) => officeSystem?.getChatter(kind) || null,
        ensureChatter: (kind) => { officeSystem?.ensureChatter(kind); },
        officeRefresh: () => officeSystem?.updateHud(),
        getPeers: () => net.peers,
        getHideOthers: () => Boolean(prefs.hideOthers),
        onLocalState: (state) => net.setState(state),
        onSceneChange: (scene, visiting) => {
          social?.handleSceneChange(scene, visiting);
          officeSystem?.handleSceneChange(scene);
        }
      }
    });

    officeSystem = createOfficeSystem({
      saveManager,
      hud,
      lesson,
      panels,
      game,
      net
    });

    assistant = createAssistant({
      saveManager,
      getContext: () => ({
        ...game.getContext(),
        lesson: lesson?.getContext() || null,
        social: social?.getContext() || null,
        office: officeSystem?.getOfficeContext() || null
      }),
      getPrefs: () => ({ ...prefs })
    });
    assistant.setEnabled(prefs.assistantEnabled !== false);
    assistant.setVoice(prefs.assistantVoice !== false);

    social = createSocial({
      saveManager,
      hud,
      game,
      net,
      actions: {
        openCourse: (courseId) => panels.openCourse(courseId),
        openFutureCourse: (courseId) => panels.openFutureCourse(courseId)
      },
      getPrefs: () => ({ ...prefs }),
      setPref: (key, value) => {
        prefs[key] = value;
        persistPrefs(prefs);
        if (key === 'hideOthers') social?.refresh();
        if (key === 'soundEnabled') sfx.setEnabled(value);
      }
    });

    const unsubSound = saveManager.on((type) => {
      if (type === 'lesson-complete') sfx.reward();
      else if (type === 'task-claimed') sfx.reward();
      else if (type === 'level-up') sfx.level();
    });

    net.connect().catch((err) => console.warn('[net]', err));

    session = { user, saveManager, hud, panels, lesson, game, assistant, social, officeSystem, net, unsubSound, unsubModeration };
    game.start();
    assistant.start();
    sfx.join();

    if (!saveManager.save.flags.tutorialSeen) {
      panels.openWelcome();
    }
    hideSplash();
  } catch (err) {
    console.error('[boot] 进入小镇失败', err);
    gameScreen.hidden = true;
    auth?.showAuth();
    showLoginError('进入小镇时遇到了一点问题，请刷新页面再试。');
    hideSplash();
  }
}

async function shutdown(reason) {
  if (!session) return;
  const current = session;
  session = null;
  try {
    await current.game.saveNow();
  } catch {
    /* the periodic autosave already ran */
  }
  current.lesson.close();
  current.officeSystem?.destroy();
  current.assistant?.destroy();
  current.social?.destroy();
  current.unsubModeration?.();
  current.unsubSound?.();
  current.game.cleanupSubscription();
  current.game.destroy();
  current.panels.destroy();
  current.hud.destroy();
  try {
    await current.net.disconnect();
  } catch {
    /* local adapter never fails */
  }
  if (reason === 'logout') {
    logout();
    window.location.reload();
    return;
  }
  auth?.showAuth();
}

async function boot() {
  auth = initAuth({ onAuthenticated: (user) => startGame(user) });

  const restored = await restoreSession();
  if (restored) {
    auth.hideAuth();
    const access = await checkAccess(restored);
    if (access.banned) {
      logout();
      auth.showAuth();
      showLoginError(`这个角色被小镇管理封禁了，暂时无法登录。${access.reason ? `原因：${access.reason}` : ''}`);
      hideSplash();
      return;
    }
    await startGame(restored);
  } else {
    hideSplash();
  }
}

boot();
