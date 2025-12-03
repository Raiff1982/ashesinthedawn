# Codette v3 Model from Kaggle Hub - Setup Guide

**Date**: December 2, 2025

## Overview

You can now download and use your custom **Codette v3 model** from Kaggle Hub instead of the default `gpt2-large`. This guide walks you through the setup process.

---

## Option 1: Quick Download (Easiest)

### Prerequisites
1. **Kaggle Account** - Required to access Kaggle Hub
2. **Kaggle API Credentials** - Set up at https://www.kaggle.com/settings/account

### Step 1: Set Up Kaggle Credentials

1. Go to https://www.kaggle.com/settings/account
2. Click **"Create New API Token"** (this downloads `kaggle.json`)
3. Move `kaggle.json` to your home directory:
   - **Windows**: `C:\Users\[YourUsername]\.kaggle\kaggle.json`
   - **macOS/Linux**: `~/.kaggle/kaggle.json`

### Step 2: Run Download Script

```powershell
(.venv) I:\ashesinthedawn> python download_model_simple.py
```

**Output:**
```
Downloading Codette v3 model from Kaggle Hub...
Model: jonathanharrison1/codette2/other/v3

✓ Model downloaded successfully!

Path to model files: C:\Users\[YourUsername]\.cache\kagglehub\models\jonathanharrison1\codette2\...

To use this model, update .env:
  CODETTE_MODEL_ID=C:\Users\[YourUsername]\.cache\kagglehub\models\jonathanharrison1\codette2\...
```

### Step 3: Update Configuration

Copy the path from the output and update `.env`:

```bash
# In .env file:
CODETTE_MODEL_ID=C:\Users\[YourUsername]\.cache\kagglehub\models\jonathanharrison1\codette2\other\v3
```

### Step 4: Restart Server

```powershell
(.venv) I:\ashesinthedawn> python codette_server_unified.py
```

The server will now load your Codette v3 model instead of `gpt2-large`.

---

## Option 2: Interactive Setup (Recommended)

```powershell
(.venv) I:\ashesinthedawn> python download_codette_model.py
```

This script will:
1. ✓ Check for Kaggle credentials
2. ✓ Download the Codette v3 model
3. ✓ Display downloaded files
4. ✓ Optionally update your `.env` file automatically

---

## Understanding Model Paths

### HuggingFace Models (Default)
```
CODETTE_MODEL_ID=gpt2-large
```
- Downloaded from HuggingFace Hub
- Cached in `~/.cache/huggingface/hub/`
- Automatically uses `.safetensors` format
- **Size**: ~350 MB

### Local Kaggle Hub Models
```
CODETTE_MODEL_ID=C:\Users\[YourUsername]\.cache\kagglehub\models\jonathanharrison1\codette2\other\v3
```
- Downloaded from Kaggle Hub
- Cached in `~/.cache/kagglehub/`
- Loaded directly from local path
- **Size**: Depends on model

### Custom Local Path
```
CODETTE_MODEL_ID=C:\Projects\my_models\codette_custom
```
- Any local directory containing model files
- Useful for development or testing
- Ensure model format is compatible (PyTorch or safetensors)

---

## Model Loading Priority

The system checks in this order:

1. **CODETTE_MODEL_ID** (if set in `.env`)
   - If it's a local path → Load from disk
   - If it's a model ID → Download from HuggingFace Hub

2. **CODETTE_MODEL_PATH** (if set in `.env`)
   - Used as direct path to model

3. **Default**: `gpt2-large`
   - Downloaded from HuggingFace if nothing else specified

**Example Startup Logs:**
```
[INFO] Initializing model: gpt2-large
[INFO] Model initialized successfully
```

OR (with Kaggle model):

```
[INFO] Initializing model: C:\Users\...\codette2\other\v3
[INFO] Loading local model from disk...
[INFO] Model initialized successfully
```

---

## Troubleshooting

### Problem: "ModuleNotFoundError: No module named 'kagglehub'"

**Solution**: Install kagglehub
```powershell
(.venv) I:\ashesinthedawn> pip install kagglehub
```

### Problem: "Kaggle credentials not found"

