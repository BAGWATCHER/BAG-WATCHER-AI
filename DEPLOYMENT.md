# Deployment Guide

## Frontend - Vercel

1. Go to https://vercel.com/new
2. Import GitHub repo: `BAGWATCHER/BAG-WATCHER-AI`
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**

Your landing page will be live at: `https://bag-watcher-ai.vercel.app`

## Backend - Railway

1. Go to https://railway.app/new
2. Select **Deploy from GitHub repo**
3. Choose `BAGWATCHER/BAG-WATCHER-AI`
4. Railway will auto-detect Nixpacks config
5. Add environment variables:
   ```
   HELIUS_API_KEY=1a87cb8f-4958-461d-8d73-5374f136d7d2
   HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=1a87cb8f-4958-461d-8d73-5374f136d7d2
   PORT=3000
   NODE_ENV=production
   ```
6. After deployment, copy the Railway URL (e.g., `https://bag-watcher-ai-production.up.railway.app`)
7. Add one more environment variable:
   ```
   WEBHOOK_BASE_URL=<your-railway-url>
   ```
8. Redeploy

## Connect Frontend to Backend

1. In Vercel, add environment variable:
   ```
   VITE_API_URL=<your-railway-url>
   ```
2. Redeploy frontend

## Domain Setup

### Frontend (Vercel)
- Go to Vercel project settings → Domains
- Add `bagwatcher.ai` and `www.bagwatcher.ai`
- Update DNS records as instructed

### Backend (Railway)
- Go to Railway project settings → Domains
- Add custom domain like `api.bagwatcher.ai`
- Update CNAME record

## Environment Variables

### Backend Required:
- `HELIUS_API_KEY` - Your Helius API key
- `HELIUS_RPC_URL` - Helius RPC endpoint
- `WEBHOOK_BASE_URL` - Your Railway domain for webhooks
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Set to "production"

### Frontend Optional:
- `VITE_API_URL` - Backend API URL (for dashboard)

## Post-Deployment

1. Test landing page at your Vercel URL
2. Test API at `<railway-url>/health`
3. Set up custom domains
4. Monitor Railway logs for webhook activity
