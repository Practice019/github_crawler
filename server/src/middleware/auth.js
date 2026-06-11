const crypto = require('crypto');

/**
 * 简单的基于令牌的认证中间件
 *
 * 使用方法：
 * 1. 在 .env 中设置 ADMIN_TOKEN=your-secure-token
 * 2. 请求时在 Authorization 头中添加: Bearer <token>
 */

function requireAuth(req, res, next) {
  // 从环境变量读取管理员令牌
  const adminToken = process.env.ADMIN_TOKEN;

  // 如果未设置令牌，拒绝所有请求并提示配置
  if (!adminToken) {
    return res.status(503).json({
      success: false,
      error: '服务器未配置认证令牌，请联系管理员在 .env 中设置 ADMIN_TOKEN'
    });
  }

  // 获取请求头中的令牌
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '缺少认证令牌，请在 Authorization 头中提供 Bearer token'
    });
  }

  const token = authHeader.substring(7); // 移除 "Bearer " 前缀

  // 使用时间安全的比较防止时序攻击
  const isValid = crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(adminToken)
  );

  if (!isValid) {
    return res.status(403).json({
      success: false,
      error: '认证令牌无效'
    });
  }

  // 认证通过，继续处理请求
  next();
}

/**
 * 生成安全的随机令牌（用于初始化）
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  requireAuth,
  generateToken
};
