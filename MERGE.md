# Vercel Deployment Configuration

This document explains how to deploy the FastAPI RAG application to Vercel and merge the changes back to the main branch.

## Changes Made

### 1. Vercel Configuration Files
- **Updated `vercel.json`**: Configured for both FastAPI backend and React frontend deployment
- **Created `api/vercel_entry.py`**: Entry point for Vercel to serve the FastAPI app
- **Updated `api/vercel.json`**: Optimized for API-only deployment
- **Created `.vercelignore`**: Excludes unnecessary files from deployment

### 2. Dependencies
- **Updated `api/requirements.txt`**: Added `httpx` dependency for better HTTP client support

## Deployment Instructions

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from project root**:
   ```bash
   cd /Users/vipinvijayan/Developer/projects/AI/AIMakerSpace/code/The-AI-Engineer-Challenge
   vercel --prod
   ```

4. **Follow the prompts**:
   - Link to existing project or create new one
   - Confirm project settings
   - Wait for deployment to complete

### Option 2: Deploy via GitHub Integration

1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin feature/pdf-rag-system
   ```

2. **Create Pull Request**:
   - Go to GitHub repository
   - Create PR from `feature/pdf-rag-system` to `main`
   - Merge the PR

3. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import project from GitHub
   - Select the repository
   - Vercel will auto-detect the configuration

## API Endpoints

Once deployed, your API will be available at:
- `https://your-app.vercel.app/api/health` - Health check
- `https://your-app.vercel.app/api/upload-pdf` - Upload PDF for RAG
- `https://your-app.vercel.app/api/chat` - Chat with uploaded PDF
- `https://your-app.vercel.app/api/status` - Get RAG service status
- `https://your-app.vercel.app/api/legacy-chat` - Legacy chat endpoint

## Environment Variables

Make sure to set the following environment variables in Vercel dashboard:
- `OPENAI_API_KEY` (if you want to use a default API key)
- Any other environment variables your app needs

## Testing the Deployment

1. **Health Check**:
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

2. **Upload PDF**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/upload-pdf \
     -F "file=@your-document.pdf" \
     -F "api_key=your-openai-api-key"
   ```

3. **Chat with PDF**:
   ```bash
   curl -X POST https://your-app.vercel.app/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "What is this document about?", "api_key": "your-openai-api-key"}'
   ```

## Merge Instructions

### GitHub PR Route:
1. Create a pull request from `feature/pdf-rag-system` to `main`
2. Review the changes
3. Merge the pull request
4. Delete the feature branch after merging

### GitHub CLI Route:
```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch
git merge feature/pdf-rag-system

# Push changes
git push origin main

# Delete feature branch
git branch -d feature/pdf-rag-system
git push origin --delete feature/pdf-rag-system
```

## Troubleshooting

### Common Issues:

1. **Import Errors**: Make sure all dependencies are in `requirements.txt`
2. **Path Issues**: The `vercel_entry.py` file handles the import path correctly
3. **CORS Issues**: CORS is configured to allow all origins for development
4. **File Upload Issues**: Ensure `python-multipart` is in requirements

### Debugging:
- Check Vercel function logs in the dashboard
- Use the `/api/health` endpoint to verify the app is running
- Test locally with `uvicorn api.app:app --reload` before deploying

## Next Steps

After successful deployment:
1. Update your frontend to use the new Vercel API endpoints
2. Configure custom domain if needed
3. Set up monitoring and logging
4. Consider adding authentication for production use