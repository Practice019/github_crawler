const axios = require('axios');
const config = require('../config');
const cache = require('../utils/cache');

const RATE_LIMIT_RETRY_DELAY = 60000;
const MAX_RETRIES = 3;
const CACHE_PREFIX = 'github:';

const apiClient = axios.create({
  baseURL: config.github.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    ...(config.github.token ? { 'Authorization': `token ${config.github.token}` } : {})
  }
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 403 && error.response.headers['x-ratelimit-remaining'] === '0') {
      const resetTime = parseInt(error.response.headers['x-ratelimit-reset'], 10) * 1000;
      const waitTime = Math.min(resetTime - Date.now(), RATE_LIMIT_RETRY_DELAY * MAX_RETRIES);
      console.warn(`GitHub API rate limit hit, waiting ${waitTime}ms`);
      await sleep(waitTime);
      return apiClient.request(error.config);
    }
    return Promise.reject(error);
  }
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheKey(suffix) {
  return `${CACHE_PREFIX}${suffix}`;
}

function normalizeRepo(repo) {
  return {
    id: repo.id,
    name: repo.full_name,
    owner: repo.owner.login,
    ownerAvatar: repo.owner.avatar_url,
    description: repo.description || '',
    url: repo.html_url,
    homepage: repo.homepage || '',
    language: repo.language || 'Unknown',
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    openIssues: repo.open_issues_count,
    watchers: repo.watchers_count,
    size: repo.size,
    topics: repo.topics || [],
    license: repo.license ? repo.license.spdx_id : null,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at
  };
}

async function searchRepositories(query, params = {}) {
  const response = await apiClient.get('/search/repositories', {
    params: {
      q: query,
      sort: 'stars',
      order: 'desc',
      per_page: config.github.perPage,
      ...params
    }
  });
  return response.data.items.map(normalizeRepo);
}

async function getTrendingProjects(options = {}) {
  const { since = 'weekly', language } = options;
  const cacheKeyStr = cacheKey(`trending:${language || 'all'}:${since}`);
  const cached = cache.get(cacheKeyStr);
  if (cached) return cached;

  let query = 'stars:>100';
  if (language) {
    query += ` language:${language}`;
  }

  // 动态计算日期范围
  const now = new Date();
  let dateRange;
  switch (since) {
    case 'daily':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      dateRange = `>${yesterday.toISOString().split('T')[0]}`;
      break;
    case 'weekly':
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      dateRange = `>${lastWeek.toISOString().split('T')[0]}`;
      break;
    case 'monthly':
      const lastMonth = new Date(now);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      dateRange = `>${lastMonth.toISOString().split('T')[0]}`;
      break;
    default:
      const defaultWeek = new Date(now);
      defaultWeek.setDate(defaultWeek.getDate() - 7);
      dateRange = `>${defaultWeek.toISOString().split('T')[0]}`;
  }
  query += ` pushed:${dateRange}`;

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const repos = await searchRepositories(query);
      cache.set(cacheKeyStr, repos);
      return repos;
    } catch (error) {
      retries++;
      if (retries >= MAX_RETRIES || error.response?.status !== 403) {
        throw error;
      }
      await sleep(RATE_LIMIT_RETRY_DELAY * retries);
    }
  }
}

async function getTrendingByLanguage(language, options = {}) {
  return getTrendingProjects({ ...options, language });
}

module.exports = {
  getTrendingProjects,
  getTrendingByLanguage,
  searchRepositories,
  apiClient
};
