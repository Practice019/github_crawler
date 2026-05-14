# GitHub Trending Projects Platform

一个自动获取 GitHub 热门项目、生成项目介绍文档，并提供项目管理功能的 Web 平台。

## ✨ 功能特性

### 📊 热门项目展示
- 自动爬取 GitHub Trending 项目（支持多语言、多时间范围）
- 智能缓存机制（永不过期）
- 手动更新缓存按钮
- 项目卡片展示（包含 stars、forks、描述等信息）
- 批量下载 README 文件

### 📝 项目介绍管理
- 自动生成项目介绍文档（基于 README）
- 项目列表展示（卡片式布局）
- 项目详情页（Markdown 渲染 + 代码高亮）
- 上下切换项目导航

### 🏷️ 标签系统
- 默认标签：未读
- 自定义标签（支持创建、重命名、删除）
- 随机颜色分配（避免重复）
- 标签筛选功能
- 每个项目可设置一个标签状态

### ⭐ 收藏功能
- 独立的收藏状态（可与标签共存）
- 收藏筛选
- 卡片和详情页都可快速收藏/取消收藏

### 🔍 搜索功能
- 实时搜索项目名称、概述、摘要
- 支持组合筛选（搜索 + 标签 + 收藏）

### 📥 手动导入
- 支持输入 GitHub 仓库链接导入 README
- 多种链接格式支持（完整链接、简短链接、owner/repo）

### 🤖 文档生成器
- 基于 OpenAI API 自动生成项目介绍
- 一键启动（下载 + 生成）
- 实时日志显示
- 支持手动导入单个仓库

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **前端**: React + React Router
- **爬虫**: Axios + Cheerio
- **文档生成**: Python + OpenAI API
- **Markdown 渲染**: react-markdown + remark-gfm
- **代码高亮**: react-syntax-highlighter
- **定时任务**: node-cron

## 📁 项目结构

```
.
├── server/                 # 后端服务
│   ├── src/
│   │   ├── routes/        # API 路由
│   │   │   ├── api.js                 # 热门项目 API
│   │   │   ├── introductions.js      # 项目介绍 API
│   │   │   ├── docGenerator.js       # 文档生成器 API
│   │   │   └── projectStatus.js      # 标签和收藏 API
│   │   └── services/      # 业务逻辑
│   │       ├── githubService.js      # GitHub 爬虫
│   │       ├── cacheService.js       # 缓存服务
│   │       ├── reportGenerator.js    # README 下载
│   │       └── scheduler.js          # 定时任务
│   ├── app.js
│   └── package.json
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   │   ├── HomePage.jsx                  # 热门项目页
│   │   │   ├── IntroductionsPage.jsx        # 项目介绍列表页
│   │   │   ├── IntroductionDetailPage.jsx   # 项目详情页
│   │   │   └── DocGeneratorPage.jsx         # 文档生成器页
│   │   ├── components/   # 通用组件
│   │   ├── services/     # API 服务
│   │   └── App.jsx
│   └── package.json
├── doc_generator/         # Python 文档生成器
│   ├── main.py
│   ├── requirements.txt
│   └── .env
├── introductions/         # 生成的项目介绍文档
├── reports/              # 下载的 README 文件
├── .cache.json           # 缓存文件
├── .env                  # 环境变量配置
└── README.md
```

## 🚀 快速开始

### 环境要求

- Node.js >= 16
- Python >= 3.8 (仅文档生成功能需要)
- npm 或 yarn

### 1. 克隆项目

```bash
git clone <repository-url>
cd test/31
```

### 2. 配置环境变量

#### 后端配置 (根目录 `.env`)

```bash
# GitHub Personal Access Token (可选，提高 API 速率限制)
# 获取方式：https://github.com/settings/tokens
# 权限：public_repo
# 未配置：60 次/小时，配置后：5000 次/小时
GITHUB_TOKEN=your_github_token_here
```

#### 文档生成器配置 (`doc_generator/.env`)

```bash
# OpenAI API 配置 (仅文档生成功能需要)
OPENAI_API_KEY=your_openai_api_key
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4
```

### 3. 安装依赖

#### 后端依赖

```bash
npm install
```

#### Python 依赖 (可选)

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

## 📖 使用说明

### 热门项目页面

1. **更新缓存**: 点击"🔄 更新缓存"按钮手动获取最新的 GitHub Trending 数据
2. **筛选项目**: 使用语言和时间范围筛选器
3. **批量下载**: 点击"📥 下载全部"批量下载所有项目的 README

### 项目介绍页面

1. **查看项目**: 浏览已生成介绍的项目列表
2. **搜索项目**: 使用搜索框快速查找项目
3. **标签管理**: 
   - 点击"🏷️ 管理标签"创建自定义标签
   - 点击标签旁的 ✎ 重命名标签
   - 点击 ✕ 删除自定义标签
4. **筛选项目**: 
   - 点击"全部"显示所有项目
   - 点击"⭐ 收藏"只显示收藏的项目
   - 点击标签按钮按标签筛选
5. **收藏项目**: 点击卡片右上角的星标图标
6. **设置标签**: 使用卡片底部的下拉框设置项目标签

### 项目详情页面

1. **查看详情**: 点击项目卡片进入详情页
2. **导航切换**: 使用顶部的左右箭头切换项目
3. **收藏**: 点击"☆ 收藏"按钮
4. **设置标签**: 使用下拉框更改标签（如果设置的标签不符合当前筛选条件，会自动跳转到下一个项目）
5. **访问 GitHub**: 点击"访问 GitHub"按钮打开原仓库

### 文档生成器页面

1. **手动导入**: 
   - 在输入框粘贴 GitHub 仓库链接
   - 支持格式：`https://github.com/owner/repo`、`github.com/owner/repo`、`owner/repo`
   - 点击"📥 导入 README"
2. **一键启动**: 点击"🚀 一键启动"自动下载所有 README 并生成文档
3. **仅生成文档**: 点击"▶ 仅生成文档"只运行文档生成程序
4. **查看日志**: 实时查看操作日志

## 🔧 API 接口

### 热门项目

- `GET /api/trending?since={daily|weekly|monthly|all}&language={lang}` - 获取热门项目
- `GET /api/github/trending?since={daily|weekly|monthly|all}&language={lang}` - 获取热门项目（兼容）
- `POST /api/scheduler/fetch` - 手动触发缓存更新
- `GET /api/scheduler/status` - 获取调度器状态

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

缓存默认永不过期，存储在 `.cache.json` 文件中。

### 定时任务

默认每 6 小时自动更新缓存（已禁用自动启动，需手动触发）。

### 文档生成

- 使用 OpenAI API 生成项目介绍
- 支持自定义 API Base URL
- 生成的文档保存在 `introductions/` 目录

## 📝 数据存储

- **缓存数据**: `.cache.json`
- **项目状态**: `introductions/.status.json`
- **README 文件**: `reports/{author}_{repo}/README.md`
- **项目介绍**: `introductions/{author}_{repo}/项目介绍.md`
- **项目链接**: `introductions/{author}_{repo}/项目链接.md`

## 🤝 依赖服务

### 必需

- **GitHub API**: 用于爬取热门项目和 README
  - 无 Token: 60 次/小时
  - 有 Token: 5000 次/小时

### 可选

- **OpenAI API**: 用于生成项目介绍文档
  - 仅在使用文档生成功能时需要
  - 可配置自定义 API Base URL

## 📄 许可证

MIT
