const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const INTRODUCTIONS_DIR = path.join(__dirname, 'introductions');

function extractProjectName(content, dirName) {
  const projectName = dirName.includes('_') ? dirName.split('_')[1] : dirName;
  const lines = content.split('\n');
  for (let line of lines) {
    if (line.startsWith('#')) {
      const title = line.replace(/^#+\s*/, '').trim();
      if (title.toLowerCase().includes(projectName.toLowerCase())) {
        return title;
      }
    }
  }
  return dirName;
}

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

function extractOverview(content) {
  const lines = content.split('\n');
  let inOverview = false;
  let overview = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.match(/^#{2,3}\s*项目概述/i)) {
      inOverview = true;
      continue;
    }
    if (inOverview && line.match(/^#{1,3}\s+/)) {
      break;
    }
    if (inOverview && line && line !== '---') {
      overview.push(line);
      if (overview.join(' ').length > 300) {
        break;
      }
    }
  }

  const overviewText = overview.join(' ').trim();
  if (overviewText && overviewText.length > 50) {
    return overviewText.length > 300
      ? overviewText.substring(0, 300) + '...'
      : overviewText;
  }
  return extractSummary(content);
}

function extractGithubLink(content) {
  const match = content.match(/https?:\/\/github\.com\/[^\s\)]+/);
  return match ? match[0] : null;
}

app.get('/test', (req, res) => {
  try {
    console.log('Starting to read projects...');
    const projects = [];
    const dirs = fs.readdirSync(INTRODUCTIONS_DIR);
    console.log('Total dirs:', dirs.length);

    for (const dir of dirs) {
      const projectPath = path.join(INTRODUCTIONS_DIR, dir);
      const stat = fs.statSync(projectPath);

      if (!stat.isDirectory()) continue;

      const introFile = path.join(projectPath, '项目介绍.md');
      const linkFile = path.join(projectPath, '项目链接.md');

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

    projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log('Total projects:', projects.length);
    res.json({
      success: true,
      total: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(4000, () => {
  console.log('Test server running on http://localhost:4000');
});
