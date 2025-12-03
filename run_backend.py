#!/usr/bin/env python
"""
Start Codette Backend Server on an available port
Configures all necessary services and keeps server running
"""

import sys
import os
import socket
import time
from pathlib import Path

# Add project to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

print("=" * 80)
print("?? CODETTE AI BACKEND SERVER STARTUP")
print("=" * 80)

# Import environment
try:
    from dotenv import load_dotenv
    env_file = project_root / '.env'
    if env_file.exists():
        load_dotenv(env_file)
        print("? Environment loaded from .env")
    else:
        print("??  No .env file found")
except ImportError:
    print("??  python-dotenv not installed")

# Import FastAPI app
print("\n?? Importing Codette server...")
try:
    import uvicorn
    from codette_server_unified import app
    print("? Codette server module imported")
except Exception as e:
    print(f"? Failed to import Codette: {e}")
    sys.exit(1)

# Find available port
def find_available_port(start_port=5555, max_attempts=20):
    """Find an available port"""
    for offset in range(max_attempts):
        port = start_port + offset
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            sock.bind(('127.0.0.1', port))
            sock.close()
            return port
        except OSError as e:
            continue
    return None

# Start server
def main():
    port = find_available_port(5555, 20)
    
    if port is None:
        print("? Could not find available port")
        sys.exit(1)
    
    host = "127.0.0.1"
    
    print("\n" + "=" * 80)
    print("?? STARTING CODETTE AI SERVER")
    print("=" * 80)
    print(f"? Host: {host}")
    print(f"? Port: {port}")
    print(f"? API Docs: http://{host}:{port}/docs")
    print(f"? WebSocket: ws://{host}:{port}/ws")
    print("=" * 80)
    print("\n Press CTRL+C to stop the server\n")
    print("=" * 80 + "\n")
    
    try:
        # Run the server - this will block
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="info",
            access_log=True,
        )
    except KeyboardInterrupt:
        print("\n\n? Server stopped by user")
    except Exception as e:
        print(f"\n? Server error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
