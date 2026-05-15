import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getIntroductionDetail, getIntroductions } from '../services/api';
import axios from 'axios';
import { fadeIn, pulse } from '../utils/animations';
import './IntroductionDetailPage.css';

function IntroductionDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tags, setTags] = useState([]);
  const [currentStatus, setCurrentStatus] = useState('unread');
  const [allProjects, setAllProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [projectStatuses, setProjectStatuses] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const statusFilter = searchParams.get('filter') || 'all';
  const contentRef = useRef(null);
  const favoriteButtonRef = useRef(null);

  useEffect(() => {
    fetchAllProjects();
    fetchTags();
  }, []);

  useEffect(() => {
    if (allProjects.length > 0 && Object.keys(projectStatuses).length > 0) {
      // 根据筛选条件过滤项目
      let filtered = allProjects;
      if (statusFilter !== 'all') {
        filtered = allProjects.filter(p => {
          const status = projectStatuses[p.id] || 'unread';
          return status === statusFilter;
        });
      }
      setFilteredProjects(filtered);

      // 在过滤后的列表中找到当前项目的索引
      const index = filtered.findIndex(p => p.id === projectId);
      setCurrentIndex(index);
    }
  }, [projectId, allProjects, projectStatuses, statusFilter]);

  useEffect(() => {
    fetchProjectDetail();
    fetchProjectStatus();
  }, [projectId]);

  useEffect(() => {
    setIsFavorited(favorites.includes(projectId));
  }, [projectId, favorites]);

  // 内容加载完成后添加淡入动画
  useEffect(() => {
    if (!loading && project && contentRef.current) {
      fadeIn(contentRef.current, { duration: 500 });
    }
  }, [loading, project]);

  const fetchAllProjects = async () => {
    try {
      const response = await getIntroductions();
      if (response.success) {
        setAllProjects(response.data);
      }
    } catch (err) {
      console.error('获取项目列表失败:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await axios.get('/api/project-status');
      if (response.data.success) {
        setTags(response.data.data.tags);
        setProjectStatuses(response.data.data.projectStatuses);
        setFavorites(response.data.data.favorites || []);
      }
    } catch (err) {
      console.error('获取标签失败:', err);
    }
  };

  const fetchProjectStatus = async () => {
    try {
      const response = await axios.get('/api/project-status');
      if (response.data.success) {
        const status = response.data.data.projectStatuses[projectId] || 'unread';
        setCurrentStatus(status);
      }
    } catch (err) {
      console.error('获取项目状态失败:', err);
    }
  };

  const fetchProjectDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getIntroductionDetail(projectId);
      if (response.success) {
        setProject(response.data);
      } else {
        setError('获取项目详情失败');
      }
    } catch (err) {
      console.error('获取项目详情失败:', err);
      setError(err.message || '获取项目详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await axios.put(`/api/project-status/${projectId}`, {
        status: newStatus
      });

      if (response.data.success) {
        setCurrentStatus(newStatus);
        // 更新本地状态
        const newStatuses = {
          ...projectStatuses,
          [projectId]: newStatus
        };
        setProjectStatuses(newStatuses);

        // 如果有筛选条件，且当前项目不再符合筛选条件，自动跳转到下一个
        if (statusFilter !== 'all' && newStatus !== statusFilter) {
          // 重新计算过滤后的项目列表（排除当前项目）
          const newFiltered = allProjects.filter(p => {
            const status = p.id === projectId ? newStatus : (newStatuses[p.id] || 'unread');
            return status === statusFilter;
          });

          // 如果还有其他项目，跳转到下一个
          if (newFiltered.length > 0) {
            // 尝试跳转到当前索引位置的项目（如果存在）
            const nextProject = newFiltered[Math.min(currentIndex, newFiltered.length - 1)];
            navigate(`/introductions/${nextProject.id}?filter=${statusFilter}`);
          } else {
            // 如果没有符合条件的项目了，返回列表页
            navigate('/introductions');
          }
        }
      }
    } catch (err) {
      console.error('更新状态失败:', err);
      alert('更新状态失败');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevProject = filteredProjects[currentIndex - 1];
      navigate(`/introductions/${prevProject.id}?filter=${statusFilter}`);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredProjects.length - 1) {
      const nextProject = filteredProjects[currentIndex + 1];
      navigate(`/introductions/${nextProject.id}?filter=${statusFilter}`);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorited) {
        // 取消收藏
        const response = await axios.delete(`/api/project-status/favorites/${projectId}`);
        if (response.data.success) {
          setFavorites(prev => prev.filter(id => id !== projectId));
          setIsFavorited(false);
        }
      } else {
        // 添加收藏
        const response = await axios.post(`/api/project-status/favorites/${projectId}`);
        if (response.data.success) {
          setFavorites(prev => [...prev, projectId]);
          setIsFavorited(true);
        }
      }
    } catch (err) {
      console.error('收藏操作失败:', err);
      alert('收藏操作失败');
    }
  };

  const handleTitleClick = () => {
    if (project?.githubLink) {
      window.open(project.githubLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleVisitGithub = () => {
    if (project?.githubLink) {
      window.open(project.githubLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBack = () => {
    navigate('/introductions');
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="detail-page">
        <div className="error-state">
          <p>❌ {error || '项目不存在'}</p>
          <button onClick={handleBack} className="back-btn">返回列表</button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <div className="detail-header">
        <div className="header-left">
          <button onClick={handleBack} className="back-btn">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"/>
            </svg>
            返回列表
          </button>
        </div>

        <div className="header-center">
          <button
            onClick={handlePrevious}
            className="nav-btn"
            disabled={currentIndex <= 0}
            title="上一个项目"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"/>
            </svg>
          </button>
          <span className="project-counter">
            {currentIndex + 1} / {filteredProjects.length}
          </span>
          <button
            onClick={handleNext}
            className="nav-btn"
            disabled={currentIndex >= filteredProjects.length - 1}
            title="下一个项目"
          >
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M8.22 2.97a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l2.97-2.97H3.75a.75.75 0 0 1 0-1.5h7.44L8.22 4.03a.75.75 0 0 1 0-1.06Z"/>
            </svg>
          </button>
        </div>

        <div className="header-right">
          <button
            className="quick-tag-btn valuable-btn"
            onClick={() => handleStatusChange('valuable')}
            title="标记为有价值"
          >
            ✓ 有价值
          </button>
          <button
            className="quick-tag-btn not-valuable-btn"
            onClick={() => handleStatusChange('not-valuable')}
            title="标记为无价值"
          >
            ✗ 无价值
          </button>
          <button
            className={`favorite-btn-detail ${isFavorited ? 'favorited' : ''}`}
            onClick={handleToggleFavorite}
            title={isFavorited ? '取消收藏' : '收藏'}
          >
            {isFavorited ? '⭐ 已收藏' : '☆ 收藏'}
          </button>
          <select
            className="status-select-detail"
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>
                {tag.label}
              </option>
            ))}
          </select>
          {project?.githubLink && (
            <button onClick={handleVisitGithub} className="visit-github-btn">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              访问 GitHub
            </button>
          )}
        </div>
      </div>

      <article className="detail-content">
        <h1
          className="project-title"
          onClick={handleTitleClick}
          style={{ cursor: project.githubLink ? 'pointer' : 'default' }}
          title={project.githubLink ? `访问 ${project.githubLink}` : ''}
        >
          {project.name}
          {project.githubLink && (
            <svg className="external-link-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"/>
            </svg>
          )}
        </h1>

        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {project.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}

export default IntroductionDetailPage;
