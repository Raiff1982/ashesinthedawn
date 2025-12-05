# ?? Codette Quick Start Guide

**Status**: ? All dependencies installed and verified  
**Date**: December 2, 2025

---

## ? Quick Start (2 Steps)

### Step 1: Start the Backend
```bash
cd I:\ashesinthedawn
python codette_server_unified.py
```

**Wait for**: `INFO: Application startup complete`

### Step 2: Start the Frontend
```bash
cd I:\ashesinthedawn
npm run dev
```

**Wait for**: `Local: http://localhost:5173/`

### Done! ??
Open your browser to **http://localhost:5173**

---

## ?? Full Setup (One-Time)

Everything is already done, but here's what was installed:

```bash
# Python dependencies (80+ packages)
pip install -r requirements_updated.txt

# Frontend dependencies (287 packages)
npm install

# Verify model setup
python verify_model.py
```

---

## ?? What You Can Do Now

? **Codette AI Assistant** - Chat with AI  
? **Audio Analysis** - Analyze audio files  
? **DAW Controls** - Transport, mixing, effects  
? **Real-time Sync** - Database integration  
? **Web UI** - React + TypeScript frontend  

---

## ?? Development Commands

```bash
# Format code
black .

# Check code style
flake8 .

# Run tests
pytest -v

# Build frontend
npm run build

# Type checking
npm run typecheck

# ESLint check
npm run lint
```

---

## ?? What's Installed

| Component | Installed | Status |
|-----------|-----------|--------|
| Python Backend | ? FastAPI, Uvicorn | Ready |
| Database | ? Supabase, SQLAlchemy | Ready |
| Audio Processing | ? Librosa, NumPy, SciPy | Ready |
| AI/ML | ? Transformers, NLTK, scikit-learn | Ready |
| Frontend | ? React, TypeScript, Vite | Ready |
| UI Framework | ? Tailwind CSS | Ready |
| Codette Model | ? v3 Model verified | Ready |

---

## ?? Troubleshooting

### Backend won't start
```bash
python -m pip install --upgrade fastapi uvicorn
python codette_server_unified.py
```

### Frontend won't start
```bash
npm install
npm run dev
```

### Model not found
```bash
python verify_model.py
```

### Port already in use
- Backend (8000): `netstat -ano | findstr :8000`
- Frontend (5173): Kill and restart `npm run dev`

---

## ?? Documentation Files

- `CODETTE_DEPENDENCIES_INSTALLED.md` - Full dependency list
- `requirements_updated.txt` - Python packages
- `package.json` - Node packages
- `verify_model.py` - Model verification script
- `.github/copilot-instructions.md` - Development guidelines

---

## ?? Next Steps

1. **Run the app**: `npm run dev`
2. **Test Codette**: Open Control Center tab
3. **Try analysis**: Upload audio, run analysis
4. **Check logs**: Monitor console output
5. **Explore API**: Visit `http://localhost:8000/docs`

---

## ?? System Info

- **Python**: 3.13.0
- **Node**: v20+ (compatible)
- **OS**: Windows 10/11
- **GPU**: Not required (CPU mode works)

---

## ?? Getting Help

- Check `CODETTE_DEPENDENCIES_INSTALLED.md` for package details
- Run `python verify_model.py` to check model setup
- Review logs in console for errors
- Check browser console (F12) for frontend errors

---

**You're all set! Start coding! ??**

