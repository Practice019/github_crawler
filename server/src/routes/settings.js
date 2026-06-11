const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { body, validationResult } = require('express-validator');
const fetch = require('node-fetch');
const lockfile = require('proper-lockfile');

// .env 文件路径
const ENV_FILE_PATH = path.join(__dirname, '..', '..', '..', 'doc_generator', '.env');
const MAIN_ENV_FILE_PATH = path.join(__dirname, '..', '..', '..', '.env');

/**
 * 验证 API Base URL，防止 SSRF 攻击
 * @param {String} apiBase - API 基础地址
 * @returns {Object} - 验证结果
 */
function validateApiBase(apiBase) {
  const allowedDomains = [
    'api.openai.com',
    'api.anthropic.com',
    'openai.api2d.net',
    'api.openai-sb.com',
    'api.closeai-asia.com'
  ];

  try {
    const url = new URL(apiBase);

    // 阻止私有 IP 范围
    const hostname = url.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.match(/^169\.254\./) ||
      hostname.match(/^fc00:/) ||
      hostname.match(/^fe80:/)
    ) {
      return { valid: false, error: '不允许使用私有 IP 地址' };
    }

    // 检查白名单（允许子域名）
    const isAllowed = allowedDomains.some(domain =>
      hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isAllowed) {
      return { valid: false, error: `域名未在白名单中，仅支持: ${allowedDomains.join(', ')}` };
    }

    // 生产环境要求 HTTPS
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      return { valid: false, error: '生产环境必须使用 HTTPS' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'URL 格式无效' };
  }
}

/**
 * 掩码处理敏感数据，只显示后4位
 */
function maskSecret(secret) {
  if (!secret || secret.length <= 4) return '****';
  return '*'.repeat(secret.length - 4) + secret.slice(-4);
}

/**
 * 解析 .env 文件内容
 */
function parseEnvFile(content) {
  const config = {
    apiBase: '',
    apiKey: '',
    model: '',
    protocol: 'openai',
    githubToken: ''
  };

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 跳过注释和空行
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    // 解析键值对
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmedLine.substring(0, equalIndex).trim();
    const value = trimmedLine.substring(equalIndex + 1).trim();

    // 映射环境变量到配置
    if (key === 'OPENAI_API_BASE') {
      config.apiBase = value;
    } else if (key === 'OPENAI_API_KEY') {
      config.apiKey = value;
    } else if (key === 'OPENAI_MODEL') {
      config.model = value;
    } else if (key === 'API_PROTOCOL') {
      config.protocol = value;
    }
  }

  // 如果没有明确设置协议，根据 API base 判断
  if (!config.protocol || config.protocol === '') {
    if (config.apiBase.includes('anthropic.com')) {
      config.protocol = 'claude';
    } else {
      config.protocol = 'openai';
    }
  }

  return config;
}

/**
 * 解析主项目 .env 文件获取 GitHub Token
 */
function parseMainEnvForGithubToken(content) {
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex === -1) continue;

    const key = trimmedLine.substring(0, equalIndex).trim();
    const value = trimmedLine.substring(equalIndex + 1).trim();

    if (key === 'GITHUB_TOKEN') {
      return value;
    }
  }

  return '';
}

/**
 * 更新主项目 .env 文件中的 GitHub Token
 */
async function updateMainEnvGithubToken(githubToken) {
  try {
    let content = await fs.readFile(MAIN_ENV_FILE_PATH, 'utf-8');
    const lines = content.split('\n');
    let tokenFound = false;

    // 更新或添加 GITHUB_TOKEN
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('GITHUB_TOKEN=') || line.startsWith('# GITHUB_TOKEN=')) {
        lines[i] = `GITHUB_TOKEN=${githubToken}`;
        tokenFound = true;
        break;
      }
    }

    // 如果没找到，添加到文件末尾
    if (!tokenFound) {
      lines.push(`GITHUB_TOKEN=${githubToken}`);
    }

    await fs.writeFile(MAIN_ENV_FILE_PATH, lines.join('\n'), 'utf-8');
  } catch (error) {
    console.error('更新主项目 .env 失败:', error);
    throw error;
  }
}

function generateEnvContent(config) {
  const lines = [
    '# OpenAI API 配置',
    `OPENAI_API_KEY=${config.apiKey}`,
    `OPENAI_API_BASE=${config.apiBase}`,
    `OPENAI_MODEL=${config.model}`,
    '',
    '# API 协议类型 (openai 或 claude)',
    `API_PROTOCOL=${config.protocol}`,
    ''
  ];

  return lines.join('\n');
}

/**
 * 测试 API 连接
 */
