import { SwapService } from './swap.service';
import { HeliusService } from './helius.service';
import { TokenFlow } from '../types';

export class AggregationService {
  private swapService: SwapService;
  private heliusService: HeliusService;

  constructor(swapService: SwapService, heliusService: HeliusService) {
    this.swapService = swapService;
    this.heliusService = heliusService;
  }

  /**
   * Get aggregated flow data for a token
   * Shows where holders are swapping TO
   */
  async getTokenFlows(
    tokenMint: string,
    timeWindowMinutes: number = 60
  ): Promise<TokenFlow[]> {
    const swaps = this.swapService.getSwapsInWindow(tokenMint, timeWindowMinutes);

    if (swaps.length === 0) {
      return [];
    }

    // Group swaps by destination token
    const flowMap = new Map<string, {
      wallets: Set<string>;
      topHolderWallets: Set<string>;
      swaps: typeof swaps;
      totalVolume: number;
      weightedScore: number;
    }>();

    for (const swap of swaps) {
      const destToken = swap.destinationToken;

      if (!flowMap.has(destToken)) {
        flowMap.set(destToken, {
          wallets: new Set(),
          topHolderWallets: new Set(),
          swaps: [],
          totalVolume: 0,
          weightedScore: 0,
        });
      }

      const flow = flowMap.get(destToken)!;
      flow.wallets.add(swap.wallet);
      flow.swaps.push(swap);
      flow.totalVolume += swap.amountOut;

      // Track top holder separately and apply 5x weight
      if (swap.isTopHolder) {
        flow.topHolderWallets.add(swap.wallet);
        flow.weightedScore += 5; // 5x weight for top holders
      } else {
        flow.weightedScore += 1; // 1x weight for regular holders
      }
    }

    // Convert to TokenFlow array and fetch metadata
    const flows: TokenFlow[] = [];

    for (const [tokenMint, data] of flowMap) {
      // Fetch token metadata
      const metadata = await this.heliusService.getTokenMetadata(tokenMint);

      flows.push({
        tokenMint,
        tokenSymbol: metadata.symbol,
        uniqueWallets: data.wallets.size,
        topHolderCount: data.topHolderWallets.size,
        totalSwaps: data.swaps.length,
        totalVolume: data.totalVolume,
        weightedScore: data.weightedScore,
        recentSwaps: data.swaps.slice(0, 5), // Include last 5 swaps
      });
    }

    // Sort by weighted score (top holders count 5x more)
    flows.sort((a, b) => b.weightedScore - a.weightedScore);

    return flows;
  }

  /**
   * Get summary stats for a tracked token
   */
  getTokenStats(tokenMint: string, timeWindowMinutes: number = 60) {
    const swaps = this.swapService.getSwapsInWindow(tokenMint, timeWindowMinutes);

    const uniqueDestinations = new Set(swaps.map((s) => s.destinationToken));
    const uniqueWallets = new Set(swaps.map((s) => s.wallet));

    return {
      totalSwaps: swaps.length,
      uniqueDestinations: uniqueDestinations.size,
      uniqueWallets: uniqueWallets.size,
      timeWindowMinutes,
    };
  }
}
