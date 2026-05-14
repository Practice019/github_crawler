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
        self.model = os.getenv("OPENAI_MODEL", "claude-haiku-4-5-20251001")

        # 设置更长的超时时间，并禁用代理
        import httpx
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url=api_base,
            timeout=httpx.Timeout(120.0, connect=10.0),  # 总超时120秒，连接超时10秒
            max_retries=2,  # 最多重试2次
            http_client=httpx.AsyncClient(proxy=None)  # 禁用代理
        )

        # 文档生成提示词
        self.system_prompt = """# 角色
你是专业的产品介绍撰稿人，擅长撰写高质量的项目介绍文章。

# 任务
阅读项目README文件，撰写一篇专业且易懂的中文项目介绍文章。
核心目标：清晰阐述项目是什么、解决什么问题、具备什么能力。

# 输出结构
## 项目概述
- 项目定位和核心价值
- 解决的主要问题
- 目标应用场景

## 核心功能
- 列出主要功能模块
- 说明每个功能的作用和价值
- 功能之间的关联关系

# 写作原则
1. 专业性：保持文章质量，使用准确的表述
2. 可读性：面向非技术背景读者，避免过度技术化
3. 完整性：全面介绍项目能力，不遗漏重要功能
4. 聚焦性：重点说明"是什么"和"能做什么"
5. 简洁性：控制篇幅在800-1200字

# 严格禁止
- 代码示例和命令行指令
- 安装部署步骤
- 配置说明和参数设置
- 开发环境搭建
- 技术架构细节（框架、库、API名称）
- 系统要求和硬件配置
- 文件目录结构
- 故障排查和问题解决
- 技术优势和平台支持说明
- 适用对象和用户群体分析
- 项目亮点和创新点总结

# 允许保留
- 功能列表和说明
- 应用场景描述（融入项目概述中）

现在开始生成项目介绍文章。
"""

    @retry(max_attempts=3, delay=2)
    async def process_file(self, file_path: Path) -> Dict:
        """处理单个文件"""
        project_name = file_path.stem

        # 创建项目文件夹
        project_folder = self.output_dir / project_name
        project_folder.mkdir(parents=True, exist_ok=True)

        # 定义输出文件路径
        intro_file = project_folder / "项目介绍.md"
        github_link_file = project_folder / "项目链接.md"

        # 检查输出文件是否已存在
        if intro_file.exists():
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
            # 进一步减少长度，避免 502 错误
            if len(source_content) > 6000:
                source_content = source_content[:6000] + "\n\n[内容过长，已截断]"

            # 调用 OpenAI API 生成文档
            user_prompt = f"项目名称: {project_name}\n\n原始文档内容:\n{source_content}"

            logger.info(f"准备请求 API，内容长度: {len(user_prompt)} 字符")

            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=2500,  # 800-1200字约需2000-2500 tokens
                stream=False  # 关闭流式输出
            )

            logger.info(f"API 请求成功")

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

            # 保存项目介绍文档
            with open(intro_file, 'w', encoding='utf-8') as f:
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
            error_type = type(e).__name__
            error_msg = str(e)
            logger.error(f"处理文件失败 {file_path.name}: [{error_type}] {error_msg}")

            # 如果是 API 错误，记录更多信息
            if hasattr(e, 'response'):
                logger.error(f"API 响应状态: {getattr(e.response, 'status_code', 'unknown')}")
                logger.error(f"API 响应内容: {getattr(e.response, 'text', 'unknown')}")

            return {
                "file": file_path.name,
                "status": "failed",
                "error_type": error_type,
                "message": error_msg
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
    import argparse

    # 解析命令行参数
    parser = argparse.ArgumentParser(
        description='批量文档生成系统 - 将 GitHub README 转化为 B 站视频脚本',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用示例:
  python main.py                    # 处理所有文件
  python main.py --test             # 测试模式：只处理第一个文件
  python main.py --limit 5          # 只处理前 5 个文件
  python main.py --concurrent 3     # 设置并发数为 3
        """
    )
    parser.add_argument('--test', action='store_true',
                        help='测试模式：只处理第一个文件')
    parser.add_argument('--limit', type=int, default=None,
                        help='限制处理文件数量（例如：--limit 5）')
    parser.add_argument('--concurrent', type=int, default=5,
                        help='并发数（默认：5，建议 3-5）')
    args = parser.parse_args()

    # 配置路径
    source_dir = "D:/test/31/reports"
    output_dir = "D:/test/31/introductions"

    # 创建生成器
    generator = SimpleDocumentGenerator(source_dir, output_dir)

    # 确定处理数量
    if args.test:
        limit = 1
        logger.info("🧪 测试模式：只处理第一个文件")
    elif args.limit:
        limit = args.limit
        logger.info(f"📊 限制模式：处理前 {limit} 个文件")
    else:
        limit = None
        logger.info("🚀 完整模式：处理所有文件")

    # 批量处理文件
    logger.info(f"并发数：{args.concurrent}")
    results = await generator.batch_process(max_concurrent=args.concurrent, limit=limit)

    # 生成报告
    generator.generate_report(results)


if __name__ == "__main__":
    asyncio.run(main())
