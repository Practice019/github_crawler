const express = require('express');
const router = express.Router();
const githubService = require('../services/githubService');
const cache = require('../services/cacheService');
const scheduler = require('../services/scheduler');
const reportGenerator = require('../services/reportGenerator');

router.get('/trending', async (req, res) => {
  try {
    const { language = 'all', since = 'daily', force = 'false' } = req.query;

    const cacheKey = `trending:${language}:${since}`;
    let data = cache.get(cacheKey);

    if (!data || force === 'true') {
      data = await githubService.fetchTrendingRepos(language, since);
      if (data.length > 0) {
        cache.set(cacheKey, data);
      }
    }

    const reposWithIntro = data.map(repo => ({
      ...repo,
      intro: githubService.generateProjectIntro(repo),
    }));

    res.json({
      success: true,
      language,
      since,
      count: reposWithIntro.length,
      cached: cache.has(cacheKey),
      data: reposWithIntro,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/trending/all', async (req, res) => {
  try {
    const meta = cache.get('trending:meta');
    const result = {};

    for (const lang of githubService.LANGUAGES) {
      const data = cache.get(`trending:${lang}`);
      if (data && data.length > 0) {
        result[lang] = data.slice(0, 10).map(repo => ({
          ...repo,
          intro: githubService.generateProjectIntro(repo),
        }));
      }
    }

    res.json({
      success: true,
      lastUpdated: meta?.lastUpdated || null,
      languages: Object.keys(result),
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/repo/:author/:name', async (req, res) => {
  try {
    const { author, name } = req.params;
    const cacheKey = `repo:${author}/${name}`;
    let data = cache.get(cacheKey);

    if (!data) {
      data = await githubService.fetchRepoDetails(author, name);
      if (data) {
        cache.set(cacheKey, data, 3600000);
      }
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Repository not found',
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

router.get('/languages', (req, res) => {
  res.json({
    success: true,
    data: githubService.LANGUAGES,
  });
});

router.get('/cache/stats', (req, res) => {
  const stats = cache.getStats();
  const keys = cache.getKeys();
  res.json({ success: true, data: { ...stats, keys } });
});

router.get('/scheduler/status', (req, res) => {
  res.json({ success: true, data: scheduler.getStatus() });
});

router.post('/scheduler/run', async (req, res) => {
  try {
    await scheduler.fetchAllData();
    res.json({ success: true, message: 'Fetch completed' });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 生成单个项目报告
router.post('/reports/generate', async (req, res) => {
  try {
    const { author, name, skipIfExists = false } = req.body;

    if (!author || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: author, name'
      });
    }

    // 直接使用 author 和 name，不需要查询仓库详情
    const repo = {
      author: author,
      name: name
    };

    const result = await reportGenerator.downloadAndSaveReadme(repo, skipIfExists);

    res.json({
      success: true,
      message: result.skipped ? 'Report already exists, skipped' : 'Report generated successfully',
      filePath: result.filePath,
      skipped: result.skipped,
      repo: `${author}/${name}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 批量生成报告
router.post('/reports/generate-batch', async (req, res) => {
  try {
    const { language = 'all', limit = 10 } = req.body;

    const cacheKey = `trending:${language}`;
    let repos = cache.get(cacheKey);

    if (!repos || repos.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No cached data found. Please fetch trending repos first.'
      });
    }

    const reposToProcess = repos.slice(0, limit);
    const results = await reportGenerator.downloadBatchReadmes(reposToProcess);

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Generated ${successCount} reports, ${failCount} failed`,
      total: results.length,
      successCount,
      failCount,
      results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取报告列表
router.get('/reports/list', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const files = await fs.readdir(reportGenerator.REPORTS_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    res.json({
      success: true,
      count: mdFiles.length,
      reports: mdFiles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
