# 快速开始指南

## 步骤 1：配置 API Key

编辑 `.env` 文件，添加您的 OpenAI API Key：

```bash
OPENAI_API_KEY=sk-your-actual-api-key-here
```

## 步骤 2：安装依赖

```bash
cd D:/test/31/doc_generator
pip install -r requirements.txt
```

## 步骤 3：运行测试（处理前 5 个文件）

```bash
python main_simple.py
```

这将处理前 5 个文件作为测试。

## 步骤 4：处理所有文件

如果测试成功，修改 `main_simple.py` 的最后部分：

```python
# 将这一行：
results = await generator.batch_process(max_concurrent=3, limit=5)

# 改为：
results = await generator.batch_process(max_concurrent=5, limit=None)
```

然后重新运行：

```bash
python main_simple.py
```

## 输出说明

- **输出目录**：`D:/test/31/introductions/`
- **生成的文档**：`{项目名}_README_CN.md`
- **处理日志**：`process.log`
- **统计报告**：`report.json`

## 调整并发数

如果遇到 API 限流，可以降低并发数：

```python
results = await generator.batch_process(max_concurrent=2, limit=None)
```

## 故障排除

### 问题 1：API Key 错误
确保 `.env` 文件中的 API Key 正确。

### 问题 2：API 限流
降低 `max_concurrent` 参数值。

### 问题 3：网络错误
检查网络连接，或配置代理。

## 性能预估

- 单个文件处理时间：约 5-10 秒
- 100 个文件（并发数 5）：约 10-20 分钟
- 100 个文件（并发数 3）：约 15-30 分钟

## 查看结果

处理完成后，查看：
1. `D:/test/31/introductions/report.json` - 统计报告
2. `D:/test/31/introductions/process.log` - 详细日志
3. `D:/test/31/introductions/*.md` - 生成的文档
