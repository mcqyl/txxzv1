import { paletteForName, drawAvatar } from '../game/sprites.js';
import { sfx } from '../core/audio.js';

const CHAT_LIMIT = 120;
const INVITE_WINDOW = 30000;
const TP_WINDOW = 20000;

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

export function createSocial({ saveManager, hud, game, net, getPrefs, setPref, actions = {} }) {
  const els = {
    modeChip: document.querySelector('.mode-chip'),
    netState: document.getElementById('net-state'),
    onlineChip: document.getElementById('online-chip'),
    onlineLabel: document.getElementById('online-label'),
    friendsPanel: document.getElementById('friends-panel'),
    friendsClose: document.getElementById('friends-close'),
    friendsCount: document.getElementById('friends-count'),
    friendsNote: document.getElementById('friends-note'),
    friendsList: document.getElementById('friends-list'),
    friendsFoot: document.getElementById('friends-cabin-action'),
    hideOthers: document.getElementById('hide-others'),
    chatLayer: document.getElementById('chat-layer'),
    chatLog: document.getElementById('chat-log'),
    chatForm: document.getElementById('chat-form'),
    chatInput: document.getElementById('chat-input'),
    chatChannel: document.getElementById('chat-channel'),
    chatCount: document.getElementById('chat-count'),
    invitePop: document.getElementById('invite-pop'),
    inviteFrom: document.getElementById('invite-from'),
    inviteSub: document.getElementById('invite-sub'),
    inviteAccept: document.getElementById('invite-accept'),
    inviteDecline: document.getElementById('invite-decline'),
    inviteTimer: document.getElementById('invite-timer-fill'),
    tpPop: document.getElementById('tp-pop'),
    tpFrom: document.getElementById('tp-from'),
    tpSub: document.getElementById('tp-sub'),
    tpAccept: document.getElementById('tp-accept'),
    tpDecline: document.getElementById('tp-decline'),
    tpTimer: document.getElementById('tp-timer-fill')
  };

  const unsubs = [];
  const outgoing = new Map();
  const history = [];
  let historyIndex = -1;
  let chatOpen = false;
  let friendsOpen = false;
  let logHideTimer = 0;
  let hadOnline = false;
  let wasOnline = false;
  let leavingCabin = false;
  let inviteQueue = [];
  let currentInvite = null;
  let inviteTicker = 0;
  let respondingInvite = false;
  let selectedAction = null;
  let lastVisitStart = { hostId: '', at: 0 };
  let tpQueue = [];
  let currentTp = null;
  let tpTicker = 0;
  let respondingTp = false;
  let destroyed = false;

  const selfId = saveManager.save.multiplayer?.playerId || saveManager.save.userId;
  const selfName = saveManager.save.player.name;

  /* ---------------- chat ---------------- */

  function showChatLog(flash = false) {
    clearTimeout(logHideTimer);
    els.chatLog.classList.add('is-visible');
    if (!chatOpen) {
      logHideTimer = setTimeout(() => {
        if (!chatOpen) els.chatLog.classList.remove('is-visible');
      }, flash ? 8500 : 5000);
    }
  }

  function trimChat() {
    while (els.chatLog.children.length > 60) els.chatLog.firstElementChild.remove();
  }

  function scrollChat() {
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
  }

  function pushChatLine(message) {
    const line = makeEl('div', 'chat-line');
    if (message.fromId === net.playerId) line.classList.add('is-own');
    const name = makeEl('span', 'chat-name', message.name || '旅人');
    line.appendChild(name);
    line.appendChild(document.createTextNode(message.text || ''));
    if (message.scope === 'cabin') {
      line.appendChild(makeEl('span', 'chat-scope', '小屋'));
    }
    els.chatLog.appendChild(line);
    trimChat();
    scrollChat();
    showChatLog(true);
  }

  function pushSystem(text, flash = false) {
    if (!text) return;
    const line = makeEl('div', 'chat-line is-system', text);
    els.chatLog.appendChild(line);
    trimChat();
    if (chatOpen) scrollChat();
    if (flash) showChatLog(false);
  }

  function openChat() {
    if (chatOpen) return;
    closeFriends();
    chatOpen = true;
    els.chatForm.hidden = false;
    els.chatLayer.classList.add('is-open');
    els.chatLog.classList.add('is-visible');
    clearTimeout(logHideTimer);
    els.chatInput.value = '';
    els.chatCount.textContent = `0/${CHAT_LIMIT}`;
    updateChannelLabel();
    if (!els.chatLog.children.length) {
      pushSystem('按 T 打开聊天，Enter 发送，Esc 收起。输入 /help 可以查看指令。');
    }
    showChatLog();
    requestAnimationFrame(() => els.chatInput.focus({ preventScroll: true }));
    sfx.open();
  }

  function closeChat() {
    if (!chatOpen) return;
    chatOpen = false;
    els.chatForm.hidden = true;
    els.chatLayer.classList.remove('is-open');
    els.chatInput.blur();
    showChatLog();
    sfx.close();
  }

  function updateChannelLabel() {
    const inCabin = game.scene === 'home';
    els.chatChannel.textContent = inCabin ? '小镇 · 小屋' : '小镇 · 大厅';
    els.chatChannel.classList.toggle('is-cabin', inCabin);
  }

  const COMMAND_HELP = [
    '可用指令：/hub 回大厅 · /home 回小屋 · /python · /c · /java 打开课程页面',
    '/tp 玩家名 请求传送 · /tp 玩家1 玩家2（管理员）· /op 玩家名（管理员）· /getop 密码',
    '/kick 玩家名 [理由]（管理员）· /ban 玩家名 [理由]（管理员，封禁后无法登录）'
  ].join('\n');

  function resolvePlayer(token) {
    const raw = String(token || '').replace(/^@/, '').trim();
    if (!raw) return null;
    const pool = [...(net.townPlayers || []), ...(net.peers || [])];
    const lower = raw.toLowerCase();
    return pool.find((peer) => peer.id === raw) ||
      pool.find((peer) => String(peer.name || '').toLowerCase() === lower) ||
      null;
  }

  function commandFail(text) {
    pushSystem(text, true);
    hud.toast(text, 'warn');
    sfx.error();
  }

  async function commandHub() {
    if (game.isVisiting()) {
      pushSystem('先离开朋友的小屋，回到大厅。', true);
      await leaveCabin();
      return;
    }
    if (game.scene === 'home') {
      game.exitHome();
      pushSystem('你推开小屋的门，回到了小镇大厅。', true);
      return;
    }
    hud.toast('你已经在小镇大厅了。');
  }

  async function commandHome() {
    if (game.isVisiting()) {
      pushSystem('你先离开了朋友的小屋，再回自己的房间。', true);
      await leaveCabin();
      setTimeout(() => game.enterHome(), 520);
      return;
    }
    if (game.scene === 'home') {
      hud.toast('这里就是你的小屋。');
      return;
    }
    closeFriends();
    game.enterHome();
    pushSystem('你回到了自己的小屋。', true);
  }

  async function commandTeleport(args) {
    if (!net.connected) {
      commandFail('还没连上小镇，传送指令暂时用不了。');
      return;
    }
    if (!args.length) {
      commandFail('用法：/tp 玩家名；管理员可以用 /tp 玩家1 玩家2 或 /op 玩家名。');
      return;
    }
    if (args.length >= 2) {
      if (!net.admin) {
        commandFail('只有管理员可以把玩家1传送到玩家2身边。');
        return;
      }
      const from = resolvePlayer(args[0]);
      const to = resolvePlayer(args[1]);
      if (!from || !to) {
        commandFail('没找到这两位玩家，确认名字后再试。');
        return;
      }
      try {
        const result = await net.forceTeleport(from.id, to.id);
        const text = `你把 ${result.fromName} 传送到了 ${result.toName} 身边。`;
        pushSystem(text, true);
        hud.toast(text, 'reward');
        sfx.accept();
      } catch (err) {
        commandFail(err.message || '强制传送没有成功。');
      }
      return;
    }
    const target = resolvePlayer(args[0]);
    if (!target || target.id === net.playerId) {
      commandFail(`没有在大厅里找到「${args[0]}」。`);
      return;
    }
    try {
      const result = await net.requestTeleport(target.id);
      if (result.teleported) {
        const text = `管理员传送：你来到了 ${result.toName} 身边。`;
        pushSystem(text, true);
        hud.toast(text, 'reward');
        sfx.accept();
      } else {
        const text = `传送请求已发给 ${result.toName}，等 TA 同意。`;
        pushSystem(text, true);
        hud.toast(text);
        sfx.invite();
      }
    } catch (err) {
      commandFail(err.message || '传送请求没有发出去。');
    }
  }

  async function commandOp(targetToken) {
    if (!net.connected) {
      commandFail('还没连上小镇。');
      return;
    }
    if (!net.admin) {
      commandFail('只有管理员可以使用 /op。');
      return;
    }
    const target = resolvePlayer(targetToken);
    if (!target) {
      commandFail(`没有找到在线玩家「${targetToken || ''}」。`);
      return;
    }
    try {
      const result = await net.grantOp(target.id);
      if (result.already) {
        hud.toast(`${result.targetName} 已经是管理员了。`);
      } else {
        const text = `已把管理员权限授予 ${result.targetName}。`;
        pushSystem(text, true);
        hud.toast(text, 'reward');
        sfx.accept();
      }
    } catch (err) {
      commandFail(err.message || '授予权限失败。');
    }
  }

  async function commandGetOp(password) {
    if (!net.connected) {
      commandFail('还没连上小镇。');
      return;
    }
    if (net.admin) {
      hud.toast('你已经是管理员了。');
      return;
    }
    if (!password) {
      commandFail('用法：/getop 密码');
      return;
    }
    try {
      await net.getOp(password);
      hud.setAdmin?.(true);
      const text = '口令正确，你现在是小镇管理员。';
      pushSystem(text, true);
      hud.toast(text, 'reward');
      sfx.accept();
    } catch (err) {
      commandFail(err.message || '密码不对。');
    }
  }

  async function commandModerate(action, args) {
    const label = action === 'ban' ? '/ban' : '/kick';
    if (!net.connected) {
      commandFail('还没连上小镇。');
      return;
    }
    if (!net.admin) {
      commandFail(`只有管理员可以使用 ${label}。`);
      return;
    }
    if (!args.length) {
      commandFail(`用法：${label} 玩家名 [理由]`);
      return;
    }
    const target = resolvePlayer(args[0]);
    if (!target) {
      commandFail(`没有找到在线玩家「${args[0]}」。`);
      return;
    }
    if (target.id === net.playerId) {
      commandFail('不能对自己使用这条指令。');
      return;
    }
    const reason = args.slice(1).join(' ').slice(0, 60);
    try {
      const result = action === 'ban'
        ? await net.ban(target.id, reason)
        : await net.kick(target.id, reason);
      const targetName = result.targetName || target.name;
      const text = action === 'ban'
        ? `已封禁 ${targetName}${reason ? `（${reason}）` : ''}，这个角色暂时无法登录小镇。`
        : `已把 ${targetName} 踢出小镇${reason ? `（${reason}）` : ''}。`;
      pushSystem(text, true);
      hud.toast(text, 'reward');
      sfx.accept();
    } catch (err) {
      commandFail(err.message || `${label} 没有成功。`);
    }
  }

  async function runCommand(raw) {
    const tokens = raw.trim().split(/\s+/);
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);
    switch (cmd) {
      case '/help':
        for (const line of COMMAND_HELP.split('\n')) pushSystem(line, true);
        break;
      case '/hub':
        await commandHub();
        break;
      case '/home':
        await commandHome();
        break;
      case '/python':
        closeFriends();
        actions.openCourse?.('python');
        break;
      case '/c':
        closeFriends();
        actions.openFutureCourse?.('c');
        break;
      case '/java':
        closeFriends();
        actions.openFutureCourse?.('java');
        break;
      case '/tp':
        await commandTeleport(args);
        break;
      case '/op':
        await commandOp(args[0]);
        break;
      case '/getop':
        await commandGetOp(args[0]);
        break;
      case '/kick':
        await commandModerate('kick', args);
        break;
      case '/ban':
        await commandModerate('ban', args);
        break;
      default:
        commandFail(`没有找到 ${cmd} 这条指令。输入 /help 看看能做什么。`);
    }
  }

  async function sendChat(text) {
    const message = String(text || '').trim().slice(0, CHAT_LIMIT);
    if (!message) return;
    if (message.startsWith('/')) {
      els.chatInput.value = '';
      els.chatCount.textContent = `0/${CHAT_LIMIT}`;
      closeChat();
      await runCommand(message);
      return;
    }
    if (!net.connected) {
      pushSystem('还没连上小镇，等连上以后再发一次吧。', true);
      sfx.error();
      return;
    }
    try {
      await net.sendChat(message);
      history.push(message);
      if (history.length > 30) history.shift();
      historyIndex = -1;
      els.chatInput.value = '';
      els.chatCount.textContent = `0/${CHAT_LIMIT}`;
      game.showChatBubble?.({ fromId: net.playerId, name: selfName, text: message });
      closeChat();
      sfx.chat();
    } catch (err) {
      pushSystem(err.message || '这句话没有送出去。', true);
      hud.toast(err.message || '这句话没有送出去。', 'warn');
      sfx.error();
    }
  }

  function chatHistory(step) {
    if (!history.length) return;
    if (historyIndex === -1) historyIndex = history.length;
    historyIndex = Math.max(0, Math.min(history.length - 1, historyIndex + step));
    els.chatInput.value = history[historyIndex] || '';
    els.chatCount.textContent = `${els.chatInput.value.length}/${CHAT_LIMIT}`;
    requestAnimationFrame(() => {
      els.chatInput.setSelectionRange(els.chatInput.value.length, els.chatInput.value.length);
    });
  }

  /* ---------------- chip / network state ---------------- */

  function refreshChips() {
    const visiting = game.isVisiting();
    const inOwnHome = game.scene === 'home' && !visiting;
    const cabin = net.cabin;
    if (els.modeChip) els.modeChip.classList.toggle('is-offline', !net.connected);
    if (els.netState) els.netState.textContent = net.connected ? '小镇联机' : '正在重连…';
    if (!els.onlineChip) return;
    els.onlineChip.classList.toggle('is-visiting', visiting || inOwnHome);
    if (!net.connected) {
      els.onlineLabel.textContent = '正在连上小镇…';
      els.onlineChip.classList.remove('has-no-one');
      return;
    }
    if (visiting) {
      els.onlineLabel.textContent = `${cabin?.hostName || game.visitHostName || '朋友'}的小屋 · ${cabin?.count || 2} 人`;
      els.onlineChip.classList.remove('has-no-one');
    } else if (inOwnHome) {
      els.onlineLabel.textContent = `我的小屋 · ${cabin?.count || 1} 人`;
      els.onlineChip.classList.remove('has-no-one');
    } else {
      els.onlineLabel.textContent = `小镇 · ${net.online} 人在线`;
      els.onlineChip.classList.toggle('has-no-one', net.online <= 1);
    }
    if (friendsOpen) renderFriends();
  }

  /* ---------------- friends panel ---------------- */

  function makeAvatar(name) {
    const canvas = document.createElement('canvas');
    canvas.className = 'friend-avatar';
    canvas.width = 16;
    canvas.height = 16;
    drawAvatar(canvas, paletteForName(name || '旅人'));
    return canvas;
  }

  function friendRow({ name, location, self = false, host = false, admin = false, actionLabel = '', action = null, pending = false }) {
    const row = makeEl('div', `friend-row${self ? ' is-self' : ''}${host ? ' is-host' : ''}`);
    row.appendChild(makeAvatar(name));
    const copy = makeEl('div', 'friend-copy');
    const nameEl = makeEl('span', 'friend-name', name + (self ? '（你）' : ''));
    if (admin) nameEl.appendChild(makeEl('i', 'friend-op', 'OP'));
    copy.appendChild(nameEl);
    copy.appendChild(makeEl('span', `friend-loc${host || location.includes('小屋') ? ' is-cabin' : ''}`, location));
    row.appendChild(copy);
    if (actionLabel) {
      const button = makeEl('button', `friend-action${pending ? ' is-pending' : ''}`, actionLabel);
      button.type = 'button';
      if (pending) button.disabled = true;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        action?.(button);
      });
      row.appendChild(button);
    }
    return row;
  }

  function renderFriends() {
    if (!friendsOpen || destroyed) return;
    const visiting = game.isVisiting();
    const inOwnHome = game.scene === 'home' && !visiting;
    const cabin = net.cabin;
    const selfLocation = visiting
      ? `做客 · ${cabin?.hostName || game.visitHostName || ''}的小屋`
      : inOwnHome ? '我的小屋 · 主人' : '大厅';
    els.hideOthers.checked = Boolean(getPrefs().hideOthers);

    let header = '正在重连…';
    if (net.connected) {
      header = visiting || inOwnHome ? `${cabin?.count || 1} 人在小屋` : `${net.online} 人在大厅`;
    }
    els.friendsCount.textContent = header;

    if (!net.connected) {
      els.friendsNote.textContent = '联机服务正在重连。你可以先在小镇里走走，聊天和串门会自动恢复。';
    } else if (visiting) {
      els.friendsNote.textContent = `你在 ${cabin?.hostName || game.visitHostName || '朋友'} 的小屋做客。按 E 看看家具，T 和小镇聊天。`;
    } else if (inOwnHome) {
      els.friendsNote.textContent = cabin && cabin.count > 1
        ? `${cabin.count - 1} 位朋友正在你的小屋里。`
        : '从下方在线朋友旁点「邀请」，请 TA 来小屋坐坐。';
    } else {
      els.friendsNote.textContent = '回到自己的小屋后，就能邀请在线朋友来串门。现在也可以按 T 和大家聊天。';
    }

    els.friendsList.innerHTML = '';
    els.friendsList.appendChild(friendRow({ name: selfName, location: selfLocation, self: true, admin: Boolean(net.admin) }));

    if (visiting) {
      for (const peer of net.peers) {
        if (peer.scene !== 'home') continue;
        const isHost = !peer.hostName;
        els.friendsList.appendChild(friendRow({
          name: peer.name,
          location: isHost ? '主人 · 小屋' : '一起做客',
          host: isHost,
          admin: peer.admin
        }));
      }
    } else if (inOwnHome) {
      for (const peer of net.peers) {
        if (peer.scene !== 'home') continue;
        els.friendsList.appendChild(friendRow({ name: peer.name, location: '客人 · 小屋', admin: peer.admin }));
      }
      for (const peer of net.townPlayers || []) {
        if (peer.id === selfId) continue;
        const pending = outgoing.has(peer.name);
        const action = net.connected ? (button) => invitePlayer(peer, button) : null;
        els.friendsList.appendChild(friendRow({
          name: peer.name,
          location: '大厅',
          admin: peer.admin,
          actionLabel: pending ? '等回复…' : '邀请',
          action,
          pending
        }));
      }
    } else {
      for (const peer of net.townPlayers || []) {
        if (peer.id === selfId) continue;
        els.friendsList.appendChild(friendRow({ name: peer.name, location: '大厅', admin: peer.admin }));
      }
    }

    if (els.friendsList.children.length <= 1) {
      els.friendsList.appendChild(makeEl('div', 'friend-empty',
        net.connected ? '大厅里暂时只有你。等朋友上线，或者去小屋布置一下。' : '正在寻找小镇里的其他旅人…'));
    }

    const guestCount = cabin ? Math.max(0, cabin.count - 1) : 0;
    if (visiting) {
      els.friendsFoot.hidden = false;
      els.friendsFoot.textContent = '离开小屋';
      selectedAction = 'leave';
    } else if (inOwnHome && guestCount > 0) {
      els.friendsFoot.hidden = false;
      els.friendsFoot.textContent = `结束串门（${guestCount} 位客人）`;
      selectedAction = 'end';
    } else {
      els.friendsFoot.hidden = true;
      selectedAction = null;
    }
  }

  function openFriends() {
    if (friendsOpen) {
      closeFriends();
      return;
    }
    closeChat();
    friendsOpen = true;
    els.friendsPanel.hidden = false;
    renderFriends();
    sfx.open();
  }

  function closeFriends() {
    if (!friendsOpen) return;
    friendsOpen = false;
    els.friendsPanel.hidden = true;
  }

  async function invitePlayer(peer, button) {
    if (!net.connected) {
      hud.toast('还没有连上小镇，稍等一下再邀请。', 'warn');
      sfx.error();
      return;
    }
    if (!(game.scene === 'home' && !game.isVisiting())) {
      hud.toast('回到自己的小屋后，才能邀请朋友。', 'warn');
      sfx.error();
      return;
    }
    if (button) {
      button.disabled = true;
      button.textContent = '邀请中…';
    }
    try {
      await net.syncRoom(saveManager.save.room);
      await net.invite(peer.id);
      outgoing.set(peer.name, Date.now());
      setTimeout(() => {
        if (outgoing.has(peer.name) && Date.now() - outgoing.get(peer.name) > INVITE_WINDOW) {
          outgoing.delete(peer.name);
          if (friendsOpen) renderFriends();
        }
      }, INVITE_WINDOW + 1500);
      pushSystem(`邀请了 ${peer.name} 来小屋做客。`);
      hud.toast(`邀请已发给 ${peer.name}，等 TA 回复。`);
      sfx.invite();
    } catch (err) {
      hud.toast(err.message || '邀请没有发出去。', 'warn');
      pushSystem(err.message || '邀请没有发出去。');
      sfx.error();
    }
    if (friendsOpen) renderFriends();
  }

  async function leaveCabin() {
    if (leavingCabin) return;
    leavingCabin = true;
    try {
      await net.leaveCabin();
      game.leaveGuestHome('self');
      closeFriends();
      pushSystem('你从小屋回到了大厅。');
      hud.toast('回到大厅啦。');
      sfx.close();
    } catch (err) {
      hud.toast(err.message || '暂时离不开小屋。', 'warn');
      sfx.error();
    } finally {
      leavingCabin = false;
    }
  }

  async function endVisits() {
    if (!net.connected) {
      hud.toast('还没有连上小镇。', 'warn');
      return;
    }
    try {
      const result = await net.endVisits();
      closeFriends();
      if (result.count > 0) {
        hud.toast('串门结束了，客人们回到了大厅。');
        pushSystem('你结束了这次串门。');
        sfx.close();
      } else {
        hud.toast('小屋里暂时没有客人。');
      }
    } catch (err) {
      hud.toast(err.message || '没能结束串门。', 'warn');
      sfx.error();
    }
    refreshChips();
  }

  /* ---------------- invites ---------------- */

  function inviteSub(invite) {
    const count = Number(invite.itemCount) || 0;
    return count > 0 ? `小屋里有 ${count} 件家具，想请你去坐一会儿。` : '小屋刚收拾好，想请你去坐一会儿。';
  }

  function showNextInvite() {
    if (currentInvite || !inviteQueue.length || destroyed) return;
    currentInvite = inviteQueue.shift();
    respondingInvite = false;
    els.inviteAccept.disabled = false;
    els.inviteDecline.disabled = false;
    els.inviteAccept.textContent = '去坐坐';
    els.inviteDecline.textContent = '谢绝';
    els.inviteFrom.textContent = currentInvite.fromName || '朋友';
    els.inviteSub.textContent = inviteSub(currentInvite);
    els.invitePop.hidden = false;
    updateInviteTimer();
    clearInterval(inviteTicker);
    inviteTicker = setInterval(updateInviteTimer, 200);
    sfx.invite();
  }

  function updateInviteTimer() {
    if (!currentInvite) return;
    const remaining = Math.max(0, currentInvite.expiresAt - Date.now());
    els.inviteTimer.style.transform = `scaleX(${Math.min(1, remaining / INVITE_WINDOW)})`;
    if (remaining <= 0) {
      const fromName = currentInvite.fromName;
      hideInvite();
      pushSystem(`${fromName} 的邀请已经过期了。`);
    }
  }

  function hideInvite(resume = true) {
    clearInterval(inviteTicker);
    inviteTicker = 0;
    currentInvite = null;
    els.invitePop.hidden = true;
    if (resume) setTimeout(showNextInvite, 400);
  }

  function receiveInvite(invite) {
    if (!invite?.id) return;
    if (currentInvite?.id === invite.id || inviteQueue.some((item) => item.id === invite.id)) return;
    inviteQueue.push(invite);
    showNextInvite();
  }

  async function respondToInvite(accept) {
    if (!currentInvite || respondingInvite) return;
    const invite = currentInvite;
    respondingInvite = true;
    els.inviteAccept.disabled = true;
    els.inviteDecline.disabled = true;
    els.inviteAccept.textContent = accept ? '正在过去…' : '谢绝中…';
    if (accept) sfx.accept();
    else sfx.click();
    try {
      const result = await net.respondInvite(invite.id, accept);
      hideInvite();
      if (accept) {
        if (result.visit) enterVisit(result.visit);
        pushSystem(`你接受了 ${invite.fromName} 的邀请。`, true);
      } else {
        pushSystem(`你谢绝了 ${invite.fromName} 的串门邀请。`, true);
      }
    } catch (err) {
      hideInvite();
      hud.toast(err.message || '邀请没有回应成功。', 'warn');
      pushSystem(err.message || '邀请没有回应成功。', true);
      sfx.error();
    }
  }

  /* ---------------- teleport requests ---------------- */

  function showNextTp() {
    if (currentTp || !tpQueue.length || destroyed) return;
    currentTp = tpQueue.shift();
    respondingTp = false;
    els.tpAccept.disabled = false;
    els.tpDecline.disabled = false;
    els.tpAccept.textContent = '同意';
    els.tpDecline.textContent = '拒绝';
    els.tpFrom.textContent = currentTp.fromName || '朋友';
    els.tpSub.textContent = `${currentTp.fromName || '朋友'} 想传送到你身边，同意后会出现在你旁边。`;
    els.tpPop.hidden = false;
    updateTpTimer();
    clearInterval(tpTicker);
    tpTicker = setInterval(updateTpTimer, 200);
    sfx.invite();
    showChatLog(false);
  }

  function updateTpTimer() {
    if (!currentTp) return;
    const remaining = Math.max(0, currentTp.expiresAt - Date.now());
    els.tpTimer.style.transform = `scaleX(${Math.min(1, remaining / TP_WINDOW)})`;
    if (remaining <= 0) {
      const fromName = currentTp.fromName;
      hideTp();
      pushSystem(`${fromName} 的传送请求过期了。`, true);
    }
  }

  function hideTp(resume = true) {
    clearInterval(tpTicker);
    tpTicker = 0;
    currentTp = null;
    els.tpPop.hidden = true;
    if (resume) setTimeout(showNextTp, 400);
  }

  function receiveTpRequest(request) {
    if (!request?.id) return;
    if (currentTp?.id === request.id || tpQueue.some((item) => item.id === request.id)) return;
    tpQueue.push(request);
    showNextTp();
  }

  async function respondToTp(accept) {
    if (!currentTp || respondingTp) return;
    const request = currentTp;
    respondingTp = true;
    els.tpAccept.disabled = true;
    els.tpDecline.disabled = true;
    els.tpAccept.textContent = accept ? '正在拉人…' : '拒绝中…';
    if (accept) sfx.accept();
    else sfx.click();
    try {
      const result = await net.respondTeleport(request.id, accept);
      hideTp();
      if (accept) {
        pushSystem(`你同意了 ${request.fromName} 的传送请求。`, true);
        hud.toast(`${request.fromName} 马上就到。`);
      } else {
        pushSystem(`你拒绝了 ${request.fromName} 的传送请求。`, true);
      }
    } catch (err) {
      hideTp();
      hud.toast(err.message || '传送请求没有回应成功。', 'warn');
      pushSystem(err.message || '传送请求没有回应成功。', true);
      sfx.error();
    }
  }

  function enterVisit(payload) {
    if (!payload?.hostId) return;
    if (game.isVisiting() && game.visitHostId === payload.hostId) {
      game.updateVisitRoom(payload.room);
      return;
    }
    if (game.isVisiting()) return;
    // SSE and the invite response both deliver visit-start; ignore the echo during the fade-in
    if (lastVisitStart.hostId === payload.hostId && Date.now() - lastVisitStart.at < 1500) return;
    lastVisitStart = { hostId: payload.hostId, at: Date.now() };
    hideInvite(false);
    closeFriends();
    closeChat();
    game.enterGuestHome(payload);
    pushSystem(`你来到 ${payload.hostName || '朋友'} 的小屋做客。按 E 看看家具。`);
    hud.toast(`来做客啦：${payload.hostName || '朋友'}的小屋`, 'reward');
    sfx.join();
    refreshChips();
  }

  /* ---------------- wiring ---------------- */

  function bindChat() {
    els.chatForm.addEventListener('submit', (event) => {
      event.preventDefault();
      sendChat(els.chatInput.value);
    });
    els.chatInput.addEventListener('input', () => {
      els.chatCount.textContent = `${els.chatInput.value.length}/${CHAT_LIMIT}`;
    });
    els.chatInput.addEventListener('keydown', (event) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeChat();
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        chatHistory(-1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        chatHistory(1);
      }
    });
  }

  function bindFriends() {
    els.onlineChip.addEventListener('click', openFriends);
    els.friendsClose.addEventListener('click', () => {
      closeFriends();
      sfx.close();
    });
    els.hideOthers.addEventListener('change', () => {
      setPref('hideOthers', els.hideOthers.checked);
      hud.toast(els.hideOthers.checked ? '现在看不到其他玩家了。' : '又能看到小镇里的大家了。');
      sfx.click();
    });
    els.friendsFoot.addEventListener('click', () => {
      if (selectedAction === 'leave') leaveCabin();
      else if (selectedAction === 'end') endVisits();
    });
    els.inviteAccept.addEventListener('click', () => respondToInvite(true));
    els.inviteDecline.addEventListener('click', () => respondToInvite(false));
    els.tpAccept.addEventListener('click', () => respondToTp(true));
    els.tpDecline.addEventListener('click', () => respondToTp(false));
  }

  unsubs.push(net.on('snapshot', () => {
    refreshChips();
    if (friendsOpen) renderFriends();
  }));
  unsubs.push(net.on('status', () => {
    refreshChips();
    if (friendsOpen) renderFriends();
  }));
  unsubs.push(net.on('connected', () => {
    wasOnline = true;
    hud.setAdmin?.(Boolean(net.admin));
    refreshChips();
    if (hadOnline) pushSystem('重新连上了小镇。');
    else {
      pushSystem(`已连上小镇，现在有 ${net.online} 位旅人在大厅。`);
      hadOnline = true;
    }
    sfx.join();
    if (game.scene === 'home' && !game.isVisiting()) net.queueRoom(saveManager.save.room);
  }));
  unsubs.push(net.on('disconnected', () => {
    wasOnline = false;
    refreshChips();
  }));
  unsubs.push(net.on('chat', (message) => {
    if (!message) return;
    pushChatLine(message);
    game.showChatBubble?.(message);
    if (message.fromId !== net.playerId) sfx.message();
  }));
  unsubs.push(net.on('invite', (invite) => receiveInvite(invite)));
  unsubs.push(net.on('invite-closed', (data) => {
    if (!data) return;
    if (currentInvite && currentInvite.id === data.inviteId) hideInvite();
    if (data.toName) {
      outgoing.delete(data.toName);
      const labels = {
        accepted: `${data.toName} 接受了邀请，马上就来。`,
        declined: `${data.toName} 谢绝了这次邀请。`,
        expired: `发给 ${data.toName} 的邀请过期了。`,
        'host-left': `你离开了小屋，发给 ${data.toName} 的邀请自动取消。`,
        'host-busy': '你已经在招待别的客人，另一份邀请自动取消了。'
      };
      if (labels[data.reason]) hud.toast(labels[data.reason]);
      if (data.reason === 'accepted') sfx.accept();
      if (friendsOpen) renderFriends();
    }
    if (data.fromName && data.reason === 'host-left') {
      pushSystem(`${data.fromName} 离开了小屋，邀请已取消。`);
    }
  }));
  unsubs.push(net.on('visit-start', (payload) => enterVisit(payload)));
  unsubs.push(net.on('visit-end', (payload) => {
    if (leavingCabin) return;
    if (game.isVisiting()) game.leaveGuestHome(payload?.reason || 'left');
    closeFriends();
    refreshChips();
  }));
  unsubs.push(net.on('visit-lost', () => {
    if (game.isVisiting()) game.leaveGuestHome('lost');
    closeFriends();
    refreshChips();
  }));
  unsubs.push(net.on('visit-room', ({ room }) => {
    if (game.isVisiting()) game.updateVisitRoom(room);
  }));
  unsubs.push(net.on('visitor-joined', (data) => {
    if (!data?.name) return;
    const host = game.scene === 'home' && !game.isVisiting();
    pushSystem(host ? `${data.name} 来你的小屋串门了。` : `${data.name} 也来做客了。`);
    hud.toast(host ? `${data.name} 来串门啦。` : `${data.name} 也来到小屋做客。`, 'reward');
    sfx.message();
    refreshChips();
  }));
  unsubs.push(net.on('visitor-left', (data) => {
    if (!data?.name) return;
    pushSystem(`${data.name} 离开了小屋。`);
    refreshChips();
  }));
  unsubs.push(net.on('town-event', (data) => {
    if (!data?.name) return;
    if (data.kind === 'join') pushSystem(`${data.name} 来到了小镇。`);
    else if (data.kind === 'leave') pushSystem(`${data.name} 离开了小镇。`);
  }));
  unsubs.push(net.on('invite-sent', () => {
    if (friendsOpen) renderFriends();
  }));
  unsubs.push(net.on('tp-request', (request) => receiveTpRequest(request)));
  unsubs.push(net.on('tp-closed', (data) => {
    if (!data) return;
    if (currentTp && currentTp.id === data.requestId) hideTp();
    const labels = {
      declined: `${data.toName || '对方'}谢绝了你的传送请求。`,
      expired: `发给 ${data.toName || '对方'} 的传送请求过期了。`,
      'from-left': '传送请求因为对方离开小镇而取消。',
      'to-left': '传送请求因为目标离开小镇而取消。',
      'from-busy': '对方已经不在大厅，传送请求取消。',
      'to-busy': '目标已经不在大厅，传送请求取消。'
    };
    if (data.toName && labels[data.reason]) {
      pushSystem(labels[data.reason], true);
      if (data.reason === 'declined' || data.reason === 'expired') hud.toast(labels[data.reason]);
    }
  }));
  unsubs.push(net.on('teleport', (data) => {
    closeChat();
    closeFriends();
    hideTp(false);
    game.teleportTo(data);
    const by = data?.admin && data?.byName ? `${data.byName}（管理员）` : (data?.byName || '一位管理员');
    const text = `${by} 把你传送到了 ${data?.toName || '朋友'} 身边。`;
    pushSystem(text, true);
    hud.toast(text);
    sfx.join();
    refreshChips();
  }));
  unsubs.push(net.on('teleport-arrive', (data) => {
    if (!data?.name) return;
    const text = `${data.name} 被传送到了你身边。`;
    pushSystem(text, true);
    hud.toast(text);
    sfx.message();
  }));
  unsubs.push(net.on('admin-granted', (data) => {
    hud.setAdmin(true);
    const text = data?.byName && data.byName !== '小镇口令'
      ? `${data.byName} 给了你小镇管理员权限。`
      : '你获得了小镇管理员权限。';
    pushSystem(`${text} 试试 /help 看看管理员指令。`, true);
    hud.toast(text, 'reward');
    sfx.level();
    if (friendsOpen) renderFriends();
  }));

  const onDocumentKey = (event) => {
    if (event.code !== 'Escape') return;
    if (friendsOpen) {
      event.preventDefault();
      closeFriends();
      sfx.close();
    } else if (chatOpen && document.activeElement !== els.chatInput) {
      event.preventDefault();
      closeChat();
    }
  };
  const onDocumentDown = (event) => {
    if (!friendsOpen) return;
    if (els.friendsPanel.contains(event.target) || els.onlineChip.contains(event.target)) return;
    closeFriends();
  };
  document.addEventListener('keydown', onDocumentKey);
  document.addEventListener('pointerdown', onDocumentDown);

  const unsubRoom = saveManager.on((type) => {
    if (type !== 'room') return;
    if (game.scene === 'home' && !game.isVisiting()) net.queueRoom(saveManager.save.room);
  });

  bindChat();
  bindFriends();
  refreshChips();

  return {
    openChat,
    closeChat,
    openFriends,
    closeFriends,
    leaveCabin,
    isChatOpen() {
      return chatOpen;
    },
    isFriendsOpen() {
      return friendsOpen;
    },
    isUiOpen() {
      return chatOpen || friendsOpen;
    },
    handleSceneChange(scene, visiting) {
      updateChannelLabel();
      if (scene === 'home' && !visiting) net.queueRoom(saveManager.save.room);
      refreshChips();
      if (friendsOpen) renderFriends();
    },
    refresh() {
      refreshChips();
      if (friendsOpen) renderFriends();
    },
    getContext() {
      return {
        connected: net.connected,
        online: net.online,
        total: net.total,
        visiting: game.isVisiting() ? { hostName: game.visitHostName } : null,
        visitors: net.cabin && !game.isVisiting() ? Math.max(0, net.cabin.count - 1) : 0,
        chatOpen
      };
    },
    destroy() {
      destroyed = true;
      clearTimeout(logHideTimer);
      clearInterval(inviteTicker);
      clearInterval(tpTicker);
      for (const unsub of unsubs) unsub();
      unsubRoom();
      document.removeEventListener('keydown', onDocumentKey);
      document.removeEventListener('pointerdown', onDocumentDown);
      els.invitePop.hidden = true;
      els.tpPop.hidden = true;
      els.friendsPanel.hidden = true;
      els.chatForm.hidden = true;
    }
  };
}
