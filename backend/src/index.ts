import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HeliusService } from './services/helius.service';
import { WebhookService } from './services/webhook.service';
import { SwapServiceV2 } from './services/swap.service.v2';
import { AggregationService } from './services/aggregation.service';
import { TokenController } from './controllers/token.controller';
import { WebhookController } from './controllers/webhook.controller';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for webhook payloads

// Initialize services
const heliusService = new HeliusService();
const webhookService = new WebhookService();
const swapService = new SwapServiceV2(heliusService, webhookService);
const aggregationService = new AggregationService(swapService, heliusService);

// Initialize controllers
const tokenController = new TokenController(
  heliusService,
  swapService,
  aggregationService
);
const webhookController = new WebhookController(swapService);

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'Trench Maps API',
    version: '2.0.0',
    description: 'Track Solana memecoin capital flows in real-time with webhooks',
    features: [
      'Real-time swap detection via Helius webhooks',
      'Monitor ALL token holders (up to 100k)',
      'Historical swap data collection',
      'Memecoin flow aggregation and ranking',
    ],
  });
});

// Webhook endpoints (must come before other routes to avoid conflicts)
app.post('/api/webhooks/helius', webhookController.handleHeliusWebhook);
app.get('/api/webhooks/test', webhookController.testWebhook);

// Token tracking endpoints
app.post('/api/tokens/track', tokenController.trackToken);
app.delete('/api/tokens/:mintAddress/untrack', tokenController.untrackToken);
app.get('/api/tokens/:mintAddress/holders', tokenController.getHolders);
app.get('/api/tokens/:mintAddress/status', tokenController.getMonitoringStatus);
app.get('/api/tokens/:mintAddress/flows', tokenController.getFlows);
app.get('/api/tokens/:mintAddress/swaps', tokenController.getSwaps);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    monitoredTokens: swapService.getMonitoredTokens().length,
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\nShutting down gracefully...');
  try {
    await swapService.clearAll();
    console.log('Cleaned up all webhooks');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   TRENCH MAPS API V2.0 RUNNING        ║
  ╠═══════════════════════════════════════╣
  ║  Port: ${PORT}                        ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}            ║
  ║  Helius API: Connected                ║
  ║  Webhook Mode: ENABLED                ║
  ╚═══════════════════════════════════════╝

  🚀 Features:
  • Real-time swap detection via webhooks
  • Monitor up to 100,000 holders per token
  • Historical data collection
  • Instant notifications when holders rotate capital

  📡 Webhook URL: ${process.env.WEBHOOK_BASE_URL || `http://localhost:${PORT}`}/api/webhooks/helius

  Ready to track memecoin flows!
  `);
});
