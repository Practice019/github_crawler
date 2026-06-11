const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { body, validationResult } = require('express-validator');
const fetch = require('node-fetch');

// .env 文件路径
const ENV_FILE_PATH = path.join(__dirname, '..', '..', '..', 'doc_generator', '.env');
const MAIN_ENV_FILE_PATH = path.join(__dirname, '..', '..', '..', '.env');

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
      console.warn('读取主项目 .env 失败:', error);
      config.githubToken = '';
    }

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('读取配置失败:', error);

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
  body('apiKey').trim().notEmpty().withMessage('API Key 不能为空'),
  body('model').trim().notEmpty().withMessage('模型名称不能为空'),
  body('protocol').isIn(['openai', 'claude']).withMessage('协议类型无效'),
  body('githubToken').trim().notEmpty().withMessage('GitHub Token 不能为空')
], async (req, res) => {
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

    // 生成新的 .env 内容
    const newContent = generateEnvContent({
      apiBase,
      apiKey,
      model,
      protocol
    });

    // 确保目录存在
    const envDir = path.dirname(ENV_FILE_PATH);
    await fs.mkdir(envDir, { recursive: true });

    // 写入文档生成器 .env 文件
    await fs.writeFile(ENV_FILE_PATH, newContent, 'utf-8');

    // 更新主项目 .env 文件中的 GitHub Token
    await updateMainEnvGithubToken(githubToken);

    res.json({
      success: true,
      message: '配置已保存'
    });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({
      success: false,
      error: '保存配置失败'
    });
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
    console.error('测试连接失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
