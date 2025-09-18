from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="PDF RAG API")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "PDF RAG API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "API is healthy"}

# This is the entry point for Vercel
handler = app
