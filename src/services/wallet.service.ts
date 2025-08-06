import { ICustomer } from '../models/customer';
import { passService } from './pass.service';
import { googleWalletService } from './googleWallet.service';
import { logger } from '../config/logger';
import { GoogleWalletPassData, GoogleWalletAddToWalletLink } from '../types/googleWallet';

/**
 * Wallet Service for Apple Wallet and Google Wallet integration
 */
export class WalletService {
  /**
   * Generate Apple Wallet pass for a customer
   */
  async generateApplePass(customer: ICustomer): Promise<Buffer> {
    try {
      // Ensure pass service is initialized
      await passService.initialize();

      // Prepare pass data
      const passData = {
        serialNumber: customer._id.toString(),
        name: customer.name,
        balance: customer.balance,
        level: 'Bronze', // Default loyalty level - can be enhanced later
      };

      // Generate pass buffer
      const passBuffer = await passService.generateApplePass(passData);

      logger.info('Apple Wallet pass generated successfully', {
        customerId: customer._id,
        customerName: passData.name,
        balance: passData.balance,
      });

      return passBuffer;

    } catch (error) {
      logger.error('Failed to generate Apple Wallet pass', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: customer._id,
      });
      throw error;
    }
  }

  /**
   * Create Google Wallet loyalty object for a customer
   */
  async createGoogleWalletPass(customer: ICustomer): Promise<void> {
    try {
      // Ensure Google Wallet service is initialized
      await googleWalletService.initialize();

      // Prepare pass data
      const passData: GoogleWalletPassData = {
        customerId: customer._id.toString(),
        customerName: customer.name,
        balance: customer.balance,
        level: 'Bronze', // Default loyalty level - can be enhanced later
        qrCode: customer._id.toString(),
      };

      // Create loyalty object
      await googleWalletService.createLoyaltyObject(passData);

      logger.info('Google Wallet pass created successfully', {
        customerId: customer._id,
        customerName: passData.customerName,
        balance: passData.balance,
      });

    } catch (error) {
      logger.error('Failed to create Google Wallet pass', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: customer._id,
      });
      throw error;
    }
  }

  /**
   * Update Google Wallet pass balance
   */
  async updateGoogleWalletBalance(customerId: string, newBalance: number): Promise<void> {
    try {
      await googleWalletService.updateLoyaltyObject(customerId, newBalance);

      logger.info('Google Wallet balance updated successfully', {
        customerId: customerId,
        newBalance: newBalance,
      });

    } catch (error) {
      logger.error('Failed to update Google Wallet balance', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: customerId,
        newBalance: newBalance,
      });
      throw error;
    }
  }

  /**
   * Generate "Add to Google Wallet" link
   */
  generateGoogleWalletLink(customerId: string): GoogleWalletAddToWalletLink {
    try {
      const link = googleWalletService.generateAddToWalletLink(customerId);

      logger.info('Google Wallet link generated successfully', {
        customerId: customerId,
      });

      return link;

    } catch (error) {
      logger.error('Failed to generate Google Wallet link', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: customerId,
      });
      throw error;
    }
  }

  /**
   * Initialize both wallet services
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Apple Wallet service
      await passService.initialize();
      
      // Initialize Google Wallet service if configured
      if (googleWalletService.isConfigured()) {
        await googleWalletService.initialize();
        // Create loyalty class if it doesn't exist
        await googleWalletService.createLoyaltyClass();
      }

      logger.info('Wallet services initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize wallet services', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate pass for a customer (backward compatibility)
   */
  async generatePass(customer: ICustomer): Promise<Buffer> {
    return this.generateApplePass(customer);
  }
}

// Export singleton instance
export const walletService = new WalletService();

// Export the generatePass function for backward compatibility
export const generatePass = (customer: ICustomer): Promise<Buffer> => {
  return walletService.generatePass(customer);
};

export default walletService;
