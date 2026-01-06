import { Request, Response } from 'express';
import { SwapServiceV2 } from '../services/swap.service.v2';
import { WebhookTransaction } from '../services/webhook.service';

export class WebhookController {
  private swapService: SwapServiceV2;

  constructor(swapService: SwapServiceV2) {
    this.swapService = swapService;
  }

  /**
   * Handle incoming Helius webhook
   */
  handleHeliusWebhook = async (req: Request, res: Response) => {
    try {
      // Helius sends an array of transactions
      const transactions: WebhookTransaction[] = req.body;

      if (!Array.isArray(transactions)) {
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }

      console.log(`Received ${transactions.length} transactions from webhook`);

      // Process each transaction
      for (const transaction of transactions) {
        // Find which token this transaction is related to
        const monitoredTokens = this.swapService.getMonitoredTokens();

        for (const tokenMint of monitoredTokens) {
          // Get holders for this token
          const holders = this.swapService.getHolders(tokenMint);
          const holderAddresses = new Set(holders.map(h => h.address));

          // Check if transaction is from one of our monitored holders
          if (holderAddresses.has(transaction.feePayer)) {
            await this.swapService.handleWebhookTransaction(tokenMint, transaction);
            break; // Transaction processed, move to next
          }
        }
      }

      // Acknowledge receipt
      res.status(200).json({ success: true, processed: transactions.length });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Test endpoint to verify webhook is accessible
   */
  testWebhook = async (req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message: 'Webhook endpoint is accessible',
      timestamp: new Date().toISOString(),
    });
  };
}
