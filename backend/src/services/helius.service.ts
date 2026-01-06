import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { TokenHolder, HeliusTransaction } from '../types';
import { KNOWN_MAJOR_TOKENS, MIN_HOLDER_BALANCE } from '../utils/constants';

export class HeliusService {
  private apiKey: string;
  private rpcUrl: string;
  private connection: Connection;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.HELIUS_API_KEY || '';
    this.rpcUrl = process.env.HELIUS_RPC_URL || '';
    this.connection = new Connection(this.rpcUrl, 'confirmed');
    this.baseUrl = `https://api.helius.xyz/v0`;
  }

  /**
   * Get all token holders for a given token mint
   */
  async getTokenHolders(tokenMint: string): Promise<TokenHolder[]> {
    try {
      console.log(`Fetching holders for token: ${tokenMint}`);

      const mintPubkey = new PublicKey(tokenMint);
      const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
      const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

      console.log('Fetching token accounts via RPC...');

      // Try both token programs
      let accounts = await this.connection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID,
        {
          filters: [
            {
              dataSize: 165,
            },
            {
              memcmp: {
                offset: 0,
                bytes: mintPubkey.toBase58(),
              },
            },
          ],
        }
      );

      console.log(`Standard Token Program: ${accounts.length} accounts`);

      // If no accounts found, try Token-2022 program
      if (accounts.length === 0) {
        console.log('Trying Token-2022 program...');
        accounts = await this.connection.getParsedProgramAccounts(
          TOKEN_2022_PROGRAM_ID,
          {
            filters: [
              {
                memcmp: {
                  offset: 0,
                  bytes: mintPubkey.toBase58(),
                },
              },
            ],
          }
        );
        console.log(`Token-2022 Program: ${accounts.length} accounts`);
      }

      const holders: TokenHolder[] = [];
      const holderMap = new Map<string, TokenHolder>();

      for (const account of accounts) {
        const parsedInfo = (account.account.data as any).parsed?.info;
        if (parsedInfo) {
          // Verify this is the correct mint
          if (parsedInfo.mint !== tokenMint) {
            continue;
          }

          const balance = parsedInfo.tokenAmount?.amount;
          const uiBalance = parsedInfo.tokenAmount?.uiAmount;
          const owner = parsedInfo.owner;

          if (balance && uiBalance != null && owner) {
            // Filter out accounts with dust amounts
            if (uiBalance >= MIN_HOLDER_BALANCE) {
              // Aggregate by owner (same person might have multiple token accounts)
              if (holderMap.has(owner)) {
                const existing = holderMap.get(owner)!;
                existing.balance += parseInt(balance);
                existing.uiBalance += uiBalance;
              } else {
                holderMap.set(owner, {
                  address: owner,
                  balance: parseInt(balance),
                  uiBalance: uiBalance,
                });
              }
            }
          }
        }
      }

      // Convert map to array
      for (const holder of holderMap.values()) {
        holders.push(holder);
      }

      console.log(`Found ${holders.length} unique holders with balance >= ${MIN_HOLDER_BALANCE}`);
      return holders;
    } catch (error) {
      console.error('Error fetching token holders:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions for a wallet address using Helius Enhanced Transactions API
   */
  async getWalletTransactions(
    walletAddress: string,
    limit: number = 100
  ): Promise<HeliusTransaction[]> {
    try {
      const url = `${this.baseUrl}/addresses/${walletAddress}/transactions`;

      const response = await axios.get(url, {
        params: {
          'api-key': this.apiKey,
          limit: limit,
        },
      });

      return response.data || [];
    } catch (error) {
      console.error(`Error fetching transactions for ${walletAddress}:`, error);
      return [];
    }
  }

  /**
   * Parse a transaction to extract swap information
   */
  parseSwapTransaction(tx: HeliusTransaction): {
    sourceToken: string;
    destinationToken: string;
    amountIn: number;
    amountOut: number;
  } | null {
    try {
      // Check if this is a swap transaction
      if (tx.type !== 'SWAP' && !tx.swap) {
        return null;
      }

      // If we have enhanced swap data
      if (tx.swap) {
        const tokenIn = tx.swap.tokenInputs[0];
        const tokenOut = tx.swap.tokenOutputs[0];

        if (!tokenIn || !tokenOut) {
          return null;
        }

        return {
          sourceToken: tokenIn.mint,
          destinationToken: tokenOut.mint,
          amountIn: parseFloat(tokenIn.amount),
          amountOut: parseFloat(tokenOut.amount),
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing swap transaction:', error);
      return null;
    }
  }

  /**
   * Check if a token is a major token (SOL, USDC, etc.) that we should filter out
   */
  isMajorToken(tokenMint: string): boolean {
    return KNOWN_MAJOR_TOKENS.has(tokenMint);
  }

  /**
   * Get token metadata using Helius DAS API
   */
  async getTokenMetadata(tokenMint: string): Promise<{ name?: string; symbol?: string; logoUrl?: string }> {
    try {
      // Use DAS API to get asset info
      const response = await axios.post(
        this.rpcUrl,
        {
          jsonrpc: '2.0',
          id: 'token-metadata',
          method: 'getAsset',
          params: {
            id: tokenMint,
          },
        }
      );

      const data = response.data?.result;

      return {
        name: data?.content?.metadata?.name || undefined,
        symbol: data?.content?.metadata?.symbol || undefined,
        logoUrl: data?.content?.links?.image || undefined,
      };
    } catch (error) {
      console.error(`Error fetching metadata for ${tokenMint}:`, error);
      return {};
    }
  }
}
