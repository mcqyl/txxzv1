import { DB } from './db.js';
import { mountAuthBackdrop } from '../ui/authScene.js';

const SESSION_KEY = 'mossbrook.session';
const LAST_USERNAME_KEY = 'mossbrook.lastUsername';
const BAN_CACHE_KEY = 'mossbrook.bannedAccount';
const AUTH_NOTICE_KEY = 'mossbrook.authNotice';

let backdrop = null;
let onAuthenticated = null;
let bound = false;

const b64 = {
  encode(buffer) {
    const bytes = new Uint8Array(buffer);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  },
  decode(str) {
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
};

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function deriveHash(password, saltBytes) {
  if (crypto.subtle) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: saltBytes, iterations: 150000, hash: 'SHA-256' },
      keyMaterial,
      256
    );
    return b64.encode(bits);
  }
  let hash = 2166136261;
  const text = password + ':' + Array.from(saltBytes).join(',');
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 'fnv:' + (hash >>> 0).toString(16);
}

async function createPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveHash(password, salt);
  return { salt: b64.encode(salt), hash };
}

async function verifyPassword(password, saltB64, expected) {
  const hash = await deriveHash(password, b64.decode(saltB64));
  if (hash.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

function validateUsername(username) {
  if (!username) return '给自己起一个名字吧';
  if (username.length < 2 || username.length > 16) return '角色名需要 2–16 个字符';
  if (!/^[\p{L}\p{N}_\-.·]+$/u.test(username)) return '角色名只能包含文字、数字、下划线、点或短横线';
  return '';
}

function validateEmail(email) {
  if (!email) return '';
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? '' : '邮箱格式看起来不正确';
}

function validatePhone(phone) {
  if (!phone) return '';
  return /^\+?\d{7,15}$/.test(phone) ? '' : '手机号格式看起来不正确';
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || '').trim().replace(/[\s-]/g, '');
}

function setError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message || '';
}

function setMode(mode) {
  const tabs = document.querySelectorAll('[data-auth-mode]');
  tabs.forEach((tab) => {
    const active = tab.dataset.authMode === mode;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  const login = document.getElementById('login-form');
  const register = document.getElementById('register-form');
  const isLogin = mode === 'login';
  login.hidden = !isLogin;
  register.hidden = isLogin;
  setError('login-error', '');
  setError('register-error', '');
  const target = isLogin ? document.getElementById('login-username') : document.getElementById('reg-username');
  requestAnimationFrame(() => target?.focus());
}

function setBusy(button, busy, label) {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.querySelector('span')?.textContent || '';
    button.querySelector('span:first-child').textContent = label || '请稍候…';
    button.disabled = true;
    button.style.opacity = '0.7';
  } else {
    if (button.dataset.label) button.querySelector('span:first-child').textContent = button.dataset.label;
    button.disabled = false;
    button.style.opacity = '';
  }
}

function startSession(user) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, at: Date.now() }));
    localStorage.setItem(LAST_USERNAME_KEY, user.username);
  } catch {
    /* storage is optional */
  }
}

function finishAuth(user, isNew) {
  hideAuth();
  onAuthenticated?.(user, isNew);
}

function showAuth(notice = '') {
  const auth = document.getElementById('auth-screen');
  const game = document.getElementById('game-screen');
  auth.hidden = false;
  game.hidden = true;
  backdrop?.show();
  setMode('login');
  if (notice) setError('login-error', notice);
}

function hideAuth() {
  const auth = document.getElementById('auth-screen');
  auth.hidden = true;
  backdrop?.hide();
}

/* ---------------- ban cache ---------------- */

