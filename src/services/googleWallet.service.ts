import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import { walletConfig } from '../config/wallet';
import { logger } from '../config/logger';
import * as path from 'path';
import {
  GoogleWalletLoyaltyClass,
  GoogleWalletLoyaltyObject,
  GoogleWalletPassData,
  GoogleWalletServiceConfig,
  GoogleWalletAddToWalletLink,
  GoogleWalletError
} from '../types/googleWallet';

/**
 * Google Wallet Service for loyalty card management
 * Handles class creation, object management, and pass generation
 */
export class GoogleWalletService {
  private walletobjects: any;
  private config: GoogleWalletServiceConfig;
  private isInitialized = false;

  constructor() {
    this.config = {
      applicationName: walletConfig.googleApplicationName,
      issuerId: walletConfig.googleIssuerId,
      serviceAccountKeyPath: walletConfig.googleServiceAccountKeyPath,
      loyaltyClassId: walletConfig.googleLoyaltyClassId,
      origins: walletConfig.googleOrigins,
    };
  }

  /**
   * Initialize Google Wallet API client
   */
  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Create JWT client for service account authentication
      const serviceAccountKeyPath = path.resolve(process.cwd(), this.config.serviceAccountKeyPath);
      const serviceAccountKey = require(serviceAccountKeyPath);
      const jwtClient = new JWT({
        email: serviceAccountKey.client_email,
        key: serviceAccountKey.private_key,
        scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
      });

      // Initialize Google Wallet API client
      this.walletobjects = google.walletobjects({
        version: 'v1',
        auth: jwtClient,
      });

      this.isInitialized = true;

