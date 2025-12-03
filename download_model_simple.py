#!/usr/bin/env python
"""
Simple Kaggle Hub Model Download
Downloads Codette v3 and prints the model path
"""

import kagglehub

# Download latest version
print("Downloading Codette v3 model from Kaggle Hub...")
print("Model: jonathanharrison1/codette2/other/v3")
print()

try:
    path = kagglehub.model_download("jonathanharrison1/codette2/other/v3")
    print("✓ Model downloaded successfully!")
    print(f"\nPath to model files: {path}")
    print(f"\nTo use this model, update .env:")
    print(f"  CODETTE_MODEL_ID={path}")
    print(f"\nOr set environment variable:")
    print(f"  set CODETTE_MODEL_ID={path}")
except Exception as e:
    print(f"✗ Download failed: {e}")
    print("\nTroubleshooting:")
    print("1. Make sure kagglehub is installed: pip install kagglehub")
    print("2. Set up Kaggle credentials:")
    print("   - Go to https://www.kaggle.com/settings/account")
    print("   - Click 'Create New API Token'")
    print("   - Save kaggle.json to ~/.kaggle/kaggle.json")
    print("3. Ensure model URL is correct: jonathanharrison1/codette2/other/v3")
