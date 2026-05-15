# GitHub Trending Projects Platform

一个现代化的 GitHub 热门项目追踪平台，集成 AI 智能分析、自动化文档生成和项目知识库管理功能。

## ✨ 核心功能

### 🔥 热门项目追踪
- **实时追踪** GitHub Trending 榜单（支持多语言、多时间范围）
- **智能缓存**机制，永不过期，手动更新
- **批量下载** README 文件，自动跳过已存在文件
- **精美卡片**展示，包含 stars、forks、语言等信息
- **动画效果**，交错淡入，流畅体验

### 🤖 AI 智能分析
- 基于 **OpenAI API** 自动生成项目深度介绍
- **一键启动**：自动下载 + 生成文档
- **实时日志**显示，彩色分类（info/success/error/warning/progress）
- **手动导入**单个仓库，支持多种链接格式
- **并发处理**，高效生成大量项目文档

### 📚 知识库管理
- **标签系统**：自定义标签、随机颜色、智能筛选
- **收藏功能**：独立收藏状态，快速访问
- **搜索功能**：实时搜索项目名称、概述、摘要
- **项目详情**：Markdown 渲染 + 代码高亮
- **导航切换**：上下切换项目，流畅浏览

### 🎨 现代化界面
- **欢迎页面**：动态背景、流星效果、鼠标交互
- **深色/浅色**主题切换，自动保存偏好
- **响应式设计**，适配各种屏幕尺寸
- **通知系统**：现代化通知组件，替代传统 alert
- **动画效果**：Anime.js 驱动，流畅自然

## 🛠️ 技术栈

### 前端
- **React 18** + React Router - 现代化 SPA 框架
- **Anime.js V4** - 高性能动画库
- **React Context** - 全局状态管理（主题、日志）
- **react-markdown** + remark-gfm - Markdown 渲染
- **react-syntax-highlighter** - 代码高亮
- **Axios** - HTTP 客户端

### 后端
- **Node.js** + Express - 服务端框架
- **Cheerio** - HTML 解析（爬虫）
- **node-cron** - 定时任务
- **Server-Sent Events (SSE)** - 实时日志推送

### AI 文档生成
- **Python 3.8+** - 文档生成脚本
- **OpenAI API** - GPT-4 智能分析
- **tqdm** - 进度条显示
- **并发处理** - 多线程加速

## 📁 项目结构

```
.
├── frontend/                   # 前端应用
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   │   ├── WelcomePage.jsx              # 欢迎页（首页）
│   │   │   ├── HomePage.jsx                 # 热门项目页
│   │   │   ├── IntroductionsPage.jsx        # 项目介绍列表页
│   │   │   ├── IntroductionDetailPage.jsx   # 项目详情页
│   │   │   └── DocGeneratorPage.jsx         # 文档生成器页
│   │   ├── components/        # 通用组件
│   │   │   ├── ProjectCard.jsx              # 项目卡片
│   │   │   ├── Notification.jsx             # 通知组件
│   │   │   ├── Sidebar.jsx                  # 侧边栏
│   │   │   └── ...
│   │   ├── contexts/          # Context 状态管理
│   │   │   ├── ThemeContext.jsx             # 主题管理
│   │   │   └── LogContext.jsx               # 全局日志
│   │   ├── utils/             # 工具函数
│   │   │   ├── animations.js                # 动画工具
│   │   │   └── introFormatter.js            # 格式化工具
│   │   ├── services/          # API 服务
│   │   └── styles/            # 样式文件
│   └── package.json
├── server/                     # 后端服务
│   ├── src/
│   │   ├── routes/            # API 路由
│   │   │   ├── api.js                       # 热门项目 API
│   │   │   ├── introductions.js            # 项目介绍 API
│   │   │   ├── docGenerator.js             # 文档生成器 API
│   │   │   └── projectStatus.js            # 标签和收藏 API
│   │   └── services/          # 业务逻辑
│   │       ├── githubService.js            # GitHub 爬虫
│   │       ├── cacheService.js             # 缓存服务
│   │       ├── reportGenerator.js          # README 下载
│   │       └── scheduler.js                # 定时任务
│   ├── app.js
│   └── package.json
├── doc_generator/              # Python 文档生成器
│   ├── main.py                # 主程序
│   ├── requirements.txt       # Python 依赖
│   └── .env                   # OpenAI 配置
├── introductions/              # 生成的项目介绍文档
├── reports/                    # 下载的 README 文件
├── .cache.json                 # 缓存文件
├── .env                        # 环境变量配置
└── README.md
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 16
- **Python** >= 3.8（仅文档生成功能需要）
- **npm** 或 yarn

### 1. 克隆项目

```bash
git clone <repository-url>
cd test/31
```

### 2. 配置环境变量

#### 后端配置（根目录 `.env`）

```bash
# GitHub Personal Access Token（可选，提高 API 速率限制）
# 获取方式：https://github.com/settings/tokens
# 权限：public_repo
# 未配置：60 次/小时，配置后：5000 次/小时
GITHUB_TOKEN=your_github_token_here
```

#### 文档生成器配置（`doc_generator/.env`）

```bash
# OpenAI API 配置（仅文档生成功能需要）
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
```

### 3. 安装依赖

#### 后端依赖

```bash
npm install
```

#### Python 依赖（可选）

```bash
cd doc_generator
pip install -r requirements.txt
cd ..
```

### 4. 启动服务

```bash
npm start
```

服务将在 `http://localhost:3000` 启动