      logger.info('Google Wallet service initialized successfully', {
        issuerId: this.config.issuerId,
        applicationName: this.config.applicationName,
      });

    } catch (error) {
      logger.error('Failed to initialize Google Wallet service', {
        error: error instanceof Error ? error.message : 'Unknown error',
        serviceAccountPath: this.config.serviceAccountKeyPath,
      });
      throw error;
    }
  }

  /**
   * Create or update loyalty class
   */
  async createLoyaltyClass(): Promise<GoogleWalletLoyaltyClass> {
    try {
      await this.initialize();

      const loyaltyClass: GoogleWalletLoyaltyClass = {
        id: `${this.config.issuerId}.${this.config.loyaltyClassId}`,
        issuerName: 'Loy Digital Loyalty',
        programName: 'Loy Loyalty Program',
        programLogo: {
          sourceUri: {
            uri: 'https://via.placeholder.com/200x200/4285F4/FFFFFF?text=LOY',
          },
        },
        accountIdLabel: 'Customer ID',
        accountNameLabel: 'Customer Name',
        programDetails: 'Earn points with every purchase and get exclusive rewards!',
        rewardsTier: 'Bronze',
        rewardsTierLabel: 'Loyalty Level',
        hexBackgroundColor: '#4285F4',
        reviewStatus: 'UNDER_REVIEW',
      };

      // Try to get existing class first
      try {
        const existingClass = await this.walletobjects.loyaltyclass.get({
          resourceId: loyaltyClass.id,
        });

        if (existingClass.data) {
          logger.info('Loyalty class already exists', { classId: loyaltyClass.id });
          return existingClass.data;
        }
      } catch (error) {
        // Class doesn't exist, we'll create it
        logger.info('Loyalty class not found, creating new one', { classId: loyaltyClass.id });
      }

      // Create new class
      const response = await this.walletobjects.loyaltyclass.insert({
        requestBody: loyaltyClass,
      });

      logger.info('Loyalty class created successfully', {
        classId: loyaltyClass.id,
        reviewStatus: response.data.reviewStatus,
      });

      return response.data;

    } catch (error) {
      logger.error('Failed to create loyalty class', {
        error: error instanceof Error ? error.message : 'Unknown error',
        classId: `${this.config.issuerId}.${this.config.loyaltyClassId}`,
      });
      throw error;
    }
  }

  /**
   * Create loyalty object for customer
   */
  async createLoyaltyObject(passData: GoogleWalletPassData): Promise<GoogleWalletLoyaltyObject> {
    try {
      await this.initialize();

      const objectId = `${this.config.issuerId}.${passData.customerId}`;
      const classId = `${this.config.issuerId}.${this.config.loyaltyClassId}`;

      const loyaltyObject: GoogleWalletLoyaltyObject = {
        id: objectId,
        classId: classId,
        state: 'ACTIVE',
        accountId: passData.customerId,
        accountName: passData.customerName,
        loyaltyPoints: {
          balance: {
            string: passData.balance.toString(),
          },
          label: 'Balance',
          localizedLabel: {
            defaultValue: {
              language: 'en-US',
              value: 'Balance',
            },
          },
        },
        barcode: {
          type: 'QR_CODE',
          value: passData.qrCode || passData.customerId,
          alternateText: `Customer ID: ${passData.customerId}`,
        },
        textModulesData: [
          {
            header: 'Customer Level',
            body: passData.level || 'Bronze',
            id: 'level',
          },
          {
            header: 'Customer ID',
            body: passData.customerId,
            id: 'customerId',
          },
        ],
      };

      // Add additional info if provided
      if (passData.additionalInfo) {
        Object.entries(passData.additionalInfo).forEach(([key, value], index) => {
          loyaltyObject.textModulesData?.push({
            header: key,
            body: value,
            id: `additional_${index}`,
          });
        });
      }

      const response = await this.walletobjects.loyaltyobject.insert({
        requestBody: loyaltyObject,
      });

      logger.info('Loyalty object created successfully', {
        objectId: objectId,
        customerId: passData.customerId,
        balance: passData.balance,
      });

      return response.data;

    } catch (error) {
      logger.error('Failed to create loyalty object', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: passData.customerId,
      });
      throw error;
    }
  }

  /**
   * Update loyalty object balance
   */
  async updateLoyaltyObject(customerId: string, newBalance: number): Promise<GoogleWalletLoyaltyObject> {
    try {
      await this.initialize();

      const objectId = `${this.config.issuerId}.${customerId}`;

      // Get existing object
      const existingObject = await this.walletobjects.loyaltyobject.get({
        resourceId: objectId,
      });

      if (!existingObject.data) {
        throw new Error(`Loyalty object not found for customer: ${customerId}`);
      }

      // Update balance
      const updatedObject = {
        ...existingObject.data,
        loyaltyPoints: {
          ...existingObject.data.loyaltyPoints,
          balance: {
            string: newBalance.toString(),
          },
        },
      };

      const response = await this.walletobjects.loyaltyobject.update({
        resourceId: objectId,
        requestBody: updatedObject,
      });

      logger.info('Loyalty object updated successfully', {
        objectId: objectId,
        customerId: customerId,
        newBalance: newBalance,
      });

      return response.data;

    } catch (error) {
      logger.error('Failed to update loyalty object', {
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
  generateAddToWalletLink(customerId: string): GoogleWalletAddToWalletLink {
    try {
      const objectId = `${this.config.issuerId}.${customerId}`;
      
      // Create JWT payload for the save link
      const payload = {
        iss: this.config.issuerId,
        aud: 'google',
        typ: 'savetowallet',
        origins: this.config.origins,
        payload: {
          loyaltyObjects: [
            {
              id: objectId,
            },
          ],
        },
      };

      // For production, you would sign this JWT with your service account key
      // For now, we'll create a basic save URL
      const saveUrl = `https://pay.google.com/gp/v/save/${Buffer.from(JSON.stringify(payload)).toString('base64')}`;

      logger.info('Add to Google Wallet link generated', {
        customerId: customerId,
        objectId: objectId,
      });

      return { saveUrl };

    } catch (error) {
      logger.error('Failed to generate add to wallet link', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: customerId,
      });
      throw error;
    }
  }

  /**
   * Handle webhook from Google Wallet
   */
  async handleWebhook(payload: any): Promise<void> {
    try {
      logger.info('Google Wallet webhook received', {
        eventType: payload.eventType,
        objectId: payload.objectId,
        classId: payload.classId,
      });

      // Handle different event types
      switch (payload.eventType) {
        case 'save':
          logger.info('Customer saved pass to Google Wallet', {
            objectId: payload.objectId,
          });
          break;
        case 'del':
          logger.info('Customer removed pass from Google Wallet', {
            objectId: payload.objectId,
          });
          break;
        default:
          logger.warn('Unknown webhook event type', {
            eventType: payload.eventType,
          });
      }

    } catch (error) {
      logger.error('Failed to handle Google Wallet webhook', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payload: payload,
      });
      throw error;
    }
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.issuerId &&
      this.config.loyaltyClassId &&
      this.config.serviceAccountKeyPath
    );
  }
}

// Export singleton instance
export const googleWalletService = new GoogleWalletService();

export default googleWalletService;