function readBanCache() {
  try {
    return JSON.parse(localStorage.getItem(BAN_CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

function banMatches(record, username, playerId) {
  if (!record) return false;
  if (playerId && record.playerId === playerId) return true;
  if (username && record.username && String(record.username).toLowerCase() === username.toLowerCase()) return true;
  return false;
}

export function rememberBan(info = {}) {
  try {
    localStorage.setItem(BAN_CACHE_KEY, JSON.stringify({
      playerId: info.playerId || '',
      username: info.username || '',
      reason: info.reason || '',
      by: info.by || '',
      at: info.at || new Date().toISOString()
    }));
  } catch {
    /* storage is optional */
  }
}

function clearBanCache(username, playerId) {
  const cached = readBanCache();
  if (banMatches(cached, username, playerId)) {
    try {
      localStorage.removeItem(BAN_CACHE_KEY);
    } catch {
      /* noop */
    }
  }
}

export function queueAuthNotice(message) {
  try {
    sessionStorage.setItem(AUTH_NOTICE_KEY, JSON.stringify({ message, at: Date.now() }));
  } catch {
    /* noop */
  }
}

function consumeAuthNotice() {
  try {
    const raw = sessionStorage.getItem(AUTH_NOTICE_KEY);
    sessionStorage.removeItem(AUTH_NOTICE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data?.message || '';
  } catch {
    return '';
  }
}

async function fetchBanStatus(username, playerId) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);
  try {
    const res = await fetch('/api/auth/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, playerId }),
      signal: controller.signal
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok) return data;
  } catch {
    /* 离线时只依靠本地封禁缓存 */
  } finally {
    clearTimeout(timer);
  }
  return null;
}

async function accessBlocked(username, playerId) {
  const cached = readBanCache();
  const data = await fetchBanStatus(username, playerId);
  if (data?.banned) {
    rememberBan({ playerId, username, reason: data.reason, by: data.by, at: data.at });
    return { banned: true, reason: data.reason || '', by: data.by || '' };
  }
  if (data && data.banned === false) {
    clearBanCache(username, playerId);
    return { banned: false };
  }
  if (banMatches(cached, username, playerId)) {
    return { banned: true, reason: cached.reason || '', by: cached.by || '' };
  }
  return { banned: false };
}

function banMessage(info) {
  const bits = ['这个角色被小镇管理封禁了，暂时无法登录。'];
  if (info.reason) bits.push(`原因：${info.reason}`);
  return bits.join(' ');
}

/* ---------------- accounts ---------------- */

async function createAccount({ username, password, email = '', phone = '' }) {
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = normalizePhone(phone);
  if (cleanEmail) {
    const existing = await DB.findUser('contactLower', cleanEmail);
    if (existing) throw Object.assign(new Error('contact-taken'), { friendly: '这个邮箱已经写在另一个角色上了' });
  }
  if (cleanPhone) {
    const existing = await DB.findUser('contactLower', cleanPhone);
    if (existing) throw Object.assign(new Error('contact-taken'), { friendly: '这个手机号已经写在另一个角色上了' });
  }
  const { salt, hash } = await createPassword(password);
  const user = {
    id: makeId(),
    username,
    usernameLower: username.toLowerCase(),
    email: cleanEmail,
    phone: cleanPhone,
    salt,
    hash,
    createdAt: new Date().toISOString(),
    schema: 2
  };
  const contact = cleanEmail || cleanPhone;
  if (contact) {
    user.contact = cleanEmail || String(phone).trim();
    user.contactLower = contact;
  }
  await DB.addUser(user);
  return user;
}

async function handleRegister(event) {
  event.preventDefault();
  const errorId = 'register-error';
  setError(errorId, '');
  const username = document.getElementById('reg-username').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const password = document.getElementById('reg-password').value;
  const button = document.getElementById('register-submit');

  const usernameError = validateUsername(username);
  if (usernameError) return setError(errorId, usernameError);
  const emailError = validateEmail(normalizeEmail(email));
  if (emailError) return setError(errorId, emailError);
  const phoneError = validatePhone(normalizePhone(phone));
  if (phoneError) return setError(errorId, phoneError);
  if (password.length < 6) return setError(errorId, '密码至少需要 6 位');
  if (password.length > 64) return setError(errorId, '密码太长了，请控制在 64 位以内');

  setBusy(button, true, '正在铺路…');
  try {
    const existingName = await DB.findUser('usernameLower', username.toLowerCase());
    if (existingName) {
      setError(errorId, '这个角色名已经被使用了，换一个试试');
      return;
    }
    const block = await accessBlocked(username, '');
    if (block.banned) {
      setError(errorId, banMessage(block));
      return;
    }
    const user = await createAccount({ username, password, email, phone });
    startSession(user);
    finishAuth(user, true);
  } catch (err) {
    console.error('[auth] 注册失败', err);
    if (err?.friendly) {
      setError(errorId, err.friendly);
    } else if (err?.code === 'constraint' || err?.code === 'contact-taken') {
      setError(errorId, '角色名或联系方式已被占用，换一个试试');
    } else {
      setError(errorId, '创建角色失败，请稍后重试');
    }
  } finally {
    setBusy(button, false);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const errorId = 'login-error';
  setError(errorId, '');
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const button = document.getElementById('login-submit');

  if (!username) return setError(errorId, '请输入角色名（游戏名）');
  const usernameError = validateUsername(username);
  if (usernameError) return setError(errorId, usernameError);
  if (!password) return setError(errorId, '请输入密码');
  if (password.length < 6) return setError(errorId, '密码至少需要 6 位');
  if (password.length > 64) return setError(errorId, '密码太长了');

  setBusy(button, true, '正在进城…');
  try {
    const existing = await DB.findUser('usernameLower', username.toLowerCase());
    const block = await accessBlocked(username, existing?.id || '');
    if (block.banned) {
      setError(errorId, banMessage(block));
      return;
    }
    if (existing) {
      const ok = await verifyPassword(password, existing.salt, existing.hash);
      if (!ok) {
        setError(errorId, '密码不对。这个角色名已经注册过，请确认密码；如果是新玩家，请换一个还没用过的名字。');
        return;
      }
      startSession(existing);
      finishAuth(existing, false);
      return;
    }

    const user = await createAccount({ username, password });
    startSession(user);
    finishAuth(user, true);
  } catch (err) {
    console.error('[auth] 登录失败', err);
    if (err?.friendly) setError(errorId, err.friendly);
    else if (err?.code === 'constraint') setError(errorId, '这个名字刚刚被占用了，换一个再试');
    else setError(errorId, '进入小镇时遇到了问题，请稍后重试');
  } finally {
    setBusy(button, false);
  }
}

export async function restoreSession() {
  let data = null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }
  if (!data?.userId) return null;
  try {
    const user = await DB.getUserById(data.userId);
    if (!user) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export async function checkAccess(user) {
  if (!user) return { banned: false };
  return accessBlocked(user.username || '', user.id || '');
}

export function logout() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

export function initAuth(options) {
  onAuthenticated = options?.onAuthenticated || null;
  backdrop = mountAuthBackdrop(document.getElementById('auth-canvas'));

  if (!bound) {
    bound = true;
    document.querySelectorAll('[data-auth-mode]').forEach((tab) => {
      tab.addEventListener('click', () => setMode(tab.dataset.authMode));
    });
    document.querySelectorAll('[data-eye]').forEach((button) => {
      button.addEventListener('click', () => {
        const input = document.getElementById(button.dataset.eye);
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        button.textContent = show ? '隐藏' : '显示';
        button.setAttribute('aria-label', show ? '隐藏密码' : '显示密码');
      });
    });
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    ['login-username', 'login-password'].forEach((id) => {
      document.getElementById(id).addEventListener('input', () => setError('login-error', ''));
    });
    ['reg-username', 'reg-email', 'reg-phone', 'reg-password'].forEach((id) => {
      document.getElementById(id).addEventListener('input', () => setError('register-error', ''));
    });
  }

  try {
    const last = localStorage.getItem(LAST_USERNAME_KEY);
    if (last) document.getElementById('login-username').value = last;
  } catch {
    /* noop */
  }
  showAuth();
  const notice = consumeAuthNotice();
  if (notice) setError('login-error', notice);

  return { showAuth, hideAuth };
}
