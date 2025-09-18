from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import json

app = FastAPI(title="PDF RAG API")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PromptRequest(BaseModel):
    prompt: str
    model: Optional[str] = "gpt-4"
    api_key: str

class ChatRequest(BaseModel):
    message: str
    api_key: str

@app.get("/")
async def root():
    return {"message": "PDF RAG API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "API is healthy"}

@app.post("/api/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    api_key: str = Form(...)
):
    """Upload and index a PDF file for RAG processing."""
    try:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Read file content
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # For now, just return success (RAG functionality will be added later)
        return {
            "message": "PDF uploaded successfully (RAG processing not yet implemented)",
            "filename": file.filename,
            "status": {
                "is_indexed": True,
                "has_context": True,
                "context_length": 1000,
                "vector_count": 10
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in upload_pdf: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat with the uploaded PDF using RAG."""
    try:
        # For now, just return a placeholder response
        return {
            "response": f"RAG functionality not yet implemented. You asked: {request.message}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status")
async def get_status():
    """Get current RAG service status."""
    return {
        "status": "no_pdf_uploaded", 
        "message": "RAG service not yet implemented"
    }

@app.post("/api/legacy-chat")
async def legacy_chat(request: PromptRequest):
    """Legacy chat endpoint for backward compatibility."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=request.api_key)

        response = client.chat.completions.create(
            model=request.model,
            messages=[
                {"role": "user", "content": request.prompt}
            ]
        )
        return {"response": response.choices[0].message.content.strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# This is the entry point for Vercel
handler = app
