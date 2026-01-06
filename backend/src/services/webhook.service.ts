import axios from 'axios';
import crypto from 'crypto';

export interface HeliusWebhook {
  webhookID: string;
  wallet: string;
  webhookURL: string;
  transactionTypes: string[];
  accountAddresses: string[];
  webhookType: string;
  authHeader?: string;
}

export interface WebhookTransaction {
  signature: string;
  timestamp: number;
  type: string;
  feePayer: string;
  fee: number;
  slot: number;
  source: string;
  nativeTransfers?: any[];
  tokenTransfers?: any[];
  accountData?: any[];
  events?: {
    swap?: {
      nativeInput?: { account: string; amount: string };
      nativeOutput?: { account: string; amount: string };
      tokenInputs?: Array<{ mint: string; amount: string; tokenAccount: string; userAccount: string }>;
      tokenOutputs?: Array<{ mint: string; amount: string; tokenAccount: string; userAccount: string }>;
    };
  };
}

export class WebhookService {
  private apiKey: string;
  private baseUrl: string;
  private webhookBaseUrl: string;
  private webhooks: Map<string, HeliusWebhook>; // tokenMint -> webhook

  constructor() {
    this.apiKey = process.env.HELIUS_API_KEY || '';
    this.baseUrl = 'https://api.helius.xyz/v0';
    this.webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    this.webhooks = new Map();
  }

  /**
   * Create a webhook to monitor addresses for swap transactions
   */
  async createWebhook(
    tokenMint: string,
    addresses: string[]
  ): Promise<HeliusWebhook> {
    try {
      console.log(`Creating webhook for ${addresses.length} addresses`);

      const webhookUrl = `${this.webhookBaseUrl}/api/webhooks/helius`;

      // Helius supports up to 100,000 addresses per webhook
      const response = await axios.post(
        `${this.baseUrl}/webhooks?api-key=${this.apiKey}`,
        {
          webhookURL: webhookUrl,
          transactionTypes: ['SWAP'], // Only listen for swap transactions
          accountAddresses: addresses,
          webhookType: 'enhanced', // Use enhanced webhooks for parsed transaction data
          txnStatus: 'all', // Get both success and failed transactions
        }
      );

      const webhook: HeliusWebhook = response.data;
      this.webhooks.set(tokenMint, webhook);

      console.log(`Created webhook ${webhook.webhookID} for token ${tokenMint}`);
      return webhook;
    } catch (error: any) {
      console.error('Error creating webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update an existing webhook with new addresses
   */
  async updateWebhook(
    webhookId: string,
    addresses: string[]
  ): Promise<HeliusWebhook> {
    try {
      console.log(`Updating webhook ${webhookId} with ${addresses.length} addresses`);

      const response = await axios.put(
        `${this.baseUrl}/webhooks/${webhookId}?api-key=${this.apiKey}`,
        {
          accountAddresses: addresses,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error updating webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/webhooks/${webhookId}?api-key=${this.apiKey}`
      );
      console.log(`Deleted webhook ${webhookId}`);
    } catch (error: any) {
      console.error('Error deleting webhook:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get all webhooks
   */
  async getAllWebhooks(): Promise<HeliusWebhook[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/webhooks?api-key=${this.apiKey}`
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching webhooks:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get webhook for a specific token
   */
  getWebhook(tokenMint: string): HeliusWebhook | undefined {
    return this.webhooks.get(tokenMint);
  }

  /**
   * Parse swap data from webhook transaction
   */
  parseWebhookSwap(transaction: WebhookTransaction): {
    sourceToken: string;
    destinationToken: string;
    amountIn: number;
    amountOut: number;
    wallet: string;
  } | null {
    try {
      if (!transaction.events?.swap) {
        return null;
      }

      const swap = transaction.events.swap;

      // Handle token swaps
      if (swap.tokenInputs && swap.tokenInputs.length > 0 &&
          swap.tokenOutputs && swap.tokenOutputs.length > 0) {

        const tokenIn = swap.tokenInputs[0];
        const tokenOut = swap.tokenOutputs[0];

        return {
          sourceToken: tokenIn.mint,
          destinationToken: tokenOut.mint,
          amountIn: parseFloat(tokenIn.amount),
          amountOut: parseFloat(tokenOut.amount),
          wallet: tokenIn.userAccount,
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing webhook swap:', error);
      return null;
    }
  }

  /**
   * Verify webhook signature (if using auth)
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    return signature === expectedSignature;
  }

  /**
   * Clean up - delete all webhooks
   */
  async cleanup(): Promise<void> {
    const webhooks = await this.getAllWebhooks();
    for (const webhook of webhooks) {
      await this.deleteWebhook(webhook.webhookID);
    }
    this.webhooks.clear();
  }
}
