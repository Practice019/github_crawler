const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const INTRODUCTIONS_DIR = path.join(__dirname, '..', '..', '..', 'introductions');

/**
 * 验证和清理路径参数
 * @param {String} id - 用户提供的 ID
 * @returns {String} - 验证后的安全路径
 * @throws {Error} - 如果路径无效
 */
function validateAndSanitizePath(id) {
  // 验证 ID 格式 - 只允许字母、数字、下划线、连字符（不允许点号）
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error('无效的项目ID格式');
  }

  // 构建完整路径
  const projectPath = path.resolve(INTRODUCTIONS_DIR, id);

  // 确保路径在预期目录内
  if (!projectPath.startsWith(path.resolve(INTRODUCTIONS_DIR) + path.sep)) {
    throw new Error('无效的项目路径');
  }

  return projectPath;
}

/**
 * 从项目介绍.md中提取项目名称
 * @param {String} content - Markdown 内容
 * @param {String} dirName - 目录名（格式：作者_项目名）
 */
function extractProjectName(content, dirName) {
  const projectName = dirName.split('_')[1] || dirName;

  const headings = content
    .split('\n')
    .filter(line => line.startsWith('#'))
    .map(line => line.replace(/^#+\s*/, '').trim());

  return headings.find(heading =>
    heading.toLowerCase().includes(projectName.toLowerCase())
  ) || dirName;
}

/**
 * 从项目介绍.md中提取摘要（第一段文本）
 */
function extractSummary(content) {
  const MAX_SUMMARY_LENGTH = 150;

  const firstParagraph = content
    .split('\n')
    .map(line => line.trim())
    .find(line => line && !line.startsWith('#') && !line.startsWith('```'));

  if (!firstParagraph) {
    return '暂无摘要';
  }

  return firstParagraph.length > MAX_SUMMARY_LENGTH
    ? firstParagraph.substring(0, MAX_SUMMARY_LENGTH) + '...'
    : firstParagraph;
}

/**
 * 从项目介绍.md中提取项目概述部分
 */
function extractOverview(content) {
  const OVERVIEW_HEADING_PATTERN = /^#{2,3}\s*项目概述/i;
  const MAX_OVERVIEW_LENGTH = 300;
  const MIN_OVERVIEW_LENGTH = 50;

  const lines = content.split('\n').map(l => l.trim());
  const overviewStart = lines.findIndex(line => OVERVIEW_HEADING_PATTERN.test(line));

  if (overviewStart === -1) {
    return extractSummary(content);
  }

  const overviewLines = [];
  for (let i = overviewStart + 1; i < lines.length; i++) {
    const line = lines[i];

    // 遇到下一个标题，停止收集
    if (line.match(/^#{1,3}\s+/)) break;

    // 收集有效内容
    if (line && line !== '---') {
      overviewLines.push(line);
      if (overviewLines.join(' ').length > MAX_OVERVIEW_LENGTH) break;
    }
  }

  const overviewText = overviewLines.join(' ').trim();

  if (overviewText.length > MIN_OVERVIEW_LENGTH) {
    return overviewText.length > MAX_OVERVIEW_LENGTH
      ? overviewText.substring(0, MAX_OVERVIEW_LENGTH) + '...'
      : overviewText;
  }

  return extractSummary(content);
}

/**
 * 从项目链接.md中提取GitHub链接
 */
function extractGithubLink(content) {
  const match = content.match(/https?:\/\/github\.com\/[^\s\)]+/);
  return match ? match[0] : null;
}

// GET /api/introductions - 获取所有项目介绍列表
router.get('/', async (req, res) => {
  try {
    // 检查目录是否存在
    try {
      await fs.access(INTRODUCTIONS_DIR);
    } catch (error) {
      return res.json({ success: true, data: [] });
    }

    const projects = [];
    const dirs = await fs.readdir(INTRODUCTIONS_DIR);

    for (const dir of dirs) {
      try {
        const projectPath = path.join(INTRODUCTIONS_DIR, dir);
        const stat = await fs.stat(projectPath);

        if (!stat.isDirectory()) continue;

        const introFile = path.join(projectPath, '项目介绍.md');
        const linkFile = path.join(projectPath, '项目链接.md');

        // 检查文件是否存在
        const [introExists, linkExists] = await Promise.all([
          fs.access(introFile).then(() => true).catch(() => false),
          fs.access(linkFile).then(() => true).catch(() => false)
        ]);

        // 只显示同时有两个文件的项目
        if (introExists && linkExists) {
          const [introContent, linkContent] = await Promise.all([
            fs.readFile(introFile, 'utf-8'),
            fs.readFile(linkFile, 'utf-8')
          ]);

          const name = extractProjectName(introContent, dir);
          const summary = extractSummary(introContent);
          const overview = extractOverview(introContent);
          const githubLink = extractGithubLink(linkContent);

          projects.push({
            id: dir,
            name,
            summary,
            overview,
            githubLink,
            createdAt: stat.birthtime
          });
        }
      } catch (error) {
        console.error(`Error processing project ${dir}:`, error.message);
        // 继续处理其他项目
        continue;
      }
    }

    // 按创建时间倒序排序
    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`📊 Total projects found: ${projects.length}`);

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching introductions:', error);
    res.status(500).json({
      success: false,
      error: '获取项目列表失败'
    });
  }
});

// GET /api/introductions/:id - 获取单个项目介绍详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 验证和清理路径
    let projectPath;
    try {
      projectPath = validateAndSanitizePath(id);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // 检查项目目录是否存在
    try {
      await fs.access(projectPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      });
    }

    const introFile = path.join(projectPath, '项目介绍.md');
    const linkFile = path.join(projectPath, '项目链接.md');

    // 检查文件是否存在
    const [introExists, linkExists] = await Promise.all([
      fs.access(introFile).then(() => true).catch(() => false),
      fs.access(linkFile).then(() => true).catch(() => false)
    ]);

    if (!introExists || !linkExists) {
      return res.status(404).json({
        success: false,
        error: '项目文件不完整'
      });
    }

    // 读取文件内容
    const [introContent, linkContent] = await Promise.all([
      fs.readFile(introFile, 'utf-8'),
      fs.readFile(linkFile, 'utf-8')
    ]);

    const name = extractProjectName(introContent, id);
    const githubLink = extractGithubLink(linkContent);

    res.json({
      success: true,
      data: {
        id,
        name,
        content: introContent,
        githubLink
      }
    });
  } catch (error) {
    console.error('Error fetching introduction detail:', error);
    res.status(500).json({
      success: false,
      error: '获取项目详情失败'
    });
  }
});

module.exports = router;
