"""
Vercel entry point for FastAPI application.
This file is required for Vercel to properly serve the FastAPI app.
"""

from app import app

# Export the FastAPI app instance for Vercel
handler = app
