import PyPDF2
import io
from typing import List
from .text_utils import CharacterTextSplitter


class PDFProcessor:
    """Utility class for processing PDF files and extracting text content."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize PDF processor with text splitting configuration.
        
        Args:
            chunk_size: Maximum size of each text chunk
            chunk_overlap: Number of characters to overlap between chunks
        """
        self.text_splitter = CharacterTextSplitter(
            chunk_size=chunk_size, 
            chunk_overlap=chunk_overlap
        )
    
    def extract_text_from_pdf(self, pdf_file_content: bytes) -> str:
        """
        Extract text content from PDF file bytes.
        
        Args:
            pdf_file_content: PDF file content as bytes
            
        Returns:
            Extracted text content as string
        """
        try:
            pdf_file = io.BytesIO(pdf_file_content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            
            text_content = ""
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text_content += page.extract_text() + "\n"
            
            return text_content.strip()
        except Exception as e:
            raise ValueError(f"Error extracting text from PDF: {str(e)}")
    
    def process_pdf_to_chunks(self, pdf_file_content: bytes) -> List[str]:
        """
        Process PDF file and return text chunks for vector database.
        
        Args:
            pdf_file_content: PDF file content as bytes
            
        Returns:
            List of text chunks ready for embedding
        """
        # Extract text from PDF
        full_text = self.extract_text_from_pdf(pdf_file_content)
        
        # Split text into chunks
        chunks = self.text_splitter.split(full_text)
        
        # Filter out empty chunks
        chunks = [chunk.strip() for chunk in chunks if chunk.strip()]
        
        return chunks
