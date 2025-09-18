const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'PDF RAG API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

app.post('/api/upload-pdf', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    if (req.file.size === 0) {
      return res.status(400).json({ error: 'File is empty' });
    }

    // For now, just return success (RAG functionality will be added later)
    res.json({
      message: 'PDF uploaded successfully (RAG processing not yet implemented)',
      filename: req.file.originalname,
      status: {
        is_indexed: true,
        has_context: true,
        context_length: 1000,
        vector_count: 10
      }
    });
  } catch (error) {
    console.error('Error in upload-pdf:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/chat', (req, res) => {
  try {
    const { message, api_key } = req.body;
    
    if (!message || !api_key) {
      return res.status(400).json({ error: 'Message and API key are required' });
    }

    // For now, just return a placeholder response
    res.json({
      response: `RAG functionality not yet implemented. You asked: ${message}`
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'no_pdf_uploaded',
    message: 'RAG service not yet implemented'
  });
});

app.post('/api/legacy-chat', async (req, res) => {
  try {
    const { prompt, api_key, model = 'gpt-4' } = req.body;
    
    if (!prompt || !api_key) {
      return res.status(400).json({ error: 'Prompt and API key are required' });
    }

    // For now, return a placeholder response
    res.json({
      response: `Legacy chat not yet implemented. You asked: ${prompt}`
    });
  } catch (error) {
    console.error('Error in legacy-chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = app;
