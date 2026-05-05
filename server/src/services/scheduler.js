const cron = require('node-cron');
const githubService = require('../services/githubService');
const cache = require('../services/cacheService');

class SchedulerService {
  constructor() {
    this.tasks = [];
    this.isRunning = false;
    this.lastRun = null;
    this.lastRunStatus = null;
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
    this.fetchAllData();
  }

  async fetchAllData() {
    if (this.isRunning) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    this.lastRun = new Date().toISOString();

    try {
      const results = await githubService.fetchAllTrending();

      for (const [lang, repos] of Object.entries(results)) {
        if (repos.length > 0) {
          cache.set(`trending:${lang}`, repos);
          console.log(`Cached ${repos.length} repos for ${lang}`);
        }
      }

      cache.set('trending:meta', {
        lastUpdated: this.lastRun,
        languages: Object.keys(results).filter(l => results[l].length > 0),
        totalCount: Object.values(results).reduce((sum, r) => sum + r.length, 0),
      });

      this.lastRunStatus = 'success';
    } catch (error) {
      console.error('Scheduled fetch failed:', error.message);
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
