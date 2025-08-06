import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { WalletDeviceRepository } from '../services/repositories/walletDeviceRepository';
import { CustomerRepository } from '../services/repositories/customerRepository';
import { pushNotificationService } from '../services/pushNotification.service';
import { config } from '../config/app';
import { logger } from '../config/logger';
import { createResponse } from '../utils/response';
import { generatePass } from '../services/wallet.service';

/**
 * Apple Wallet Web Service Controller
 * Implements Apple's required endpoints for pass updates
 */
export class WalletController {
  private walletDeviceRepository: WalletDeviceRepository;
  private customerRepository: CustomerRepository;

  constructor() {
    this.walletDeviceRepository = new WalletDeviceRepository();
    this.customerRepository = new CustomerRepository();
  }

  /**
   * Register device for pass updates
   * POST /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber
   */
  registerDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;
      const { pushToken } = req.body;

      if (!pushToken) {
        res.status(400).json(createResponse(false, 'Push token is required'));
        return;
      }

      if (!deviceLibraryIdentifier || !passTypeIdentifier || !serialNumber) {
        res.status(400).json(createResponse(false, 'Missing required parameters'));
        return;
      }

      // Find customer by serial number (assuming serial number maps to customer ID)
      const customer = await this.customerRepository.findById(serialNumber);

      if (!customer) {
        res.status(404).json(createResponse(false, 'Pass not found'));
        return;
      }

      // Register or update device
      await this.walletDeviceRepository.registerDevice({
        customerId: new mongoose.Types.ObjectId(serialNumber),
        serialNumber,
        deviceLibraryIdentifier,
        pushToken,
        passTypeIdentifier,
      });

      logger.info('Device registered for pass updates', {
        deviceLibraryIdentifier: deviceLibraryIdentifier.substring(0, 8) + '...',
        passTypeIdentifier,
        serialNumber,
      });

      res.status(201).json(createResponse(true, 'Device registered successfully'));

    } catch (error) {
      logger.error('Error registering device', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params: req.params,
      });
      res.status(500).json(createResponse(false, 'Internal server error'));
    }
  };

  /**
   * Get serial numbers of passes that need updates
   * GET /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier
   */
  getUpdatablePasses = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceLibraryIdentifier, passTypeIdentifier } = req.params;
      const { passesUpdatedSince } = req.query;

      if (!deviceLibraryIdentifier || !passTypeIdentifier) {
        res.status(400).json(createResponse(false, 'Missing required parameters'));
        return;
      }

      let updatedSince: Date | undefined;
      if (passesUpdatedSince && typeof passesUpdatedSince === 'string') {
        updatedSince = new Date(parseInt(passesUpdatedSince));
      }

      const result = await this.walletDeviceRepository.getUpdatablePasses(
        deviceLibraryIdentifier,
        passTypeIdentifier,
        updatedSince
      );

      if (result.serialNumbers.length === 0) {
        res.status(204).send(); // No updates available
        return;
      }

      res.status(200).json({
        serialNumbers: result.serialNumbers,
        lastUpdated: result.lastUpdated,
      });

    } catch (error) {
      logger.error('Error getting updatable passes', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params: req.params,
        query: req.query,
      });
      res.status(500).json(createResponse(false, 'Internal server error'));
    }
  };

  /**
   * Get the latest version of a pass
   * GET /v1/passes/:passTypeIdentifier/:serialNumber
   */
  getLatestPass = async (req: Request, res: Response): Promise<void> => {
    try {
      const { passTypeIdentifier, serialNumber } = req.params;

      if (!passTypeIdentifier || !serialNumber) {
        res.status(400).json(createResponse(false, 'Missing required parameters'));
        return;
      }

      // Find customer by serial number
      const customerId = new mongoose.Types.ObjectId(serialNumber);
      const customer = await this.customerRepository.findById(customerId.toString());

      if (!customer) {
        res.status(404).json(createResponse(false, 'Pass not found'));
        return;
      }

      // Check if device is registered for this pass
      const device = await this.walletDeviceRepository.findBySerialNumber(
        serialNumber,
        passTypeIdentifier
      );

      if (!device) {
        res.status(404).json(createResponse(false, 'Pass not registered'));
        return;
      }

      // Generate updated pass
      const passBuffer = await generatePass(customer);

      // Set appropriate headers
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename="loyalty-card-${serialNumber}.pkpass"`);
      res.setHeader('Last-Modified', device.lastUpdated.toUTCString());

      logger.info('Latest pass served', {
        passTypeIdentifier,
        serialNumber,
        customerId: customer._id,
      });

      res.status(200).send(passBuffer);

    } catch (error) {
      logger.error('Error serving latest pass', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params: req.params,
      });
      res.status(500).json(createResponse(false, 'Internal server error'));
    }
  };

  /**
   * Unregister device from pass updates
   * DELETE /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber
   */
  unregisterDevice = async (req: Request, res: Response): Promise<void> => {
    try {
      const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;

      if (!deviceLibraryIdentifier || !passTypeIdentifier || !serialNumber) {
        res.status(400).json(createResponse(false, 'Missing required parameters'));
        return;
      }

      const success = await this.walletDeviceRepository.unregisterDevice(
        deviceLibraryIdentifier,
        serialNumber,
        passTypeIdentifier
      );

      if (!success) {
        res.status(404).json(createResponse(false, 'Registration not found'));
        return;
      }

      logger.info('Device unregistered from pass updates', {
        deviceLibraryIdentifier: deviceLibraryIdentifier.substring(0, 8) + '...',
        passTypeIdentifier,
        serialNumber,
      });

      res.status(200).json(createResponse(true, 'Device unregistered successfully'));

    } catch (error) {
      logger.error('Error unregistering device', {
        error: error instanceof Error ? error.message : 'Unknown error',
        params: req.params,
      });
      res.status(500).json(createResponse(false, 'Internal server error'));
    }
  };

  /**
   * Log errors from devices
   * POST /v1/log
   */
  logError = async (req: Request, res: Response): Promise<void> => {
    try {
      const { logs } = req.body;

      if (!logs || !Array.isArray(logs)) {
        res.status(400).json(createResponse(false, 'Invalid log format'));
        return;
      }

      // Log device errors
      logs.forEach((logEntry: any) => {
        logger.warn('Device error reported', {
          deviceLog: logEntry,
          timestamp: new Date().toISOString(),
        });
      });

      res.status(200).json(createResponse(true, 'Logs received'));

    } catch (error) {
      logger.error('Error processing device logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body,
      });
      res.status(500).json(createResponse(false, 'Internal server error'));
    }
  };

  /**
   * Send push notification to update passes for a customer
   */
  sendPassUpdateNotification = async (customerId: mongoose.Types.ObjectId): Promise<void> => {
    try {
      // Get push tokens for customer's active devices
      const pushTokens = await this.walletDeviceRepository.getPushTokensByCustomerId(customerId);

      if (pushTokens.length === 0) {
        logger.info('No active devices found for customer', { customerId });
        return;
      }

      // Mark passes as updated
      await this.walletDeviceRepository.markPassesAsUpdated(customerId);

      // Send push notifications
      const result = await pushNotificationService.sendBulkUpdateNotifications(pushTokens);

      logger.info('Pass update notifications sent', {
        customerId,
        totalDevices: pushTokens.length,
        successful: result.successful,
        failed: result.failed,
      });

    } catch (error) {
      logger.error('Error sending pass update notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
      });
    }
  };
}

export default WalletController;
