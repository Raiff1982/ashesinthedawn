#!/usr/bin/env python
"""
Download Codette v3 Model from Kaggle Hub
This script downloads the custom Codette model and configures the system to use it.
"""

import os
import sys
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_kaggle_credentials():
    """Ensure Kaggle credentials are set up."""
    kaggle_config = Path.home() / '.kaggle' / 'kaggle.json'
    
    if not kaggle_config.exists():
        logger.warning("Kaggle credentials not found at ~/.kaggle/kaggle.json")
        logger.info("To set up Kaggle credentials:")
        logger.info("1. Go to https://www.kaggle.com/settings/account")
        logger.info("2. Click 'Create New API Token'")
        logger.info("3. Save the kaggle.json file to ~/.kaggle/")
        logger.info("4. Make sure permissions are restricted: chmod 600 ~/.kaggle/kaggle.json")
        return False
    
    # Set permissions (Unix-like systems)
    try:
        os.chmod(kaggle_config, 0o600)
        logger.info("✓ Kaggle credentials found and permissions set")
        return True
    except Exception as e:
        logger.warning(f"Could not set permissions: {e}")
        return True  # Credentials still exist

def download_model():
    """Download the Codette v3 model from Kaggle Hub."""
    try:
        import kagglehub
        
        logger.info("Starting Codette v3 model download...")
        logger.info("Model: jonathanharrison1/codette2/other/v3")
        
        # Download model
        path = kagglehub.model_download("jonathanharrison1/codette2/other/v3")
        
        logger.info(f"✓ Model downloaded successfully")
        logger.info(f"Model path: {path}")
        
        return path
    
    except Exception as e:
        logger.error(f"Failed to download model: {e}")
        logger.error("Make sure your Kaggle credentials are set up correctly")
        return None

def get_model_files(model_path):
    """List files in the downloaded model directory."""
    try:
        path = Path(model_path)
        if not path.exists():
            logger.error(f"Model path does not exist: {model_path}")
            return []
        
        files = []
        for item in path.rglob('*'):
            if item.is_file():
                files.append(item)
        
        return files
    except Exception as e:
        logger.error(f"Error listing model files: {e}")
        return []

def update_env_file(model_path):
    """Update .env file with the model path."""
    env_file = Path(__file__).parent / '.env'
    
    if not env_file.exists():
        logger.error(f".env file not found at {env_file}")
        return False
    
    try:
        # Read current .env
        with open(env_file, 'r') as f:
            content = f.read()
        
        # Update or add CODETTE_MODEL_ID
        # First try to update existing
        if 'CODETTE_MODEL_ID=' in content:
            # Replace the line
            lines = content.split('\n')
            new_lines = []
            for line in lines:
                if line.startswith('CODETTE_MODEL_ID='):
                    new_lines.append(f'CODETTE_MODEL_ID={model_path}')
                else:
                    new_lines.append(line)
            content = '\n'.join(new_lines)
        else:
            # Add new line after CODETTE_PORT
            if 'CODETTE_PORT=' in content:
                content = content.replace(
                    'CODETTE_PORT=8000',
                    f'CODETTE_PORT=8000\nCODETTE_MODEL_PATH={model_path}'
                )
        
        # Write back
        with open(env_file, 'w') as f:
            f.write(content)
        
        logger.info(f"✓ Updated .env with model path")
        return True
    
    except Exception as e:
        logger.error(f"Failed to update .env: {e}")
        return False

def print_summary(model_path):
    """Print summary of what was downloaded."""
    print("\n" + "="*60)
    print("CODETTE V3 MODEL DOWNLOAD COMPLETE")
    print("="*60)
    print(f"\nModel Location: {model_path}")
    
    files = get_model_files(model_path)
    print(f"\nFiles Downloaded ({len(files)}):")
    for f in files[:10]:  # Show first 10
        print(f"  - {f.name} ({f.stat().st_size / 1024:.1f} KB)")
    
    if len(files) > 10:
        print(f"  ... and {len(files) - 10} more files")
    
    print("\n" + "="*60)
    print("NEXT STEPS:")
    print("="*60)
    print("1. Update CODETTE_MODEL_ID in .env to point to the model")
    print(f"   CODETTE_MODEL_ID={model_path}")
    print("\n2. Start the Codette server:")
    print("   python codette_server_unified.py")
    print("\n3. The server will use this custom model instead of gpt2-large")
    print("="*60 + "\n")

def main():
    """Main execution flow."""
    logger.info("Codette Model Download Tool")
    logger.info("-" * 60)
    
    # Check Kaggle credentials
    if not setup_kaggle_credentials():
        logger.error("Cannot proceed without Kaggle credentials")
        sys.exit(1)
    
    # Download model
    model_path = download_model()
    if not model_path:
        logger.error("Failed to download model")
        sys.exit(1)
    
    # Print summary
    print_summary(model_path)
    
    # Optionally update .env
    try:
        update_choice = input("Would you like to update .env file with this model path? (y/n): ").lower()
        if update_choice == 'y':
            if update_env_file(model_path):
                logger.info("✓ Configuration updated successfully")
            else:
                logger.warning("Could not update .env file - update manually")
    except KeyboardInterrupt:
        logger.info("\nSkipped .env update")

if __name__ == '__main__':
    main()
