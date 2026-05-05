class CacheService {
  constructor(defaultTTL = 1800000) {
    this.store = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  getStats() {
    let valid = 0;
    let expired = 0;
    const now = Date.now();
    for (const [key, item] of this.store) {
      if (now > item.expiresAt) expired++;
      else valid++;
    }
    return { total: this.store.size, valid, expired };
  }

  getKeys() {
    return Array.from(this.store.keys());
  }

  getInfo(key) {
    const item = this.store.get(key);
    if (!item) return null;
    return {
      key,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      isExpired: Date.now() > item.expiresAt,
      size: JSON.stringify(item.value).length,
    };
  }
}

module.exports = new CacheService();
