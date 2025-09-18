"""
Vercel entry point for FastAPI application.
Export the ASGI `app` instance only. Vercel's Python runtime recognizes an `app` ASGI
callable and will serve it directly. Exporting a `handler` object (e.g. Mangum instance)
can confuse Vercel's internal checks and may raise TypeError.
"""

# Import the FastAPI `app` from the primary server module (main.py).
# This avoids conflicts when multiple files share the same base name (e.g. index.js/index.py).
from .main import app
