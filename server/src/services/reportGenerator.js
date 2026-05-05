const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

const REPORTS_DIR = path.join(__dirname, '..', '..', '..', 'reports');

/**
 * 从 GitHub 下载原生 README.md
 * @param {Object} repo - 项目信息
 * @returns {String} - README 内容
 */
async function downloadReadme(repo) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const headers = {
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'GitHub-Trending-App',
      };

      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      const response = await axios.get(`https://api.github.com/repos/${repo.author}/${repo.name}/readme`, {
        headers,
        timeout: 30000,
        proxy: {
          host: '127.0.0.1',
          port: 7890,
          protocol: 'http'
        },
        validateStatus: null // 允许所有状态码，手动处理
      });

      // 检查速率限制
      if (response.status === 403) {
        const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
        const rateLimitReset = response.headers['x-ratelimit-reset'];

        if (rateLimitRemaining === '0') {
          const resetTime = new Date(parseInt(rateLimitReset) * 1000);
          const waitMinutes = Math.ceil((resetTime - new Date()) / 60000);
          throw new Error(`GitHub API rate limit exceeded. Resets in ${waitMinutes} minutes. Consider adding GITHUB_TOKEN to .env file.`);
        }
        throw new Error(`GitHub API access forbidden. Check your GITHUB_TOKEN.`);
      }

      if (response.status !== 200) {
        if (response.status === 404) {
          throw new Error(`README not found (repository may not have a README file)`);
        } else if (response.status === 401) {
          throw new Error(`Authentication failed (check GITHUB_TOKEN)`);
        } else {
          throw new Error(`Failed to fetch README: HTTP ${response.status}`);
        }
      }

      const readme = response.data;

      if (!readme || readme.trim().length === 0) {
        throw new Error(`README file is empty`);
      }

      return readme;
    } catch (error) {
      lastError = error;

      // 如果是速率限制错误，不重试
      if (error.message.includes('rate limit')) {
        throw error;
      }

      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        console.error(`Error downloading README for ${repo.author}/${repo.name} after ${maxRetries} attempts:`, error.message);
        throw error;
      }

      // 等待后重试（指数退避）
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Retry ${attempt}/${maxRetries} for ${repo.author}/${repo.name} after ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError;
}

/**
 * 检查报告文件是否已存在
 * @param {String} filename - 文件名
 * @returns {Boolean} - 文件是否存在
 */
