const cron = require('node-cron');
const githubService = require('../services/githubService');
const cache = require('../services/cacheService');

class SchedulerService {
  constructor() {
    this.tasks = [];
    this.isRunning = false;
    this.lastRun = null;
    this.lastRunStatus = null;
    this.logListeners = []; // SSE 日志监听器
  }

  // 添加日志监听器
  addLogListener(listener) {
    this.logListeners.push(listener);
  }

  // 移除日志监听器
  removeLogListener(listener) {
    this.logListeners = this.logListeners.filter(l => l !== listener);
  }

  // 发送日志到所有监听器
  sendLog(type, message) {
    const log = {
      type,
      message,
      timestamp: new Date().toISOString()
    };
    console.log(`[${type}] ${message}`);
    this.logListeners.forEach(listener => {
      try {
        listener(log);
      } catch (err) {
        console.error('Failed to send log to listener:', err);
      }
    });
  }

  start() {
    console.log('Starting scheduler...');

    this.fetchTask = cron.schedule('0 */6 * * *', async () => {
      console.log('Scheduled task: Fetching all trending data...');
      await this.fetchAllData();
    });

    this.cleanupTask = cron.schedule('0 */12 * * *', () => {
      console.log('Scheduled task: Cleaning expired cache entries...');
      cache.clear();
    });

    console.log('Scheduler started. Next fetch at 6-hour intervals.');
    console.log('⚠️  Auto-fetch disabled. Use manual update button to fetch data.');
  }

  async fetchAllData() {
    if (this.isRunning) {
      this.sendLog('warning', 'Fetch already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date().toISOString();
    this.sendLog('info', '开始更新缓存...');

    try {
      // 获取所有三种时间范围的数据
      const timeRanges = ['daily', 'weekly', 'monthly'];

      for (const since of timeRanges) {
        this.sendLog('info', `正在获取 ${since} 数据...`);
        const results = await githubService.fetchAllTrending(since);

        for (const [lang, repos] of Object.entries(results)) {
          if (repos.length > 0) {
            cache.set(`trending:${lang}:${since}`, repos);
            this.sendLog('success', `✅ 已缓存 ${repos.length} 个项目 (${lang} - ${since})`);
          }
        }

        cache.set(`trending:meta:${since}`, {
          lastUpdated: this.lastRun,
          languages: Object.keys(results).filter(l => results[l].length > 0),
          totalCount: Object.values(results).reduce((sum, r) => sum + r.length, 0),
        });
      }

      this.lastRunStatus = 'success';
      this.sendLog('success', '✅ 缓存更新完成！');
    } catch (error) {
      this.sendLog('error', `❌ 缓存更新失败: ${error.message}`);
      this.lastRunStatus = 'failed';
    } finally {
      this.isRunning = false;
    }
  }

  stop() {
    if (this.fetchTask) this.fetchTask.stop();
    if (this.cleanupTask) this.cleanupTask.stop();
    console.log('Scheduler stopped.');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      lastRunStatus: this.lastRunStatus,
      cacheStats: cache.getStats(),
    };
  }
}

module.exports = new SchedulerService();