### 5. 访问应用

打开浏览器访问 `http://localhost:3000`

## 📖 使用指南

### 欢迎页面（首页）

- **动态背景**：流星、星星、粒子效果
- **鼠标交互**：鼠标轨迹、点击涟漪
- **功能介绍**：6 大核心功能展示
- **快速导航**：一键进入主应用

### 热门项目页面

1. **更新缓存**：点击"🔄 更新缓存"手动获取最新 GitHub Trending 数据
2. **筛选项目**：使用语言和时间范围筛选器
3. **搜索项目**：实时搜索项目名称、描述
4. **排序**：按 Stars、Forks、Name 排序
5. **批量下载**：点击"📥 下载全部"批量下载所有项目的 README
6. **生成报告**：点击卡片上的"📄 生成报告"按钮

### 项目介绍页面

1. **查看项目**：浏览已生成介绍的项目列表
2. **搜索项目**：使用搜索框快速查找项目
3. **标签管理**：
   - 点击"🏷️ 管理标签"创建自定义标签
   - 点击标签旁的 ✎ 重命名标签
   - 点击 ✕ 删除自定义标签
4. **筛选项目**：
   - 点击"全部"显示所有项目
   - 点击"⭐ 收藏"只显示收藏的项目
   - 点击标签按钮按标签筛选
5. **收藏项目**：点击卡片右上角的星标图标
6. **设置标签**：使用卡片底部的下拉框设置项目标签

### 项目详情页面

1. **查看详情**：点击项目卡片进入详情页
2. **导航切换**：使用顶部的左右箭头切换项目
3. **收藏**：点击"☆ 收藏"按钮
4. **设置标签**：使用下拉框更改标签
5. **访问 GitHub**：点击"访问 GitHub"按钮打开原仓库
6. **Markdown 渲染**：完整的项目介绍文档，支持代码高亮

### 文档生成器页面

1. **手动导入**：
   - 在输入框粘贴 GitHub 仓库链接
   - 支持格式：`https://github.com/owner/repo`、`github.com/owner/repo`、`owner/repo`
   - 点击"📥 导入 README"
2. **一键启动**：
   - 勾选"启动前更新缓存"（可选）
   - 点击"🚀 一键启动"自动下载所有 README 并生成文档
3. **仅生成文档**：点击"▶ 仅生成文档"只运行文档生成程序
4. **查看日志**：实时查看操作日志，彩色分类
   - **蓝色**：分隔符（=== 开头）
   - **青色**：统计信息（总计、成功、跳过、失败）
   - **绿色**：成功信息
   - **红色**：错误信息
   - **黄色**：警告信息
   - **灰色**：跳过信息
   - **紫色**：进度条
   - **白色/黑色**：普通信息

## 🔧 API 接口

### 热门项目

- `GET /api/trending?since={daily|weekly|monthly|all}&language={lang}` - 获取热门项目
- `GET /api/github/trending?since={daily|weekly|monthly|all}&language={lang}` - 获取热门项目（兼容）
- `POST /api/scheduler/fetch` - 手动触发缓存更新
- `GET /api/scheduler/status` - 获取调度器状态
- `GET /api/scheduler/logs` - 获取实时日志（SSE）

### 项目介绍

- `GET /api/introductions` - 获取项目介绍列表
- `GET /api/introductions/:id` - 获取项目详情
- `POST /api/reports/generate` - 生成项目报告（下载 README）

### 标签和收藏

- `GET /api/project-status` - 获取所有标签和项目状态
- `PUT /api/project-status/:id` - 更新项目标签
- `POST /api/project-status/tags` - 创建标签
- `PUT /api/project-status/tags/:tagId` - 重命名标签
- `DELETE /api/project-status/tags/:tagId` - 删除标签
- `POST /api/project-status/favorites/:id` - 添加收藏
- `DELETE /api/project-status/favorites/:id` - 取消收藏

