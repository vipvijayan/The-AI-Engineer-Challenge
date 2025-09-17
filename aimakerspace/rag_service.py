import asyncio
from typing import List, Optional
from .vectordatabase import VectorDatabase
from .openai_utils.embedding import EmbeddingModel
from .openai_utils.chatmodel import ChatOpenAI
from .pdf_processor import PDFProcessor


class RAGService:
    """RAG (Retrieval-Augmented Generation) service for PDF-based question answering."""
    
    def __init__(self, api_key: str, model_name: str = "gpt-4"):
        """
        Initialize RAG service with OpenAI API key.
        
        Args:
            api_key: OpenAI API key
            model_name: OpenAI model name for chat completions
        """
        self.api_key = api_key
        self.model_name = model_name
        
        # Initialize components
        self.embedding_model = EmbeddingModel()
        self.vector_db = VectorDatabase(embedding_model=self.embedding_model)
        self.pdf_processor = PDFProcessor()
        self.chat_model = ChatOpenAI(model_name=model_name)
        
        # Store PDF context for reference
        self.pdf_context: Optional[str] = None
        self.is_indexed = False
    
    async def index_pdf(self, pdf_file_content: bytes) -> bool:
        """
        Index a PDF file by extracting text, chunking, and creating embeddings.
        
        Args:
            pdf_file_content: PDF file content as bytes
            
        Returns:
            True if indexing was successful
        """
        try:
            # Process PDF into chunks
            text_chunks = self.pdf_processor.process_pdf_to_chunks(pdf_file_content)
            
            if not text_chunks:
                raise ValueError("No text content found in PDF")
            
            # Store full text for context
            self.pdf_context = "\n\n".join(text_chunks)
            
            # Create embeddings and build vector database
            await self.vector_db.abuild_from_list(text_chunks)
            
            self.is_indexed = True
            return True
            
        except Exception as e:
            print(f"Error indexing PDF: {str(e)}")
            return False
    
    def search_relevant_context(self, query: str, k: int = 3) -> List[str]:
        """
        Search for relevant context chunks based on query.
        
        Args:
            query: User's question
            k: Number of relevant chunks to retrieve
            
        Returns:
            List of relevant text chunks
        """
        if not self.is_indexed:
            return []
        
        try:
            # Search for relevant chunks
            relevant_chunks = self.vector_db.search_by_text(
                query_text=query,
                k=k,
                return_as_text=True
            )
            return relevant_chunks
        except Exception as e:
            print(f"Error searching context: {str(e)}")
            return []
    
    def generate_response(self, query: str, context_chunks: List[str]) -> str:
        """
        Generate response using retrieved context and user query.
        
        Args:
            query: User's question
            context_chunks: Retrieved relevant context chunks
            
        Returns:
            Generated response from the LLM
        """
        if not context_chunks:
            return "I don't have enough context to answer your question. Please make sure a PDF has been uploaded and indexed."
        
        # Combine context chunks
        context = "\n\n".join(context_chunks)
        
        # Create system prompt for RAG
        system_prompt = f"""You are a helpful assistant that answers questions based on the provided context from a PDF document. 
        
        IMPORTANT INSTRUCTIONS:
        - Only answer questions using information from the provided context
        - If the answer cannot be found in the context, say "I cannot find the answer to your question in the provided document"
        - Be specific and cite relevant parts of the document when possible
        - If you're unsure about something, say so rather than guessing
        
        Context from the document:
        {context}
        """
        
        # Create messages for chat completion
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]
        
        try:
            # Generate response using the chat model
            response = self.chat_model.run(messages, text_only=True)
            return response
        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    async def ask_question(self, query: str, k: int = 3) -> str:
        """
        Complete RAG pipeline: search for context and generate response.
        
        Args:
            query: User's question
            k: Number of relevant chunks to retrieve
            
        Returns:
            Generated response
        """
        if not self.is_indexed:
            return "No PDF has been uploaded and indexed yet. Please upload a PDF first."
        
        # Search for relevant context
        context_chunks = self.search_relevant_context(query, k)
        
        # Generate response
        response = self.generate_response(query, context_chunks)
        
        return response
    
    def get_indexing_status(self) -> dict:
        """
        Get current indexing status and document info.
        
        Returns:
            Dictionary with indexing status and document information
        """
        return {
            "is_indexed": self.is_indexed,
            "has_context": self.pdf_context is not None,
            "context_length": len(self.pdf_context) if self.pdf_context else 0,
            "vector_count": len(self.vector_db.vectors)
        }
