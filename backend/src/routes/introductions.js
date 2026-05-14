const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const INTRODUCTIONS_DIR = path.join(__dirname, '../../../introductions');

/**
 * 提取项目名称（从文件夹名称）
 */
function extractProjectName(foldername) {
  // 格式：owner_repo
  const parts = foldername.split('_');
  if (parts.length >= 2) {
    return parts.slice(1).join('_'); // 返回 repo 名称
  }
  return foldername;
}

/**
 * 提取摘要（从 Markdown 内容提取前 100 字）
 */
function extractSummary(content, maxLength = 100) {
  // 移除 Markdown 标记
  let text = content
    .replace(/^#+\s+/gm, '') // 移除标题
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除加粗
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // 移除链接
    .replace(/`(.+?)`/g, '$1') // 移除代码
    .replace(/\n+/g, ' ') // 替换换行为空格
    .trim();

  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
}

/**
 * 从项目链接.md 中提取 GitHub 链接
 */
function extractGithubLink(content) {
  // 匹配 GitHub URL
  const match = content.match(/https:\/\/github\.com\/[^\s\n)]+/);
  return match ? match[0] : null;
}

/**
 * GET /api/introductions
 * 获取所有项目介绍列表
 */
router.get('/', async (req, res) => {
  try {
    // 读取 introductions 目录
    const folders = await fs.readdir(INTRODUCTIONS_DIR);

    const projects = [];

    for (const folder of folders) {
      const folderPath = path.join(INTRODUCTIONS_DIR, folder);

      // 检查是否是目录
      const stat = await fs.stat(folderPath);
      if (!stat.isDirectory()) continue;

      // 检查是否同时存在两个文件
      const introFile = path.join(folderPath, '项目介绍.md');
      const linkFile = path.join(folderPath, '项目链接.md');

      try {
        await fs.access(introFile);
        await fs.access(linkFile);
      } catch {
        // 文件不存在，跳过
        continue;
      }

      // 读取项目介绍内容
      const introContent = await fs.readFile(introFile, 'utf-8');
      const summary = extractSummary(introContent);

      projects.push({
        id: folder,
        name: extractProjectName(folder),
        summary
      });
    }

    res.json({
      success: true,
      data: projects,
      total: projects.length
    });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取项目列表失败'
    });
  }
});

/**
 * GET /api/introductions/:id
 * 获取单个项目介绍详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const folderPath = path.join(INTRODUCTIONS_DIR, id);

    // 检查文件夹是否存在
    try {
      const stat = await fs.stat(folderPath);
      if (!stat.isDirectory()) {
        return res.status(404).json({
          success: false,
          error: '项目不存在'
        });
      }
    } catch {
      return res.status(404).json({
        success: false,
        error: '项目不存在'
      });
    }

    // 读取两个文件
    const introFile = path.join(folderPath, '项目介绍.md');
    const linkFile = path.join(folderPath, '项目链接.md');

    try {
      const introContent = await fs.readFile(introFile, 'utf-8');
      const linkContent = await fs.readFile(linkFile, 'utf-8');
      const githubLink = extractGithubLink(linkContent);

      res.json({
        success: true,
        data: {
          id,
          name: extractProjectName(id),
          content: introContent,
          link: githubLink
        }
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: '文件读取失败'
      });
    }
  } catch (error) {
    console.error('获取项目详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取项目详情失败'
    });
  }
});

module.exports = router;
