import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import IntroductionsPage from './pages/IntroductionsPage';
import IntroductionDetailPage from './pages/IntroductionDetailPage';
import DocGeneratorPage from './pages/DocGeneratorPage';
import './App.css';

function App() {
  const location = useLocation();

  // 根据路由决定标题
  const getTitle = () => {
    if (location.pathname === '/') {
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
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/introductions" element={<IntroductionsPage />} />
            <Route path="/introductions/:projectId" element={<IntroductionDetailPage />} />
            <Route path="/doc-generator" element={<DocGeneratorPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
