const STATE_MIN_MS = 100;
const STATE_HEARTBEAT_MS = 5000;
const STREAM_SILENCE_MS = 45000;

function hashSeed(text) {
  let hash = 2166136261;
  for (const char of String(text || '')) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export class RemoteNetworkAdapter {
  constructor(saveManager) {
    this.mode = 'remote';
    this.saveManager = saveManager;
    this.handlers = new Map();
    this.peers = [];
    this.townPlayers = [];
    this.online = 0;
    this.total = 0;
    this.cabin = null;
    this.visit = null;
    this.connected = false;
    this.token = '';
    this.stream = null;
    this.closed = false;
    this.connecting = null;
    this.retryTimer = 0;
    this.retryDelay = 900;
    this.watchdog = 0;
    this.lastMessageAt = 0;
    this.stateTimer = 0;
    this.heartbeatTimer = 0;
    this.roomTimer = 0;
    this.pendingRoom = null;
    this.lastStateAt = 0;
    this.lastSent = null;
    this.admin = false;
    const player = saveManager.save.player || {};
    this.localState = {
      scene: player.scene === 'home' ? 'home' : player.scene === 'office' ? 'office' : 'town',
      officeId: player.scene === 'office' ? (player.officeId || 'python') : null,
      officeTitle: '',
      x: Number(player.x) || 752,
      y: Number(player.y) || 548,
      dir: player.dir || 'down',
      moving: false,
      sitting: false,
      lying: false,
      boat: false
    };
  }

  on(type, handler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type).add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  emit(type, payload) {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const handler of set) {
      try {
        handler(payload);
      } catch (err) {
        console.error('[net] handler error', err);
      }
    }
  }

  get playerId() {
    const save = this.saveManager.save;
    return save.multiplayer?.playerId || save.userId;
  }

  get name() {
    return this.saveManager.save.player.name;
  }

  getPresence() {
    return {
      mode: this.mode,
      playerId: this.playerId,
      roomId: this.cabin?.hostId || null,
      peers: this.peers,
      online: this.online,
      total: this.total,
      cabin: this.cabin,
      scene: this.localState.scene,
      officeId: this.localState.officeId || null,
      officeTitle: this.localState.officeTitle || '',
      x: this.localState.x,
      y: this.localState.y,
      connected: this.connected
    };
  }

  async connect() {
    this.closed = false;
    await this.attemptConnection();
    return { ok: this.connected, mode: this.mode };
  }

  async attemptConnection() {
    try {
      await this.openConnection();
    } catch (err) {
      if (this.closed) return;
      console.warn('[net] 连接小镇联机失败：', err.message);
      this.connected = false;
      this.emit('status', { state: 'offline', error: err.message });
      this.scheduleReconnect();
    }
  }

  async openConnection() {
    if (this.connecting) return this.connecting;
    this.connecting = this.runOpenConnection()
      .catch((err) => {
        this.connecting = null;
        throw err;
      })
      .then((result) => {
        this.connecting = null;
        return result;
      });
    return this.connecting;
  }

  async runOpenConnection() {
    clearTimeout(this.retryTimer);
    this.retryTimer = 0;
    this.closeStream();
    const state = this.localState;
    const payload = {
      playerId: this.playerId,
      name: this.name,
      lookSeed: hashSeed(this.name),
      scene: state.scene,
      officeId: state.officeId || null,
      officeTitle: state.officeTitle || '',
      x: state.x,
      y: state.y,
      dir: state.dir,
      moving: false,
      sitting: Boolean(state.sitting),
      lying: Boolean(state.lying),
      boat: Boolean(state.boat)
    };
    if (state.scene === 'home' && !this.visit) {
      payload.room = this.saveManager.save.room;
    }
    const data = await this.request('/api/multiplayer/hello', payload, true);
    if (this.closed) return;
    this.token = data.token;
    this.admin = Boolean(data.you?.admin);
    this.connected = true;
    this.retryDelay = 900;
    this.lastMessageAt = Date.now();
    this.applySnapshot(data);
    this.openStream();
    this.emit('status', { state: 'online', online: this.online, total: this.total });
    this.emit('connected', { mode: this.mode });
    this.lastSent = null;
    this.flushState(true);
  }

  openStream() {
    if (!this.token || this.closed) return;
    this.closeStream();
    const source = new EventSource(`/api/multiplayer/events?token=${encodeURIComponent(this.token)}`);
    this.stream = source;
    const bind = (name, handler) => {
      source.addEventListener(name, (event) => {
        this.lastMessageAt = Date.now();
        let data = {};
        try {
          data = event.data ? JSON.parse(event.data) : {};
        } catch {
          data = {};
        }
        handler(data);
      });
    };

    source.onopen = () => {
      this.lastMessageAt = Date.now();
      this.connected = true;
    };
    source.onerror = () => {
      if (this.closed || this.stream !== source) return;
      this.closeStream();
      this.connected = false;
      this.emit('status', { state: 'offline' });
      this.scheduleReconnect();
    };

    bind('ping', () => {});
    bind('snapshot', (data) => this.applySnapshot(data));
    bind('chat', (data) => this.emit('chat', data));
    bind('invite', (data) => this.emit('invite', data));
    bind('invite-closed', (data) => this.emit('invite-closed', data));
    bind('visit-start', (data) => this.applyVisit(data));
    bind('visit-end', (data) => {
      if (!this.visit) return;
      this.visit = null;
      this.emit('visit-end', data);
    });
    bind('room', (data) => {
      if (!this.visit) return;
      this.visit = { ...this.visit, room: data.room };
      this.emit('visit-room', { room: data.room, hostName: data.hostName || this.visit.hostName });
    });
    bind('visitor-joined', (data) => this.emit('visitor-joined', data));
    bind('visitor-left', (data) => this.emit('visitor-left', data));
    bind('town-event', (data) => this.emit('town-event', data));
    bind('tp-request', (data) => this.emit('tp-request', data));
    bind('tp-closed', (data) => this.emit('tp-closed', data));
    bind('teleport', (data) => {
      this.visit = null;
      this.localState = {
        ...this.localState,
        scene: 'town',
        officeId: null,
        officeTitle: '',
        x: Number(data.x) || 752,
        y: Number(data.y) || 548,
        dir: 'down',
        moving: false,
        sitting: false,
        lying: false,
        boat: false
      };
      this.lastSent = null;
      this.emit('teleport', data);
    });
    bind('teleport-arrive', (data) => this.emit('teleport-arrive', data));
    bind('admin-granted', (data) => {
      this.admin = true;
      this.emit('admin-granted', data);
    });
    bind('moderation', (data) => this.emit('moderation', data));

    this.startWatchdog();
  }

  startWatchdog() {
    if (this.watchdog) return;
    this.watchdog = setInterval(() => {
      if (this.closed || !this.connected) return;
      if (Date.now() - this.lastMessageAt > STREAM_SILENCE_MS) {
        this.connected = false;
        this.closeStream();
        this.emit('status', { state: 'offline' });
        this.scheduleReconnect();
      }
    }, 15000);
  }

  stopWatchdog() {
    clearInterval(this.watchdog);
    this.watchdog = 0;
  }

  closeStream() {
    if (!this.stream) return;
    const source = this.stream;
    this.stream = null;
    source.close();
  }

  scheduleReconnect() {
    if (this.closed || this.retryTimer) return;
    const delay = this.retryDelay;
    this.retryDelay = Math.min(10000, Math.round(this.retryDelay * 1.7));
    this.retryTimer = setTimeout(() => {
      this.retryTimer = 0;
      this.openConnection().catch((err) => {
        if (this.closed) return;
        console.warn('[net] 重新连接失败：', err.message);
        this.emit('status', { state: 'offline', error: err.message });
        this.scheduleReconnect();
      });
    }, delay);
  }

  recoverSession() {
    if (this.closed) return;
    this.connected = false;
    this.token = '';
    this.closeStream();
    this.emit('status', { state: 'offline' });
    this.scheduleReconnect();
  }

  applySnapshot(data) {
    if (!data || typeof data !== 'object') return;
    this.peers = Array.isArray(data.peers) ? data.peers.filter((peer) => peer && peer.id) : [];
    this.townPlayers = Array.isArray(data.town) ? data.town.filter((peer) => peer && peer.id) : [];
    this.online = Number(data.online) || 0;
    this.total = Number(data.total) || this.peers.length + 1;
    this.cabin = data.cabin || null;
    if (this.visit && (!this.cabin || this.cabin.hostId !== this.visit.hostId)) {
      const lost = this.visit;
      this.visit = null;
      this.emit('visit-lost', { hostName: lost.hostName });
    }
    this.emit('snapshot', {
      peers: this.peers,
      town: this.townPlayers,
      online: this.online,
      total: this.total,
      cabin: this.cabin
    });
  }

  applyVisit(data) {
    if (!data?.hostId) return;
    const rejoined = Boolean(this.visit && this.visit.hostId === data.hostId);
    this.visit = {
      hostId: data.hostId,
      hostName: data.hostName || '朋友',
      room: data.room || { items: [], lampOn: true, wallpaper: 'warm' },
      entry: data.entry || { x: 160, y: 206 }
    };
    this.localState = {
      ...this.localState,
      scene: 'home',
      officeId: null,
      officeTitle: '',
      x: this.visit.entry.x,
      y: this.visit.entry.y
    };
    this.emit('visit-start', { ...this.visit, rejoined });
  }

  async request(path, body = {}, noToken = false) {
    const payload = noToken ? body : { ...body, token: this.token };
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    let data = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok || data.ok === false) {
      const error = new Error(data.error || `请求失败（${response.status}）`);
      error.status = response.status;
      error.data = data;
      if (data.banned) {
        this.emit('moderation', {
          action: 'ban',
          reason: data.reason || '',
          byName: '小镇管理',
          playerId: this.playerId,
          username: this.name,
          recovered: true
        });
      }
      if (data.reconnect) this.recoverSession();
      throw error;
    }
    return data;
  }

  setState(patch) {
    if (!patch) return;
    const next = { ...this.localState };
    if (patch.scene === 'town' || patch.scene === 'home' || patch.scene === 'office') next.scene = patch.scene;
    if (typeof patch.officeId === 'string') next.officeId = patch.officeId.slice(0, 12) || null;
    if (typeof patch.officeTitle === 'string') next.officeTitle = patch.officeTitle.slice(0, 12);
    if (next.scene !== 'office') {
      next.officeId = null;
      next.officeTitle = '';
    }
    if (Number.isFinite(patch.x)) next.x = Math.round(patch.x);
    if (Number.isFinite(patch.y)) next.y = Math.round(patch.y);
    if (typeof patch.dir === 'string') next.dir = patch.dir;
    if (typeof patch.moving === 'boolean') next.moving = patch.moving;
    if (typeof patch.sitting === 'boolean') next.sitting = patch.sitting;
    if (typeof patch.lying === 'boolean') next.lying = patch.lying;
    if (typeof patch.boat === 'boolean') next.boat = patch.boat;
    this.localState = next;
    if (!this.token) return;
    const changed = ['scene', 'officeId', 'officeTitle', 'x', 'y', 'dir', 'moving', 'sitting', 'lying', 'boat']
      .some((key) => next[key] !== this.lastSent?.[key]);
    if (!changed) {
      if (!this.heartbeatTimer) {
        this.heartbeatTimer = setTimeout(() => {
          this.heartbeatTimer = 0;
          this.flushState();
        }, STATE_HEARTBEAT_MS);
      }
      return;
    }
    if (this.stateTimer) return;
    const wait = Math.max(0, STATE_MIN_MS - (Date.now() - this.lastStateAt));
    this.stateTimer = setTimeout(() => {
      this.stateTimer = 0;
      this.flushState();
    }, wait);
  }

  flushState(force = false) {
    if (!this.token) return;
    clearTimeout(this.heartbeatTimer);
    this.heartbeatTimer = 0;
    if (!force && this.lastSent && ['scene', 'officeId', 'officeTitle', 'x', 'y', 'dir', 'moving', 'sitting', 'lying', 'boat']
      .every((key) => this.localState[key] === this.lastSent[key])) return;
    this.lastStateAt = Date.now();
    this.lastSent = { ...this.localState };
    this.request('/api/multiplayer/state', this.localState).catch((err) => {
      if (err.data?.reconnect) return;
      console.warn('[net] 同步位置失败：', err.message);
    });
  }

  queueRoom(room) {
    this.pendingRoom = room;
    if (this.roomTimer) return;
    this.roomTimer = setTimeout(() => {
      this.roomTimer = 0;
      const snapshot = this.pendingRoom;
      this.pendingRoom = null;
      if (!snapshot || !this.token) return;
      this.request('/api/multiplayer/room', { room: snapshot }).catch((err) => {
        console.warn('[net] 同步小屋布置失败：', err.message);
      });
    }, 280);
  }

  async syncRoom(room) {
    clearTimeout(this.roomTimer);
    this.roomTimer = 0;
    this.pendingRoom = null;
    if (!this.token) return { ok: false };
    return this.request('/api/multiplayer/room', { room });
  }

  async sendChat(text) {
    const data = await this.request('/api/multiplayer/chat', { text });
    return data;
  }

  async invite(targetId) {
    const data = await this.request('/api/multiplayer/invite', { targetId });
    this.emit('invite-sent', data);
    return data;
  }

  async respondInvite(inviteId, accept) {
    const data = await this.request('/api/multiplayer/invite/respond', { inviteId, accept });
    if (data.visit) this.applyVisit(data.visit);
    return data;
  }

  async requestTeleport(targetId) {
    return this.request('/api/multiplayer/tp', { targetId });
  }

  async respondTeleport(requestId, accept) {
    return this.request('/api/multiplayer/tp/respond', { requestId, accept });
  }

  async forceTeleport(fromId, toId) {
    return this.request('/api/multiplayer/tp-force', { fromId, toId });
  }

  async grantOp(targetId) {
    return this.request('/api/multiplayer/op', { targetId });
  }

  async getOp(password) {
    return this.request('/api/multiplayer/getop', { password });
  }

  async kick(targetId, reason = '') {
    return this.request('/api/multiplayer/kick', { targetId, reason });
  }

  async ban(targetId, reason = '') {
    return this.request('/api/multiplayer/ban', { targetId, reason });
  }

  async leaveCabin() {
    await this.request('/api/multiplayer/leave-room');
    const visit = this.visit;
    this.visit = null;
    this.localState = {
      ...this.localState,
      scene: 'town',
      officeId: null,
      officeTitle: '',
      sitting: false,
      lying: false
    };
    if (visit) this.emit('visit-end', { reason: 'self', hostName: visit.hostName });
    return { ok: true };
  }

  async endVisits() {
    return this.request('/api/multiplayer/end-visit');
  }

  async disconnect() {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.retryTimer);
    clearTimeout(this.stateTimer);
    clearTimeout(this.heartbeatTimer);
    clearTimeout(this.roomTimer);
    this.retryTimer = 0;
    this.stateTimer = 0;
    this.heartbeatTimer = 0;
    this.roomTimer = 0;
    this.closeStream();
    this.stopWatchdog();
    if (this.token) {
      try {
        await this.request('/api/multiplayer/leave');
      } catch {
        /* the tab may already be unloading */
      }
    }
    this.token = '';
    this.connected = false;
    this.peers = [];
    this.emit('disconnected', { mode: this.mode });
  }
}

export function createNetworkAdapter(saveManager) {
  return new RemoteNetworkAdapter(saveManager);
}
