#!/usr/bin/env python
"""Start Codette backend on available port"""

import sys
import socket
import uvicorn
from pathlib import Path

# Add project to path
sys.path.insert(0, str(Path(__file__).parent))

# Import the app
from codette_server_unified import app

def find_available_port(start_port=5555, max_attempts=10):
    """Find an available port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.bind(('127.0.0.1', port))
            sock.close()
            return port
        except OSError:
            continue
    return None

if __name__ == "__main__":
    # Find available port
    port = find_available_port(5555, 10)
    
    if port is None:
        print("❌ Could not find available port")
        sys.exit(1)
    
    print(f"✅ Starting Codette Backend on http://127.0.0.1:{port}")
    print(f"📡 API Docs: http://127.0.0.1:{port}/docs")
    print(f"🌐 WebSocket: ws://127.0.0.1:{port}/ws")
    
    # Start server
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=port,
        log_level="info",
    )
