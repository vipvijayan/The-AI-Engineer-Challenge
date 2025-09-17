# from fastapi import FastAPI, HTTPException
# from fastapi.responses import StreamingResponse
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from openai import OpenAI
# from typing import Optional

# app = FastAPI(title="OpenAI Chat API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# class ChatRequest(BaseModel):
#     developer_message: str
#     user_message: str
#     model: Optional[str] = "gpt-4.1-mini"
#     api_key: str

# @app.post("/api/chat")
# async def chat(request: ChatRequest):
#     try:
#         client = OpenAI(api_key=request.api_key)

#         def generate():
#             try:
#                 stream = client.chat.completions.create(
#                     model=request.model,
#                     messages=[
#                         {"role": "system", "content": request.developer_message},
#                         {"role": "user", "content": request.user_message}
#                     ],
#                     stream=True
#                 )

#                 for chunk in stream:
#                     content = chunk.choices[0].delta.content if chunk.choices[0].delta.content else ""
#                     if content:
#                         yield content

#                 print(content)

#             except Exception as e:
#                 yield f"\n[ERROR] Streaming interrupted: {str(e)}"

#         return StreamingResponse(generate(), media_type="text/event-stream")

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/api/health")
# async def health_check():
#     return {"status": "ok"}

# if __name__ == "__main__":
#     import uvicorn


#     uvicorn.run(app, host="0.0.0.0", port=8000)


from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import sys
import os
import asyncio

# Add the parent directory to the path to import aimakerspace
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from aimakerspace.rag_service import RAGService

app = FastAPI()

# Allow CORS from same domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Since we're on the same domain, we can be more permissive
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
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

@app.post("/api/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    api_key: str = Form(...)
):
    """Upload and index a PDF file for RAG processing."""
    global rag_service
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Read file content
        file_content = await file.read()
        
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat with the uploaded PDF using RAG."""
    global rag_service
    
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
    
    if rag_service is None:
        return {"status": "no_pdf_uploaded", "message": "No PDF has been uploaded yet"}
    
    status = rag_service.get_indexing_status()
    return {"status": "ready", "details": status}

@app.post("/api/legacy-chat")
async def legacy_chat(request: PromptRequest):
    """Legacy chat endpoint for backward compatibility."""
    try:
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

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}