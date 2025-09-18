const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdf = require('pdf-parse');
const OpenAI = require('openai');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Global variables for RAG functionality
let pdfContent = '';
let pdfChunks = [];
let openaiClient = null;

// Simple text chunking function
function chunkText(text, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    start = end - overlap;
  }
  
  return chunks;
}

// Simple cosine similarity function
function cosineSimilarity(a, b) {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Get embeddings from OpenAI
async function getEmbeddings(text, apiKey) {
  if (!openaiClient || openaiClient.apiKey !== apiKey) {
    openaiClient = new OpenAI({ apiKey });
  }
  
  try {
    const response = await openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embeddings:', error);
    throw error;
  }
}

// Find most relevant chunks
async function findRelevantChunks(query, apiKey, topK = 3) {
  try {
    const queryEmbedding = await getEmbeddings(query, apiKey);
    const chunkEmbeddings = await Promise.all(
      pdfChunks.map(chunk => getEmbeddings(chunk.text, apiKey))
    );
    
    const similarities = chunkEmbeddings.map((embedding, index) => ({
      chunk: pdfChunks[index],
      similarity: cosineSimilarity(queryEmbedding, embedding)
    }));
    
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  } catch (error) {
    console.error('Error finding relevant chunks:', error);
    return [];
  }
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'PDF RAG API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is healthy' });
});

app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
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

    const { api_key } = req.body;
    if (!api_key) {
      return res.status(400).json({ error: 'API key is required' });
    }

    // Process PDF
    console.log('Processing PDF:', req.file.originalname);
    const pdfData = await pdf(req.file.buffer);
    pdfContent = pdfData.text;
    
    // Chunk the text
    const textChunks = chunkText(pdfContent);
    pdfChunks = textChunks.map((text, index) => ({ text, index }));
    
    console.log(`PDF processed: ${pdfChunks.length} chunks created`);

    res.json({
      message: 'PDF uploaded and processed successfully',
      filename: req.file.originalname,
      status: {
        is_indexed: true,
        has_context: true,
        context_length: pdfContent.length,
        vector_count: pdfChunks.length
      }
    });
  } catch (error) {
    console.error('Error in upload-pdf:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, api_key } = req.body;
    
    if (!message || !api_key) {
      return res.status(400).json({ error: 'Message and API key are required' });
    }

    if (pdfChunks.length === 0) {
      return res.status(400).json({ error: 'No PDF has been uploaded. Please upload a PDF first.' });
    }

    // Find relevant chunks
    const relevantChunks = await findRelevantChunks(message, api_key);
    
    if (relevantChunks.length === 0) {
      return res.status(500).json({ error: 'Could not find relevant information in the PDF' });
    }

    // Create context from relevant chunks
    const context = relevantChunks.map(chunk => chunk.chunk.text).join('\n\n');
    
    // Generate response using OpenAI
    if (!openaiClient || openaiClient.apiKey !== api_key) {
      openaiClient = new OpenAI({ apiKey: api_key });
    }

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that answers questions based on the provided PDF content. Use the context below to answer the user's question. If the answer cannot be found in the context, say so clearly.

Context from PDF:
${context}`
        },
        {
          role: 'user',
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    res.json({
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.get('/api/status', (req, res) => {
  if (pdfChunks.length === 0) {
    res.json({
      status: 'no_pdf_uploaded',
      message: 'No PDF has been uploaded yet'
    });
  } else {
    res.json({
      status: 'ready',
      details: {
        is_indexed: true,
        has_context: true,
        context_length: pdfContent.length,
        vector_count: pdfChunks.length
      }
    });
  }
});

app.post('/api/legacy-chat', async (req, res) => {
  try {
    const { prompt, api_key, model = 'gpt-4o-mini' } = req.body;
    
    if (!prompt || !api_key) {
      return res.status(400).json({ error: 'Prompt and API key are required' });
    }

    // Initialize OpenAI client
    if (!openaiClient || openaiClient.apiKey !== api_key) {
      openaiClient = new OpenAI({ apiKey: api_key });
    }

    const completion = await openaiClient.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    res.json({
      response: completion.choices[0].message.content
    });
  } catch (error) {
    console.error('Error in legacy-chat:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

module.exports = app;
