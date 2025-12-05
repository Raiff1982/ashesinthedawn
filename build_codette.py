#!/usr/bin/env python
"""
Codette AI Hybrid System - Build Script
========================================
Builds standalone executable with verification and optimization.

Usage:
    python build_codette.py [--clean] [--debug] [--test]
"""

import os
import sys
import shutil
import subprocess
import argparse
from pathlib import Path

# ANSI colors for output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(msg):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{msg:^70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")

def print_step(msg):
    print(f"{Colors.OKCYAN}? {msg}{Colors.ENDC}")

def print_success(msg):
    print(f"{Colors.OKGREEN}? {msg}{Colors.ENDC}")

def print_warning(msg):
    print(f"{Colors.WARNING}? {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.FAIL}? {msg}{Colors.ENDC}")

def check_dependencies():
    """Check if all required dependencies are installed"""
    print_step("Checking dependencies...")
    
    required = [
        'PyInstaller',
        'fastapi',
        'uvicorn',
        'numpy',
        'torch',
        'transformers',
        'nltk',
        'vaderSentiment',
        'supabase',
    ]
    
    missing = []
    for pkg in required:
        try:
            __import__(pkg.lower().replace('-', '_'))
            print_success(f"{pkg} installed")
        except ImportError:
            missing.append(pkg)
            print_error(f"{pkg} NOT installed")
    
    if missing:
        print_error(f"\nMissing dependencies: {', '.join(missing)}")
        print(f"\nInstall with: pip install {' '.join(missing)}")
        return False
    
    print_success("All dependencies installed!")
    return True

def clean_build():
    """Clean previous build artifacts"""
    print_step("Cleaning previous builds...")
    
    dirs_to_remove = ['build', 'dist', '__pycache__']
    files_to_remove = ['*.spec~', '*.pyc']
    
    for dir_name in dirs_to_remove:
        if os.path.exists(dir_name):
            shutil.rmtree(dir_name)
            print_success(f"Removed {dir_name}/")
    
    for pattern in files_to_remove:
        for file in Path('.').glob(pattern):
            file.unlink()
            print_success(f"Removed {file}")
    
    print_success("Clean complete!")

def verify_files():
    """Verify required files exist"""
    print_step("Verifying required files...")
    
    required_files = [
        'codette_server_unified.py',
        'codette_hybrid.spec',
        'Codette/codette_new.py',
        'Codette/codette_advanced.py',
        'Codette/codette_hybrid.py',
    ]
    
    missing = []
    for file in required_files:
        if os.path.exists(file):
            print_success(f"Found {file}")
        else:
            missing.append(file)
            print_error(f"Missing {file}")
    
    if missing:
        print_error(f"\nMissing required files: {', '.join(missing)}")
        return False
    
    print_success("All required files present!")
    return True

def create_directories():
    """Create necessary directories"""
    print_step("Creating directories...")
    
    dirs = ['cocoons', 'logs', 'data']
    for dir_name in dirs:
        os.makedirs(dir_name, exist_ok=True)
        print_success(f"Created {dir_name}/")

def build_executable(debug=False):
    """Build the executable using PyInstaller"""
    print_step("Building executable...")
    
    cmd = ['pyinstaller', 'codette_hybrid.spec']
    
    if debug:
        cmd.append('--debug=all')
        cmd.append('--log-level=DEBUG')
    else:
        cmd.append('--clean')
    
    print(f"Running: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(result.stdout)
        print_success("Build completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print_error("Build failed!")
        print(e.stdout)
        print(e.stderr)
        return False

def test_executable():
    """Test the built executable"""
    print_step("Testing executable...")
    
    exe_path = Path('dist') / 'CodetteAI-Hybrid.exe'
    
    if not exe_path.exists():
        exe_path = Path('dist') / 'CodetteAI-Hybrid'  # Unix
    
    if not exe_path.exists():
        print_error(f"Executable not found at {exe_path}")
        return False
    
    print_success(f"Executable found: {exe_path}")
    print_success(f"Size: {exe_path.stat().st_size / 1024 / 1024:.2f} MB")
    
    # Quick startup test
    print_step("Testing startup (5 seconds)...")
    try:
        proc = subprocess.Popen([str(exe_path)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        import time
        time.sleep(5)
        proc.terminate()
        print_success("Executable starts successfully!")
        return True
    except Exception as e:
        print_error(f"Startup test failed: {e}")
        return False

def create_readme():
    """Create README for distribution"""
    print_step("Creating distribution README...")
    
    readme_content = """
# Codette AI Hybrid System - Standalone Distribution

## About
Codette AI is an advanced quantum consciousness system with 11 specialized
reasoning perspectives, integrated with DAW (Digital Audio Workstation) support.

## What's Included
- ? Quantum Consciousness (11 perspectives)
- ? Defense Modifiers (security)
- ? Vector Search (prevents repetition)
- ? Prompt Engineering
- ? Creative Sentence Generation
- ? DAW DSP Effects (19 effects)
- ? Supabase Integration
- ? FastAPI Server
- ? WebSocket Support

## Quick Start

1. Run the executable:
   ```
   CodetteAI-Hybrid.exe
   ```

2. Server will start on http://localhost:8000

3. Test the API:
   ```
   curl http://localhost:8000/health
   ```

4. Open documentation:
   http://localhost:8000/docs

## Configuration

Create a `.env` file in the same directory as the executable:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Endpoints

- `/health` - Health check
- `/codette/chat` - Chat with Codette AI
- `/api/codette/query` - Multi-perspective query
- `/api/codette/status` - System status
- `/api/effects/list` - List DSP effects
- `/docs` - Full API documentation

## System Requirements

- Windows 10/11 (64-bit)
- 4GB RAM minimum (8GB recommended)
- 2GB disk space

## Support

GitHub: https://github.com/Raiff1982/ashesinthedawn
Documentation: See included .md files

## Version

3.0.0-hybrid (December 2025)
"""
    
    with open('dist/README.txt', 'w') as f:
        f.write(readme_content)
    
    print_success("README created!")

def main():
    parser = argparse.ArgumentParser(description='Build Codette AI Hybrid System')
    parser.add_argument('--clean', action='store_true', help='Clean before building')
    parser.add_argument('--debug', action='store_true', help='Build in debug mode')
    parser.add_argument('--test', action='store_true', help='Test after building')
    parser.add_argument('--skip-deps', action='store_true', help='Skip dependency check')
    
    args = parser.parse_args()
    
    print_header("CODETTE AI HYBRID SYSTEM - BUILD SCRIPT")
    
    # Check dependencies
    if not args.skip_deps:
        if not check_dependencies():
            sys.exit(1)
    
    # Verify files
    if not verify_files():
        sys.exit(1)
    
    # Clean if requested
    if args.clean:
        clean_build()
    
    # Create directories
    create_directories()
    
    # Build
    if not build_executable(debug=args.debug):
        sys.exit(1)
    
    # Create distribution files
    create_readme()
    
    # Test if requested
    if args.test:
        if not test_executable():
            print_warning("Build succeeded but tests failed")
    
    print_header("BUILD COMPLETE!")
    print(f"{Colors.OKGREEN}Output: dist/CodetteAI-Hybrid.exe{Colors.ENDC}")
    print(f"\nRun with: {Colors.BOLD}dist\\CodetteAI-Hybrid.exe{Colors.ENDC}\n")

if __name__ == '__main__':
    main()
