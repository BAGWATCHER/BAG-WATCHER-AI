import { HeliusService } from './helius.service';
import { WebhookService, WebhookTransaction } from './webhook.service';
import { SwapTransaction, TokenHolder } from '../types';

export class SwapServiceV2 {
  private heliusService: HeliusService;
  private webhookService: WebhookService;
  private swapCache: Map<string, SwapTransaction[]>; // tokenMint -> swaps
  private holderCache: Map<string, TokenHolder[]>; // tokenMint -> holders
  private webhookIds: Map<string, string>; // tokenMint -> webhookId

  constructor(heliusService: HeliusService, webhookService: WebhookService) {
    this.heliusService = heliusService;
    this.webhookService = webhookService;
    this.swapCache = new Map();
    this.holderCache = new Map();
    this.webhookIds = new Map();
  }

  /**
   * Start monitoring a token for swaps using webhooks
   */
  async startMonitoring(tokenMint: string): Promise<void> {
    console.log(`Starting webhook monitoring for ${tokenMint}`);

    // Initialize swap cache
    this.swapCache.set(tokenMint, []);

    // Get all holders
    const holders = await this.heliusService.getTokenHolders(tokenMint);
    console.log(`Found ${holders.length} holders for ${tokenMint}`);

    // Cache holders
    this.holderCache.set(tokenMint, holders);

    // Extract wallet addresses
    const addresses = holders.map(h => h.address);

    // Create webhook to monitor all holder addresses
    // Helius supports up to 100,000 addresses per webhook
    const maxAddresses = 100000;
    const addressesToMonitor = addresses.slice(0, maxAddresses);

    if (addresses.length > maxAddresses) {
      console.warn(
        `Token has ${addresses.length} holders, monitoring first ${maxAddresses}`
      );
    }

    try {
      const webhook = await this.webhookService.createWebhook(
        tokenMint,
        addressesToMonitor
      );
      this.webhookIds.set(tokenMint, webhook.webhookID);
      console.log(
        `Webhook ${webhook.webhookID} monitoring ${addressesToMonitor.length} addresses`
      );
    } catch (error) {
      console.error(`Failed to create webhook for ${tokenMint}:`, error);
      throw error;
    }

    // Skip historical data fetch to avoid rate limits
    // Webhooks will catch all new swaps in real-time
    console.log('Skipping historical data fetch - webhooks will track all new swaps');

    // Optionally fetch a small sample for testing
    // await this.fetchHistoricalSwaps(tokenMint, holders);
  }

  /**
   * Fetch historical swap transactions for holders
   */
  private async fetchHistoricalSwaps(
    tokenMint: string,
    holders: TokenHolder[]
  ): Promise<void> {
    console.log(`Fetching historical swaps for ${tokenMint}...`);

    const swaps: SwapTransaction[] = [];
    const oneDayAgo = Date.now() / 1000 - 86400;

    // Sample top 50 holders for historical data to avoid rate limits
    const topHolders = holders
      .sort((a, b) => b.uiBalance - a.uiBalance)
      .slice(0, 50);

    console.log(`Checking historical transactions for top ${topHolders.length} holders`);

    // Process in smaller batches with longer delays
    const batchSize = 5;
    for (let i = 0; i < topHolders.length; i += batchSize) {
      const batch = topHolders.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (holder) => {
          try {
            const transactions = await this.heliusService.getWalletTransactions(
              holder.address,
              20 // Reduced to avoid rate limits
            );

            for (const tx of transactions) {
              // Only process transactions from last 24 hours
              if (tx.timestamp < oneDayAgo) continue;

              const swapData = this.heliusService.parseSwapTransaction(tx);
              if (!swapData) continue;

              const { sourceToken, destinationToken, amountIn, amountOut } = swapData;

              // Check if this is a swap FROM our tracked token
              if (sourceToken !== tokenMint) continue;

              // Filter out swaps TO major tokens
              if (this.heliusService.isMajorToken(destinationToken)) continue;

              const swap: SwapTransaction = {
                signature: tx.signature,
                wallet: holder.address,
                sourceToken,
                destinationToken,
                amountIn,
                amountOut,
                timestamp: tx.timestamp,
              };

              swaps.push(swap);
            }
          } catch (error: any) {
            // Silently handle rate limit errors during historical fetch
            if (error.response?.status !== 502) {
              console.error(`Error fetching history for ${holder.address}:`, error.message);
            }
          }
        })
      );

