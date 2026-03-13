# Deployment Guide

This guide explains how to deploy the AI Meeting Summarizer application to Vercel.

## Important Note

⚠️ **Backend Limitation**: The backend uses Ollama which runs locally on your machine. Vercel's serverless functions cannot run Ollama directly. You have two options:

1. **Deploy Frontend Only**: Deploy just the frontend to Vercel and run the backend locally or on a separate server
2. **Use Alternative Backend**: Replace Ollama with a cloud-based AI service (OpenAI, Anthropic, etc.) for full cloud deployment

## Option 1: Deploy Frontend to Vercel

### Step 1: Prepare for Deployment

1. Make sure all changes are committed and pushed to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push
   ```

### Step 2: Deploy to Vercel

#### Using Vercel Dashboard:

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click "Add New Project"
3. Import your repository: `Akshayapanja/AI-meeting-summarizer`
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Add Environment Variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your backend URL (e.g., `http://localhost:3001` for local development, or your deployed backend URL)
6. Click "Deploy"

#### Using Vercel CLI:

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to project root and deploy:
   ```bash
   cd "c:\Users\sriha\OneDrive\Desktop\Meeting summarizer"
   vercel
   ```

4. Follow the prompts:
   - Link to existing project or create new
   - Set root directory to `frontend`
   - Confirm settings

5. Set environment variable:
   ```bash
   vercel env add VITE_API_URL
   ```
   Enter your backend URL when prompted.

### Step 3: Configure Environment Variables

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add:
   - **VITE_API_URL**: Your backend API URL
     - For local backend: `http://localhost:3001` (won't work from deployed frontend)
     - For deployed backend: Your backend deployment URL

### Step 4: Run Backend Separately

Since Ollama runs locally, you'll need to:

1. **Option A**: Run backend on your local machine and use a tunneling service:
   - Use [ngrok](https://ngrok.com/) or [localtunnel](https://localtunnel.github.io/www/)
   - Update `VITE_API_URL` in Vercel to point to the tunnel URL

2. **Option B**: Deploy backend to a service that supports Node.js:
   - [Railway](https://railway.app/)
   - [Render](https://render.com/)
   - [Fly.io](https://fly.io/)
   - Note: These services won't have Ollama installed, so you'd need to modify the backend

## Option 2: Full Cloud Deployment (Recommended for Production)

To deploy both frontend and backend to the cloud, you'll need to:

1. Replace Ollama with a cloud AI service:
   - OpenAI API
   - Anthropic Claude API
   - Google Gemini API
   - Or any other cloud-based LLM service

2. Update `backend/server.js` to use the cloud API instead of Ollama

3. Deploy backend to Vercel as serverless functions or to another platform

4. Update frontend environment variables to point to the deployed backend

## Troubleshooting

### Frontend Build Fails

- Ensure all dependencies are in `package.json`
- Check that `npm install` completes successfully
- Verify `npm run build` works locally

### API Connection Errors

- Check that `VITE_API_URL` is set correctly in Vercel
- Verify CORS is enabled on your backend
- Ensure backend is accessible from the internet (not just localhost)

### Environment Variables Not Working

- Vercel requires a redeploy after adding environment variables
- Use `vercel --prod` to deploy to production with new env vars
- Check that variable names start with `VITE_` for Vite projects

## Next Steps

After deployment:
1. Test the deployed frontend
2. Verify API connectivity
3. Set up custom domain (optional)
4. Configure automatic deployments from GitHub (enabled by default)
