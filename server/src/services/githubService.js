const axios = require('axios');
const { addProxyToConfig } = require('../utils/proxyConfig');

// 常量定义
const GITHUB_API = 'https://api.github.com';
const GITHUB_TRENDING = 'https://github.com/trending';
const LANGUAGES = ['', 'javascript', 'typescript', 'python', 'go', 'rust', 'java', 'cpp', 'vue'];
const MAX_RETRIES = 3;
const INITIAL_RETRY_WAIT = 5000;
const MAX_RETRY_WAIT = 30000;
const REQUEST_TIMEOUT = 30000;

const sinceDays = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/**
 * 构建 Trending URL
 * @param {String} language - 编程语言
 * @param {String} since - 时间范围
 * @returns {String} - 完整 URL
 */
function buildTrendingUrl(language, since) {
  let url = GITHUB_TRENDING;
  if (language !== 'all') {
    url += `/${language}`;
  }
  return `${url}?since=${since}`;
}

/**
 * 获取 HTML 内容
 * @param {String} url - 目标 URL
 * @returns {String} - HTML 内容
 */
async function fetchHtml(url) {
  const response = await axios.get(url, addProxyToConfig({
    headers: {
      'Accept': 'text/html',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    timeout: REQUEST_TIMEOUT
  }));
  return response.data;
}

/**
 * 检查是否没有仓库
 * @param {Object} $ - Cheerio 对象
 * @returns {Boolean} - 是否没有仓库
 */
function hasNoRepos($) {
  const noReposMessage = $('.blankslate').text();
  return noReposMessage.indexOf('have any trending repositories') > 0;
}

/**
 * 解析数字文本
 * @param {String} text - 包含数字的文本
 * @returns {Number} - 解析后的数字
 */
function parseNumber(text) {
  return parseInt(text.trim().replace(/,/g, '')) || 0;
}

/**
 * 解析单个仓库
 * @param {Object} $ - Cheerio 对象
 * @param {Object} $repo - 仓库元素
 * @returns {Object|null} - 仓库信息
 */
function parseRepo($, $repo) {
  try {
    const repoPath = $repo.find('h2 a').attr('href');
    if (!repoPath) return null;

    const name = repoPath.replace(/^\//, '');
    const [author, repoName] = name.split('/');

    return {
      id: name,
      author,
      name: repoName,
      url: `https://github.com/${name}`,
      avatar: `https://github.com/${author}.png`,
      description: $repo.find('p').text().trim() || 'No description provided',
      language: $repo.find('[itemprop=programmingLanguage]').text().trim() || 'Unknown',
      stars: parseNumber($repo.find(`[href*="/${name}/stargazers"]`).text()),
      forks: parseNumber($repo.find(`[href*="/${name}/forks"]`).text()),
      todayStars: parseNumber($repo.find('.float-sm-right').text()),
      starsAdded: parseNumber($repo.find('.float-sm-right').text()),
      topics: [],
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error parsing repo:', err.message);
    return null;
  }
}

/**
 * 解析仓库列表
 * @param {String} html - HTML 内容
 * @param {String} language - 编程语言
 * @returns {Array} - 仓库列表
 */
function parseRepos(html, language) {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);

  if (hasNoRepos($)) {
    console.log(`No trending repos found for ${language}`);
    return [];
  }

  const repos = [];
  $('.Box-row').each((index, element) => {
    const repo = parseRepo($, $(element));
    if (repo) repos.push(repo);
  });

  // 按今日新增 Star 数排序
  repos.sort((a, b) => b.starsAdded - a.starsAdded);

  console.log(`Found ${repos.length} trending repos`);
  return repos;
}

/**
 * 等待后重试
 * @param {Number} attempt - 当前尝试次数
 */
async function retryWait(attempt) {
  const waitTime = Math.min(INITIAL_RETRY_WAIT * Math.pow(2, attempt - 1), MAX_RETRY_WAIT);
  console.log(`Retrying in ${waitTime}ms...`);
  await new Promise(resolve => setTimeout(resolve, waitTime));
}

/**
 * 单次尝试获取 Trending
 * @param {String} language - 编程语言
 * @param {String} since - 时间范围
 * @param {Number} attempt - 尝试次数
 * @returns {Array} - 仓库列表
 */
async function attemptFetch(language, since, attempt) {
  const url = buildTrendingUrl(language, since);
  console.log(`[Attempt ${attempt}/${MAX_RETRIES}] Fetching: ${url}`);

  const html = await fetchHtml(url);
  const repos = parseRepos(html, language);

  console.log(`✅ Successfully fetched ${repos.length} trending repos for ${language}`);
  return repos;
}

/**
 * 爬取 GitHub Trending 页面获取真正的热门项目
 * @param {String} language - 编程语言
 * @param {String} since - 时间范围 (daily/weekly/monthly)
 * @returns {Array} - 热门仓库列表
 */
async function fetchTrendingRepos(language = 'all', since = 'daily') {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await attemptFetch(language, since, attempt);
    } catch (error) {
      console.error(`[Attempt ${attempt}/${MAX_RETRIES}] Error:`, error.message);

      if (attempt === MAX_RETRIES) {
        console.error(`Failed to fetch trending repos after ${MAX_RETRIES} attempts`);
        return [];
      }

      await retryWait(attempt);
    }
  }

  return [];
}

async function fetchRepoDetails(author, name) {
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Trending-App',
    };

    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }

    const axiosConfig = addProxyToConfig({
      headers,
      timeout: REQUEST_TIMEOUT
    });

    const response = await axios.get(`${GITHUB_API}/repos/${author}/${name}`, axiosConfig);
    return response.data;
  } catch (error) {
    console.error(`Error fetching repo details for ${author}/${name}:`, error.message);
    return null;
  }
}

async function fetchAllTrending(since = 'daily') {
  const results = {};

  for (const lang of LANGUAGES) {
    const langKey = lang || 'all';
    console.log(`Fetching trending for ${langKey}...`);

    try {
      const repos = await fetchTrendingRepos(langKey, since);
      results[langKey] = repos;

      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`Error fetching ${langKey}:`, error.message);
      results[langKey] = [];
    }
  }

  return results;
}

module.exports = {
  fetchTrendingRepos,
  fetchRepoDetails,
  fetchAllTrending,
  LANGUAGES,
};
