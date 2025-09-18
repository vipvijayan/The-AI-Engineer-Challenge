import React, { useState, ChangeEvent, FormEvent, useRef } from 'react';

interface ChatResponse {
  response?: string;
  detail?: string;
}

interface UploadResponse {
  message: string;
  filename: string;
  status: {
    is_indexed: boolean;
    has_context: boolean;
    context_length: number;
    vector_count: number;
  };
}

interface StatusResponse {
  status: string;
  message?: string;
  details?: {
    is_indexed: boolean;
    has_context: boolean;
    context_length: number;
    vector_count: number;
  };
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isPdfUploaded, setIsPdfUploaded] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine API base URL based on environment
  const getApiBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      // In production, use the same domain (Vercel will handle routing)
      return '';
    } else {
      // In development, use localhost
      return 'http://localhost:8000';
    }
  };

  const API_BASE_URL = getApiBaseUrl();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setResponse("Loading...");

    try {
      const endpoint = isPdfUploaded ? `${API_BASE_URL}/api/chat` : `${API_BASE_URL}/api/legacy-chat`;
      const body = isPdfUploaded 
        ? JSON.stringify({ message: prompt, api_key: apiKey })
        : JSON.stringify({ prompt, api_key: apiKey });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: body,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: ChatResponse = await res.json();
      setResponse(data.response ?? data.detail ?? 'No response');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setResponse(`Error: ${error.message}`);
      } else {
        setResponse('Unknown error occurred.');
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setUploadStatus('');
      } else {
        setUploadStatus('Please select a PDF file');
        setSelectedFile(null);
      }
    }
  };

  const handleFileUpload = async (): Promise<void> => {
    if (!selectedFile || !apiKey) {
      setUploadStatus('Please select a PDF file and enter your API key');
      return;
    }

    console.log('Selected file:', selectedFile);
    console.log('File type:', selectedFile.type);
    console.log('File name:', selectedFile.name);
    console.log('File size:', selectedFile.size);

    setUploadStatus('Uploading and processing PDF...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('api_key', apiKey);

      console.log('FormData entries:');
      // Convert FormData to array for debugging
      const formDataArray = Array.from(formData.entries());
      formDataArray.forEach(([key, value]) => {
        console.log(key, value);
      });

      const res = await fetch(`${API_BASE_URL}/api/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: UploadResponse = await res.json();
      setUploadStatus(`Successfully uploaded: ${data.filename}`);
      setIsPdfUploaded(true);
      setResponse('PDF uploaded successfully! You can now ask questions about the document.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setUploadStatus(`Error: ${error.message}`);
      } else {
        setUploadStatus('Unknown error occurred during upload');
      }
    }
  };

  const checkStatus = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/status`);
      const data: StatusResponse = await res.json();
      
      if (data.status === 'ready') {
        setIsPdfUploaded(true);
        setUploadStatus('PDF is ready for questions');
      } else {
        setIsPdfUploaded(false);
        setUploadStatus(data.message || 'No PDF uploaded');
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handlePromptChange = (e: ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value);
  const handleApiKeyChange = (e: ChangeEvent<HTMLInputElement>) => setApiKey(e.target.value);

  // Check status on component mount
  React.useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>PDF RAG Chat System</h1>
      
      {/* API Key Input */}
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="password"
          placeholder="Enter your OpenAI API key"
          value={apiKey}
          onChange={handleApiKeyChange}
          style={{ 
            width: '100%', 
            padding: '0.5rem', 
            marginBottom: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
      </div>

      {/* PDF Upload Section */}
      <div style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Upload PDF Document</h3>
        <div style={{ marginBottom: '1rem' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ marginBottom: '1rem' }}
          />
          <button
            type="button"
            onClick={handleFileUpload}
            disabled={!selectedFile || !apiKey}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedFile && apiKey ? '#007bff' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedFile && apiKey ? 'pointer' : 'not-allowed'
            }}
          >
            Upload PDF
          </button>
        </div>
        {uploadStatus && (
          <div style={{ 
            padding: '0.5rem', 
            backgroundColor: uploadStatus.includes('Error') ? '#f8d7da' : '#d4edda',
            color: uploadStatus.includes('Error') ? '#721c24' : '#155724',
            borderRadius: '4px',
            marginTop: '0.5rem'
          }}>
            {uploadStatus}
          </div>
        )}
      </div>

      {/* Chat Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3>
          {isPdfUploaded ? 'Chat with PDF Document' : 'Chat with OpenAI (Legacy Mode)'}
        </h3>
        <form onSubmit={handleSubmit}>
          <textarea
            rows={4}
            placeholder={isPdfUploaded ? "Ask a question about the PDF document..." : "Type your message..."}
            value={prompt}
            onChange={handlePromptChange}
            style={{ 
              width: '100%', 
              padding: '0.5rem',
              marginBottom: '1rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              resize: 'vertical'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {isPdfUploaded ? 'Ask Question' : 'Send Message'}
          </button>
        </form>
      </div>

      {/* Response Section */}
      {response && (
        <div>
          <h3>Response:</h3>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {response}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;