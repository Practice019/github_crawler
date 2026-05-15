import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIntroductions } from '../services/api';
import axios from 'axios';
import './IntroductionsPage.css';

function IntroductionsPage() {
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);
  const [projectStatuses, setProjectStatuses] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all 或标签 id
  const [favoriteFilter, setFavoriteFilter] = useState(false); // 是否只显示收藏
  const [searchQuery, setSearchQuery] = useState(''); // 搜索关键词
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [editingTagId, setEditingTagId] = useState(null);
  const [editingTagLabel, setEditingTagLabel] = useState('');
  const navigate = useNavigate();

  // 生成随机颜色，避免与现有颜色重复
  const generateRandomColor = () => {
    const colors = [
      '#6366f1', '#10b981', '#8b949e', '#f59e0b', '#ef4444',
      '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4',
      '#84cc16', '#a855f7', '#22c55e', '#eab308', '#3b82f6'
    ];

    const usedColors = tags.map(tag => tag.color);
    const availableColors = colors.filter(color => !usedColors.includes(color));

    if (availableColors.length > 0) {
      return availableColors[Math.floor(Math.random() * availableColors.length)];
    }

    // 如果所有预设颜色都用完了，生成随机颜色
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  };

  useEffect(() => {
    fetchProjects();
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const response = await axios.get('/api/project-status');
      if (response.data.success) {
        setTags(response.data.data.tags);
        setProjectStatuses(response.data.data.projectStatuses);
        setFavorites(response.data.data.favorites || []);
      }
    } catch (err) {
      console.error('获取状态失败:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getIntroductions();
      if (response.success) {
        setProjects(response.data);
      } else {
        setError('获取项目列表失败');
      }
    } catch (err) {
      console.error('获取项目列表失败:', err);
      setError(err.message || '获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (projectId) => {
    navigate(`/introductions/${projectId}?filter=${statusFilter}`);
  };

  const handleStatusChange = async (projectId, newStatus, event) => {
    event.stopPropagation(); // 阻止卡片点击事件

    try {
      const response = await axios.put(`/api/project-status/${projectId}`, {
        status: newStatus
      });

      if (response.data.success) {
        setProjectStatuses(prev => ({
          ...prev,
          [projectId]: newStatus
        }));
      }
    } catch (err) {
      console.error('更新状态失败:', err);
      alert('更新状态失败');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagLabel.trim()) {
      alert('请输入标签名称');
      return;
    }

    try {
      const color = generateRandomColor();
      const response = await axios.post('/api/project-status/tags', {
        label: newTagLabel,
        color: color
      });

      if (response.data.success) {
        setTags(prev => [...prev, response.data.data]);
        setNewTagLabel('');
        alert('标签创建成功');
      }
    } catch (err) {
      console.error('创建标签失败:', err);
      alert('创建标签失败');
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!confirm('确定要删除这个标签吗？使用该标签的项目将被重置为"未读"。')) {
      return;
    }

    try {
      const response = await axios.delete(`/api/project-status/tags/${tagId}`);

      if (response.data.success) {
        setTags(prev => prev.filter(tag => tag.id !== tagId));
        // 刷新项目状态
        fetchStatuses();
        alert('标签已删除');
      }
    } catch (err) {
      console.error('删除标签失败:', err);
      alert(err.response?.data?.error || '删除标签失败');
    }
  };

  const handleStartEdit = (tag) => {
    setEditingTagId(tag.id);
    setEditingTagLabel(tag.label);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditingTagLabel('');
  };

  const handleSaveEdit = async (tagId) => {
    if (!editingTagLabel.trim()) {
      alert('标签名称不能为空');
      return;
    }

    try {
      const response = await axios.put(`/api/project-status/tags/${tagId}`, {
        label: editingTagLabel
      });

      if (response.data.success) {
        setTags(prev => prev.map(tag =>
          tag.id === tagId ? response.data.data : tag
        ));
        setEditingTagId(null);
        setEditingTagLabel('');
        alert('标签已更新');
      }
    } catch (err) {
      console.error('更新标签失败:', err);
      alert(err.response?.data?.error || '更新标签失败');
    }
  };

  const handleToggleFavorite = async (projectId, event) => {
    event.stopPropagation(); // 阻止卡片点击事件

    const isFavorited = favorites.includes(projectId);

    try {
      if (isFavorited) {
        // 取消收藏
        const response = await axios.delete(`/api/project-status/favorites/${projectId}`);
        if (response.data.success) {
          setFavorites(prev => prev.filter(id => id !== projectId));
        }
      } else {
        // 添加收藏
        const response = await axios.post(`/api/project-status/favorites/${projectId}`);
        if (response.data.success) {
          setFavorites(prev => [...prev, projectId]);
        }
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
      alert('收藏操作失败');
    }
  };

  const getProjectStatus = (projectId) => {
    return projectStatuses[projectId] || 'unread';
  };

  const filteredProjects = projects.filter(project => {
    // 搜索筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = project.name?.toLowerCase().includes(query);
      const matchOverview = project.overview?.toLowerCase().includes(query);
      const matchSummary = project.summary?.toLowerCase().includes(query);
      if (!matchName && !matchOverview && !matchSummary) return false;
    }

    // 标签筛选
    if (statusFilter !== 'all') {
      const status = getProjectStatus(project.id);
      if (status !== statusFilter) return false;
    }

    // 收藏筛选
    if (favoriteFilter) {
      if (!favorites.includes(project.id)) return false;
    }

    return true;
  });

  const getStatusCounts = () => {
    const counts = { all: projects.length, favorites: favorites.length };
    tags.forEach(tag => {
      counts[tag.id] = 0;
    });
    projects.forEach(project => {
      const status = getProjectStatus(project.id);
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const getCurrentTag = (projectId) => {
    const statusId = getProjectStatus(projectId);
    const tag = tags.find(tag => tag.id === statusId);
    // 如果找不到标签，返回第一个标签或默认值
    return tag || tags[0] || { id: 'unread', label: '未读', color: '#6366f1' };
  };

  if (loading) {
    return (
      <div className="introductions-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="introductions-page">
        <div className="error-state">
          <p>❌ {error}</p>
          <button onClick={fetchProjects} className="retry-btn">重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="introductions-page">
      <div className="page-header">
        <h2>项目介绍</h2>
        <div className="header-actions">
          <p className="page-subtitle">共 {projects.length} 个项目</p>
          <button className="manage-tags-btn" onClick={() => setShowTagManager(!showTagManager)}>
            🏷️ 管理标签
          </button>
        </div>
      </div>

      <div className="search-section">
        <input
          type="text"
          placeholder="搜索项目名称或描述..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      {showTagManager && (
        <div className="tag-manager">
          <h3>标签管理</h3>
          <div className="tag-list">
            {tags.map(tag => (
              <div key={tag.id} className="tag-item">
                <span className="tag-color" style={{ backgroundColor: tag.color }}></span>
                {editingTagId === tag.id ? (
                  <>
                    <input
                      type="text"
                      value={editingTagLabel}
                      onChange={(e) => setEditingTagLabel(e.target.value)}
                      className="tag-edit-input"
                      autoFocus
                    />
                    <button className="save-tag-btn" onClick={() => handleSaveEdit(tag.id)}>
                      ✓
                    </button>
                    <button className="cancel-tag-btn" onClick={handleCancelEdit}>
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span className="tag-label">{tag.label}</span>
                    {!['unread'].includes(tag.id) && (
                      <>
                        <button className="edit-tag-btn" onClick={() => handleStartEdit(tag)}>
                          ✎
                        </button>
                        <button className="delete-tag-btn" onClick={() => handleDeleteTag(tag.id)}>
                          ✕
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="create-tag">
            <input
              type="text"
              placeholder="标签名称"
              value={newTagLabel}
              onChange={(e) => setNewTagLabel(e.target.value)}
              className="tag-input"
            />
            <button className="create-tag-btn" onClick={handleCreateTag}>
              创建标签
            </button>
          </div>
        </div>
      )}

      <div className="status-filter">
        <button
          className={`filter-btn ${statusFilter === 'all' && !favoriteFilter ? 'active' : ''}`}
          onClick={() => { setStatusFilter('all'); setFavoriteFilter(false); }}
        >
          全部 ({statusCounts.all})
        </button>
        <button
          className={`filter-btn favorite-btn ${favoriteFilter ? 'active' : ''}`}
          onClick={() => { setFavoriteFilter(!favoriteFilter); setStatusFilter('all'); }}
        >
          ⭐ 收藏 ({statusCounts.favorites})
        </button>
        {tags.map(tag => (
          <button
            key={tag.id}
            className={`filter-btn ${statusFilter === tag.id && !favoriteFilter ? 'active' : ''}`}
            onClick={() => { setStatusFilter(tag.id); setFavoriteFilter(false); }}
            style={statusFilter === tag.id && !favoriteFilter ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
          >
            {tag.label} ({statusCounts[tag.id] || 0})
          </button>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>暂无项目介绍</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="empty-state">
          <p>没有符合条件的项目</p>
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => {
            const currentTag = getCurrentTag(project.id);
            return (
              <article
                key={project.id}
                className="intro-card"
                style={{ borderLeftColor: currentTag.color }}
                onClick={() => handleCardClick(project.id)}
              >
                <div className="intro-card-header">
                  <h3 className="intro-card-title">{project.name}</h3>
                  <div className="card-header-actions">
                    <button
                      className={`favorite-icon ${favorites.includes(project.id) ? 'favorited' : ''}`}
                      onClick={(e) => handleToggleFavorite(project.id, e)}
                      title={favorites.includes(project.id) ? '取消收藏' : '收藏'}
                    >
                      {favorites.includes(project.id) ? '⭐' : '☆'}
                    </button>
                    {project.githubLink && (
                      <a
                        href={project.githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="github-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg height="16" width="16" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
                <div className="intro-card-body">
                  <p className="intro-card-overview">{project.overview || project.summary}</p>
                </div>
                <div className="intro-card-footer">
                  <div className="footer-left">
                    <select
                      className="status-select"
                      value={currentTag.id}
                      onChange={(e) => handleStatusChange(project.id, e.target.value, e)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ borderColor: currentTag.color }}
                    >
                      {tags.map(tag => (
                        <option key={tag.id} value={tag.id}>
                          {tag.label}
                        </option>
                      ))}
                    </select>
                    {project.createdAt && (
                      <span className="created-time">
                        {new Date(project.createdAt).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  <span className="read-more">查看详情 →</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default IntroductionsPage;
