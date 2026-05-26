/**
 * 性能监控中间件
 * 记录请求响应时间和慢请求
 */

/**
 * 请求日志和性能监控
 * @param {Object} options - 配置选项
 */
function performanceMonitor(options = {}) {
  const {
    slowThreshold = 1000, // 慢请求阈值（毫秒）
    logAllRequests = true, // 是否记录所有请求
    logSlowRequests = true // 是否记录慢请求
  } = options;

  return (req, res, next) => {
    const start = Date.now();

    // 记录原始的 res.send 方法
    const originalSend = res.send;

    res.send = function(data) {
      const duration = Date.now() - start;
      const method = req.method;
      const path = req.path;
      const status = res.statusCode;

      // 记录所有请求
      if (logAllRequests) {
        console.log(`[${method}] ${path} - ${status} - ${duration}ms`);
      }

      // 记录慢请求
      if (logSlowRequests && duration > slowThreshold) {
        console.warn(`⚠️  SLOW REQUEST: [${method}] ${path} - ${status} - ${duration}ms`);

        // 可以在这里添加更详细的日志或发送到监控系统
        if (duration > slowThreshold * 2) {
          console.error(`🔴 VERY SLOW REQUEST: [${method}] ${path} - ${status} - ${duration}ms`);
        }
      }

      // 添加响应时间头
      res.set('X-Response-Time', `${duration}ms`);

      // 调用原始的 send 方法
      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * 简单的内存监控
 */
function memoryMonitor(intervalMs = 60000) {
  setInterval(() => {
    const usage = process.memoryUsage();
    const mb = (bytes) => Math.round(bytes / 1024 / 1024);

    // 只在内存使用超过阈值时记录
    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;

    // 堆内存使用率超过 95% 才警告（Node.js 会自动扩展堆）
    if (heapUsagePercent > 95) {
      console.warn(`⚠️  High heap memory usage: ${heapUsagePercent.toFixed(1)}%`);
      console.log('📊 Memory Usage:', {
        rss: `${mb(usage.rss)}MB`,
        heapTotal: `${mb(usage.heapTotal)}MB`,
        heapUsed: `${mb(usage.heapUsed)}MB`,
        external: `${mb(usage.external)}MB`
      });
    }

    // RSS 超过 500MB 才警告
    if (usage.rss > 500 * 1024 * 1024) {
      console.warn(`⚠️  High RSS memory: ${mb(usage.rss)}MB`);
    }
  }, intervalMs);
}

module.exports = {
  performanceMonitor,
  memoryMonitor
};
