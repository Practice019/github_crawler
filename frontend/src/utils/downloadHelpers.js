/**
 * 下载相关的辅助函数
 */

/**
 * 下载单个项目的 README
 * @param {Object} project - 项目对象
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 下载结果
 */
export async function downloadSingleProject(project, options = {}) {
  const { skipIfExists = true } = options;
  const projectName = `${project.author || project.owner}/${project.name}`;

  const response = await fetch('/api/reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      author: project.author || project.owner,
      name: project.name,
      skipIfExists
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Unknown error');
  }

  const data = await response.json();
  return { ...data, projectName };
}

/**
 * 创建下载统计对象
 * @returns {Object} 统计对象
 */
export function createDownloadStats() {
  return {
    success: 0,
    skipped: 0,
    failed: 0,
    failedRepos: []
  };
}

/**
 * 更新统计信息
 * @param {Object} stats - 统计对象
 * @param {Object} result - 下载结果
 * @param {string} projectName - 项目名称
 */
export function updateStats(stats, result, projectName) {
  if (result.skipped) {
    stats.skipped++;
  } else {
    stats.success++;
  }
}

/**
 * 处理下载错误
 * @param {Error} error - 错误对象
 * @param {Object} stats - 统计对象
 * @param {string} projectName - 项目名称
 */
export function handleDownloadError(error, stats, projectName) {
  stats.failed++;
  stats.failedRepos.push({
    name: projectName,
    reason: error.message
  });
}

/**
 * 判断是否应该停止下载
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否停止
 */
export function shouldStopDownload(error) {
  return error.message && error.message.includes('rate limit');
}

/**
 * 生成下载摘要消息
 * @param {Object} stats - 统计对象
 * @returns {string} 摘要消息
 */
export function generateDownloadSummary(stats) {
  let message = `下载完成！\n✅ 新下载：${stats.success} 个\n⏭️ 已跳过：${stats.skipped} 个\n❌ 失败：${stats.failed} 个\n\n文件已保存到 reports 目录`;

  if (stats.failedRepos.length > 0) {
    message += '\n\n失败的仓库：\n' +
      stats.failedRepos.slice(0, 5).map(r => `• ${r.name}: ${r.reason}`).join('\n');

    if (stats.failedRepos.length > 5) {
      message += `\n... 还有 ${stats.failedRepos.length - 5} 个失败`;
    }
  }

  return message;
}

/**
 * 生成速率限制警告消息
 * @param {string} errorMsg - 错误消息
 * @param {Object} stats - 统计对象
 * @returns {string} 警告消息
 */
export function generateRateLimitWarning(errorMsg, stats) {
  return `⚠️ GitHub API 速率限制\n\n${errorMsg}\n\n已下载：${stats.success} 个\n已跳过：${stats.skipped} 个\n失败：${stats.failed} 个\n\n建议：\n1. 添加 GITHUB_TOKEN 到 .env 文件\n2. 等待速率限制重置后继续`;
}

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