**Solution**: Set up credentials
1. Go to https://www.kaggle.com/settings/account
2. Click "Create New API Token"
3. Extract the zip and move `kaggle.json` to `C:\Users\[YourUsername]\.kaggle\`

### Problem: "Model not found: jonathanharrison1/codette2/other/v3"

**Solution**: Verify the model exists
- Check your Kaggle profile for the model repository
- Ensure the path is correct: `jonathanharrison1/codette2/other/v3`
- Verify you have access to the model (public or shared with you)

### Problem: "Connection timeout downloading model"

**Solution**: Kaggle Hub download can be slow
- Try again - network may be temporarily unavailable
- Use a VPN if Kaggle is blocked in your region
- Models are large (can be 500MB - 5GB+)

### Problem: Model loads but doesn't generate responses

**Solution**: Check model compatibility
- Some models may not be compatible with transformers' `AutoModelForCausalLM`
- Verify model format is PyTorch or safetensors
- Check model card on Kaggle or HuggingFace for requirements

---

## Environment Variables Reference

```bash
# Frontend (Vite-style)
VITE_CODETTE_API=http://localhost:8000          # Backend endpoint

# Backend (Python)
CODETTE_MODEL_ID=gpt2-large                     # Model to load
CODETTE_MODEL_PATH=                             # Optional direct path
CODETTE_PORT=8000                               # Server port
CODETTE_HOST=0.0.0.0                            # Server host
HUGGINGFACEHUB_API_TOKEN=                       # Optional HF token
GOOGLE_API_KEY=                                 # Optional Google Search
GOOGLE_CUSTOM_SEARCH_ID=                        # Optional Google Search
```

---

## File Reference

| File | Purpose |
|------|---------|
| `download_model_simple.py` | Simple one-line download script |
| `download_codette_model.py` | Interactive setup with .env update |
| `.env` | Configuration file (stores CODETTE_MODEL_ID) |
| `codette_server_unified.py` | Backend server (loads model) |
| `ai_core.py` | AI engine (reads CODETTE_MODEL_ID env var) |

---

## Full Startup Sequence

### Terminal 1: Backend Server
```powershell
I:\ashesinthedawn> .venv\Scripts\Activate.ps1
(.venv) I:\ashesinthedawn> python codette_server_unified.py

[INFO] Initializing model: C:\Users\...\codette2\other\v3
[INFO] Model initialized successfully
[INFO] Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2: Frontend
```powershell
I:\ashesinthedawn> npm run dev

VITE v7.2.4 running at:
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### Test Connection
```powershell
# Verify backend is running
Invoke-WebRequest -Uri "http://localhost:8000/health"

# Test Codette chat endpoint
$body = @{message = "How should I mix drums?"} | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:8000/codette/chat" `
  -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

---

## Performance Notes

### Model Download Time
- First download: 5-15 minutes (depends on internet speed and model size)
- Subsequent runs: Loads from cache (~10-30 seconds startup)

### Memory Usage
- `gpt2-large`: ~1-2 GB RAM (or ~500 MB on GPU)
- Larger models: May require 4-8 GB+ RAM
- GPU available: Automatically used if CUDA installed

### GPU Support
```bash
# Automatically detected
if torch.cuda.is_available():
    model = model.cuda()  # Load on GPU
else:
    model = model.cpu()   # Fall back to CPU
```

---

## Next Steps

1. **Download Model** (choose one):
   ```powershell
   python download_model_simple.py
   ```

2. **Update .env** with the model path (from output)

3. **Restart Server**:
   ```powershell
   python codette_server_unified.py
   ```

4. **Start Frontend**:
   ```powershell
   npm run dev
   ```

5. **Test**: Go to `http://localhost:5173` and use Codette

---

## Advanced: Using Multiple Models

You can switch models by updating `.env`:

```bash
# For quick development: use small, fast model
CODETTE_MODEL_ID=gpt2-large

# For production: use your Codette v3 model
CODETTE_MODEL_ID=C:\Users\...\codette2\other\v3

# For experiments: try different models
CODETTE_MODEL_ID=distilgpt2
CODETTE_MODEL_ID=facebook/opt-350m
```

Just update `.env` and restart the server to switch.

---

**Configuration Status**: ✅ Ready for Kaggle Hub model download  
**Next Action**: Run `python download_model_simple.py` to get your model
