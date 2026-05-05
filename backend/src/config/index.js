require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  github: {
    apiBaseUrl: 'https://api.github.com',
    token: process.env.GITHUB_TOKEN || '',
    perPage: 30
  },
  cache: {
    ttl: process.env.CACHE_TTL || 3600,
    checkPeriod: 600
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
};