async function testApiConnection(config) {
  try {
    let url, headers, body;

    if (config.protocol === 'openai') {
      // OpenAI 协议测试
      url = `${config.apiBase}/chat/completions`;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      };
      body = JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
    } else {
      // Claude 协议测试
      url = `${config.apiBase}/v1/messages`;
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      };
      body = JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      timeout: 10000
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// GET /api/settings/doc-generator - 获取文档生成器配置
router.get('/doc-generator', async (req, res) => {
  try {
    // 读取文档生成器 .env 文件
    const content = await fs.readFile(ENV_FILE_PATH, 'utf-8');
    const config = parseEnvFile(content);

    // 读取主项目 .env 文件获取 GitHub Token
    try {
      const mainEnvContent = await fs.readFile(MAIN_ENV_FILE_PATH, 'utf-8');
      config.githubToken = parseMainEnvForGithubToken(mainEnvContent);
    } catch (error) {
      console.warn('读取主项目 .env 失败');
      config.githubToken = '';
    }

    // 掩码处理敏感数据
    const maskedConfig = {
      ...config,
      apiKey: maskSecret(config.apiKey),
      githubToken: maskSecret(config.githubToken)
    };

    res.json({
      success: true,
      config: maskedConfig
    });
  } catch (error) {
    console.error('读取配置失败');

    // 如果文件不存在，返回默认配置
    if (error.code === 'ENOENT') {
      res.json({
        success: true,
        config: {
          apiBase: '',
          apiKey: '',
          model: '',
          protocol: 'openai',
          githubToken: ''
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: '读取配置失败'
      });
    }
  }
});

// POST /api/settings/doc-generator - 更新文档生成器配置
router.post('/doc-generator', [
  body('apiBase').trim().notEmpty().withMessage('API 地址不能为空'),
  body('apiKey').optional().trim(),
  body('model').trim().notEmpty().withMessage('模型名称不能为空'),
  body('protocol').isIn(['openai', 'claude']).withMessage('协议类型无效'),
  body('githubToken').optional().trim()
], async (req, res) => {
  let releaseEnv, releaseMain;
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    const { apiBase, apiKey, model, protocol, githubToken } = req.body;

    // SSRF 防护：验证 URL
    const validation = validateApiBase(apiBase);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // 确保目录存在
    const envDir = path.dirname(ENV_FILE_PATH);
    await fs.mkdir(envDir, { recursive: true });

    // 获取文件锁（5秒超时，最多重试5次）
    try {
      releaseEnv = await lockfile.lock(ENV_FILE_PATH, {
        retries: { retries: 5, minTimeout: 100, maxTimeout: 1000 },
        stale: 10000,
        realpath: false
      });
    } catch (lockError) {
      return res.status(503).json({
        success: false,
        error: '配置文件正在被其他进程使用，请稍后再试'
      });
    }

    // 读取现有配置
    let existingConfig = {
      apiKey: '',
      githubToken: ''
    };

    try {
      const content = await fs.readFile(ENV_FILE_PATH, 'utf-8');
      existingConfig = parseEnvFile(content);

      const mainEnvContent = await fs.readFile(MAIN_ENV_FILE_PATH, 'utf-8');
      existingConfig.githubToken = parseMainEnvForGithubToken(mainEnvContent);
    } catch (error) {
      // 文件不存在或读取失败，使用空值
    }

    // 如果传入的是掩码值，使用现有值
    const finalApiKey = (apiKey && !apiKey.includes('*')) ? apiKey : existingConfig.apiKey;
    const finalGithubToken = (githubToken && !githubToken.includes('*')) ? githubToken : existingConfig.githubToken;

    // 验证最终值不为空
    if (!finalApiKey) {
      return res.status(400).json({
        success: false,
        error: 'API Key 不能为空'
      });
    }
    if (!finalGithubToken) {
      return res.status(400).json({
        success: false,
        error: 'GitHub Token 不能为空'
      });
    }

    // 生成新的 .env 内容
    const newContent = generateEnvContent({
      apiBase,
      apiKey: finalApiKey,
      model,
      protocol
    });

    // 写入文档生成器 .env 文件
    await fs.writeFile(ENV_FILE_PATH, newContent, 'utf-8');
    await fs.chmod(ENV_FILE_PATH, 0o600);

    // 获取主 .env 文件锁
    try {
      releaseMain = await lockfile.lock(MAIN_ENV_FILE_PATH, {
        retries: { retries: 5, minTimeout: 100, maxTimeout: 1000 },
        stale: 10000,
        realpath: false
      });
    } catch (lockError) {
      return res.status(503).json({
        success: false,
        error: '主配置文件正在被其他进程使用，请稍后再试'
      });
    }

    // 更新主项目 .env 文件中的 GitHub Token
    await updateMainEnvGithubToken(finalGithubToken);
    await fs.chmod(MAIN_ENV_FILE_PATH, 0o600);

    res.json({
      success: true,
      message: '配置已保存'
    });
  } catch (error) {
    console.error('保存配置失败');
    res.status(500).json({
      success: false,
      error: '保存配置失败'
    });
  } finally {
    // 释放文件锁
    if (releaseEnv) await releaseEnv();
    if (releaseMain) await releaseMain();
  }
});

// POST /api/settings/test-connection - 测试 API 连接
router.post('/test-connection', [
  body('apiBase').trim().notEmpty(),
  body('apiKey').trim().notEmpty(),
  body('model').trim().notEmpty(),
  body('protocol').isIn(['openai', 'claude'])
], async (req, res) => {
  try {
    // 验证输入
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: '参数不完整'
      });
    }

    const { apiBase, apiKey, model, protocol } = req.body;

    // SSRF 防护：验证 URL
    const validation = validateApiBase(apiBase);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // 测试连接
    const result = await testApiConnection({
      apiBase,
      apiKey,
      model,
      protocol
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'API 连接测试成功'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '测试连接失败'
    });
  }
});

module.exports = router;
