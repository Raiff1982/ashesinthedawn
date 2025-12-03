"""
pytest configuration and fixtures for ashesinthedawn project

Handles path setup for imports so tests can find modules correctly.
"""

import sys
import os
from pathlib import Path

# Get the root directory of the project
ROOT_DIR = Path(__file__).parent.absolute()

# Add Codette/src to the Python path so imports work correctly
codette_src = ROOT_DIR / "Codette" / "src"
if str(codette_src) not in sys.path:
    sys.path.insert(0, str(codette_src))

# Also add root for any top-level imports
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Add ashesinthedawn-main paths for compatibility
ashesinthedawn_main = ROOT_DIR / "ashesinthedawn-main"
if ashesinthedawn_main.exists():
    codette_main_src = ashesinthedawn_main / "Codette" / "src"
    if str(codette_main_src) not in sys.path:
        sys.path.insert(0, str(codette_main_src))

print(f"pytest paths configured. sys.path includes: {sys.path[:3]}")
