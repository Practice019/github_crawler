# 批量技术文档生成系统

基于 OpenAI API 的批量技术文档生成系统，将 GitHub 项目 README 自动转化为完整的中文技术介绍文档。

## 功能特性

- ✅ 批量处理 100+ 个项目文档
- ✅ 异步并发处理，提高效率
- ✅ 智能跳过已存在文件
- ✅ 自动重试机制
- ✅ 实时进度显示
- ✅ 详细日志记录
- ✅ 统计报告生成
- ✅ 完整性优先的技术文档生成

## 系统要求

- Python 3.10+
- OpenAI API Key

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置

1. 复制 `.env.example` 为 `.env`
2. 配置 OpenAI API Key

```bash
cp .env.example .env
# 编辑 .env 文件，添加：
# OPENAI_API_KEY=sk-your-key-here
```

## 使用方法

### 测试模式（推荐首次使用）

```bash
python main.py --test
```

只处理第一个文件，快速验证配置是否正确。

### 小批量处理

```bash
python main.py --limit 5
```

处理前 5 个文件，验证批量处理稳定性。

### 完整处理

```bash
python main.py
```

处理所有文件。

### 自定义并发数

```bash
python main.py --concurrent 3
```

降低并发数可以避免 API 限流。

### 查看帮助

```bash
python main.py --help
```

### 目录结构

```
D:/test/31/
├── reports/              # 源文件目录（输入）
│   ├── project1.md
│   ├── project2.md
│   └── ...
├── introductions/        # 输出目录（自动创建）
│   ├── {owner}_{repo}/   # 每个项目一个文件夹
│   │   ├── 项目介绍.md   # 完整的技术文档
│   │   └── github_link.md # GitHub链接
│   ├── process.log       # 处理日志
│   └── report.json       # 统计报告
└── doc_generator/        # 项目代码
    ├── main.py
    ├── requirements.txt
    └── README.md
```

## 输出文档格式

生成的每个文档包含以下标准章节：

```markdown
## 项目概述
- 项目是什么
- 解决什么问题
- 核心价值

## 核心功能
- 所有主要功能详细说明
- 工作流/使用场景逐一说明

## 技术架构
- 系统组成部分
- 组件职责和交互关系
- 技术栈和依赖

## 应用场景
- 典型使用场景
- 具体应用方式

## 目标用户
- 适用人群
- 技术背景要求

## 部署和使用
- 硬件/软件要求
- 部署方式
- 配置说明

## 项目结构
- 目录和文件说明
- 模块职责

## 文档和资源
- 官方文档链接
```

### 写作原则

1. **完整性优先**：不遗漏任何关键信息，写到把项目说清楚为止
2. **清晰性**：技术术语保留，但要解释其作用
3. **结构化**：保持README中的表格/列表结构
4. **准确性**：基于README内容，不添加不存在的信息
5. **实用性**：说明如何使用，不只是罗列功能
6. **无长度限制**：内容完整性比简洁性更重要

## 特性说明

### 1. 文件存在性检查
处理前自动检查目标文件是否存在，存在则跳过，避免重复处理。

### 2. 错误处理
- 失败的文件自动跳过
- 记录详细错误日志
- 继续处理下一个文件

### 3. 并发控制
- 默认并发数：5
- 可通过修改 `max_concurrent` 参数调整
- 避免 API 限流

### 4. 进度显示
使用 tqdm 实时显示处理进度：
```
处理进度: 45%|████▌     | 45/100 [02:15<02:45, 3.00s/it]
```

### 5. 统计报告
处理完成后自动生成 JSON 格式报告：
```json
{
  "timestamp": "2026-05-04T10:30:00",
  "total": 100,
  "success": 95,
  "skipped": 3,
  "failed": 2,
  "details": [...]
}
```

## 日志说明

日志文件位置：`D:/test/31/introductions/process.log`

日志级别：
- INFO：正常处理信息
- WARNING：重试警告
- ERROR：处理失败错误

## 性能优化

- 使用 asyncio 异步处理
- 信号量控制并发数
- 自动重试机制（最多3次）
- 智能跳过已处理文件

## 故障排除

### 问题1：golutra-cli 未找到
确保 golutra-cli.exe 位于正确路径：
```
D:/project_GIT/golutra-master/golutra-cli.exe
```

### 问题2：API 限流
降低并发数：
```python
results = await generator.batch_process(max_concurrent=3)
```

### 问题3：编码错误
所有文件使用 UTF-8 编码，如遇到编码问题，检查源文件编码。

## 测试

### 功能测试
```bash
# 测试处理 10 个文件
python main.py
```

### 性能测试
查看日志中的时间戳，计算总耗时。

### 错误测试
检查 process.log 中的错误记录。

## 技术架构

```
┌─────────────────┐
│   main.py       │  主控制器
└────────┬────────┘
         │
         ├─> DocumentGenerator  文档生成器
         │   ├─> process_file()  单文件处理
         │   ├─> batch_process() 批量处理
         │   └─> generate_report() 报告生成
         │
         ├─> golutra-cli  文档生成引擎
         │
         ├─> asyncio  并发处理
         ├─> tqdm  进度显示
         └─> logging  日志记录
```

## 许可证

MIT License

## 作者

Claude Code Assistant

## 更新日志

### v1.0.0 (2026-05-04)
- 初始版本
- 支持批量文档生成
- 集成 golutra-cli
- 异步并发处理
- 完整的错误处理和日志系统
