"""
清洗 introductions 目录下所有 script.md 文件
确保格式统一：每段用两个换行符（\n\n）分隔
"""
import re
from pathlib import Path

def clean_script(file_path: Path) -> dict:
    """
    清洗单个 script.md 文件
    将单换行转换为双换行，但保持段落内容不变

    返回：
    - status: 'cleaned' | 'skipped' | 'error'
    - message: 处理信息
    - changes: 修改内容描述
    """
    try:
        # 读取文件
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # 1. 统一换行符（Windows \r\n -> Unix \n）
        content = content.replace('\r\n', '\n')

        # 2. 移除文件开头和结尾的空白
        content = content.strip()

        # 3. 关键逻辑：识别段落并确保段落间是双换行
        # 按行分割
        lines = content.split('\n')

        result_lines = []
        prev_line_empty = False

        for i, line in enumerate(lines):
            is_empty = not line.strip()

            if is_empty:
                # 当前行是空行
                if not prev_line_empty and i > 0:
                    # 前一行不是空行，添加一个空行（确保双换行）
                    result_lines.append('')
                prev_line_empty = True
            else:
                # 当前行非空
                if i > 0 and not prev_line_empty:
                    # 前一行也非空，说明是单换行，需要添加空行
                    result_lines.append('')
                result_lines.append(line)
                prev_line_empty = False

        # 4. 重新组合
        cleaned_content = '\n'.join(result_lines)

        # 5. 清理多余的连续空行（3个及以上 -> 2个）
        cleaned_content = re.sub(r'\n{3,}', '\n\n', cleaned_content)

        # 6. 确保文件末尾只有一个换行符
        cleaned_content = cleaned_content.rstrip() + '\n'

        # 检查是否有变化
        if cleaned_content == original_content:
            return {
                'status': 'skipped',
                'message': '文件格式已正确，无需清洗',
                'changes': []
            }

        # 保存清洗后的内容
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)

        # 统计变化
        changes = []

        # 统计双换行符变化
        original_double_newlines = original_content.count('\n\n')
        cleaned_double_newlines = cleaned_content.count('\n\n')
        if original_double_newlines != cleaned_double_newlines:
            changes.append(f"双换行符: {original_double_newlines} -> {cleaned_double_newlines}")

        # 统计行数
        original_lines_count = len([l for l in original_content.split('\n') if l.strip()])
        cleaned_lines_count = len([l for l in cleaned_content.split('\n') if l.strip()])
        if original_lines_count != cleaned_lines_count:
            changes.append(f"非空行数: {original_lines_count} -> {cleaned_lines_count}")

        return {
            'status': 'cleaned',
            'message': '文件已清洗',
            'changes': changes
        }

    except Exception as e:
        return {
            'status': 'error',
            'message': str(e),
            'changes': []
        }


def clean_all_scripts(base_dir: str = "D:/test/31/introductions"):
    """清洗所有项目的 script.md 文件"""
    base_path = Path(base_dir)

    if not base_path.exists():
        print(f"错误：目录不存在 {base_dir}")
        return

    # 查找所有 script.md 文件
    script_files = list(base_path.glob("*/script.md"))

    print(f"找到 {len(script_files)} 个 script.md 文件")
    print("="*60)

    results = {
        'cleaned': 0,
        'skipped': 0,
        'error': 0
    }

    for script_file in script_files:
        project_name = script_file.parent.name
        result = clean_script(script_file)

        status_icon = {
            'cleaned': 'OK',
            'skipped': 'SKIP',
            'error': 'ERR'
        }[result['status']]

        print(f"[{status_icon}] {project_name:40s} {result['message']}")

        if result['changes']:
            for change in result['changes']:
                print(f"      {change}")

        results[result['status']] += 1

    print("="*60)
    print(f"清洗完成:")
    print(f"  已清洗: {results['cleaned']}")
    print(f"  已跳过: {results['skipped']}")
    print(f"  错误: {results['error']}")
    print(f"  总计: {len(script_files)}")


if __name__ == "__main__":
    clean_all_scripts()
