# Complete Requirements Installation Guide

This guide will install all dependencies for the Codette Enhanced project (both Python backend and React frontend).

## Prerequisites

Make sure you have:
- **Python 3.11+** (recommended 3.11 or 3.12 for better compatibility)
- **Node.js 18+** 
- **npm 9+**

Check versions:
```bash
python --version
node --version
npm --version
```

---

## Step 1: Install Python Requirements (Codette Backend)

### Option A: Quick Install (All Requirements)

Navigate to the Codette directory:
```bash
cd Codette
```

Install using requirements.txt:
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Option B: Install with pyproject.toml (Recommended for Python 3.11+)

```bash
cd Codette
python -m pip install --upgrade pip setuptools wheel
pip install -e .
```

To include development tools:
```bash
pip install -e ".[dev]"
```

### Option C: Install Essentials Only (if pip has issues)

```bash
python -m pip install --upgrade pip
pip install numpy>=1.24.0 scipy>=1.9.0 pandas>=2.0.0
pip install nltk>=3.8.1 vaderSentiment>=3.3.2 textblob>=0.17.1
pip install fastapi>=0.95.0 uvicorn>=0.21.0 pydantic>=1.10.0
pip install sqlalchemy>=2.0.0
pip install pytest>=7.2.0
pip install black flake8 mypy isort pylint
```

### Option D: Minimal Install (Core Only)

```bash
pip install numpy scipy pandas nltk vaderSentiment textblob fastapi uvicorn
```

---

## Step 2: Install Node.js Requirements (React Frontend)

Navigate to project root:
```bash
cd ..
```

### Standard Install

```bash
npm install
```

### Clean Install (if you have issues)

```bash
# Clear cache
npm cache clean --force

# Remove existing node_modules and package-lock
rm -rf node_modules package-lock.json

# Fresh install
npm install
```

### Install with Specific Node Version (Optional)

If you have nvm installed:
```bash
nvm use 18
npm install
```

---

## Step 3: Verify Installation

### Python Verification

```bash
# Check core packages
python -c "import numpy; print('? numpy:', numpy.__version__)"
python -c "import pandas; print('? pandas:', pandas.__version__)"
python -c "import fastapi; print('? fastapi:', fastapi.__version__)"
python -c "import nltk; print('? nltk:', nltk.__version__)"

# Run Python version check
python --version
```

### Node.js Verification

```bash
# Check installed packages
npm list --depth=0

# Run TypeScript check
npm run typecheck

# Run linter
npm run lint
```

---

## Step 4: Build and Run

### Build React Frontend

```bash
npm run build
```

### Start Development Server

```bash
# React dev server (runs on port 5173 or 5174/5175)
npm run dev
```

### Start Python Backend

```bash
cd Codette
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Troubleshooting

### Python Issues

#### Problem: `pip install` fails with "No module named '_internal'"
**Solution:**
```bash
python -m pip install --upgrade pip
python -m pip install --upgrade setuptools wheel
pip install -r requirements.txt
```

#### Problem: ModuleNotFoundError for specific package
**Solution:**
```bash
pip install <package-name> --upgrade
```

#### Problem: Python 3.13 incompatibility
**Solution:** Use Python 3.11 or 3.12 instead:
```bash
# Check available versions
python --version

# If on 3.13, consider switching to 3.11/3.12
# On Windows: use python installer with specific version
# On Mac: brew install python@3.11
# On Linux: apt-get install python3.11
```

### Node.js Issues

#### Problem: `npm install` fails with peer dependency issues
**Solution:**
```bash
npm install --legacy-peer-deps
```

#### Problem: "vite not found" or port already in use
**Solution:**
```bash
# Install globally (optional)
npm install -g vite

# Or use npx
npx vite dev --port 5174
```

#### Problem: TypeScript errors after install
**Solution:**
```bash
npm run typecheck
npm run lint
```

### Combined Issues

#### Problem: Both Python and Node fail
**Solution:**

1. Clean everything:
```bash
# Python
pip cache purge
rm -rf Codette/venv Codette/__pycache__

# Node
npm cache clean --force
rm -rf node_modules package-lock.json
```

2. Reinstall from scratch:
```bash
# Python
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r Codette/requirements.txt

# Node
npm install
```

---

## Quick Start Commands

Once everything is installed, here are the essential commands:

### Development Mode (Both Frontend & Backend)

**Terminal 1 - Backend:**
```bash
cd Codette
python -m uvicorn src.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Production Build

```bash
# Frontend
npm run build

# Backend is ready as-is
```

### Testing

```bash
# Python tests
cd Codette
pytest

# Lint checks
npm run lint
npm run typecheck
```

---

## System Requirements Summary

| Component | Requirement | Status |
|-----------|-------------|--------|
| Python | 3.11+ (3.13 may have issues) | ?? Recommended 3.11/3.12 |
| Node.js | 18+ | ? |
| npm | 9+ | ? |
| RAM | 4GB+ | ? |
| Disk | 2GB+ | ? |

---

## File Structure After Installation

```
ashesinthedawn/
??? node_modules/          # React dependencies
??? Codette/
?   ??? requirements.txt    # Python dependencies
?   ??? pyproject.toml      # Python project config
?   ??? src/               # Python source
??? src/                   # React source
??? package.json           # Node config
??? venv/                  # Python virtual env (optional)
```

---

## Next Steps

1. ? Install all requirements (this guide)
2. ? Start backend: `python -m uvicorn src.main:app --reload`
3. ? Start frontend: `npm run dev`
4. ? Open browser: `http://localhost:5173`
5. ? Begin development!

---

## Additional Resources

- [Python pip docs](https://pip.pypa.io/en/stable/user_guide/)
- [npm docs](https://docs.npmjs.com/)
- [FastAPI docs](https://fastapi.tiangolo.com/)
- [Vite docs](https://vitejs.dev/)
- [React docs](https://react.dev/)

---

**Last Updated:** 2025  
**Maintained by:** Codette Development Team  
**Status:** ? Ready for Installation
