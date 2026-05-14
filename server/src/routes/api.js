const express = require('express');
const router = express.Router();
const githubService = require('../services/githubService');
const cache = require('../services/cacheService');
const reportGenerator = require('../services/reportGenerator');
const scheduler = require('../services/scheduler');

// GET /api/trending - 获取trending项目
router.get('/trending', async (req, res) => {
  try {
    const { since = 'weekly', language = '' } = req.query;

    // 构建缓存键
    const lang = language || 'javascript'; // 默认语言

    console.log(`API Request: /api/trending?since=${since}&language=${language}`);

    // 如果选择"全部"，合并所有时间范围的数据
    if (since === 'all') {
      const allRepos = new Map(); // 使用 Map 去重

      for (const timeRange of ['daily', 'weekly', 'monthly']) {
        const cacheKey = `trending:${lang}:${timeRange}`;
        const repos = cache.get(cacheKey);

        if (repos && repos.length > 0) {
          repos.forEach(repo => {
            // 使用项目 ID 去重，保留最新的数据
            if (!allRepos.has(repo.id) || repo.todayStars > (allRepos.get(repo.id).todayStars || 0)) {
              allRepos.set(repo.id, repo);
            }
          });
        }
      }

      const mergedRepos = Array.from(allRepos.values());
      // 按 stars 排序
      mergedRepos.sort((a, b) => (b.stars || 0) - (a.stars || 0));

      console.log(`Merged ${mergedRepos.length} repos from all time ranges`);

      return res.json({
        success: true,
        data: mergedRepos,
        cached: true,
        since: 'all',
        language: lang
      });
    }

    // 单个时间范围的逻辑
    const cacheKey = `trending:${lang}:${since}`;
    console.log(`Cache key: ${cacheKey}`);

    // 尝试从缓存获取
    let repos = cache.get(cacheKey);

    if (!repos || repos.length === 0) {
      console.log(`Cache miss for ${cacheKey}, fetching from GitHub...`);
      // 缓存未命中，实时爬取
      repos = await githubService.fetchTrendingRepos(lang, since);
      if (repos && repos.length > 0) {
        cache.set(cacheKey, repos);
      }
    } else {
      console.log(`Cache hit for ${cacheKey}, returning ${repos.length} repos`);
    }

    res.json({
      success: true,
      data: repos || [],
      cached: !!cache.get(cacheKey),
      since,
      language: lang
    });
  } catch (error) {
    console.error('Error fetching trending:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/github/trending - 兼容旧路由
router.get('/github/trending', async (req, res) => {
  try {
    const { since = 'weekly', language = '' } = req.query;

    // 构建缓存键
    const lang = language || 'javascript'; // 默认语言

    console.log(`API Request: /api/github/trending?since=${since}&language=${language}`);

    // 如果选择"全部"，合并所有时间范围的数据
    if (since === 'all') {
      const allRepos = new Map(); // 使用 Map 去重

      for (const timeRange of ['daily', 'weekly', 'monthly']) {
        const cacheKey = `trending:${lang}:${timeRange}`;
        const repos = cache.get(cacheKey);

        if (repos && repos.length > 0) {
          repos.forEach(repo => {
            // 使用项目 ID 去重，保留最新的数据
            if (!allRepos.has(repo.id) || repo.todayStars > (allRepos.get(repo.id).todayStars || 0)) {
              allRepos.set(repo.id, repo);
            }
          });
        }
      }

      const mergedRepos = Array.from(allRepos.values());
      // 按 stars 排序
      mergedRepos.sort((a, b) => (b.stars || 0) - (a.stars || 0));

      console.log(`Merged ${mergedRepos.length} repos from all time ranges`);

      return res.json({
        success: true,
        data: mergedRepos,
        cached: true,
        since: 'all',
        language: lang
      });
    }

    // 单个时间范围的逻辑
    const cacheKey = `trending:${lang}:${since}`;
    console.log(`Cache key: ${cacheKey}`);

    // 尝试从缓存获取
    let repos = cache.get(cacheKey);

    if (!repos || repos.length === 0) {
      console.log(`Cache miss for ${cacheKey}, fetching from GitHub...`);
      // 缓存未命中，实时爬取
      repos = await githubService.fetchTrendingRepos(lang, since);
      if (repos && repos.length > 0) {
        cache.set(cacheKey, repos);
      }
    } else {
      console.log(`Cache hit for ${cacheKey}, returning ${repos.length} repos`);
    }

    res.json({
      success: true,
      data: repos || [],
      cached: !!cache.get(cacheKey),
      since,
      language: lang
    });
  } catch (error) {
    console.error('Error fetching trending:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/reports/generate - 生成项目报告
router.post('/reports/generate', async (req, res) => {
  try {
    const { author, name, skipIfExists } = req.body;

    if (!author || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: author, name'
      });
    }

    const result = await reportGenerator.generateReport(author, name, skipIfExists);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: error.message
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
      error: error.message
    });
  }
});

module.exports = router;
