"""
Simple Vercel entry point for testing.
"""

from simple_app import app

# Export the FastAPI app instance for Vercel
handler = app
