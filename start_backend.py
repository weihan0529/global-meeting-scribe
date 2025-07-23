#!/usr/bin/env python
"""
Start Daphne server with increased timeout settings for long-running audio processing.
"""

import os
import sys
import subprocess

def start_daphne():
    """Start Daphne with custom settings for better handling of long-running tasks."""
    
    # Change to the unisono_backend directory
    backend_dir = os.path.join(os.getcwd(), 'unisono_backend')
    if not os.path.exists(backend_dir):
        print(f"Error: Backend directory not found at {backend_dir}")
        sys.exit(1)
    
    os.chdir(backend_dir)
    print(f"Changed to directory: {os.getcwd()}")
    
    # Set environment variables for increased timeouts
    env = os.environ.copy()
    env['DJANGO_SETTINGS_MODULE'] = 'unisono_backend.settings'
    
    # Daphne command with increased timeout settings
    cmd = [
        'daphne',
        '--bind', '0.0.0.0',
        '--port', '8000',
        '--access-log', '-',  # Log to stdout
        '--proxy-headers',  # Handle proxy headers
        '--websocket_timeout', '3600',  # 1 hour websocket timeout
        '-t', '3600',  # 1 hour HTTP timeout (using -t shorthand)
        'unisono_backend.asgi:application'
    ]
    
    print("Starting Daphne server with increased timeout settings...")
    print(f"Command: {' '.join(cmd)}")
    print("WebSocket timeout: 3600 seconds")
    print("HTTP timeout: 3600 seconds")
    print("-" * 50)
    
    try:
        subprocess.run(cmd, env=env, check=True)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"Server failed to start: {e}")
        sys.exit(1)

if __name__ == '__main__':
    start_daphne() 