### 文档生成器

- `POST /api/doc-generator/run` - 启动文档生成程序
- `POST /api/doc-generator/stop` - 停止文档生成程序
- `GET /api/doc-generator/status` - 获取运行状态
- `GET /api/doc-generator/logs` - 获取实时日志（SSE）

## ⚙️ 配置说明

### 缓存配置

- 缓存默认**永不过期**，存储在 `.cache.json` 文件中
- 手动更新：点击"🔄 更新缓存"按钮
- 自动更新：定时任务每 6 小时自动更新（默认禁用）

### 定时任务

默认每 6 小时自动更新缓存（已禁用自动启动，需手动触发）。

可在 `server/src/services/scheduler.js` 中修改：

```javascript
// 每 6 小时更新一次
cron.schedule('0 */6 * * *', async () => {
  // ...
});
```

### 文档生成

- 使用 **OpenAI API** 生成项目介绍
- 支持自定义 API Base URL（兼容其他 OpenAI 兼容服务）
- 生成的文档保存在 `introductions/` 目录
- 支持**并发处理**，默认 5 个并发

### 主题配置

- 支持**深色/浅色**主题切换
- 主题偏好自动保存到 localStorage
- 点击侧边栏的主题切换按钮即可切换

## 📝 数据存储

- **缓存数据**：`.cache.json`
- **项目状态**：`introductions/.status.json`
- **README 文件**：`reports/{author}_{repo}/README.md`
- **项目介绍**：`introductions/{author}_{repo}/项目介绍.md`
- **项目链接**：`introductions/{author}_{repo}/项目链接.md`

## 🎨 界面特性

### 动画效果

- **欢迎页面**：
  - 流星效果（8 颗，对角线移动）
  - 静态星星（20 颗，闪烁效果）
  - 浮动粒子（5 个，随机移动）
  - 鼠标轨迹（粒子跟随）
  - 点击涟漪（扩散效果）

- **项目卡片**：
  - 交错淡入（stagger fade-in）
  - 悬停效果（hover scale）
  - 按钮脉冲（pulse animation）

### 主题系统

- **深色主题**：
  - 背景：`#0a0e27`
  - 文字：`#ffffff`
  - 强调色：`#667eea`

- **浅色主题**：
  - 背景：`#ffffff`
  - 文字：`#24292f`
  - 强调色：`#0969da`

### 通知系统

- **类型**：success、error、warning、info
- **位置**：右上角固定
- **自动关闭**：5 秒后自动消失
- **手动关闭**：点击 ✕ 按钮
- **样式**：Glassmorphism（毛玻璃效果）

## 🤝 依赖服务

### 必需

- **GitHub API**：用于爬取热门项目和 README
  - 无 Token：60 次/小时
  - 有 Token：5000 次/小时
  - 获取 Token：https://github.com/settings/tokens

### 可选

- **OpenAI API**：用于生成项目介绍文档
  - 仅在使用文档生成功能时需要
  - 可配置自定义 API Base URL
  - 支持 GPT-4、GPT-3.5-turbo 等模型

## 🐛 常见问题

### 1. GitHub API 速率限制

**问题**：下载 README 时提示速率限制

**解决方案**：
1. 配置 `GITHUB_TOKEN` 环境变量
2. 获取 Token：https://github.com/settings/tokens
3. 权限选择：`public_repo`
4. 配置后速率限制从 60 次/小时提升到 5000 次/小时

### 2. 文档生成失败

**问题**：点击"一键启动"后文档生成失败

**解决方案**：
1. 检查 `doc_generator/.env` 文件是否配置正确
2. 确认 OpenAI API Key 有效
3. 检查 Python 依赖是否安装完整
4. 查看日志中的具体错误信息

### 3. 日志滚动抽搐

**问题**：日志快速更新时滚动条抽搐

**解决方案**：
- 已优化为始终自动滚动到底部
- 如需查看历史日志，可暂停程序后滚动

### 4. 主题切换不生效

**问题**：点击主题切换按钮后界面没有变化

**解决方案**：
1. 清除浏览器缓存（Ctrl + F5）
2. 检查浏览器控制台是否有错误
3. 确认 localStorage 是否被禁用

## 📄 许可证

MIT License

## 🙏 致谢

- [GitHub Trending](https://github.com/trending) - 数据来源
- [OpenAI](https://openai.com/) - AI 文档生成
- [Anime.js](https://animejs.com/) - 动画库
- [React](https://react.dev/) - 前端框架
- [Express](https://expressjs.com/) - 后端框架

---

**Made with ❤️ by Claude Code**
