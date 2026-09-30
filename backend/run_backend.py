"""
Run script for FastAPI backend server.
Usage:
    python backend/run_backend.py
"""

import uvicorn
import os
import sys

# Ensure backend root is in pythonpath
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings

if __name__ == "__main__":
    print(f"Starting {settings.PROJECT_NAME} on http://{settings.BACKEND_HOST}:{settings.BACKEND_PORT}")
    uvicorn.run(
        "app.main:app",
        host=settings.BACKEND_HOST,
        port=settings.BACKEND_PORT,
        reload=False
    )
