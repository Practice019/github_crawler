"""
简化版批量文档生成系统
直接使用 OpenAI API 生成文档
"""

import asyncio
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import functools

try:
    from tqdm.asyncio import tqdm
except ImportError:
    os.system("pip install tqdm")
    from tqdm.asyncio import tqdm

try:
    from openai import AsyncOpenAI
except ImportError:
    print("正在安装 openai...")
    os.system("pip install openai")
    from openai import AsyncOpenAI

try:
    from dotenv import load_dotenv
except ImportError:
    os.system("pip install python-dotenv")
    from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置日志
log_dir = Path("D:/test/31/introductions")
log_dir.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / 'process.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


# 重试装饰器
def retry(max_attempts=3, delay=2):
    """错误重试装饰器"""
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    logger.warning(f"尝试 {attempt + 1}/{max_attempts} 失败: {str(e)}")
                    if attempt == max_attempts - 1:
                        raise
                    await asyncio.sleep(delay * (attempt + 1))
            return None
        return wrapper
    return decorator


class SimpleDocumentGenerator:
    """简化版文档生成器"""

    def __init__(self, source_dir: str, output_dir: str):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 初始化 OpenAI 客户端
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("请在 .env 文件中设置 OPENAI_API_KEY")

        api_base = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

        self.client = AsyncOpenAI(api_key=api_key, base_url=api_base)

        # 文档生成提示词
        self.system_prompt = """你是B站爆款短视频文案专家，专门为技术类开源项目创作视频脚本。

## 任务
将GitHub开源项目README转化为B站视频脚本，完整讲清楚项目，然后按50字分段输出。

## 目标受众
- 技术爱好者/学生（"GitHub上最火的XX工具"）
- 泛科技用户（"3分钟看懂这个神器"）

## 内容结构要求（必须包含以下所有部分）

### 1. 开场痛点（对话式）
- 抛出目标用户的真实痛点
- 引发共鸣，让用户产生"说的就是我"的感觉
- 例："你是不是也遇到过XX问题？"

### 2. 项目核心定位（对话式）
- 一句话说清楚这个项目是什么
- 必须包含：项目名称 + GitHub Star数（如果有）
- 例："今天给大家介绍GitHub上10万+Star的神器Dify，一个开源的LLM应用开发平台"

### 3. 核心价值（陈述式）
- 这个项目解决了什么核心问题
- 相比传统方案有什么优势
- 例："让你不用写代码就能搭建AI应用，5分钟就能上手"

### 4. 核心功能讲解（陈述式，严格3-4个功能）
**重要**：只讲3-4个最核心的功能，不要超过4个。
每个功能必须包含：
- 功能是什么
- 解决什么场景问题
- 怎么用（简单描述）
- 例："第一个核心功能是可视化工作流编排。你可以像搭积木一样拖拽组件，快速构建AI应用，不需要写一行代码。比如你想做个客服机器人，直接拖个对话节点、接个知识库、连上大模型，几分钟就搞定。"

### 5. 技术亮点/数据背书（陈述式）
必须提取并展示：
- GitHub Star数、Fork数、贡献者数
- 更新频率（如"月均XX提交"，说明项目活跃）
- 功能数据（如"支持100+AI模型""10万+用户"）
- 技术栈信息（主要技术选型）
- 与同类项目对比（如果README中有）

### 6. 使用门槛/部署方式（陈述式）
- 上手难度（"5分钟上手""无需编程基础"）
- 部署方式（"Docker一键部署""云端版本直接用"）
- 文档支持（"中文文档完善"）

### 7. 行动号召（对话式）
必须包含三个引导：
- 引导三连："觉得有用的话，点赞收藏加关注"
- 引导GitHub："项目链接已经放在简介里了"
- 引导评论："评论区说说你用过哪些类似工具"

## 文案要求
1. **完整性**：把项目讲清楚，不要遗漏关键信息
2. **场景化**：每个功能都要结合使用场景讲解
3. **数据驱动**：从README中提取所有可用数据
4. **对话式密度**：开场+核心定位+结尾用对话式，其他部分用陈述式
5. **口语化**：适合口播，避免书面语
6. **价值导向**：不只讲功能，要讲这个功能解决什么问题

## 输出格式要求（严格遵守）
**关键规则**：写完完整内容后，按每50字用一个换行符（\\n）自动分段。

### 分段规则（必须严格执行）
1. **字数控制**：每段严格控制在45-55字之间
2. **语义完整**：不要在句子中间断开，保持语义完整
3. **段落分隔**：段与段之间只用一个换行符（\\n）分隔，不要用两个
4. **禁止多余换行**：不要出现连续的空行
5. **无标注**：不要输出【镜头X】【画面】等任何标注，只输出文案内容
6. **文件结尾**：最后一段后只加一个换行符

### 格式检查清单
- [ ] 每段字数在45-55字之间
- [ ] 段落间只有一个\\n，没有空行
- [ ] 没有连续的\\n\\n
- [ ] 没有任何标注符号
- [ ] 文件开头无空行
- [ ] 文件结尾只有一个\\n

## 输出示例
你是不是也遇到过搭建AI应用太复杂的问题？想做个原型验证，光配环境就要折腾好几天？


今天给大家介绍GitHub上10万+Star的神器Dify，一个开源的LLM应用开发平台。


这个项目最大的价值就是让你不用写代码就能搭建AI应用，可视化拖拽，5分钟就能上手。


第一个核心功能是可视化工作流编排。你可以像搭积木一样拖拽组件，快速构建AI应用。


比如你想做个客服机器人，直接拖个对话节点、接个知识库、连上大模型，几分钟就搞定。


第二个核心功能是RAG知识库管理。支持多种文档格式，自动向量化，让AI能理解你的业务数据。


你可以上传PDF、Word、网页内容，系统自动处理，AI就能基于这些内容回答问题。


第三个核心功能是Agent智能体构建。内置工具调用能力，让AI能主动执行任务，不只是聊天。


技术亮点方面，这个项目GitHub上已经有10万+Star，5000+贡献者，月均300+提交。


支持100多种AI模型接入，包括GPT、Claude、国产大模型等，还有完整的可观测性功能。


部署方面也很简单，Docker一键部署，或者直接用云端版本，中文文档也很完善。


觉得有用的话，点赞收藏加关注。项目链接已经放在简介里了，评论区说说你用过哪些类似工具。

## 注意事项
- **总字数**：严格控制在600-800字
- **功能数量**：只讲3-4个核心功能，不要超过4个
- **分段格式**：先写完整内容，再按45-55字分段
- **段落分隔**：每段之间必须且只能用两个换行符（\\n\\n）
- **语义完整**：保持每段语义完整，不要在句子中间断开
- **场景化**：功能讲解必须结合使用场景，不要只列功能名称
- **无多余换行**：不要出现3个或更多连续换行符
- **文件格式**：开头无空行，结尾只有一个换行符

现在开始生成脚本。
"""

    @retry(max_attempts=3, delay=2)
    async def process_file(self, file_path: Path) -> Dict:
        """处理单个文件"""
        project_name = file_path.stem

        # 创建项目文件夹
        project_folder = self.output_dir / project_name
        project_folder.mkdir(parents=True, exist_ok=True)

        # 定义输出文件路径
        script_file = project_folder / "script.md"
        github_link_file = project_folder / "github_link.md"

        # 检查输出文件是否已存在
        if script_file.exists():
            logger.info(f"跳过已存在的项目: {project_name}")
            return {
                "file": file_path.name,
                "status": "skipped",
                "message": "文件已存在"
            }

        try:
            # 读取源文件
            with open(file_path, 'r', encoding='utf-8') as f:
                source_content = f.read()

            # 提取GitHub链接（从项目名称构建）
            # 项目名称格式：owner_repo
            parts = project_name.split('_', 1)
            if len(parts) == 2:
                owner, repo = parts
                github_url = f"https://github.com/{owner}/{repo}"
            else:
                github_url = f"项目名称格式异常: {project_name}"

            # 限制源文件长度（避免超过 token 限制）
            if len(source_content) > 10000:
                source_content = source_content[:10000] + "\n\n[内容过长，已截断]"

            # 调用 OpenAI API 生成文档
            user_prompt = f"项目名称: {project_name}\n\n原始文档内容:\n{source_content}"

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )

            # 处理不同的响应格式
            if hasattr(response, 'choices'):
                result = response.choices[0].message.content
            elif isinstance(response, str):
                result = response
            elif isinstance(response, dict):
                # 尝试从字典中提取内容
                result = response.get('content') or response.get('text') or str(response)
            else:
                result = str(response)

            # 保存视频脚本
            with open(script_file, 'w', encoding='utf-8') as f:
                f.write(result)

            # 保存GitHub链接
            github_content = f"# GitHub 链接\n\n{github_url}\n"
            with open(github_link_file, 'w', encoding='utf-8') as f:
                f.write(github_content)

            logger.info(f"成功生成: {project_name}/")
            return {
                "file": file_path.name,
                "status": "success",
                "output": f"{project_name}/",
                "github_url": github_url,
                "message": "生成成功"
            }

        except Exception as e:
            logger.error(f"处理文件失败 {file_path.name}: {str(e)}")
            return {
                "file": file_path.name,
                "status": "failed",
                "message": str(e)
            }

    async def batch_process(self, max_concurrent: int = 5, limit: int = None) -> List[Dict]:
        """批量处理文件"""
        # 获取所有 md 文件
        md_files = list(self.source_dir.glob("*.md"))

        # 如果指定了限制，只处理前 N 个文件
        if limit:
            md_files = md_files[:limit]

        logger.info(f"找到 {len(md_files)} 个文件待处理")

        # 创建信号量控制并发
        semaphore = asyncio.Semaphore(max_concurrent)

        async def process_with_limit(file_path):
            async with semaphore:
                return await self.process_file(file_path)

        # 使用 tqdm 显示进度
        results = []
        with tqdm(total=len(md_files), desc="处理进度") as pbar:
            tasks = [process_with_limit(f) for f in md_files]
            for coro in asyncio.as_completed(tasks):
                result = await coro
                results.append(result)
                pbar.update(1)

        return results

    def generate_report(self, results: List[Dict]):
        """生成统计报告"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "total": len(results),
            "success": sum(1 for r in results if r['status'] == 'success'),
            "skipped": sum(1 for r in results if r['status'] == 'skipped'),
            "failed": sum(1 for r in results if r['status'] == 'failed'),
            "details": results
        }

        report_file = self.output_dir / "report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)

        logger.info(f"\n{'='*50}")
        logger.info(f"处理完成统计:")
        logger.info(f"总计: {report['total']}")
        logger.info(f"成功: {report['success']}")
        logger.info(f"跳过: {report['skipped']}")
        logger.info(f"失败: {report['failed']}")
        logger.info(f"报告已保存到: {report_file}")
        logger.info(f"{'='*50}")

        return report


async def main():
    """主函数"""
    # 配置路径
    source_dir = "D:/test/31/reports"
    output_dir = "D:/test/31/introductions"

    # 创建生成器
    generator = SimpleDocumentGenerator(source_dir, output_dir)

    # 批量处理所有文件
    logger.info("开始批量处理所有文档...")
    results = await generator.batch_process(max_concurrent=5, limit=None)

    # 生成报告
    generator.generate_report(results)


if __name__ == "__main__":
    asyncio.run(main())
