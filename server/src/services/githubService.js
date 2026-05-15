const axios = require('axios');
const { addProxyToConfig } = require('../utils/proxyConfig');
const GITHUB_API = 'https://api.github.com';
const GITHUB_TRENDING = 'https://github.com/trending';
const LANGUAGES = ['', 'javascript', 'typescript', 'python', 'go', 'rust', 'java', 'cpp', 'vue'];

const sinceDays = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/**
 * 爬取 GitHub Trending 页面获取真正的热门项目
 * 参考：github-trending-repos 项目的实现
 * @param {String} language - 编程语言
 * @param {String} since - 时间范围 (daily/weekly/monthly)
 * @returns {Array} - 热门仓库列表
 */
async function fetchTrendingRepos(language = 'all', since = 'daily') {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const cheerio = require('cheerio');

      // 构建 URL
      let url = `${GITHUB_TRENDING}`;
      if (language !== 'all') {
        url += `/${language}`;
      }
      url += `?since=${since}`;

      console.log(`[Attempt ${attempt}/${maxRetries}] Fetching trending from: ${url}`);

      const response = await axios.get(url, addProxyToConfig({
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 30000
      }));

      const html = response.data;
      const $ = cheerio.load(html);
      const repos = [];

      // 使用参考项目的选择器
      const repoSelector = '.Box-row';
      const $repos = $(repoSelector);

      console.log(`Found ${$repos.length} trending repos`);

      // 检查是否有"没有trending repos"的消息
      const noReposMessage = $('.blankslate').text();
      if (noReposMessage.indexOf('have any trending repositories') > 0) {
        console.log(`No trending repos found for ${language}`);
        return [];
      }

      // 解析每个仓库
      $repos.each((index, element) => {
        try {
          const $repo = $(element);

          // 获取仓库名称（格式：owner/name）
          const nameSelector = 'h2 a';
          const repoPath = $repo.find(nameSelector).attr('href');
          if (!repoPath) return;

          const name = repoPath.replace(/^\//, ''); // 移除开头的 /
          const [author, repoName] = name.split('/');

          // 获取描述
          const description = $repo.find('p').text().trim() || 'No description provided';

          // 获取语言
          const repoLanguage = $repo.find('[itemprop=programmingLanguage]').text().trim() || 'Unknown';

          // 获取今日新增 Star 数（最重要的指标）
          const starsAddedText = $repo.find('.float-sm-right').text().trim();
          const starsAdded = parseInt(starsAddedText.replace(/,/g, '')) || 0;

          // 获取总 Star 数
          const starsText = $repo.find(`[href*="/${name}/stargazers"]`).text().trim();
          const stars = parseInt(starsText.replace(/,/g, '')) || 0;

          // 获取 Fork 数
          const forksText = $repo.find(`[href*="/${name}/forks"]`).text().trim();
          const forks = parseInt(forksText.replace(/,/g, '')) || 0;

          repos.push({
            id: name,
            author: author,
            name: repoName,
            url: `https://github.com/${name}`,
            avatar: `https://github.com/${author}.png`,
            description: description,
            language: repoLanguage,
            stars: stars,
            forks: forks,
            todayStars: starsAdded, // 今日新增 Star 数
            starsAdded: starsAdded, // 保留原始字段名
            topics: [],
            fetchedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.error('Error parsing repo:', err.message);
        }
      });

      // 按今日新增 Star 数排序（从高到低）
      repos.sort((a, b) => b.starsAdded - a.starsAdded);

      console.log(`✅ Successfully fetched ${repos.length} trending repos for ${language}`);
      return repos;

    } catch (error) {
      console.error(`[Attempt ${attempt}/${maxRetries}] Error:`, error.message);
      console.error(`Error name: ${error.name}`);
      console.error(`Error stack:`, error.stack);

      if (attempt === maxRetries) {
        console.error(`Failed to fetch trending repos after ${maxRetries} attempts`);
        return [];
      }

      // 等待后重试（指数退避）
      const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 30000);
      console.log(`Retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
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
      timeout: 30000
    });

    const [repoRes, readmeRes] = await Promise.all([
      axios.get(`${GITHUB_API}/repos/${author}/${name}`, axiosConfig),
      axios.get(`${GITHUB_API}/repos/${author}/${name}/readme`, {
        ...axiosConfig,
        headers: { ...headers, 'Accept': 'application/vnd.github.v3.raw' },
      }),
    ]);

    const repo = repoRes.data;
    let readme = '';
    if (readmeRes.status === 200) {
      readme = readmeRes.data;
    }

    return {
      author: repo.owner.login,
      name: repo.name,
      description: repo.description || '',
      homepage: repo.homepage || '',
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language || 'Unknown',
      topics: repo.topics || [],
      license: repo.license?.spdx_id || 'Unknown',
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      readme: readme ? readme.substring(0, 2000) : 'No README available',
    };
  } catch (error) {
    console.error(`Error fetching repo details (${author}/${name}):`, error.message);
    return null;
  }
}

async function fetchAllTrending(since = 'daily') {
  const results = {};

  for (const lang of LANGUAGES) {
    const langName = lang || 'all';
    const cacheKey = lang || 'all'; // 空字符串存储为 'all'
    console.log(`Fetching trending for: ${langName} (${since})`);
    results[cacheKey] = await fetchTrendingRepos(lang, since);
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return results;
}

function generateProjectIntro(repo) {
  const intro = [];
  intro.push(`**${repo.name}** 是由 ${repo.author} 开发的开源项目。`);

  if (repo.description && repo.description !== 'No description provided') {
    intro.push(repo.description);
  }

  if (repo.language && repo.language !== 'Unknown') {
    intro.push(`主要使用 ${repo.language} 编写。`);
  }

  intro.push(`该项目已获得 ${repo.stars.toLocaleString()} 个 Star，${repo.forks.toLocaleString()} 个 Fork。`);

  if (repo.todayStars > 0) {
    intro.push(`近期新增 ${repo.todayStars} 个 Star，热度持续上升。`);
  }

  if (repo.topics && repo.topics.length > 0) {
    intro.push(`相关标签：${repo.topics.slice(0, 5).join('、')}。`);
  }

  return intro.join(' ');
}

/**
 * 分页获取 trending 项目
 * @param {Object} options - 选项
 * @returns {Object} - 分页结果
 */
async function fetchTrendingPaginated(options = {}) {
  const { language = 'all', since = 'daily', page = 1, perPage = 20 } = options;

  const allRepos = await fetchTrendingRepos(language, since);
  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    data: allRepos.slice(start, end),
    pagination: {
      page,
      perPage,
      total: allRepos.length,
      totalPages: Math.ceil(allRepos.length / perPage),
      hasNext: end < allRepos.length,
      hasPrev: page > 1
    }
  };
}

module.exports = {
  fetchTrendingRepos,
  fetchRepoDetails,
  fetchAllTrending,
  fetchTrendingPaginated,
  generateProjectIntro,
  LANGUAGES,
};
