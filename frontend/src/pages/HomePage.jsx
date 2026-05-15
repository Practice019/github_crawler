import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getTrendingWithIntros } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import SearchFilter from '../components/SearchFilter';
import { LoadingState, ErrorState, EmptyState } from '../components/StateDisplay';
import { SkeletonGrid } from '../components/SkeletonCard';
import Notification from '../components/Notification';
import { staggerFadeIn, fadeIn } from '../utils/animations';
import { useLog } from '../contexts/LogContext';
import {
  downloadSingleProject,
  createDownloadStats,
  updateStats,
  handleDownloadError,
  shouldStopDownload,
  generateDownloadSummary,
  generateRateLimitWarning,
  delay
} from '../utils/downloadHelpers';

function HomePage() {
  const [projects, setProjects] = useState([]);
  const [notification, setNotification] = useState(null);
  const { addLog } = useLog();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [since, setSince] = useState('all');
  const [sortBy, setSortBy] = useState('stars');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [updating, setUpdating] = useState(false);
  const gridRef = useRef(null);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTrendingWithIntros({ since, language });
      setProjects(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [since, language]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          project.name?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.owner?.toLowerCase().includes(query) ||
          project.language?.toLowerCase().includes(query) ||
          project.introduction?.summary?.toLowerCase().includes(query) ||
          project.introduction?.useCases?.some(uc => uc.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'stars') return (b.stars || 0) - (a.stars || 0);
        if (sortBy === 'forks') return (b.forks || 0) - (a.forks || 0);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        return 0;
      });
  }, [projects, searchQuery, sortBy]);

  // 当项目加载完成后，添加交错动画
  useEffect(() => {
    if (!loading && !error && filteredProjects.length > 0 && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.project-card');
      if (cards.length > 0) {
        staggerFadeIn(Array.from(cards));
      }
    }
  }, [loading, error, filteredProjects.length]);

  const handleRetry = () => {
    fetchProjects();
  };

  const handleDownloadAll = async () => {
    if (downloading) return;

    try {
      setDownloading(true);
      setDownloadProgress({ current: 0, total: filteredProjects.length });

      addLog('info', `========== 开始批量下载 README ==========`);
      addLog('info', `总计项目数：${filteredProjects.length}`);

      const stats = createDownloadStats();

      for (let i = 0; i < filteredProjects.length; i++) {
        const project = filteredProjects[i];
        const projectName = `${project.author || project.owner}/${project.name}`;

        try {
          addLog('info', `[${i + 1}/${filteredProjects.length}] 下载: ${projectName}`);

          const result = await downloadSingleProject(project, { skipIfExists: true });

          if (result.skipped) {
            stats.skipped++;
            addLog('info', `  ⏭️ 已跳过（文件已存在）`);
          } else {
            stats.success++;
            addLog('success', `  ✅ 下载成功`);
            // 只有成功下载的才需要延迟，避免速率限制
            if (i < filteredProjects.length - 1) {
              await delay(500);
            }
          }
        } catch (error) {
          handleDownloadError(error, stats, projectName);
          addLog('error', `  ❌ 下载失败: ${error.message}`);

          // 如果遇到速率限制，停止下载
          if (shouldStopDownload(error)) {
            addLog('warning', `⚠️ GitHub API 速率限制，停止下载`);
            setNotification({
              message: generateRateLimitWarning(error.message, stats),
              type: 'warning'
            });
            break;
          }
        }

        setDownloadProgress({ current: i + 1, total: filteredProjects.length });
      }

      addLog('success', `========== 批量下载完成 ==========`);
      addLog('success', `✅ 新下载：${stats.success} 个`);
      addLog('info', `⏭️ 已跳过：${stats.skipped} 个`);
      if (stats.failed > 0) {
        addLog('error', `❌ 失败：${stats.failed} 个`);
      }

      setNotification({
        message: generateDownloadSummary(stats),
        type: 'success'
      });
    } catch (err) {
      addLog('error', `批量下载失败：${err.message}`);
      setNotification({ message: `批量下载失败：${err.message}`, type: 'error' });
    } finally {
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleUpdateCache = async () => {
    if (updating) return;

    try {
      setUpdating(true);
      addLog('info', '========== 开始更新缓存 ==========');

      const response = await fetch('/api/scheduler/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        addLog('success', '✅ 缓存更新已启动');
        setNotification({ message: '缓存更新已启动，请稍后刷新页面查看最新数据', type: 'success' });
      } else {
        addLog('error', `❌ 更新失败：${data.error}`);
        setNotification({ message: `更新失败：${data.error}`, type: 'error' });
      }
    } catch (err) {
      addLog('error', `❌ 更新失败：${err.message}`);
      setNotification({ message: `更新失败：${err.message}`, type: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="home-page">
      <SearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        language={language}
        onLanguageChange={setLanguage}
        since={since}
        onSinceChange={setSince}
        resultCount={loading ? undefined : filteredProjects.length}
      />

      <div className="toolbar">
        <div className="sort-options">
          <span className="sort-label">Sort by:</span>
          <button
            className={`sort-btn ${sortBy === 'stars' ? 'active' : ''}`}
            onClick={() => setSortBy('stars')}
          >
            Stars
          </button>
          <button
            className={`sort-btn ${sortBy === 'forks' ? 'active' : ''}`}
            onClick={() => setSortBy('forks')}
          >
            Forks
          </button>
          <button
            className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
            onClick={() => setSortBy('name')}
          >
            Name
          </button>
        </div>

        <div className="batch-actions">
          <button
            className="update-cache-btn"
            onClick={handleUpdateCache}
            disabled={updating}
            title="手动更新热门项目缓存"
          >
            {updating ? '更新中...' : '🔄 更新缓存'}
          </button>
          <button
            className="download-all-btn"
            onClick={handleDownloadAll}
            disabled={downloading || filteredProjects.length === 0}
            title="下载所有仓库的 README.md"
          >
            {downloading
              ? `下载中... (${downloadProgress.current}/${downloadProgress.total})`
              : `📥 下载全部 (${filteredProjects.length})`
            }
          </button>
        </div>
      </div>

      {loading && <SkeletonGrid count={6} />}

      {error && <ErrorState message={error} onRetry={handleRetry} />}

      {!loading && !error && filteredProjects.length === 0 && (
        <EmptyState message={searchQuery ? 'No projects match your search' : 'No trending projects found'} />
      )}

      {!loading && !error && filteredProjects.length > 0 && (
        <div ref={gridRef} className="project-grid">
          {filteredProjects.map((project, index) => (
            <ProjectCard key={project.id || project.name} project={project} index={index} />
          ))}
        </div>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default HomePage;
