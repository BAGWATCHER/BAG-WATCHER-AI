export interface TokenHolder {
  address: string;
  balance: number;
  uiBalance: number;
}

export interface SwapTransaction {
  signature: string;
  wallet: string;
  sourceToken: string;
  destinationToken: string;
  amountIn: number;
  amountOut: number;
  timestamp: number;
  isTopHolder?: boolean; // Flag for top 20 holders
}

export interface TokenFlow {
  tokenMint: string;
  tokenSymbol?: string;
  uniqueWallets: number;
  topHolderCount?: number; // Number of top 20 holders who swapped
  totalSwaps: number;
  totalVolume: number;
  weightedScore?: number; // Weighted score (top holders count 5x)
  recentSwaps: SwapTransaction[];
}

export interface HeliusTransaction {
  signature: string;
  timestamp: number;
  type: string;
  source: string;
  feePayer: string;
  tokenTransfers?: Array<{
    fromUserAccount: string;
    toUserAccount: string;
    fromTokenAccount: string;
    toTokenAccount: string;
    tokenAmount: number;
    mint: string;
    tokenStandard: string;
  }>;
  swap?: {
    tokenInputs: Array<{
      mint: string;
      amount: string;
      tokenAccount: string;
    }>;
    tokenOutputs: Array<{
      mint: string;
      amount: string;
      tokenAccount: string;
    }>;
    programId: string;
  };
}