      // Longer delay between batches to avoid rate limits
      if (i + batchSize < topHolders.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (swaps.length > 0) {
      console.log(`Found ${swaps.length} historical swaps for ${tokenMint}`);
      const existingSwaps = this.swapCache.get(tokenMint) || [];
      this.swapCache.set(tokenMint, [...existingSwaps, ...swaps]);
    }
  }

  /**
   * Handle incoming webhook transaction
   */
  async handleWebhookTransaction(
    tokenMint: string,
    transaction: WebhookTransaction
  ): Promise<void> {
    const swapData = this.webhookService.parseWebhookSwap(transaction);
    if (!swapData) return;

    const { sourceToken, destinationToken, amountIn, amountOut, wallet } = swapData;

    // Check if this is a swap FROM our tracked token
    if (sourceToken !== tokenMint) return;

    // Filter out swaps TO major tokens
    if (this.heliusService.isMajorToken(destinationToken)) {
      console.log(`Skipping swap to major token: ${destinationToken}`);
      return;
    }

    // This is a memecoin -> memecoin swap!
    const swap: SwapTransaction = {
      signature: transaction.signature,
      wallet,
      sourceToken,
      destinationToken,
      amountIn,
      amountOut,
      timestamp: transaction.timestamp,
    };

    // Add to cache
    const existingSwaps = this.swapCache.get(tokenMint) || [];

    // Check if we already have this swap
    if (existingSwaps.some(s => s.signature === swap.signature)) {
      return;
    }

    existingSwaps.push(swap);

    // Keep only swaps from last 24 hours
    const oneDayAgo = Date.now() / 1000 - 86400;
    const recentSwaps = existingSwaps.filter(s => s.timestamp > oneDayAgo);

    this.swapCache.set(tokenMint, recentSwaps);

    console.log(
      `🔥 NEW SWAP: ${wallet.slice(0, 8)}... swapped ${sourceToken.slice(0, 8)}... -> ${destinationToken.slice(0, 8)}...`
    );
    console.log(`Total swaps for ${tokenMint}: ${recentSwaps.length}`);
  }

  /**
   * Stop monitoring a token
   */
  async stopMonitoring(tokenMint: string): Promise<void> {
    const webhookId = this.webhookIds.get(tokenMint);
    if (webhookId) {
      try {
        await this.webhookService.deleteWebhook(webhookId);
        this.webhookIds.delete(tokenMint);
        console.log(`Stopped monitoring ${tokenMint}`);
      } catch (error) {
        console.error(`Error stopping monitoring for ${tokenMint}:`, error);
      }
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
    return allSwaps.filter(s => s.timestamp > cutoffTime);
  }

  /**
   * Get holders for a token
   */
  getHolders(tokenMint: string): TokenHolder[] {
    return this.holderCache.get(tokenMint) || [];
  }

  /**
   * Check if monitoring a token
   */
  isMonitoring(tokenMint: string): boolean {
    return this.webhookIds.has(tokenMint);
  }

  /**
   * Get all monitored tokens
   */
  getMonitoredTokens(): string[] {
    return Array.from(this.webhookIds.keys());
  }

  /**
   * Clean up all webhooks
   */
  async clearAll(): Promise<void> {
    const tokens = this.getMonitoredTokens();
    for (const token of tokens) {
      await this.stopMonitoring(token);
    }
    this.swapCache.clear();
    this.holderCache.clear();
  }
}
