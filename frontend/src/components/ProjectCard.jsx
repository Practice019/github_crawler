import React, { useState } from 'react';
import { formatStarCount, getLastUpdatedDate, truncateDescription, getTechStackSummary, getHighlightsList } from '../utils/introFormatter';
import axios from 'axios';
import Notification from './Notification';
import { useLog } from '../contexts/LogContext';

function ProjectCard({ project, index = 0 }) {
  const [generating, setGenerating] = useState(false);
  const [reportStatus, setReportStatus] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [notification, setNotification] = useState(null);
  const { addLog } = useLog();

  const intro = project.introduction;
  const highlights = intro ? getHighlightsList(intro) : [];
  const techStackSummary = intro ? getTechStackSummary(intro) : project.language || 'Unknown';

  // 获取首字母作为默认头像
  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const handleGenerateReport = async (project) => {
    const projectName = `${project.owner || project.author}/${project.name}`;

    try {
      setGenerating(true);
      setReportStatus('生成中...');

      addLog('info', `开始生成报告: ${projectName}`);

      const response = await axios.post('/api/reports/generate', {
        author: project.owner || project.author,
        name: project.name
      });

      if (response.data.success) {
        setReportStatus('✅ 报告生成成功！');
        addLog('success', `✅ 报告生成成功: ${projectName}`);
        addLog('info', `  文件路径: ${response.data.filePath}`);

        setTimeout(() => {
          setNotification({
            message: `报告已生成！\n\n文件路径：${response.data.filePath}\n项目：${response.data.repo}\n\n报告已保存到 reports 目录`,
            type: 'success'
          });
          setReportStatus(null);
        }, 500);
      }
    } catch (error) {
      console.error('生成报告失败:', error);
      const errorMsg = error.response?.data?.error || error.message;
      setReportStatus('❌ 生成失败');
      addLog('error', `❌ 报告生成失败: ${projectName}`);
      addLog('error', `  错误: ${errorMsg}`);

      setTimeout(() => setReportStatus(null), 3000);
      setNotification({
        message: `生成报告失败：${errorMsg}`,
        type: 'error'
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <article
      className="project-card"
    >
      <div className="project-header">
        {!imgError ? (
          <img
            src={project.ownerAvatar || project.avatar || `https://github.com/${project.owner || project.author}.png`}
            alt={`${project.owner || project.author} avatar`}
            className="avatar"
            width="48"
            height="48"
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="avatar avatar-fallback">
            {getInitials(project.owner || project.author)}
          </div>
        )}
        <div className="project-info">
          <h3>
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              {project.name}
            </a>
          </h3>
          <p className="description">{truncateDescription(project.description)}</p>
        </div>
      </div>

      {highlights.length > 0 && (
        <div className="project-highlights">
          {highlights.slice(0, 3).map((highlight, idx) => (
            <span key={idx} className="highlight-badge">{highlight}</span>
          ))}
        </div>
      )}

      {intro && intro.summary && (
        <div className="project-intro">
          <p className="intro-summary">{truncateDescription(intro.summary, 100)}</p>
          {intro.useCases && intro.useCases.length > 0 && (
            <div className="use-cases">
              {intro.useCases.slice(0, 3).map((useCase, idx) => (
                <span key={idx} className="use-case-tag">{useCase}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="project-footer">
        <div className="project-stats">
          <span className="lang-dot" data-lang={project.language?.toLowerCase()}></span>
          <span className="lang-label">{techStackSummary}</span>
          <span className="stat">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.37a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
            </svg>
            {formatStarCount(project.stars)}
          </span>
          <span className="stat">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
              <path d="M5 5.372v.878c0 .41.21.794.556 1.016l3.832 2.456c.366.234.836.234 1.202 0l3.832-2.456A1.22 1.22 0 0 0 15 6.25V5.372a1.22 1.22 0 0 0-.673-1.092L10.495 1.824a1.22 1.22 0 0 0-1.202 0L5.461 4.28A1.22 1.22 0 0 0 5 5.372Zm9.018 0v.878c0 .41-.21.794-.556 1.016l-3.832 2.456a1.22 1.22 0 0 1-1.202 0L5.461 7.266A1.22 1.22 0 0 1 5 6.25V5.372c0-.41.21-.794.556-1.016l3.832-2.456a1.22 1.22 0 0 1 1.202 0l3.832 2.456A1.22 1.22 0 0 1 15 5.372Z"/>
            </svg>
            {project.forks}
          </span>
        </div>
        <div className="project-actions">
          <button
            className="generate-report-btn"
            onClick={() => handleGenerateReport(project)}
            title="生成项目深度报告"
            disabled={generating}
          >
            {generating ? '生成中...' : '📄 生成报告'}
          </button>
        </div>
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </article>
  );
}

export default React.memo(ProjectCard);
