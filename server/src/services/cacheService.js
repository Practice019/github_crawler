const fs = require('fs');
const path = require('path');

class CacheService {
  constructor(defaultTTL = Infinity) {
    this.store = new Map();
    this.defaultTTL = defaultTTL;
    this.cacheFile = path.join(__dirname, '..', '..', '.cache.json');
    this.loadFromFile();
  }

  // 从文件加载缓存
  loadFromFile() {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = fs.readFileSync(this.cacheFile, 'utf-8');
        const cache = JSON.parse(data);
        let loaded = 0;

        for (const [key, item] of Object.entries(cache)) {
          // 不检查过期时间，直接加载所有缓存
          this.store.set(key, item);
          loaded++;
        }

        if (loaded > 0) {
          console.log(`✅ Loaded ${loaded} cached items from disk (never expire)`);
        }
      }
    } catch (error) {
      console.error('Failed to load cache from file:', error.message);
    }
  }

  // 保存缓存到文件
  saveToFile() {
    try {
      const cache = {};
      for (const [key, item] of this.store) {
        cache[key] = item;
      }
      fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
    } catch (error) {
      console.error('Failed to save cache to file:', error.message);
    }
  }

  set(key, value, ttl = this.defaultTTL) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      createdAt: Date.now(),
    });
    // 保存到文件
    this.saveToFile();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    // 不检查过期时间，永久有效
    return item.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.store.delete(key);
    this.saveToFile();
  }

  clear() {
    this.store.clear();
    this.saveToFile();
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
