import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { fadeIn, staggerFadeIn, scaleIn } from '../utils/animations';
import './WelcomePage.css';

function WelcomePage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    // 页面加载动画
    if (heroRef.current) {
      fadeIn(heroRef.current, { duration: 1000 });
    }

    setTimeout(() => {
      if (featuresRef.current) {
        const features = featuresRef.current.querySelectorAll('.feature-card');
        staggerFadeIn(Array.from(features), { delay: 150 });
      }
    }, 500);
  }, []);

  // 鼠标移动效果
  useEffect(() => {
    let isOverClickable = false;

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });

      // 检测鼠标是否在可点击元素上
      const target = e.target;
      const clickable = target.closest('button, a, .feature-card, .tech-item');
      isOverClickable = !!clickable;

      // 添加鼠标轨迹粒子
      const newTrail = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY
      };

      setTrail(prev => [...prev.slice(-15), newTrail]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 鼠标点击涟漪效果
  const handleClick = (e) => {
    const newRipple = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY
    };

    setRipples(prev => [...prev, newRipple]);

    // 1秒后移除涟漪
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 1000);
  };

  const handleStart = () => {
    navigate('/trending');
  };

  const features = [
    {
      icon: '🔥',
      title: '热门追踪',
      desc: '实时追踪 GitHub Trending 榜单，支持多语言、多时间范围筛选。智能缓存机制确保数据新鲜度，批量下载 README 文件，让你不错过任何优质开源项目。',
      gradient: 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)'
    },
    {
      icon: '🤖',
      title: 'AI 智能文档',
      desc: '基于 OpenAI API 自动生成项目介绍文档，深度分析项目特点、技术栈和应用场景。支持 Markdown 渲染和代码高亮，让你快速了解项目核心价值。',
      gradient: 'linear-gradient(135deg, rgba(240, 147, 251, 0.3) 0%, rgba(245, 87, 108, 0.3) 100%)'
    },
    {
      icon: '🏷️',
      title: '智能标签系统',
      desc: '自定义标签管理，为项目打上个性化标记。支持标签筛选、随机颜色分配、项目状态标记，让你的项目管理井井有条，快速定位目标项目。',
      gradient: 'linear-gradient(135deg, rgba(79, 172, 254, 0.3) 0%, rgba(0, 242, 254, 0.3) 100%)'
    },
    {
      icon: '⭐',
      title: '收藏管理',
      desc: '独立的收藏功能，一键收藏感兴趣的项目。支持收藏筛选、快速收藏/取消操作，与标签系统完美协同，构建你的专属项目库。',
      gradient: 'linear-gradient(135deg, rgba(67, 233, 123, 0.3) 0%, rgba(56, 249, 215, 0.3) 100%)'
    },
    {
      icon: '🔍',
      title: '全文搜索',
      desc: '强大的实时搜索功能，支持搜索项目名称、描述、AI 生成的摘要。组合筛选让你精准定位目标项目，大幅提升查找效率。',
      gradient: 'linear-gradient(135deg, rgba(250, 112, 154, 0.3) 0%, rgba(254, 225, 64, 0.3) 100%)'
    },
    {
      icon: '⚡',
      title: '极速体验',
      desc: 'React + Anime.js 打造的流畅动画效果，现代化的交互设计。响应式布局适配各种设备，骨架屏加载优化，带来极致的用户体验。',
      gradient: 'linear-gradient(135deg, rgba(48, 207, 208, 0.3) 0%, rgba(51, 8, 103, 0.3) 100%)'
    }
  ];

  return (
    <div className="welcome-page" onClick={handleClick}>
      {/* 动态网格背景 */}
      <div className="grid-background"></div>

      {/* 鼠标轨迹粒子 */}
      {trail.map((point) => (
        <div
          key={point.id}
          className="trail-particle"
          style={{
            left: `${point.x}px`,
            top: `${point.y}px`
          }}
        />
      ))}

      {/* 点击涟漪效果 */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ripple"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`
          }}
        />
      ))}

      {/* 流星效果 */}
      <div className="shooting-stars">
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
        <div className="star"></div>
      </div>

      {/* 静态星星 */}
      <div className="static-stars">
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
        <div className="static-star"></div>
      </div>

      {/* 浮动粒子 */}
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <div className="welcome-container">
        {/* Hero Section */}
        <section ref={heroRef} className="hero-section" style={{ opacity: 0 }}>
          <div className="hero-badge">GitHub Trending Platform</div>
          <h1 className="hero-title">
            发现最<span className="highlight">热门</span>的
            <br />
            开源项目
          </h1>
          <p className="hero-subtitle">
            自动追踪 GitHub Trending · AI 智能生成项目文档 · 标签与收藏管理
            <br />
            一站式开源项目发现与管理平台
          </p>

          <button className="cta-button" onClick={handleStart}>
            <span className="cta-text">开始探索</span>
            <svg className="cta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">热门项目</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">AI</div>
              <div className="stat-label">智能文档</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">实时</div>
              <div className="stat-label">数据更新</div>
            </div>
          </div>
        </section>

        {/* 项目介绍 */}
        <section className="intro-section">
          <div className="intro-content">
            <h2 className="intro-title">为什么选择我们？</h2>
            <p className="intro-text">
              在开源世界中，每天都有成千上万的优质项目诞生。但如何从海量信息中快速找到真正有价值的项目？
              如何高效地管理和追踪感兴趣的开源项目？这正是我们要解决的问题。
            </p>
            <p className="intro-text">
              <strong>GitHub Trending Projects Platform</strong> 是一个专为开发者打造的开源项目发现与管理平台。
              我们自动追踪 GitHub Trending 榜单，利用 AI 技术深度分析每个项目的特点、技术栈和应用场景，
              生成易读的项目介绍文档。通过智能标签系统和收藏功能，你可以轻松构建自己的项目知识库。
            </p>
            <p className="intro-text">
              无论你是想学习新技术、寻找项目灵感，还是追踪行业趋势，这个平台都能帮你节省大量时间，
              让你专注于真正重要的事情——学习和创造。我们相信，好的工具应该让复杂的事情变简单，
              让开发者能够更高效地探索开源世界的无限可能。
            </p>
            <div className="intro-highlights">
              <div className="highlight-item">
                <span className="highlight-icon">⚡</span>
                <div className="highlight-content">
                  <h4>自动化追踪</h4>
                  <p>无需手动刷新，系统自动获取最新热门项目</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">🧠</span>
                <div className="highlight-content">
                  <h4>AI 智能分析</h4>
                  <p>深度解读项目价值，生成专业的介绍文档</p>
                </div>
              </div>
              <div className="highlight-item">
                <span className="highlight-icon">📚</span>
                <div className="highlight-content">
                  <h4>知识库管理</h4>
                  <p>标签分类、收藏筛选，构建个人项目知识体系</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="features-section">
          <div className="features-header">
            <h2 className="features-title">核心功能</h2>
            <p className="features-subtitle">
              强大的功能集合，让你高效管理和发现优质开源项目
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div
                key={index}
                className="feature-card"
                style={{
                  opacity: 0,
                  transform: 'translateY(30px)',
                  background: feature.gradient
                }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
                <div className="feature-shine"></div>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="tech-section">
          <div className="tech-header">
            <span className="tech-badge">技术栈</span>
            <p className="tech-description">
              采用现代化的前后端技术栈，确保平台的高性能、可扩展性和优秀的用户体验
            </p>
          </div>
          <div className="tech-grid">
            {[
              { name: 'React', desc: '前端框架' },
              { name: 'Node.js', desc: '后端运行时' },
              { name: 'Express', desc: 'Web 框架' },
              { name: 'Anime.js', desc: '动画库' },
              { name: 'React Router', desc: '路由管理' },
              { name: 'Axios', desc: 'HTTP 客户端' },
              { name: 'OpenAI API', desc: 'AI 文档生成' },
              { name: 'Cheerio', desc: '数据爬取' },
              { name: 'Markdown', desc: '文档渲染' }
            ].map((tech, index) => (
              <div key={index} className="tech-item">
                <span className="tech-name">{tech.name}</span>
                <span className="tech-desc">{tech.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="welcome-footer">
          <div className="footer-content">
            <p>Made with ❤️ by Developers</p>
            <div className="footer-links">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
              <span>·</span>
              <a href="#" onClick={(e) => { e.preventDefault(); handleStart(); }}>开始使用</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default WelcomePage;
