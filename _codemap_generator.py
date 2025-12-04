#!/usr/bin/env python3
"""Generate a code map of the ashesinthedawn workspace"""

import os
from pathlib import Path
from collections import defaultdict

root = Path("I:\\ashesinthedawn")

# File extensions to include
extensions = {'.ts', '.tsx', '.py', '.json', '.md', '.sql', '.yaml', '.yml', '.env', '.js', '.jsx'}
special_files = {'.env', '.env.local', '.gitignore', 'Dockerfile', 'package.json', 'tsconfig.json'}

# Directories to exclude
exclude_dirs = {'node_modules', '.git', '__pycache__', '.pytest_cache', 'dist', 'build', '.venv', 'venv'}

# Organize files by directory
file_structure = defaultdict(list)
all_files = []

print("Scanning workspace...")

for f in root.rglob('*'):
    if f.is_file():
        # Check if should include
        should_include = False
        
        if f.suffix in extensions:
            should_include = True
        elif f.name in special_files:
            should_include = True
        
        # Check if in excluded directory
        if should_include:
            rel_path = f.relative_to(root)
            parts = rel_path.parts
            
            # Skip if in excluded dir
            if any(part in exclude_dirs for part in parts):
                continue
            
            dir_path = str(rel_path.parent)
            all_files.append(str(rel_path))
            file_structure[dir_path].append(rel_path.name)

# Print organized map
print("\n" + "="*80)
print("CODE MAP: ashesinthedawn Workspace")
print("="*80 + "\n")

# Print by directory
sorted_dirs = sorted(file_structure.keys())
for dir_name in sorted_dirs:
    # Skip . files unless they're config
    if dir_name.startswith('.') and dir_name not in ['.', '.github', '.env']:
        continue
    
    files = sorted(file_structure[dir_name])
    print(f"\n?? {dir_name if dir_name != '.' else 'ROOT'}")
    print("-" * 80)
    for filename in files:
        # Get icon based on file type
        if filename.endswith('.ts') or filename.endswith('.tsx'):
            icon = "??"  # TypeScript/React
        elif filename.endswith('.py'):
            icon = "??"  # Python
        elif filename.endswith('.json'):
            icon = "??"  # Config
        elif filename.endswith('.md'):
            icon = "??"  # Markdown
        elif filename.endswith('.sql'):
            icon = "???"  # Database
        elif filename.endswith('.yaml') or filename.endswith('.yml'):
            icon = "??"  # Config
        elif filename.startswith('.env'):
            icon = "??"  # Secrets
        else:
            icon = "??"
        
        print(f"  {icon} {filename}")

print("\n" + "="*80)
print(f"SUMMARY: {len(all_files)} files found")
print("="*80)

# Print by file type
print("\n?? FILES BY TYPE")
print("-" * 80)
by_type = defaultdict(int)
for f in all_files:
    ext = Path(f).suffix or Path(f).name
    by_type[ext] += 1

for ext, count in sorted(by_type.items(), key=lambda x: -x[1]):
    print(f"  {ext:15s}: {count:3d} files")

print("\n?? DIRECTORIES STRUCTURE")
print("-" * 80)

# Print directory tree
def print_tree(path, prefix="", max_depth=4, current_depth=0):
    if current_depth >= max_depth:
        return
    
    try:
        items = sorted(path.iterdir())
    except PermissionError:
        return
    
    dirs = [d for d in items if d.is_dir() and d.name not in exclude_dirs and not d.name.startswith('.')]
    
    for i, d in enumerate(dirs[:20]):  # Limit to 20 dirs
        is_last = i == len(dirs) - 1
        print(f"{prefix}{'??? ' if is_last else '??? '}{d.name}/")
        extension = "    " if is_last else "?   "
        print_tree(d, prefix + extension, max_depth, current_depth + 1)

print(f"?? {root.name}/")
print_tree(root)

print("\n? Code map generation complete!")
