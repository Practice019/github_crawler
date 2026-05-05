const githubService = require('./github');
const cache = require('../utils/cache');

const TECH_STACK_CATEGORIES = {
  webFramework: ['react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'remix', 'gatsby', 'ember'],
  backend: ['express', 'django', 'flask', 'fastapi', 'spring', 'rails', 'gin', 'echo', 'fiber', 'koa', 'nestjs', 'laravel', 'asp.net'],
  database: ['postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'prisma', 'mongoose', 'sequelize', 'typeorm'],
  devops: ['docker', 'kubernetes', 'github actions', 'jenkins', 'terraform', 'ansible', 'ci/cd'],
  testing: ['jest', 'mocha', 'pytest', 'cypress', 'vitest', 'playwright', 'testify'],
  language: ['javascript', 'typescript', 'python', 'go', 'rust', 'java', 'ruby', 'c++', 'c#', 'php', 'swift', 'kotlin']
};

const USE_CASE_KEYWORDS = {
  'web development': ['react', 'vue', 'angular', 'html', 'css', 'webpack', 'vite'],
  'api development': ['express', 'fastapi', 'gin', 'graphql', 'rest', 'api'],
  'machine learning': ['machine learning', 'neural', 'pytorch', 'tensorflow', 'scikit', 'llm', 'ai'],
  'data analysis': ['pandas', 'dataframe', 'visualization', 'analytics', 'data science'],
  'devops tools': ['docker', 'kubernetes', 'deployment', 'ci/cd', 'infrastructure'],
  'mobile development': ['react native', 'flutter', 'ios', 'android', 'mobile'],
  'database tools': ['database', 'orm', 'query', 'migration', 'sql'],
  'cli tools': ['cli', 'command line', 'terminal', 'shell'],
  'game development': ['game', 'unity', 'godot', 'engine', 'render'],
  'security': ['security', 'auth', 'encryption', 'oauth', 'jwt'],
  'monitoring': ['monitor', 'logging', 'metrics', 'observability', 'tracing']
};

function detectTechStack(repo) {
  const stack = [];
  const name = (repo.name || '').toLowerCase();
  const desc = (repo.description || '').toLowerCase();
  const topics = (repo.topics || []).map(t => t.toLowerCase());
  const language = (repo.language || '').toLowerCase();
  const combined = `${name} ${desc} ${topics.join(' ')} ${language}`;

  for (const [category, keywords] of Object.entries(TECH_STACK_CATEGORIES)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        const entry = { category, name: keyword };
        if (!stack.some(s => s.name === entry.name)) {
          stack.push(entry);
        }
      }
    }
  }

  if (repo.language && !stack.some(s => s.name === repo.language.toLowerCase())) {
    stack.unshift({ category: 'language', name: repo.language });
  }

  return stack;
}

function detectUseCases(repo) {
  const useCases = [];
  const name = (repo.name || '').toLowerCase();
  const desc = (repo.description || '').toLowerCase();
  const topics = (repo.topics || []).map(t => t.toLowerCase());
  const combined = `${name} ${desc} ${topics.join(' ')}`;

  for (const [useCase, keywords] of Object.entries(USE_CASE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (combined.includes(keyword.toLowerCase())) {
        if (!useCases.includes(useCase)) {
          useCases.push(useCase);
        }
        break;
      }
    }
  }

  return useCases.length > 0 ? useCases : ['general purpose'];
}

function generateSummary(repo) {
  if (repo.description) return repo.description;
  return `A ${repo.language || 'multi-language'} project with ${repo.stars} stars and ${repo.forks} forks. Last updated on ${new Date(repo.updatedAt).toLocaleDateString()}.`;
}

function generateIntroduction(repo) {
  const summary = generateSummary(repo);
  const techStack = detectTechStack(repo);
  const useCases = detectUseCases(repo);

  const highlights = [];
  if (repo.stars > 10000) highlights.push('Highly popular');
  if (repo.stars > 1000) highlights.push('Well adopted');
  if (repo.forks > 1000) highlights.push('Active community');
  if (repo.openIssues < 10) highlights.push('Well maintained');
  if (repo.license) highlights.push(`Open source (${repo.license})`);

  const languageStats = techStack.filter(t => t.category === 'language').map(t => t.name);
  const frameworkStats = techStack.filter(t => t.category === 'webFramework' || t.category === 'backend').map(t => t.name);

  return {
    summary,
    techStack,
    useCases,
    highlights,
    details: {
      fullName: repo.name,
      language: repo.language,
      languages: languageStats,
      frameworks: frameworkStats,
      stars: repo.stars,
      forks: repo.forks,
      watchers: repo.watchers,
      topics: repo.topics || [],
      license: repo.license,
      lastUpdated: repo.updatedAt,
      url: repo.url
    },
    markdown: formatMarkdown(repo, summary, techStack, useCases, highlights)
  };
}

function formatMarkdown(repo, summary, techStack, useCases, highlights) {
  const lines = [
    `## ${repo.name}`,
    '',
    summary,
    ''
  ];

  if (highlights.length > 0) {
    lines.push(`**Highlights:** ${highlights.join(' | ')}`, '');
  }

  if (techStack.length > 0) {
    lines.push('**Tech Stack:**', '');
    const byCategory = {};
    for (const tech of techStack) {
      if (!byCategory[tech.category]) byCategory[tech.category] = [];
      byCategory[tech.category].push(tech.name);
    }
    for (const [category, items] of Object.entries(byCategory)) {
      lines.push(`- ${category}: ${items.join(', ')}`);
    }
    lines.push('');
  }

  if (useCases.length > 0) {
    lines.push(`**Use Cases:** ${useCases.join(', ')}`, '');
  }

  lines.push(`[View on GitHub](${repo.url})`);
  return lines.join('\n');
}

async function getProjectIntro(repoFullName) {
  const cacheKeyStr = cache.cacheKey(`intro:${repoFullName.replace(/\//g, '-')}`);
  const cached = cache.get(cacheKeyStr);
  if (cached) return cached;

  const query = `repo:${repoFullName}`;
  const repos = await githubService.searchRepositories(query, { per_page: 1 });

  if (repos.length === 0) {
    throw new Error(`Repository ${repoFullName} not found`);
  }

  const intro = generateIntroduction(repos[0]);
  cache.set(cacheKeyStr, intro);
  return intro;
}

async function getBatchProjectIntros(repoFullNames) {
  const results = [];
  for (const name of repoFullNames) {
    try {
      const intro = await getProjectIntro(name);
      results.push({ name, intro, status: 'success' });
    } catch (error) {
      results.push({ name, intro: null, status: 'error', error: error.message });
    }
  }
  return results;
}

function generateIntroFromRepoData(repo) {
  const cacheKeyStr = cache.cacheKey(`intro:data:${repo.name.replace(/[^a-z0-9]/gi, '-')}`);
  const cached = cache.get(cacheKeyStr);
  if (cached) return cached;

  const intro = generateIntroduction(repo);
  cache.set(cacheKeyStr, intro);
  return intro;
}

module.exports = {
  getProjectIntro,
  getBatchProjectIntros,
  generateIntroFromRepoData,
  detectTechStack,
  detectUseCases
};
