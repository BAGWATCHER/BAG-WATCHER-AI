import { Request, Response } from 'express';
import { HeliusService } from '../services/helius.service';
import { SwapService } from '../services/swap.service';
import { AggregationService } from '../services/aggregation.service';

export class TokenController {
  private heliusService: HeliusService;
  private swapService: SwapService;
  private aggregationService: AggregationService;

  constructor(
    heliusService: HeliusService,
    swapService: SwapService,
    aggregationService: AggregationService
  ) {
    this.heliusService = heliusService;
    this.swapService = swapService;
    this.aggregationService = aggregationService;
  }

  /**
   * Start tracking a token
   * POST /api/tokens/track
   * Body: { mintAddress: string }
   */
  trackToken = async (req: Request, res: Response) => {
    try {
      const { mintAddress } = req.body;

      if (!mintAddress) {
        return res.status(400).json({ error: 'mintAddress is required' });
      }

      console.log(`Starting to track token: ${mintAddress}`);

      // Get token metadata
      const metadata = await this.heliusService.getTokenMetadata(mintAddress);

      // Get holders count
      const holders = await this.heliusService.getTokenHolders(mintAddress);

      // Start monitoring for swaps
      await this.swapService.startMonitoring(mintAddress);

      res.json({
        success: true,
        tokenMint: mintAddress,
        tokenSymbol: metadata.symbol,
        tokenName: metadata.name,
        holderCount: holders.length,
        message: 'Token tracking started. Swaps will be detected in real-time.',
      });
    } catch (error: any) {
      console.error('Error tracking token:', error);
      res.status(500).json({ error: error.message || 'Failed to track token' });
    }
  };

  /**
   * Stop tracking a token
   * DELETE /api/tokens/:mintAddress/untrack
   */
  untrackToken = async (req: Request, res: Response) => {
    try {
      const { mintAddress } = req.params;

      this.swapService.stopMonitoring(mintAddress);

      res.json({
        success: true,
        message: `Stopped tracking ${mintAddress}`,
      });
    } catch (error: any) {
      console.error('Error untracking token:', error);
      res.status(500).json({ error: error.message || 'Failed to untrack token' });
    }
  };

  /**
   * Get token holders
   * GET /api/tokens/:mintAddress/holders
   */
  getHolders = async (req: Request, res: Response) => {
    try {
      const { mintAddress } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      const holders = await this.heliusService.getTokenHolders(mintAddress);

      // Sort by balance descending
      const sortedHolders = holders.sort((a, b) => b.uiBalance - a.uiBalance);

      res.json({
        tokenMint: mintAddress,
        holderCount: holders.length,
        topHolders: sortedHolders.slice(0, limit),
        totalSupplyHeld: holders.reduce((sum, h) => sum + h.uiBalance, 0),
      });
    } catch (error: any) {
      console.error('Error fetching holders:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch holders' });
    }
  };

  /**
   * Get monitoring status for a token
   * GET /api/tokens/:mintAddress/status
   */
  getMonitoringStatus = async (req: Request, res: Response) => {
    try {
      const { mintAddress } = req.params;

      const swaps = this.swapService.getSwaps(mintAddress);
      const isMonitoring = this.swapService.isMonitoring(mintAddress);

      res.json({
        tokenMint: mintAddress,
        isMonitoring,
        totalSwapsDetected: swaps.length,
        oldestSwap: swaps.length > 0 ? swaps[0].timestamp : null,
        newestSwap: swaps.length > 0 ? swaps[swaps.length - 1].timestamp : null,
        monitoringDuration: 'N/A', // Can add uptime tracking later
      });
    } catch (error: any) {
      console.error('Error fetching status:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch status' });
    }
  };

  /**
   * Get token flows (where holders are swapping to)
   * GET /api/tokens/:mintAddress/flows?timeWindow=60
   */
  getFlows = async (req: Request, res: Response) => {
    try {
      const { mintAddress } = req.params;
      const timeWindow = parseInt(req.query.timeWindow as string) || 60;

      const flows = await this.aggregationService.getTokenFlows(
        mintAddress,
        timeWindow
      );

      const stats = this.aggregationService.getTokenStats(mintAddress, timeWindow);

      res.json({
        tokenMint: mintAddress,
        timeWindowMinutes: timeWindow,
        stats,
        flows,
      });
    } catch (error: any) {
      console.error('Error fetching flows:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch flows' });
    }
  };

  /**
   * Get all swaps for a token
   * GET /api/tokens/:mintAddress/swaps?timeWindow=60
   */
  getSwaps = async (req: Request, res: Response) => {
    try {
      const { mintAddress } = req.params;
      const timeWindow = parseInt(req.query.timeWindow as string) || 60;

      const swaps = this.swapService.getSwapsInWindow(mintAddress, timeWindow);

      res.json({
        tokenMint: mintAddress,
        timeWindowMinutes: timeWindow,
        totalSwaps: swaps.length,
        swaps,
      });
    } catch (error: any) {
      console.error('Error fetching swaps:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch swaps' });
    }
  };
}
