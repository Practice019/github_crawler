import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { slideInLeft } from '../utils/animations';
import { useTheme } from '../contexts/ThemeContext';
import './Sidebar.css';

function Sidebar() {
  const sidebarRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (sidebarRef.current) {
      // 侧边栏滑入动画
      slideInLeft(sidebarRef.current, { duration: 400 });
    }
  }, []);

  return (
    <aside ref={sidebarRef} className="sidebar" style={{ opacity: 0, transform: 'translateX(-50px)' }}>
      <nav className="sidebar-nav">
        <NavLink
          to="/trending"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg className="nav-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.37a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
          </svg>
          <span>热门项目</span>
        </NavLink>

        <NavLink
          to="/introductions"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg className="nav-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25ZM3.5 4.75A.75.75 0 0 1 4.25 4h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 3.5 4.75ZM4.25 7a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5h-7.5ZM3.5 10.75a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1-.75-.75Z"/>
          </svg>
          <span>项目介绍</span>
        </NavLink>

        <NavLink
          to="/doc-generator"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg className="nav-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H9.06l-.303-.303A2.25 2.25 0 0 0 7.168 2H1.75ZM1.5 2.75a.25.25 0 0 1 .25-.25h5.418c.264 0 .518.105.707.293L8.5 3.5h5.75a.25.25 0 0 1 .25.25v8.5a.25.25 0 0 1-.25.25H1.75a.25.25 0 0 1-.25-.25Z"/>
          </svg>
          <span>生成文档</span>
        </NavLink>

        <button className="theme-toggle-btn" onClick={toggleTheme} title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}>
          {theme === 'dark' ? (
            <svg className="theme-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-1.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm5.657-8.157a.75.75 0 0 1 0 1.061l-1.061 1.061a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 1 1-1.061-1.06l1.06-1.061a.75.75 0 0 1 1.061 0ZM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0ZM3 8a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 3 8Zm13 0a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8Zm-8 5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13Zm3.536-1.464a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061ZM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.06-1.06a.75.75 0 0 1 0-1.06Z"/>
            </svg>
          ) : (
            <svg className="theme-icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M9.598 1.591a.749.749 0 0 1 .785-.175 7.001 7.001 0 1 1-8.967 8.967.75.75 0 0 1 .961-.96 5.5 5.5 0 0 0 7.046-7.046.75.75 0 0 1 .175-.786Zm1.616 1.945a7 7 0 0 1-7.678 7.678 5.499 5.499 0 1 0 7.678-7.678Z"/>
            </svg>
          )}
          <span>{theme === 'dark' ? '浅色' : '深色'}</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
