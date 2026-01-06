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
}

export interface TokenFlow {
  tokenMint: string;
  tokenSymbol?: string;
  uniqueWallets: number;
  totalSwaps: number;
  totalVolume: number;
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
