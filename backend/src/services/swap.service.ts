import { HeliusService } from './helius.service';
import { SwapTransaction, TokenHolder } from '../types';

export class SwapService {
  private heliusService: HeliusService;
  private swapCache: Map<string, SwapTransaction[]>; // tokenMint -> swaps
  private pollingIntervals: Map<string, NodeJS.Timeout>; // tokenMint -> interval

  constructor(heliusService: HeliusService) {
    this.heliusService = heliusService;
    this.swapCache = new Map();
    this.pollingIntervals = new Map();
  }

  /**
   * Start monitoring a token for swaps
   */
  async startMonitoring(tokenMint: string): Promise<void> {
    // Don't start if already monitoring
    if (this.pollingIntervals.has(tokenMint)) {
      console.log(`Already monitoring ${tokenMint}`);
      return;
    }

    console.log(`Starting to monitor ${tokenMint}`);

    // Initialize swap cache for this token
    this.swapCache.set(tokenMint, []);

    // Get initial holders
    const holders = await this.heliusService.getTokenHolders(tokenMint);
    console.log(`Monitoring ${holders.length} holders for ${tokenMint}`);

    // For MVP, we'll monitor top 100 holders to avoid rate limits
    const topHolders = holders
      .sort((a, b) => b.uiBalance - a.uiBalance)
      .slice(0, 100);

    // Start polling for swaps
    const interval = setInterval(async () => {
      await this.checkForSwaps(tokenMint, topHolders);
    }, 15000); // Check every 15 seconds

    this.pollingIntervals.set(tokenMint, interval);

    // Do initial check immediately
    await this.checkForSwaps(tokenMint, topHolders);
  }

  /**
   * Stop monitoring a token
   */
  stopMonitoring(tokenMint: string): void {
    const interval = this.pollingIntervals.get(tokenMint);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(tokenMint);
      console.log(`Stopped monitoring ${tokenMint}`);
    }
  }

  /**
   * Check for new swaps from holders
   */
  private async checkForSwaps(
    tokenMint: string,
    holders: TokenHolder[]
  ): Promise<void> {
    console.log(`Checking for swaps from ${holders.length} holders of ${tokenMint}`);

    const existingSwaps = this.swapCache.get(tokenMint) || [];
    const newSwaps: SwapTransaction[] = [];

    // Check recent transactions for each holder (in batches to avoid rate limits)
    const batchSize = 5;
    for (let i = 0; i < holders.length; i += batchSize) {
      const batch = holders.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (holder) => {
          try {
            const transactions = await this.heliusService.getWalletTransactions(
              holder.address,
              10 // Only check last 10 transactions
            );

            for (const tx of transactions) {
              // Skip if we've already seen this transaction
              if (existingSwaps.some((s) => s.signature === tx.signature)) {
                continue;
              }

              const swapData = this.heliusService.parseSwapTransaction(tx);
              if (!swapData) continue;

              const { sourceToken, destinationToken, amountIn, amountOut } = swapData;

              // Check if this is a swap FROM our tracked token
              if (sourceToken !== tokenMint) continue;

              // Filter out swaps TO major tokens (SOL, USDC, etc.)
              if (this.heliusService.isMajorToken(destinationToken)) {
                console.log(`Skipping swap to major token: ${destinationToken}`);
                continue;
              }

              // This is a memecoin -> memecoin swap!
              const swap: SwapTransaction = {
                signature: tx.signature,
                wallet: holder.address,
                sourceToken,
                destinationToken,
                amountIn,
                amountOut,
                timestamp: tx.timestamp,
              };

              newSwaps.push(swap);
              console.log(
                `Found swap: ${sourceToken.slice(0, 8)}... -> ${destinationToken.slice(0, 8)}... by ${holder.address.slice(0, 8)}...`
              );
            }
          } catch (error) {
            console.error(`Error checking holder ${holder.address}:`, error);
          }
        })
      );

      // Small delay between batches to avoid rate limits
      if (i + batchSize < holders.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Add new swaps to cache
    if (newSwaps.length > 0) {
      const allSwaps = [...existingSwaps, ...newSwaps];
      // Keep only swaps from last 24 hours
      const oneDayAgo = Date.now() / 1000 - 86400;
      const recentSwaps = allSwaps.filter((s) => s.timestamp > oneDayAgo);

      this.swapCache.set(tokenMint, recentSwaps);
      console.log(`Total swaps cached for ${tokenMint}: ${recentSwaps.length}`);
    }
  }

  /**
   * Get all swaps for a token
   */
  getSwaps(tokenMint: string): SwapTransaction[] {
    return this.swapCache.get(tokenMint) || [];
  }

  /**
   * Get swaps within a time window
   */
  getSwapsInWindow(tokenMint: string, windowMinutes: number): SwapTransaction[] {
    const allSwaps = this.getSwaps(tokenMint);
    const cutoffTime = Date.now() / 1000 - windowMinutes * 60;
    return allSwaps.filter((s) => s.timestamp > cutoffTime);
  }

  /**
   * Check if a token is being monitored
   */
  isMonitoring(tokenMint: string): boolean {
    return this.pollingIntervals.has(tokenMint);
  }

  /**
   * Get all monitored tokens
   */
  getMonitoredTokens(): string[] {
    return Array.from(this.pollingIntervals.keys());
  }

  /**
   * Clear all monitoring
   */
  clearAll(): void {
    for (const [tokenMint] of this.pollingIntervals) {
      this.stopMonitoring(tokenMint);
    }
    this.swapCache.clear();
  }
}
