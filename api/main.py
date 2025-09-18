from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import sys
import os

# Add the current directory to the path to import aimakerspace
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Import RAG service
try:
    from aimakerspace.rag_service import RAGService
except ImportError as e:
    print(f"Warning: Could not import RAGService: {e}")
    RAGService = None

app = FastAPI(title="PDF RAG API")

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG service instance
rag_service: Optional[RAGService] = None

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
    global rag_service
    
    if RAGService is None:
        raise HTTPException(status_code=500, detail="RAG service not available")
    
    try:
        # Validate file type
        if not file.filename or not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Read file content
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Initialize RAG service with API key
        rag_service = RAGService(api_key=api_key)
        
        # Index the PDF
        success = await rag_service.index_pdf(file_content)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to process PDF")
        
        # Get indexing status
        status = rag_service.get_indexing_status()
        
        return {
            "message": "PDF uploaded and indexed successfully",
            "filename": file.filename,
            "status": status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in upload_pdf: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat with the uploaded PDF using RAG."""
    global rag_service
    
    if RAGService is None:
        raise HTTPException(status_code=500, detail="RAG service not available")
    
    try:
        if rag_service is None:
            raise HTTPException(
                status_code=400, 
                detail="No PDF has been uploaded. Please upload a PDF first."
            )
        
        # Use RAG service to answer the question
        response = await rag_service.ask_question(request.message)
        
        return {"response": response}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/status")
async def get_status():
    """Get current RAG service status."""
    global rag_service
    
    if RAGService is None:
        return {"status": "error", "message": "RAG service not available"}
    
    if rag_service is None:
        return {"status": "no_pdf_uploaded", "message": "No PDF has been uploaded yet"}
    
    status = rag_service.get_indexing_status()
    return {"status": "ready", "details": status}

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
