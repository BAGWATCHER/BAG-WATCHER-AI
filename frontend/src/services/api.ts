import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TokenFlow {
  tokenMint: string;
  tokenSymbol?: string;
  uniqueWallets: number;
  totalSwaps: number;
  totalVolume: number;
  recentSwaps: SwapTransaction[];
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

export interface FlowsResponse {
  tokenMint: string;
  timeWindowMinutes: number;
  stats: {
    totalSwaps: number;
    uniqueDestinations: number;
    uniqueWallets: number;
    timeWindowMinutes: number;
  };
  flows: TokenFlow[];
}

export interface TrackTokenResponse {
  success: boolean;
  tokenMint: string;
  tokenSymbol?: string;
  tokenName?: string;
  holderCount: number;
  message: string;
}

export const trackToken = async (mintAddress: string): Promise<TrackTokenResponse> => {
  const response = await api.post('/api/tokens/track', { mintAddress });
  return response.data;
};

export const untrackToken = async (mintAddress: string): Promise<void> => {
  await api.delete(`/api/tokens/${mintAddress}/untrack`);
};

export const getTokenFlows = async (
  mintAddress: string,
  timeWindow: number = 60
): Promise<FlowsResponse> => {
  const response = await api.get(`/api/tokens/${mintAddress}/flows`, {
    params: { timeWindow },
  });
  return response.data;
};

export const getTokenSwaps = async (
  mintAddress: string,
  timeWindow: number = 60
): Promise<{ swaps: SwapTransaction[]; totalSwaps: number }> => {
  const response = await api.get(`/api/tokens/${mintAddress}/swaps`, {
    params: { timeWindow },
  });
  return response.data;
};

export interface HolderData {
  address: string;
  balance: number;
  uiBalance: number;
}

export interface HoldersResponse {
  tokenMint: string;
  holderCount: number;
  topHolders: HolderData[];
  totalSupplyHeld: number;
}

export interface MonitoringStatus {
  tokenMint: string;
  isMonitoring: boolean;
  totalSwapsDetected: number;
  oldestSwap: number | null;
  newestSwap: number | null;
  monitoringDuration: string;
}

export const getTokenHolders = async (mintAddress: string): Promise<HoldersResponse> => {
  const response = await api.get(`/api/tokens/${mintAddress}/holders`);
  return response.data;
};

export const getMonitoringStatus = async (mintAddress: string): Promise<MonitoringStatus> => {
  const response = await api.get(`/api/tokens/${mintAddress}/status`);
  return response.data;
};
