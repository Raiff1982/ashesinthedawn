import ast
import sys

try:
    with open('codette_server_unified.py', 'r') as f:
        code = f.read()
    ast.parse(code)
    print("✅ Syntax valid")
except SyntaxError as e:
    print(f"❌ Syntax Error at line {e.lineno}: {e.msg}")
    print(f"   Text: {e.text}")
    print(f"   Offset: {' ' * (e.offset - 1) if e.offset else ''}^")
    sys.exit(1)
