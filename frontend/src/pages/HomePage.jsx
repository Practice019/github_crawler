import React, { useState, useEffect, useCallback } from 'react';
import { getTrendingWithIntros } from '../services/api';
import ProjectCard from '../components/ProjectCard';
import SearchFilter from '../components/SearchFilter';
import { LoadingState, ErrorState, EmptyState } from '../components/StateDisplay';

function HomePage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState('');
  const [since, setSince] = useState('all');
  const [sortBy, setSortBy] = useState('stars');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [updating, setUpdating] = useState(false);

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

  const filteredProjects = projects
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

  const handleRetry = () => {
    fetchProjects();
  };

  const handleDownloadAll = async () => {
    if (downloading) return;

    try {
      setDownloading(true);
      setDownloadProgress({ current: 0, total: filteredProjects.length });

      let successCount = 0;
      let failCount = 0;
      let skippedCount = 0;
      const failedRepos = [];

      for (let i = 0; i < filteredProjects.length; i++) {
        const project = filteredProjects[i];
        try {
          const response = await fetch('/api/reports/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              author: project.author || project.owner,
              name: project.name,
              skipIfExists: true  // 跳过已存在的文件
            })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.skipped) {
              skippedCount++;
            } else {
              successCount++;
            }
          } else {
            failCount++;
            const errorData = await response.json();
            failedRepos.push({
              name: `${project.author || project.owner}/${project.name}`,
              reason: errorData.error || 'Unknown error'
            });

            // 如果遇到速率限制，停止下载
            if (errorData.error && errorData.error.includes('rate limit')) {
              alert(`⚠️ GitHub API 速率限制\n\n${errorData.error}\n\n已下载：${successCount} 个\n已跳过：${skippedCount} 个\n失败：${failCount} 个\n\n建议：\n1. 添加 GITHUB_TOKEN 到 .env 文件\n2. 等待速率限制重置后继续`);
              break;
            }
          }
        } catch (err) {
          failCount++;
          failedRepos.push({
            name: `${project.author || project.owner}/${project.name}`,
            reason: err.message || 'Network error'
          });
        }

        setDownloadProgress({ current: i + 1, total: filteredProjects.length });

        // 添加延迟，避免触发速率限制（每秒最多2个请求）
        if (i < filteredProjects.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      let message = `下载完成！\n✅ 新下载：${successCount} 个\n⏭️ 已跳过：${skippedCount} 个\n❌ 失败：${failCount} 个\n\n文件已保存到 reports 目录`;

      if (failedRepos.length > 0) {
        message += '\n\n失败的仓库：\n' + failedRepos.slice(0, 5).map(r => `• ${r.name}: ${r.reason}`).join('\n');
        if (failedRepos.length > 5) {
          message += `\n... 还有 ${failedRepos.length - 5} 个失败`;
        }
      }

      alert(message);
    } catch (err) {
      alert(`批量下载失败：${err.message}`);
    } finally {
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const handleUpdateCache = async () => {
    if (updating) return;

    try {
      setUpdating(true);
      const response = await fetch('/api/scheduler/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        alert('缓存更新已启动，请稍后刷新页面查看最新数据');
      } else {
        alert(`更新失败：${data.error}`);
      }
    } catch (err) {
      alert(`更新失败：${err.message}`);
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

      {loading && <LoadingState message="Fetching trending projects..." />}

      {error && <ErrorState message={error} onRetry={handleRetry} />}

      {!loading && !error && filteredProjects.length === 0 && (
        <EmptyState message={searchQuery ? 'No projects match your search' : 'No trending projects found'} />
      )}

      {!loading && !error && filteredProjects.length > 0 && (
        <div className="project-grid">
          {filteredProjects.map(project => (
            <ProjectCard key={project.id || project.name} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
