import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { fadeIn, pulse, rotateLoading } from '../utils/animations';
import { useLog } from '../contexts/LogContext';
import './DocGeneratorPage.css';

function DocGeneratorPage() {
  const { logs, addLog, clearLogs } = useLog();
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [updateCacheBeforeStart, setUpdateCacheBeforeStart] = useState(false);
  const logsEndRef = useRef(null);
  const eventSourceRef = useRef(null);

  // 自动滚动到底部
  const scrollToBottom = (smooth = true) => {
    if (smooth) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      logsEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  };

  // 组件挂载时立即滚动到底部（不使用动画）
  useEffect(() => {
    scrollToBottom(false);
  }, []);

  // 日志更新时平滑滚动到底部
  useEffect(() => {
    if (logs.length > 0) {
      scrollToBottom(true);
    }
  }, [logs]);

  // 检查运行状态
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/doc-generator/status');
      const data = await response.json();
      if (data.success && data.running) {
        setRunning(true);
        connectToLogs();
      }
    } catch (error) {
      console.error('检查状态失败:', error);
    }
  };

  // 日志类型模式匹配
  const LOG_TYPE_PATTERNS = {
    error: [' - ERROR - '],
    warning: [' - WARNING - '],
    success: [' - SUCCESS - '],
    separator: ['==='],
    stats: ['总计:', '成功:', '跳过:', '失败:', '处理完成统计', '报告已保存到'],
    skipped: ['⏭️', '已跳过'],
    progress: ['处理进度:', '|', 'it/s']
  };

  const TYPE_MAPPING = {
    stderr: 'info',
    stdout: 'info',
    exit: 'exit'
  };

  // 根据日志内容判断实际类型
  const parseLogType = (originalType, message) => {
    // 检查消息是否匹配任何模式
    for (const [type, patterns] of Object.entries(LOG_TYPE_PATTERNS)) {
      if (patterns.some(pattern => message.includes(pattern))) {
        // 对于 progress 类型，需要同时包含 | 和 it/s
        if (type === 'progress' && patterns.includes('|')) {
          if (message.includes('|') && message.includes('it/s')) {
            return type;
          }
          continue;
        }
        return type;
      }
    }

    // 使用类型映射
    return TYPE_MAPPING[originalType] || originalType;
  };

  // 连接到日志流
  const connectToLogs = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/doc-generator/logs');
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const log = JSON.parse(event.data);
      const actualType = parseLogType(log.type, log.message);
      addLog(actualType, log.message);

      // 如果收到退出消息，更新运行状态
      if (log.type === 'exit' || log.type === 'error') {
        setRunning(false);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE 连接错误:', error);
      eventSource.close();
    };
  };

  // 启动程序
  const handleStart = async () => {
    try {
      setStarting(true);

      const response = await fetch('/api/doc-generator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setRunning(true);
        connectToLogs();
      } else {
        addLog('error', `启动失败: ${data.error}`);
        alert(`启动失败: ${data.error}`);
      }
    } catch (error) {
      addLog('error', `启动失败: ${error.message}`);
      alert(`启动失败: ${error.message}`);
    } finally {
      setStarting(false);
    }
  };

  // 停止程序
  const handleStop = async () => {
    try {
      const response = await fetch('/api/doc-generator/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setRunning(false);
      } else {
        alert(`停止失败: ${data.error}`);
      }
    } catch (error) {
      alert(`停止失败: ${error.message}`);
    }
  };

  // 下载所有 README
  const downloadAllReadmes = async () => {
    try {
      setDownloading(true);
      addLog('info', '开始下载所有项目的 README...');

      // 获取所有热门项目
      const trendingResponse = await axios.get('/api/github/trending', {
        params: { since: 'all', language: '' }
      });

      if (!trendingResponse.data.success) {
        throw new Error('获取热门项目失败');
      }

      const projects = trendingResponse.data.data || [];
      setDownloadProgress({ current: 0, total: projects.length });
      addLog('info', `找到 ${projects.length} 个项目，开始下载...`);

      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;

      for (let i = 0; i < projects.length; i++) {
        const project = projects[i];
        const projectName = `${project.author || project.owner}/${project.name}`;

        try {
          addLog('info', `[${i + 1}/${projects.length}] 下载: ${projectName}`);

          const response = await axios.post('/api/reports/generate', {
            author: project.author || project.owner,
            name: project.name,
            skipIfExists: true
          });

          if (response.data.success) {
            if (response.data.skipped) {
              skippedCount++;
              addLog('info', `  ⏭️ 已跳过（文件已存在）`);
              // 跳过的项目不需要延迟
            } else {
              successCount++;
              addLog('success', `  ✅ 下载成功`);
              // 只有成功下载的才需要延迟，避免速率限制
              if (i < projects.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          } else {
            failCount++;
            addLog('error', `  ❌ 下载失败: ${response.data.error || '未知错误'}`);
          }
        } catch (err) {
          failCount++;
          addLog('error', `  ❌ 下载失败: ${err.response?.data?.error || err.message}`);
        }

        setDownloadProgress({ current: i + 1, total: projects.length });
      }

      addLog('success', `下载完成！成功: ${successCount}, 跳过: ${skippedCount}, 失败: ${failCount}`);
      return { success: true, successCount, skippedCount, failCount };
    } catch (error) {
      addLog('error', `下载失败: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  // 一键启动：先下载再生成
  const handleOneClick = async () => {
    if (running || downloading || starting) {
      return;
    }

    try {
      setStarting(true);

      // 第零步：更新缓存（如果勾选）
      if (updateCacheBeforeStart) {
        addLog('info', '========== 第零步：更新热门项目缓存 ==========');

        try {
          let cacheUpdateCompleted = false;
          let eventSource = null;

          // 先建立 SSE 连接并设置监听器
          await new Promise((resolve, reject) => {
            eventSource = new EventSource('/api/scheduler/logs');

            // 立即设置消息监听器（在 onopen 之前）
            eventSource.onmessage = (event) => {
              const log = JSON.parse(event.data);
              const actualType = parseLogType(log.type, log.message);
              addLog(actualType, log.message);

              // 检测完成信号
              if (log.message.includes('缓存更新完成') || log.message.includes('缓存更新失败')) {
                cacheUpdateCompleted = true;
                eventSource.close();
              }
            };

            eventSource.onopen = () => {
              addLog('info', 'SSE 连接已建立');
              resolve();
            };

            eventSource.onerror = (error) => {
              console.error('SSE 连接错误:', error);
              reject(error);
            };

            // 超时保护
            setTimeout(() => resolve(), 1000);
          });

          // 启动缓存更新
          const cacheResponse = await fetch('/api/scheduler/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });

          const cacheData = await cacheResponse.json();
          if (!cacheData.success) {
            addLog('error', `❌ 启动失败: ${cacheData.error}`);
            eventSource.close();
          } else {
            // 等待缓存更新完成
            let timeout = 0;
            while (!cacheUpdateCompleted && timeout < 120) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              timeout++;
            }

            if (!cacheUpdateCompleted) {
              addLog('warning', '⚠️ 缓存更新超时');
              eventSource.close();
            }
          }
        } catch (err) {
          addLog('error', `❌ 缓存更新失败: ${err.message}`);
        }
      }

      // 第一步：下载所有 README
      addLog('info', '========== 第一步：下载 README ==========');
      const downloadResult = await downloadAllReadmes();

      if (!downloadResult.success) {
        alert(`下载失败: ${downloadResult.error}`);
        return;
      }

      // 第二步：启动文档生成
      addLog('info', '========== 第二步：生成文档 ==========');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒

      const response = await fetch('/api/doc-generator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        setRunning(true);
        connectToLogs();
        addLog('success', '文档生成程序已启动');
      } else {
        alert(`启动失败: ${data.error}`);
      }
    } catch (error) {
      alert(`一键启动失败: ${error.message}`);
    } finally {
      setStarting(false);
    }
  };

  // 添加日志到界面
  // 解析 GitHub URL
  const parseGithubUrl = (url) => {
    try {
      // 支持多种格式：
      // https://github.com/owner/repo
      // https://github.com/owner/repo.git
      // github.com/owner/repo
      // owner/repo
      const cleanUrl = url.trim().replace(/\.git$/, '');

      // 如果是完整 URL
      if (cleanUrl.includes('github.com/')) {
        const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
        if (match) {
          return { owner: match[1], repo: match[2] };
        }
      }

      // 如果是 owner/repo 格式
      if (cleanUrl.includes('/') && !cleanUrl.includes('://')) {
        const parts = cleanUrl.split('/');
        if (parts.length >= 2) {
          return { owner: parts[0], repo: parts[1] };
        }
      }

      return null;
    } catch (err) {
      return null;
    }
  };

  // 手动导入单个仓库
  const handleImportRepo = async () => {
    if (!importUrl.trim()) {
      alert('请输入 GitHub 仓库链接');
      return;
    }

    const parsed = parseGithubUrl(importUrl);
    if (!parsed) {
      alert('无效的 GitHub 链接\n\n支持的格式：\n• https://github.com/owner/repo\n• github.com/owner/repo\n• owner/repo');
      return;
    }

    try {
      setImporting(true);
      addLog('info', `开始导入: ${parsed.owner}/${parsed.repo}`);

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: parsed.owner,
          name: parsed.repo,
          skipIfExists: false  // 不跳过已存在的文件，强制重新下载
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.skipped) {
          addLog('info', `✅ 文件已存在: ${parsed.owner}/${parsed.repo}`);
        } else {
          addLog('success', `✅ 导入成功: ${parsed.owner}/${parsed.repo}`);
        }
        setImportUrl('');
      } else {
        addLog('error', `❌ 导入失败: ${data.error || '未知错误'}`);
        alert(`导入失败：${data.error || '未知错误'}`);
      }
    } catch (err) {
      addLog('error', `❌ 导入失败: ${err.message}`);
      alert(`导入失败：${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  // 清空日志
  const handleClear = () => {
    if (confirm('确定要清空所有运行日志吗？此操作不可恢复。')) {
      clearLogs();
    }
  };

  // 组件卸载时关闭连接
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // 根据日志类型返回样式类
  const getLogStyle = (log) => {
    // 对所有日志进行类型解析，包括客户端直接添加的日志
    const actualType = parseLogType(log.type, log.message);
    return `log-${actualType}`;
  };

  return (
    <div className="doc-generator-page">
      <div className="page-header">
        <h2>文档生成器</h2>
        <div className="header-actions">
          <div className="one-click-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={updateCacheBeforeStart}
                onChange={(e) => setUpdateCacheBeforeStart(e.target.checked)}
                disabled={running || starting || downloading}
              />
              <span>启动前更新缓存</span>
            </label>
            <button
              className="btn btn-success"
              onClick={handleOneClick}
              disabled={running || starting || downloading}
            >
              🚀 一键启动
            </button>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleStart}
            disabled={running || starting || downloading}
          >
            ▶ 仅生成文档
          </button>
          <button
            className="btn btn-danger"
            onClick={handleStop}
            disabled={!running || downloading}
          >
            ⏹ 停止
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleClear}
            disabled={running || downloading}
          >
            🗑 清空日志
          </button>
        </div>
      </div>

      <div className="import-section">
        <h3>手动导入 README</h3>
        <div className="import-form">
          <input
            type="text"
            placeholder="输入 GitHub 仓库链接 (如: https://github.com/facebook/react 或 facebook/react)"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleImportRepo()}
            className="import-input"
            disabled={importing}
          />
          <button
            className="btn btn-import"
            onClick={handleImportRepo}
            disabled={importing || !importUrl.trim()}
          >
            {importing ? '导入中...' : '📥 导入 README'}
          </button>
        </div>
        <p className="import-hint">
          支持格式：完整链接、简短链接或 owner/repo 格式
        </p>
      </div>

      <div className="logs-container">
        <div className="logs-header">
          <span className="logs-title">运行日志</span>
          <span className="logs-count">{logs.length} 条</span>
        </div>
        <div className="logs-content">
          {logs.length === 0 ? (
            <div className="logs-empty">暂无日志，点击"启动"按钮开始运行</div>
          ) : (
            logs.map((log, index) => (
              <div key={log.id || index} className={`log-line ${getLogStyle(log)}`}>
                <span className="log-timestamp">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }) : ''}
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  );
}

export default DocGeneratorPage;
