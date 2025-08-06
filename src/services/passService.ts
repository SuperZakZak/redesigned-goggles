import { Pass } from '@/models/pass';
import { Customer } from '@/models/customer';
import { logger } from '@/config/logger';
import { v4 as uuidv4 } from 'uuid';
import { appleWalletManualService } from './appleWalletManual.service';

export interface GeneratePassOptions {
  customerId: string;
}

class PassService {
  /**
   * Generate an Apple Wallet pass (.pkpass) for a given customer.
   * Returns the pkpass file as Buffer.
   * Uses manual OpenSSL approach to bypass passkit-generator issues.
   */
  async generateApplePass({ customerId }: GeneratePassOptions): Promise<Buffer> {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('CUSTOMER_NOT_FOUND');
      }

      const serialNumber = `LOY-${customer.id}-${Date.now()}`;

      // Use our working manual service instead of problematic passkit-generator
      const pkpassBuffer = await appleWalletManualService.generatePass(customer);

      // Save pass record to database
      await Pass.create({
        serialNumber,
        customerId: customer._id,
        deviceLibraryIdentifiers: [],
        updatedAt: new Date(),
      });

      logger.info('Apple pass generated successfully', { 
        customerId, 
        serialNumber,
        size: pkpassBuffer.length
      });
      
      return pkpassBuffer;
    } catch (error: any) {
      logger.error('Failed to generate Apple pass', { 
        customerId,
        error: error.message 
      });
      throw new Error(`Failed to generate Apple Wallet pass: ${error.message}`);
    }
  }

  /**
   * Register a device for push notifications.
   */
  async registerDevice(serial: string, deviceLibraryId: string, pushToken: string): Promise<void> {
    const pass = await Pass.findOne({ serialNumber: serial });
    if (!pass) throw new Error('PASS_NOT_FOUND');

    if (!pass.deviceLibraryIdentifiers.includes(deviceLibraryId)) {
      pass.deviceLibraryIdentifiers.push(deviceLibraryId);
      await pass.save();
    }

    logger.info('Device registered for pass updates', { serial, deviceLibraryId });
    // Here you would store pushToken mapping (e.g., in Redis) for later push.
  }

  /**
   * Trigger push update notification to all registered devices for pass serial.
   * This is a stub – integrate with APNS later.
   */
  async pushUpdate(serial: string): Promise<void> {
    const pass = await Pass.findOne({ serialNumber: serial });
    if (!pass) throw new Error('PASS_NOT_FOUND');

    // TODO: Implement APNS push with stored device tokens
    logger.info('Push update triggered', { serial, devices: pass.deviceLibraryIdentifiers.length });
  }
}

export const passService = new PassService();
