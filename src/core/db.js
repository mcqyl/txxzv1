const DB_NAME = 'mossbrook_town';
const DB_VERSION = 1;
const LS_KEY = 'mossbrook.db.fallback';

let dbPromise = null;
let fallback = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('indexedDB-unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('users')) {
        const users = db.createObjectStore('users', { keyPath: 'id' });
        users.createIndex('usernameLower', 'usernameLower', { unique: true });
        users.createIndex('contactLower', 'contactLower', { unique: true });
      }
      if (!db.objectStoreNames.contains('saves')) {
        db.createObjectStore('saves', { keyPath: 'userId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexedDB-open-failed'));
  }).catch((err) => {
    console.warn('[db] IndexedDB 不可用，改用 localStorage 存储。', err);
    fallback = createFallback();
    return fallback;
  });
  return dbPromise;
}

function createFallback() {
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '{"users":[],"saves":{}}');
    } catch {
      return { users: [], saves: {} };
    }
  };
  const write = (data) => localStorage.setItem(LS_KEY, JSON.stringify(data));
  return {
    _fallback: true,
    async getUserById(id) {
      return read().users.find((u) => u.id === id) || null;
    },
    async findUser(field, value) {
      return read().users.find((u) => u[field] === value) || null;
    },
    async addUser(user) {
      const data = read();
      if (data.users.some((u) => u.usernameLower === user.usernameLower)) {
        const e = new Error('username-taken');
        e.code = 'username-taken';
        throw e;
      }
      if (user.contactLower && data.users.some((u) => u.contactLower === user.contactLower)) {
        const e = new Error('contact-taken');
        e.code = 'contact-taken';
        throw e;
      }
      data.users.push(user);
      write(data);
      return user;
    },
    async updateUser(user) {
      const data = read();
      const i = data.users.findIndex((u) => u.id === user.id);
      if (i >= 0) data.users[i] = user;
      write(data);
    },
    async getSave(userId) {
      return read().saves[userId] || null;
    },
    async putSave(save) {
      const data = read();
      data.saves[save.userId] = save;
      write(data);
    },
    async deleteSave(userId) {
      const data = read();
      delete data.saves[userId];
      write(data);
    },
    async countUsers() {
      return read().users.length;
    }
  };
}

function tx(db, store, mode, fn) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const os = transaction.objectStore(store);
    let request;
    try {
      request = fn(os);
    } catch (err) {
      reject(err);
      return;
    }
    transaction.oncomplete = () => resolve(request ? request.result : undefined);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('transaction-aborted'));
  });
}

export const DB = {
  async getUserById(id) {
    const db = await openDB();
    if (db._fallback) return db.getUserById(id);
    return tx(db, 'users', 'readonly', (os) => os.get(id));
  },

  async findUser(field, value) {
    const db = await openDB();
    if (db._fallback) return db.findUser(field, value);
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('users', 'readonly');
      const index = transaction.objectStore('users').index(field);
      const req = index.get(value);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  async addUser(user) {
    const db = await openDB();
    if (db._fallback) return db.addUser(user);
    try {
      await tx(db, 'users', 'readwrite', (os) => os.add(user));
      return user;
    } catch (err) {
      const e = new Error(err?.name === 'ConstraintError' ? 'constraint' : 'add-user-failed');
      e.code = e.message;
      throw e;
    }
  },

  async updateUser(user) {
    const db = await openDB();
    if (db._fallback) return db.updateUser(user);
    await tx(db, 'users', 'readwrite', (os) => os.put(user));
    return user;
  },

  async getSave(userId) {
    const db = await openDB();
    if (db._fallback) return db.getSave(userId);
    return tx(db, 'saves', 'readonly', (os) => os.get(userId));
  },

  async putSave(save) {
    const db = await openDB();
    if (db._fallback) return db.putSave(save);
    await tx(db, 'saves', 'readwrite', (os) => os.put(save));
    return save;
  },

  async deleteSave(userId) {
    const db = await openDB();
    if (db._fallback) return db.deleteSave(userId);
    await tx(db, 'saves', 'readwrite', (os) => os.delete(userId));
  }
};
