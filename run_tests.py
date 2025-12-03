#!/usr/bin/env python
"""
Test runner for ashesinthedawn Codette tests
Configures paths properly before running pytest
"""

import sys
import os
from pathlib import Path

# Set up paths
root_dir = Path(__file__).parent.absolute()
codette_src = root_dir / "Codette" / "src"

# Add to path
if str(codette_src) not in sys.path:
    sys.path.insert(0, str(codette_src))
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

print(f"Python paths configured:")
print(f"  - {codette_src}")
print(f"  - {root_dir}")
print()

# Now run pytest
import pytest

# Run with proper configuration
args = [
    "Codette/tests/",
    "-v",
    "--tb=short",
    "--disable-warnings",
    "-p", "no:cacheprovider"
]

# Add any additional arguments passed to script
args.extend(sys.argv[1:])

print(f"Running: pytest {' '.join(args)}\n")
exit_code = pytest.main(args)
sys.exit(exit_code)
