/**
 * 代理配置工具
 * 从环境变量读取代理设置
 */

/**
 * 获取代理配置
 * @returns {Object|undefined} 代理配置对象，如果未配置则返回 undefined
 */
function getProxyConfig() {
  // 如果设置了 NO_PROXY 环境变量，则不使用代理
  if (process.env.NO_PROXY === 'true') {
    return undefined;
  }

  // 如果没有设置代理主机，返回 undefined
  if (!process.env.PROXY_HOST && !process.env.HTTP_PROXY) {
    return undefined;
  }

  // 优先使用 PROXY_HOST/PROXY_PORT，否则解析 HTTP_PROXY
  if (process.env.PROXY_HOST) {
    return {
      host: process.env.PROXY_HOST,
      port: parseInt(process.env.PROXY_PORT || '7890', 10),
      protocol: process.env.PROXY_PROTOCOL || 'http'
    };
  }

  // 解析 HTTP_PROXY 环境变量（格式：http://host:port）
  if (process.env.HTTP_PROXY) {
    try {
      const url = new URL(process.env.HTTP_PROXY);
      return {
        host: url.hostname,
        port: parseInt(url.port || '80', 10),
        protocol: url.protocol.replace(':', '')
      };
    } catch (error) {
      console.warn('Failed to parse HTTP_PROXY:', error.message);
      return undefined;
    }
  }

  return undefined;
}

/**
 * 为 axios 配置添加代理设置
 * @param {Object} config - axios 配置对象
 * @returns {Object} 添加了代理配置的 axios 配置对象
 */
function addProxyToConfig(config = {}) {
  const proxyConfig = getProxyConfig();

  if (proxyConfig) {
    return {
      ...config,
      proxy: proxyConfig
    };
  }

  return config;
}

module.exports = {
  getProxyConfig,
  addProxyToConfig
};
