const config = require('../config');

class Cache {
  constructor() {
    this.store = new Map();
    this.ttl = parseInt(config.cache.ttl, 10) * 1000;
    this.checkPeriod = parseInt(config.cache.checkPeriod, 10) * 1000;
    this.startCleanup();
  }

  startCleanup() {
    setInterval(() => this.evictExpired(), this.checkPeriod);
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs) {
    this.store.set(key, {
      value,
      createdAt: Date.now(),
      expiry: Date.now() + (ttlMs || this.ttl)
    });
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.store.delete(key);
  }

  evictExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }
}

module.exports = new Cache();
