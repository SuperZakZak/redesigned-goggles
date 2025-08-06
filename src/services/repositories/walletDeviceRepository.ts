import { ObjectId } from 'mongodb';
import { WalletDevice, IWalletDevice } from '../../models/walletDevice';
import { BaseRepository } from './baseRepository';

/**
 * Repository for WalletDevice operations
 */
export class WalletDeviceRepository extends BaseRepository<IWalletDevice> {
  constructor() {
    super(WalletDevice);
  }

  /**
   * Register a new device for a pass
   */
  async registerDevice(data: {
    customerId: ObjectId;
    serialNumber: string;
    deviceLibraryIdentifier: string;
    pushToken: string;
    passTypeIdentifier: string;
  }): Promise<IWalletDevice> {
    // Check if device is already registered for this pass
    const existing = await this.findOne({
      deviceLibraryIdentifier: data.deviceLibraryIdentifier,
      serialNumber: data.serialNumber,
      passTypeIdentifier: data.passTypeIdentifier,
    });

    if (existing) {
      // Update existing registration
      existing.pushToken = data.pushToken;
      existing.isActive = true;
      existing.lastUpdated = new Date();
      return await existing.save();
    }

    // Create new registration
    return await this.create(data);
  }

  /**
   * Get all active passes for a device that were updated after a given timestamp
   */
  async getUpdatablePasses(
    deviceLibraryIdentifier: string,
    passTypeIdentifier: string,
    updatedSince?: Date
  ): Promise<{ serialNumbers: string[]; lastUpdated: string }> {
    const query: any = {
      deviceLibraryIdentifier,
      passTypeIdentifier,
      isActive: true,
    };

    if (updatedSince) {
      query.lastUpdated = { $gt: updatedSince };
    }

    const devices = await this.find(query, { serialNumber: 1, lastUpdated: 1 });
    
    const serialNumbers = devices.map((device: IWalletDevice) => device.serialNumber);
    const lastUpdated = devices.length > 0 
      ? Math.max(...devices.map((d: IWalletDevice) => d.lastUpdated.getTime())).toString()
      : Date.now().toString();

    return { serialNumbers, lastUpdated };
  }

  /**
   * Find device registration by serial number and pass type
   */
  async findBySerialNumber(
    serialNumber: string,
    passTypeIdentifier: string
  ): Promise<IWalletDevice | null> {
    return await this.findOne({
      serialNumber,
      passTypeIdentifier,
      isActive: true,
    });
  }

  /**
   * Unregister a device for a specific pass
   */
  async unregisterDevice(
    deviceLibraryIdentifier: string,
    serialNumber: string,
    passTypeIdentifier: string
  ): Promise<boolean> {
    const result = await this.updateOne(
      {
        deviceLibraryIdentifier,
        serialNumber,
        passTypeIdentifier,
      },
      {
        isActive: false,
        lastUpdated: new Date(),
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Get all active devices for a customer
   */
  async findByCustomerId(customerId: ObjectId): Promise<IWalletDevice[]> {
    return await this.find({
      customerId,
      isActive: true,
    });
  }

  /**
   * Get push tokens for a customer's active devices
   */
  async getPushTokensByCustomerId(customerId: ObjectId): Promise<string[]> {
    const devices = await this.find(
      {
        customerId,
        isActive: true,
      },
      { pushToken: 1 }
    );

    return devices.map((device: IWalletDevice) => device.pushToken);
  }

  /**
   * Mark passes as updated for push notification purposes
   */
  async markPassesAsUpdated(customerId: ObjectId): Promise<void> {
    await this.updateMany(
      {
        customerId,
        isActive: true,
      },
      {
        lastUpdated: new Date(),
      }
    );
  }
}

export default WalletDeviceRepository;
