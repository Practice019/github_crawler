import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import './App.css';
import './styles/animations.css';
import './styles/modern-theme.css';

// 路由级代码分割 - 懒加载页面组件
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const IntroductionsPage = lazy(() => import('./pages/IntroductionsPage'));
const IntroductionDetailPage = lazy(() => import('./pages/IntroductionDetailPage'));
const DocGeneratorPage = lazy(() => import('./pages/DocGeneratorPage'));

// 加载中组件
function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      加载中...
    </div>
  );
}

function App() {
  const location = useLocation();

  // 欢迎页面不显示侧边栏和标题
  const isWelcomePage = location.pathname === '/';

  // 根据路由决定标题
  const getTitle = () => {
    if (location.pathname === '/trending') {
      return 'GitHub 热门项目';
    }
    if (location.pathname === '/introductions') {
      return '项目介绍';
    }
    if (location.pathname === '/doc-generator') {
      return null; // 文档生成器页面自己有标题
    }
    // 详情页不显示标题
    return null;
  };

  const title = getTitle();

  if (isWelcomePage) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="app-container">
        {title && (
          <header className="app-header">
            <h1>{title}</h1>
          </header>
        )}
        <main className="app-main">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/trending" element={<HomePage />} />
              <Route path="/introductions" element={<IntroductionsPage />} />
              <Route path="/introductions/:projectId" element={<IntroductionDetailPage />} />
              <Route path="/doc-generator" element={<DocGeneratorPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default App;
