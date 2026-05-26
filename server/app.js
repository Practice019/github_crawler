const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./src/routes/api');
const introductionsRoutes = require('./src/routes/introductions');
const docGeneratorRoutes = require('./src/routes/docGenerator');
const projectStatusRoutes = require('./src/routes/projectStatus');
const scheduler = require('./src/services/scheduler');
const { performanceMonitor, memoryMonitor } = require('./src/middleware/performanceMonitor');

// 使用 dotenv 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// 安全响应头
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS 配置
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // 在生产环境要求 origin 头
    if (!origin && process.env.NODE_ENV === 'production') {
      callback(new Error('Origin header required in production'));
      return;
    }

    // 允许无 origin（开发环境）或白名单中的 origin
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// 通用速率限制
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// 昂贵操作速率限制
const expensiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小时
  max: 10,
  message: { success: false, error: '操作过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// 性能监控中间件
app.use(performanceMonitor({
  slowThreshold: 1000, // 1秒以上视为慢请求
  logAllRequests: true,
  logSlowRequests: true
}));

// 启动内存监控（每分钟检查一次）
memoryMonitor(60000);

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test route works' });
});

app.use('/api', apiLimiter, apiRoutes);
app.use('/api/introductions', introductionsRoutes);
app.use('/api/doc-generator', expensiveLimiter, docGeneratorRoutes);
app.use('/api/project-status', projectStatusRoutes);

// Fallback route for SPA - handle all other routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'), (err) => {
      if (err) {
        next();
      }
    });
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  scheduler.start();
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;
