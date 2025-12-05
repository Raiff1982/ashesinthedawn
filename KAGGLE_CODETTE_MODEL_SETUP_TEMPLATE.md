# ?? Kaggle Codette Model - Setup Guide (TEMPLATE)

**Status**: ?? Configuration Template  
**Model**: Codette v3 (jonathanharrison1/codette2/other/v3)  
**Purpose**: Setup instructions without sensitive credentials

---

## ?? SECURITY NOTICE

**THIS IS A TEMPLATE FILE**

- ? DO NOT add real API keys to this file
- ? DO NOT commit credentials to Git
- ? Use `.env` files for sensitive data
- ? Keep `kaggle.json` in `~/.kaggle/` directory only

---

## ?? Model Download

### Step 1: Set Up Kaggle Credentials

1. **Get your Kaggle API credentials**:
   - Go to: https://www.kaggle.com/settings/account
   - Click "Create New API Token"
   - Download `kaggle.json`

2. **Place credentials securely**:
   ```bash
   # Windows
   mkdir %USERPROFILE%\.kaggle
   move kaggle.json %USERPROFILE%\.kaggle\
   
   # Linux/Mac
   mkdir ~/.kaggle
   mv kaggle.json ~/.kaggle/
   chmod 600 ~/.kaggle/kaggle.json
   ```

3. **Verify credentials are private**:
   ```bash
   # Should NOT be in your project directory
   # Should NOT be tracked in Git
   # Should be in .gitignore
   ```

### Step 2: Download Model

```bash
# Using kagglehub
pip install kagglehub

# Download model
python -c "import kagglehub; kagglehub.model_download('jonathanharrison1/codette2/other/v3')"
```

**Model will be cached at**:
- Windows: `C:\Users\<USERNAME>\.cache\kagglehub\models\jonathanharrison1\codette2\other\v3\5`
- Linux/Mac: `~/.cache/kagglehub/models/jonathanharrison1/codette2/other/v3/5`

---

## ?? Configuration

### Environment Variables (.env file)

Create a `.env` file (this file is gitignored):

```bash
# Codette Model Configuration
CODETTE_MODEL_ID=/path/to/your/model/cache
CODETTE_PORT=8000
CODETTE_HOST=0.0.0.0
VITE_CODETTE_API=http://localhost:8000

# Kaggle credentials - DO NOT add here, use ~/.kaggle/kaggle.json instead!
```

### Example Model Path

Replace `/path/to/your/model/cache` with your actual path:

```bash
# Windows example
CODETTE_MODEL_ID=C:\Users\YourUsername\.cache\kagglehub\models\jonathanharrison1\codette2\other\v3\5

# Linux/Mac example
CODETTE_MODEL_ID=/home/yourusername/.cache/kagglehub/models/jonathanharrison1/codette2/other/v3/5
```

---

## ?? Usage

### Option 1: Use with Backend Server

```bash
# Start the Codette server
python codette_server_unified.py
```

Expected output:
```
INFO: Uvicorn running on http://0.0.0.0:8000
INFO: Model loaded successfully
```

### Option 2: Load Model Directly in Python

```python
import sys
import os
from pathlib import Path

# Get model path from environment
MODEL_PATH = os.getenv('CODETTE_MODEL_ID')
sys.path.insert(0, MODEL_PATH)

# Import Codette modules
from codette_quantum_multicore import CodetteCoreEngine
from codette_meta_3d import MetaProcessor

# Initialize
engine = CodetteCoreEngine()
result = engine.process(input_data)
```

---

## ?? Model Components

After download, you'll find these files:

| File | Purpose |
|------|---------|
| `codette_quantum_multicore.py` | Core Codette engine |
| `codette_meta_3d.py` | 3D metadata processor |
| `analyze_cocoons.py` | Analysis utilities |
| `codestuffop.py` | Operations framework |
| `state.db` | Model state storage |
| `Quantum Cosmic Multicore.md` | Architecture docs |

---

## ?? Security Best Practices

### DO ?
- Store credentials in `~/.kaggle/kaggle.json`
- Use environment variables for paths
- Keep `.env` files in `.gitignore`
- Use placeholders in documentation
- Rotate API keys every 90 days

### DON'T ?
- Commit `kaggle.json` to Git
- Put API keys in code or docs
- Share credentials in chat/email
- Store secrets in plaintext files tracked by Git

---

## ??? Troubleshooting

### Issue: "kagglehub not found"
```bash
pip install kagglehub
```

### Issue: "Authentication failed"
```bash
# Verify kaggle.json exists
ls ~/.kaggle/kaggle.json  # Linux/Mac
dir %USERPROFILE%\.kaggle\kaggle.json  # Windows

# Verify format
cat ~/.kaggle/kaggle.json
# Should contain: {"username": "...", "key": "..."}
```

### Issue: "Model not loading"
```python
# Verify path is correct
import os
print(os.getenv('CODETTE_MODEL_ID'))

# Check files exist
import os
from pathlib import Path
model_path = Path(os.getenv('CODETTE_MODEL_ID'))
print(list(model_path.glob('*.py')))
```

---

## ?? Additional Resources

- Kaggle API Docs: https://www.kaggle.com/docs/api
- Model Page: https://www.kaggle.com/models/jonathanharrison1/codette2
- Repository: https://github.com/alanalf23-sys/ashesinthedawn

---

## ? Setup Checklist

- [ ] Install kagglehub: `pip install kagglehub`
- [ ] Create Kaggle API token
- [ ] Save `kaggle.json` to `~/.kaggle/`
- [ ] Download model via kagglehub
- [ ] Create `.env` file with model path
- [ ] Verify `.gitignore` excludes sensitive files
- [ ] Test model loading
- [ ] Start backend server
- [ ] Test from frontend

---

**Setup Complete!** ??

Your Codette model is ready to use with proper security practices in place.

**Remember**: Never commit credentials to Git!
