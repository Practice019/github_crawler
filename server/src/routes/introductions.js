const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const INTRODUCTIONS_DIR = path.join(__dirname, '..', '..', '..', 'introductions');

/**
 * 从项目介绍.md中提取项目名称
 * @param {String} content - Markdown 内容
 * @param {String} dirName - 目录名（格式：作者_项目名）
 */
function extractProjectName(content, dirName) {
  // 从目录名中提取项目名（下划线后面的部分）
  const projectName = dirName.includes('_') ? dirName.split('_')[1] : dirName;

  // 在 Markdown 中查找包含项目名的标题（不区分大小写）
  const lines = content.split('\n');
  for (let line of lines) {
    if (line.startsWith('#')) {
      const title = line.replace(/^#+\s*/, '').trim();
      // 检查标题是否包含项目名（不区分大小写）
      if (title.toLowerCase().includes(projectName.toLowerCase())) {
        return title;
      }
    }
  }

  // 如果没找到匹配的标题，返回目录名
  return dirName;
}

/**
 * 从项目介绍.md中提取摘要（第一段文本）
 */
function extractSummary(content) {
  const lines = content.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line && !line.startsWith('#') && !line.startsWith('```')) {
      return line.length > 150 ? line.substring(0, 150) + '...' : line;
    }
  }
  return '暂无摘要';
}

/**
 * 从项目介绍.md中提取项目概述部分
 */
function extractOverview(content) {
  // 查找"项目概述"部分（支持二级或三级标题）
  const lines = content.split('\n');
  let inOverview = false;
  let overview = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 检测是否进入项目概述部分（支持 ## 或 ### 标题）
    if (line.match(/^#{2,3}\s*项目概述/i)) {
      inOverview = true;
      continue;
    }

    // 如果遇到下一个同级或更高级标题，停止收集
    if (inOverview && line.match(/^#{1,3}\s+/)) {
      break;
    }

    // 收集概述内容（跳过空行和分隔符）
    if (inOverview && line && line !== '---') {
      overview.push(line);
      // 限制概述长度，最多收集到300字
      if (overview.join(' ').length > 300) {
        break;
      }
    }
  }

  const overviewText = overview.join(' ').trim();

  // 如果找到了概述内容，返回它（限制在300字以内）
  if (overviewText && overviewText.length > 50) {
    return overviewText.length > 300
      ? overviewText.substring(0, 300) + '...'
      : overviewText;
  }

  // 如果没找到项目概述，使用第一段有效内容
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
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(INTRODUCTIONS_DIR)) {
      return res.json({ success: true, data: [] });
    }

    const projects = [];
    const dirs = fs.readdirSync(INTRODUCTIONS_DIR);

    for (const dir of dirs) {
      const projectPath = path.join(INTRODUCTIONS_DIR, dir);
      const stat = fs.statSync(projectPath);

      if (!stat.isDirectory()) continue;

      const introFile = path.join(projectPath, '项目介绍.md');
      const linkFile = path.join(projectPath, '项目链接.md');

      // 只显示同时有两个文件的项目
      if (fs.existsSync(introFile) && fs.existsSync(linkFile)) {
        const introContent = fs.readFileSync(introFile, 'utf-8');
        const linkContent = fs.readFileSync(linkFile, 'utf-8');

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
    }

    // 按创建时间倒序排序
    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching introductions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/introductions/:id - 获取单个项目介绍详情
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const projectPath = path.join(INTRODUCTIONS_DIR, id);

    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      });
    }

    const introFile = path.join(projectPath, '项目介绍.md');
    const linkFile = path.join(projectPath, '项目链接.md');

    if (!fs.existsSync(introFile) || !fs.existsSync(linkFile)) {
      return res.status(404).json({
        success: false,
        error: '项目文件不完整'
      });
    }

    const introContent = fs.readFileSync(introFile, 'utf-8');
    const linkContent = fs.readFileSync(linkFile, 'utf-8');

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
      error: error.message
    });
  }
});

module.exports = router;
