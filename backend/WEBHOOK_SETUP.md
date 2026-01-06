# Webhook Setup Guide

## Why Webhooks?

The original polling approach had several limitations:
- Only monitored top 100 holders
- Checked wallets every 15 seconds (very slow)
- Made excessive API calls causing rate limits
- Missed swaps that happened between polling intervals

**With webhooks**, Helius notifies us INSTANTLY when ANY monitored holder makes a swap transaction. This means:
- ✅ Monitor ALL holders (up to 100,000 per token)
- ✅ Real-time detection (< 1 second latency)
- ✅ No rate limits on swap detection
- ✅ More efficient API usage

## Local Development Setup

For webhooks to work locally, Helius needs to send HTTP requests to your computer. You need to expose your local server to the internet using a tunneling service.

### Option 1: ngrok (Recommended)

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Start your backend server:**
   ```bash
   cd backend
   npm run dev
   ```

3. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS forwarding URL** (e.g., `https://abc123.ngrok.io`)

5. **Update your .env file:**
   ```
   WEBHOOK_BASE_URL=https://abc123.ngrok.io
   ```

6. **Restart your backend** for the new webhook URL to take effect

### Option 2: Deploy to Production

For production use, deploy your backend to a service like:
- **Render**: https://render.com
- **Railway**: https://railway.app
- **Fly.io**: https://fly.io
- **DigitalOcean**: https://www.digitalocean.com

Then set your `WEBHOOK_BASE_URL` to your production URL:
```
WEBHOOK_BASE_URL=https://your-app.onrender.com
```

## Testing Webhooks

1. **Test endpoint accessibility:**
   ```bash
   curl https://your-ngrok-url.ngrok.io/api/webhooks/test
   ```

2. **Track a token** to create the webhook:
   ```bash
   curl -X POST http://localhost:3000/api/tokens/track \
     -H "Content-Type: application/json" \
     -d '{"mintAddress": "YOUR_TOKEN_MINT"}'
   ```

3. **Check Helius dashboard** to verify webhook was created:
   - Go to https://dev.helius.xyz/webhooks
   - You should see your webhook listed

4. **Monitor console logs** for incoming webhook notifications when swaps occur

## Webhook Flow

```
┌─────────────────┐
│  Holder Wallet  │
│   makes swap    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Solana Chain   │
└────────┬────────┘
         │
         v
┌─────────────────┐      Webhook Event      ┌─────────────────┐
│  Helius Index   │ ──────────────────────> │  Your Backend   │
│  Detects Swap   │     (< 1 second)        │  /api/webhooks  │
└─────────────────┘                         └────────┬────────┘
                                                     │
                                                     v
                                            ┌─────────────────┐
                                            │  Process Swap   │
                                            │  Update Cache   │
                                            │  Notify Frontend│
                                            └─────────────────┘
```

## Switching to V2 (Webhook Mode)

To use the new webhook-based system:

1. **Rename files:**
   ```bash
   cd backend/src
   mv index.ts index.old.ts
   mv index.v2.ts index.ts
   ```

2. **The server will auto-restart** and webhooks will be enabled

3. **Track a token** and it will automatically create webhooks for all holders

## Monitoring

Once webhooks are set up, you'll see console logs like:

```
Created webhook abc-123-def for token Gysp4iZ6uNu...
Webhook abc-123-def monitoring 1415 addresses

🔥 NEW SWAP: 5mxf9obc... swapped Gysp4iZ6... -> 9oKUn9hQ...
Total swaps for Gysp4iZ6uNu...: 5
```

## Troubleshooting

### Webhook not receiving events
- Verify ngrok is running and URL is correct
- Check Helius dashboard for webhook status
- Ensure `WEBHOOK_BASE_URL` is set to your ngrok HTTPS URL
- Test webhook accessibility with curl

### Too many addresses error
- Helius webhooks support up to 100,000 addresses
- Tokens with more holders will only monitor first 100k

### Rate limits on historical data fetch
- Historical data collection samples top 200 holders
- Batched with delays to avoid rate limits
- Webhooks will catch all future swaps in real-time

## Production Deployment

When deploying to production:

1. Set `WEBHOOK_BASE_URL` to your production domain
2. Webhooks persist across restarts (stored in Helius)
3. Implement proper error handling and retry logic
4. Consider adding a database to persist swap history
5. Use environment-specific webhook URLs (dev, staging, prod)

## Cost Considerations

- Helius webhooks are FREE on all plans
- Each webhook can monitor up to 100,000 addresses
- You can have multiple webhooks (one per tracked token)
- Much more cost-effective than polling API
