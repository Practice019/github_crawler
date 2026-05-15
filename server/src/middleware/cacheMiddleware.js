/**
 * HTTP 缓存中间件
 * 为不同类型的响应设置合适的缓存策略
 */

/**
 * 为 API 响应添加缓存头
 * @param {number} maxAge - 缓存时间（秒）
 * @param {boolean} isPublic - 是否允许公共缓存
 */
function cacheControl(maxAge = 300, isPublic = true) {
  return (req, res, next) => {
    const cacheType = isPublic ? 'public' : 'private';
    res.set('Cache-Control', `${cacheType}, max-age=${maxAge}`);
    next();
  };
}

/**
 * 为静态资源添加长期缓存
 */
function staticCache() {
  return (req, res, next) => {
    // 一年缓存，immutable 表示永不过期
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  };
}

/**
 * 禁用缓存（用于动态内容）
 */
function noCache() {
  return (req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  };
}

/**
 * 条件缓存 - 使用 ETag
 */
function conditionalCache(generateETag) {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function(data) {
      const etag = generateETag ? generateETag(data) : `"${Buffer.from(JSON.stringify(data)).toString('base64').substring(0, 27)}"`;
      res.set('ETag', etag);

      // 如果客户端的 ETag 匹配，返回 304
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }

      originalSend.call(this, data);
    };

    next();
  };
}

module.exports = {
  cacheControl,
  staticCache,
  noCache,
  conditionalCache
};
