import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { HeliusService } from './services/helius.service';
import { SwapService } from './services/swap.service';
import { AggregationService } from './services/aggregation.service';
import { TokenController } from './controllers/token.controller';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const heliusService = new HeliusService();
const swapService = new SwapService(heliusService);
const aggregationService = new AggregationService(swapService, heliusService);

// Initialize controllers
const tokenController = new TokenController(
  heliusService,
  swapService,
  aggregationService
);

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'Trench Maps API',
    version: '1.0.0',
    description: 'Track Solana memecoin capital flows in real-time',
  });
});

// Token tracking endpoints
app.post('/api/tokens/track', tokenController.trackToken);
app.delete('/api/tokens/:mintAddress/untrack', tokenController.untrackToken);
app.get('/api/tokens/:mintAddress/holders', tokenController.getHolders);
app.get('/api/tokens/:mintAddress/status', tokenController.getMonitoringStatus);
app.get('/api/tokens/:mintAddress/flows', tokenController.getFlows);
app.get('/api/tokens/:mintAddress/swaps', tokenController.getSwaps);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  swapService.clearAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  swapService.clearAll();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║     TRENCH MAPS API RUNNING           ║
  ╠═══════════════════════════════════════╣
  ║  Port: ${PORT}                        ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}            ║
  ║  Helius API: Connected                ║
  ╚═══════════════════════════════════════╝

  Ready to track memecoin flows!
  `);
});