async function reportExists(filename) {
  try {
    const filePath = path.join(REPORTS_DIR, filename);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * 下载并保存原生 README.md
 * @param {Object} repo - 项目信息
 * @param {Boolean} skipIfExists - 如果文件已存在是否跳过
 * @returns {Object} - 包含文件路径和是否跳过的信息
 */
async function downloadAndSaveReadme(repo, skipIfExists = false) {
  const filename = `${repo.author}_${repo.name}.md`;

  // 检查文件是否已存在
  if (skipIfExists && await reportExists(filename)) {
    const filePath = path.join(REPORTS_DIR, filename);
    return { filePath, skipped: true };
  }

  const readme = await downloadReadme(repo);
  const filePath = await saveReport(filename, readme);

  return { filePath, skipped: false };
}

/**
 * 生成项目详细报告（博客文章风格）
 * @param {Object} repo - 项目信息
 * @returns {String} - Markdown 格式的报告内容
 */
function generateProjectReport(repo) {
  const report = `# ${repo.name} - 深度解析与应用指南

> 一个值得关注的 ${repo.language} 开源项目

---

## 📋 项目概览

**项目名称：** ${repo.name}
**开发者：** ${repo.author}
**项目地址：** [${repo.url}](${repo.url})
**主要语言：** ${repo.language}
**社区热度：** ⭐ ${repo.stars.toLocaleString()} Stars | 🍴 ${repo.forks.toLocaleString()} Forks
${repo.todayStars > 0 ? `**近期趋势：** 🔥 新增 ${repo.todayStars} 个 Star，热度持续上升\n` : ''}
---

## 🎯 项目简介

${repo.description || '这是一个创新的开源项目，致力于为开发者社区提供优质的解决方案。'}

${repo.name} 是由 ${repo.author} 开发和维护的开源项目，使用 ${repo.language} 作为主要开发语言。该项目在 GitHub 上已经获得了 ${repo.stars.toLocaleString()} 个 Star，这充分证明了其在开发者社区中的认可度和影响力。

## 🚀 项目背景与诞生原因

在现代软件开发中，开发者经常面临各种技术挑战和实际问题。${repo.name} 的诞生正是为了解决这些痛点。

${repo.description ? `该项目专注于 ${repo.description.toLowerCase()}，` : ''}通过提供高质量的代码实现和完善的文档支持，帮助开发者更高效地完成工作。项目的核心理念是：**简化复杂性，提升开发效率，促进技术创新**。

随着项目的不断发展，${repo.name} 已经吸引了 ${repo.forks.toLocaleString()} 个 Fork，这意味着有大量开发者正在基于这个项目进行二次开发和定制化应用。这种活跃的社区参与度是项目持续进步的重要动力。

## 💡 核心功能与特性

${repo.name} 提供了一系列强大的功能和特性，主要包括：

### 主要功能

1. **核心能力**
   - 基于 ${repo.language} 技术栈构建，确保代码质量和性能
   - 提供完整的功能实现，满足实际应用需求
   - 支持灵活的配置和扩展，适应不同场景

2. **技术优势**
   - 采用现代化的开发理念和最佳实践
   - 代码结构清晰，易于理解和维护
   - 完善的错误处理和异常管理机制

3. **社区支持**
   - 活跃的开发者社区，持续更新和改进
   - 详细的文档和示例代码
   - 及时的问题反馈和解决机制

${repo.topics && repo.topics.length > 0 ? `
### 技术标签

项目涉及的技术领域包括：${repo.topics.slice(0, 10).map(t => `**${t}**`).join('、')}。这些标签反映了项目的技术广度和应用范围。
` : ''}

## 🏗️ 技术架构分析

${repo.name} 采用 ${repo.language} 作为主要开发语言，这为项目带来了以下优势：

### 技术选型

- **开发语言：** ${repo.language}
- **架构风格：** 现代化、模块化设计
- **代码质量：** 经过 ${repo.stars.toLocaleString()} 个 Star 的社区验证

### 设计理念

项目遵循以下设计原则：

1. **可维护性**：代码结构清晰，模块划分合理，便于长期维护
2. **可扩展性**：支持插件化扩展，满足不同场景需求
3. **性能优化**：注重运行效率，优化关键路径
4. **安全性**：重视代码安全，防范常见漏洞

## 📱 实际应用场景

${repo.name} 可以应用于多种实际场景，为不同类型的项目提供支持：

### 适用场景

${repo.topics && repo.topics.length > 0 ?
  repo.topics.slice(0, 6).map((topic, index) => `
${index + 1}. **${topic} 相关应用**
   - 适合需要 ${topic} 功能的项目
   - 可以作为 ${topic} 解决方案的参考实现
   - 帮助开发者快速构建 ${topic} 相关功能`).join('\n') :
  `
1. **${repo.language} 项目开发**
   - 作为项目基础框架或核心组件
   - 提供可靠的功能实现和最佳实践参考

2. **技术学习与研究**
   - 学习 ${repo.language} 的优秀代码示例
   - 了解现代软件开发的设计模式

3. **企业级应用开发**
   - 满足生产环境的稳定性要求
   - 支持大规模部署和高并发场景

4. **个人项目与实验**
   - 快速原型开发
   - 技术验证和概念验证`
}

### 典型用例

通过使用 ${repo.name}，开发者可以：

- ✅ **快速启动项目**：利用成熟的代码库，减少从零开始的开发时间
- ✅ **降低技术风险**：基于经过验证的解决方案，避免常见陷阱
- ✅ **提升代码质量**：参考优秀的代码实现，学习最佳实践
- ✅ **加速迭代速度**：专注于业务逻辑，而非底层实现细节

## 🎓 学习价值与技术收获

对于开发者而言，${repo.name} 不仅是一个实用工具，更是一个宝贵的学习资源：

### 技术学习

1. **${repo.language} 最佳实践**
   - 学习如何编写高质量的 ${repo.language} 代码
   - 了解 ${repo.language} 生态系统的常用工具和库
   - 掌握 ${repo.language} 项目的组织和管理方式

2. **软件工程实践**
   - 代码组织和模块化设计
   - 测试驱动开发（TDD）
   - 持续集成和持续部署（CI/CD）

3. **开源协作经验**
   - 学习如何参与开源项目
   - 了解代码审查和协作流程
   - 提升技术沟通能力

### 职业发展

- **技能提升**：通过阅读和使用优秀代码，提升编程能力
- **项目经验**：可以作为个人项目或作品集的一部分
- **社区参与**：通过贡献代码，建立个人技术品牌

## 👥 适用人群

${repo.name} 适合以下人群使用：

### 初学者

- 刚接触 ${repo.language} 的开发者
- 希望学习实际项目代码的学生
- 需要参考实现的编程爱好者

### 专业开发者

- 寻找可靠解决方案的工程师
- 需要快速实现功能的项目开发者
- 希望优化现有代码的技术专家

### 技术团队

- 需要统一技术栈的开发团队
- 寻求成熟方案的创业公司
- 进行技术选型的架构师

## 🌟 项目优势与特点

相比其他类似项目，${repo.name} 具有以下显著优势：

### 社区认可

- **高 Star 数**：${repo.stars.toLocaleString()} 个 Star 证明了项目的质量和价值
- **活跃维护**：${repo.forks.toLocaleString()} 个 Fork 显示了社区的活跃度
- **持续更新**：项目保持活跃开发，不断改进和优化

### 技术优势

- **成熟稳定**：经过大量实际应用验证
- **文档完善**：提供详细的使用说明和示例
- **易于集成**：可以方便地集成到现有项目中

### 生态系统

- **丰富的扩展**：支持多种插件和扩展
- **活跃的社区**：有问题可以快速获得帮助
- **持续演进**：跟随技术发展不断更新

## 🔧 快速开始

想要使用 ${repo.name}？访问项目主页获取详细的安装和使用说明：

**项目地址：** [${repo.url}](${repo.url})

### 基本步骤

1. 访问 GitHub 仓库
2. 阅读 README 文档
3. 根据文档进行安装配置
4. 参考示例代码开始使用

## 📊 项目数据

- **Star 数量：** ${repo.stars.toLocaleString()} ⭐
- **Fork 数量：** ${repo.forks.toLocaleString()} 🍴
- **主要语言：** ${repo.language}
${repo.todayStars > 0 ? `- **近期热度：** 新增 ${repo.todayStars} 个 Star 🔥\n` : ''}
- **数据更新：** ${new Date(repo.fetchedAt).toLocaleString('zh-CN')}

## 💭 总结

${repo.name} 是一个优秀的 ${repo.language} 开源项目，它通过提供高质量的代码实现和完善的功能支持，帮助开发者更高效地完成工作。无论你是初学者还是经验丰富的开发者，都可以从这个项目中获得价值。

项目的 ${repo.stars.toLocaleString()} 个 Star 和 ${repo.forks.toLocaleString()} 个 Fork 充分证明了其在社区中的认可度。如果你正在寻找一个可靠的 ${repo.language} 解决方案，或者想要学习优秀的代码实现，${repo.name} 绝对值得你关注和尝试。

**立即访问：** [${repo.url}](${repo.url})

---

## 📚 相关资源

- **项目主页：** [${repo.url}](${repo.url})
- **问题反馈：** [${repo.url}/issues](${repo.url}/issues)
- **贡献指南：** [${repo.url}/blob/main/CONTRIBUTING.md](${repo.url}/blob/main/CONTRIBUTING.md)

---

*本文由 GitHub 热点项目展示平台自动生成，旨在帮助开发者快速了解优秀开源项目。*
`;

  // 计算字数（中文字符按1个字，英文单词按0.5个字计算）
  const wordCount = Math.floor(report.length / 2);
  const finalReport = report + `\n*文章字数：约 ${wordCount} 字*\n`;

  return finalReport;
}

/**
 * 保存报告到文件
 * @param {String} filename - 文件名
 * @param {String} content - 报告内容
 */
async function saveReport(filename, content) {
  try {
    // 确保报告目录存在
    await fs.mkdir(REPORTS_DIR, { recursive: true });

    const filePath = path.join(REPORTS_DIR, filename);
    await fs.writeFile(filePath, content, 'utf-8');

    return filePath;
  } catch (error) {
    console.error('保存报告失败:', error.message);
    throw error;
  }
}

/**
 * 为项目生成并保存报告
 * @param {Object} repo - 项目信息
 * @returns {String} - 报告文件路径
 */
async function generateAndSaveReport(repo) {
  const report = generateProjectReport(repo);
  const filename = `${repo.author}_${repo.name}.md`;
  const filePath = await saveReport(filename, report);

  return filePath;
}

/**
 * 批量生成报告
 * @param {Array} repos - 项目列表
 * @returns {Array} - 生成的报告文件路径列表
 */
async function generateBatchReports(repos) {
  const results = [];

  for (const repo of repos) {
    try {
      const filePath = await generateAndSaveReport(repo);
      results.push({
        success: true,
        repo: `${repo.author}/${repo.name}`,
        filePath
      });
    } catch (error) {
      results.push({
        success: false,
        repo: `${repo.author}/${repo.name}`,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * 批量下载 README
 * @param {Array} repos - 项目列表
 * @param {Boolean} skipIfExists - 如果文件已存在是否跳过
 * @returns {Array} - 下载的 README 文件路径列表
 */
async function downloadBatchReadmes(repos, skipIfExists = false) {
  const results = [];

  for (const repo of repos) {
    try {
      const result = await downloadAndSaveReadme(repo, skipIfExists);
      results.push({
        success: true,
        repo: `${repo.author}/${repo.name}`,
        filePath: result.filePath,
        skipped: result.skipped
      });
    } catch (error) {
      results.push({
        success: false,
        repo: `${repo.author}/${repo.name}`,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  generateProjectReport,
  saveReport,
  generateAndSaveReport,
  generateBatchReports,
  downloadReadme,
  downloadAndSaveReadme,
  downloadBatchReadmes,
  reportExists,
  REPORTS_DIR
};
