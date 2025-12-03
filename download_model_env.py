#!/usr/bin/env python
"""
Download Codette v3 Model using Kaggle API Token
Alternative method using environment variable authentication
"""

import os
import sys
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Set Kaggle token as environment variable
os.environ['KAGGLE_USERNAME'] = 'jonathan'
os.environ['KAGGLE_KEY'] = 'KGAT_d932da64588f0548c3635d2f2cccb546'

try:
    import kagglehub
    
    logger.info("Downloading Codette v3 model from Kaggle Hub...")
    logger.info("Model: jonathanharrison1/codette2/other/v3")
    logger.info("")
    
    # Download model
    path = kagglehub.model_download("jonathanharrison1/codette2/other/v3")
    
    logger.info("✓ Model downloaded successfully!")
    logger.info(f"\nPath to model files: {path}")
    logger.info(f"\nTo use this model, update .env:")
    logger.info(f"  CODETTE_MODEL_ID={path}")
    logger.info(f"\nOr set environment variable:")
    logger.info(f"  set CODETTE_MODEL_ID={path}")
    
    # List files
    model_path = Path(path)
    if model_path.exists():
        files = list(model_path.rglob('*'))
        files = [f for f in files if f.is_file()]
        logger.info(f"\nDownloaded files ({len(files)}):")
        for f in files[:10]:
            size_mb = f.stat().st_size / (1024 * 1024)
            logger.info(f"  - {f.name} ({size_mb:.1f} MB)")
        if len(files) > 10:
            logger.info(f"  ... and {len(files) - 10} more files")
    
except Exception as e:
    logger.error(f"✗ Download failed: {e}")
    logger.error("\nTroubleshooting:")
    logger.error("1. Verify your Kaggle credentials are correct")
    logger.error("2. Ensure the model exists: jonathanharrison1/codette2/other/v3")
    logger.error("3. Check internet connection")
    sys.exit(1)
