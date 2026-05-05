"""
测试清洗脚本的换行符处理
"""

# 模拟原始内容（Windows格式）
original = "段落1\r\n\r\n段落2\r\n\r\n段落3"

print("原始内容:")
print(repr(original))
print()

# 步骤1: 统一换行符
content = original.replace('\r\n', '\n')
print("步骤1 - 统一换行符:")
print(repr(content))
print()

# 步骤2: 分割段落
paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
print("步骤2 - 分割段落:")
print(paragraphs)
print()

# 步骤3: 重新组合
cleaned = '\n\n'.join(paragraphs)
print("步骤3 - 重新组合:")
print(repr(cleaned))
print()

# 步骤4: 添加文件结尾换行
cleaned += '\n'
print("步骤4 - 添加结尾换行:")
print(repr(cleaned))
print()

# 验证段落间的换行符数量
print("验证: 段落间有几个换行符?")
print(f"'段落1' 和 '段落2' 之间: {cleaned.count('段落1\\n\\n段落2')}")
