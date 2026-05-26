const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const githubService = require('../services/githubService');
const cache = require('../services/cacheService');
const reportGenerator = require('../services/reportGenerator');
const scheduler = require('../services/scheduler');
const { cacheControl, noCache } = require('../middleware/cacheMiddleware');

/**
 * 合并所有时间范围的仓库数据
 */
function mergeAllTimeRanges(lang) {
  const allRepos = new Map();
  const timeRanges = ['daily', 'weekly', 'monthly'];

  for (const timeRange of timeRanges) {
    const cacheKey = `trending:${lang}:${timeRange}`;
    const repos = cache.get(cacheKey) || [];

    repos.forEach(repo => {
      const existing = allRepos.get(repo.id);
      if (!existing || repo.todayStars > (existing.todayStars || 0)) {
        allRepos.set(repo.id, repo);
      }
    });
  }

  const mergedRepos = Array.from(allRepos.values());
  mergedRepos.sort((a, b) => (b.stars || 0) - (a.stars || 0));

  console.log(`Merged ${mergedRepos.length} repos from all time ranges`);
  return mergedRepos;
}

/**
 * 获取单个时间范围的仓库数据
 */
async function fetchSingleTimeRange(lang, since) {
  const cacheKey = `trending:${lang}:${since}`;
  let repos = cache.get(cacheKey);

  if (!repos || repos.length === 0) {
    console.log(`Cache miss for ${cacheKey}, fetching from GitHub...`);
    repos = await githubService.fetchTrendingRepos(lang, since);
    if (repos && repos.length > 0) {
      cache.set(cacheKey, repos);
    }
  } else {
    console.log(`Cache hit for ${cacheKey}, returning ${repos.length} repos`);
  }

  return repos || [];
}

/**
 * 处理 trending 请求的通用函数
 */
async function handleTrendingRequest(req, res) {
  try {
    const { since = 'weekly', language = '' } = req.query;
    const lang = language || 'all';

    console.log(`API Request: ${req.path}?since=${since}&language=${language}`);

    const repos = since === 'all'
      ? mergeAllTimeRanges(lang)
      : await fetchSingleTimeRange(lang, since);

    res.json({
      success: true,
      data: repos,
      cached: since !== 'all' && !!cache.get(`trending:${lang}:${since}`),
      since,
      language: lang
    });
  } catch (error) {
    console.error('Error fetching trending:', error);
    res.status(500).json({
      success: false,
      error: '获取热门项目失败'
    });
  }
}

// GET /api/trending - 获取trending项目（缓存 1 年）
router.get('/trending', cacheControl(31536000), handleTrendingRequest);

// GET /api/github/trending - 兼容旧路由（缓存 1 年）
router.get('/github/trending', cacheControl(31536000), handleTrendingRequest);

// POST /api/reports/generate - 生成项目报告（不缓存）
router.post('/reports/generate', [
  noCache(),
  body('author').trim().isLength({ min: 1, max: 100 }).matches(/^[a-zA-Z0-9_-]+$/),
  body('name').trim().isLength({ min: 1, max: 100 }).matches(/^[a-zA-Z0-9_.-]+$/),
  body('skipIfExists').optional().isBoolean()
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '无效的输入参数',
        details: errors.array()
      });
    }

    const { author, name, skipIfExists } = req.body;

    const result = await reportGenerator.generateReport(author, name, skipIfExists);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: '生成报告失败'
    });
  }
});

// GET /api/cache/stats - 缓存统计
router.get('/cache/stats', (req, res) => {
  res.json({
    success: true,
    stats: cache.getStats()
  });
});

// GET /api/scheduler/status - 获取爬取状态
router.get('/scheduler/status', (req, res) => {
  res.json({
    success: true,
    status: scheduler.getStatus()
  });
});

// POST /api/scheduler/fetch - 手动触发缓存更新
router.post('/scheduler/fetch', async (req, res) => {
  try {
    if (scheduler.getStatus().isRunning) {
      return res.status(409).json({
        success: false,
        error: '缓存更新正在进行中，请稍后再试'
      });
    }

    // 异步执行，立即返回
    scheduler.fetchAllData().catch(err => {
      console.error('Manual fetch failed:', err.message);
    });

    res.json({
      success: true,
      message: '缓存更新已启动'
    });
  } catch (error) {
    console.error('Error triggering fetch:', error);
    res.status(500).json({
      success: false,
      error: '触发更新失败'
    });
  }
});

// GET /api/scheduler/logs - 获取缓存更新实时日志（SSE）
router.get('/scheduler/logs', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const listener = (log) => {
    res.write(`data: ${JSON.stringify(log)}\n\n`);
  };

  scheduler.addLogListener(listener);

  req.on('close', () => {
    scheduler.removeLogListener(listener);
  });
});

module.exports = router;
