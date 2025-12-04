#!/usr/bin/env python3
"""
Start Codette AI Backend Server
"""

import subprocess
import sys
import os

os.chdir(r"I:\ashesinthedawn")
print("Starting Codette AI Backend Server...")
print("=" * 60)
print("Server will start on: http://localhost:8000")
print("API Docs: http://localhost:8000/docs")
print("WebSocket: ws://localhost:8000/ws")
print("=" * 60)

try:
    subprocess.run([
        sys.executable, 
        "codette_server_unified.py"
    ])
except KeyboardInterrupt:
    print("\n[*] Server stopped by user")
    sys.exit(0)
except Exception as e:
    print(f"[ERROR] Failed to start server: {e}")
    sys.exit(1)
