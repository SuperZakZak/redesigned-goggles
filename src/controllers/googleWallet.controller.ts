import { Request, Response } from 'express';
import { walletService } from '../services/wallet.service';
import { googleWalletService } from '../services/googleWallet.service';
import { CustomerRepository } from '../services/repositories/customerRepository';
import { logger } from '../config/logger';
import { createResponse, sendError } from '../utils/response';
import Joi from 'joi';

// Create repository instance
const customerRepository = new CustomerRepository();

/**
 * Google Wallet Controller
 * Handles Google Wallet related API endpoints
 */
export class GoogleWalletController {
  /**
   * Create Google Wallet pass for customer
   * POST /api/v1/google-wallet/passes
   */
  async createPass(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const schema = Joi.object({
        customerId: Joi.string().required(),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        sendError(res, error.details[0]?.message || 'Validation error', 400);
        return;
      }

      const { customerId } = value;

      // Get customer
      const customer = await customerRepository.findById(customerId);
      if (!customer) {
        sendError(res, 'Customer not found', 404);
        return;
      }

      // Create Google Wallet pass
      await walletService.createGoogleWalletPass(customer);

      logger.info('Google Wallet pass created via API', {
        customerId: customerId,
        customerName: customer.name,
      });

      res.status(201).json(createResponse(true, 'Google Wallet pass created successfully', {
        customerId: customerId,
        customerName: customer.name,
      }));

    } catch (error) {
      logger.error('Failed to create Google Wallet pass via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body,
      });

      sendError(res, 'Failed to create Google Wallet pass', 500);
    }
  }

  /**
   * Generate "Add to Google Wallet" link
   * GET /api/v1/google-wallet/passes/:customerId/link
   */
  async generateAddToWalletLink(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      // Check if customer exists
      const customer = await customerRepository.findById(customerId);
      if (!customer) {
        sendError(res, 'Customer not found', 404);
        return;
      }

      // Generate add to wallet link
      const link = walletService.generateGoogleWalletLink(customerId);

      logger.info('Google Wallet link generated via API', {
        customerId: customerId,
      });

      res.status(200).json(createResponse(true, 'Add to Google Wallet link generated successfully', {
        customerId: customerId,
        addToWalletUrl: link.saveUrl,
      }));

    } catch (error) {
      logger.error('Failed to generate Google Wallet link via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: req.params.customerId,
      });

      sendError(res, 'Failed to generate add to wallet link', 500);
    }
  }

  /**
   * Update Google Wallet pass balance
   * PUT /api/v1/google-wallet/passes/:customerId/balance
   */
  async updateBalance(req: Request, res: Response): Promise<void> {
    try {
      const { customerId } = req.params;

      if (!customerId) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      // Validate request
      const schema = Joi.object({
        balance: Joi.number().min(0).required(),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        sendError(res, error.details[0]?.message || 'Validation error', 400);
        return;
      }

      const { balance } = value;

      // Check if customer exists
      const customer = await customerRepository.findById(customerId);
      if (!customer) {
        sendError(res, 'Customer not found', 404);
        return;
      }

      // Update Google Wallet balance
      await walletService.updateGoogleWalletBalance(customerId, balance);

      logger.info('Google Wallet balance updated via API', {
        customerId: customerId,
        newBalance: balance,
      });

      res.status(200).json(createResponse(true, 'Google Wallet balance updated successfully', {
        customerId: customerId,
        newBalance: balance,
      }));

    } catch (error) {
      logger.error('Failed to update Google Wallet balance via API', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: req.params.customerId,
        body: req.body,
      });

      sendError(res, 'Failed to update Google Wallet balance', 500);
    }
  }

  /**
   * Handle Google Wallet webhook
   * POST /api/v1/google-wallet/webhook
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;

      // Basic validation
      if (!payload.eventType || !payload.objectId) {
        sendError(res, 'Invalid webhook payload', 400);
        return;
      }

      // Handle webhook
      await googleWalletService.handleWebhook(payload);

      logger.info('Google Wallet webhook processed successfully', {
        eventType: payload.eventType,
        objectId: payload.objectId,
      });

      res.status(200).json(createResponse(true, 'Webhook processed successfully'));

    } catch (error) {
      logger.error('Failed to process Google Wallet webhook', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body,
      });

      sendError(res, 'Failed to process webhook', 500);
    }
  }

  /**
   * Get Google Wallet service status
   * GET /api/v1/google-wallet/status
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const isConfigured = googleWalletService.isConfigured();

      res.status(200).json(createResponse(true, 'Google Wallet service status', {
        configured: isConfigured,
        ready: isConfigured,
      }));

    } catch (error) {
      logger.error('Failed to get Google Wallet status', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      sendError(res, 'Failed to get service status', 500);
    }
  }
}

// Export singleton instance
export const googleWalletController = new GoogleWalletController();
