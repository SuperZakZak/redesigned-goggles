import apn from 'node-apn';
import { config } from '../config/app';
import { logger } from '../config/logger';

/**
 * Push Notification Service for Apple Wallet updates
 */
export class PushNotificationService {
  private provider: apn.Provider | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize APNs provider with certificates
   */
  private initializeProvider(): void {
    try {
      if (!config.apns.cert || !config.apns.key) {
        logger.warn('APNs certificates not configured, push notifications disabled');
        return;
      }

      const options: apn.ProviderOptions = {
        cert: config.apns.cert,
        key: config.apns.key,
        production: true, // Force production mode for production certificates
        ...(config.apns.passphrase && { passphrase: config.apns.passphrase }),
      };

      this.provider = new apn.Provider(options);
      this.isInitialized = true;

      logger.info('APNs provider initialized successfully', {
        production: true, // Using production mode for production certificates
      });

      // Handle provider events
      this.provider.on('connected', () => {
        logger.info('APNs provider connected');
      });

      this.provider.on('disconnected', () => {
        logger.warn('APNs provider disconnected');
      });

      this.provider.on('socketError', (error: Error) => {
        logger.error('APNs socket error', { error: error.message });
      });

      this.provider.on('transmissionError', (errorCode: number, notification: any, device: string) => {
        logger.error('APNs transmission error', {
          errorCode,
          device,
          notification: notification.payload,
        });
      });

    } catch (error) {
      logger.error('Failed to initialize APNs provider', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send silent push notification to update Apple Wallet pass
   */
  async sendUpdateNotification(pushToken: string): Promise<boolean> {
    if (!this.isInitialized || !this.provider) {
      logger.warn('APNs provider not initialized, cannot send push notification', {
        pushToken: pushToken.substring(0, 8) + '...',
      });
      return false;
    }

    try {
      // Create silent notification for Wallet pass update
      const notification = new apn.Notification();
      
      // Silent notification - no alert, badge, or sound
      notification.contentAvailable = true;
      notification.priority = 5; // Low priority for background updates
      
      // No payload needed for Wallet pass updates
      notification.payload = {};

      // Send notification
      const result = await this.provider.send(notification, pushToken);

      // Check for failures
      if (result.failed && result.failed.length > 0) {
        const failure = result.failed[0];
        logger.error('Failed to send APNs notification', {
          pushToken: pushToken.substring(0, 8) + '...',
          error: failure?.error || 'Unknown error',
          status: failure?.status || 'Unknown status',
          response: failure?.response || 'No response',
        });
        return false;
      }

      logger.info('APNs notification sent successfully', {
        pushToken: pushToken.substring(0, 8) + '...',
        sent: result.sent?.length || 0,
      });

      return true;

    } catch (error) {
      logger.error('Error sending APNs notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        pushToken: pushToken.substring(0, 8) + '...',
      });
      return false;
    }
  }

  /**
   * Send update notifications to multiple devices
   */
  async sendBulkUpdateNotifications(pushTokens: string[]): Promise<{
    successful: number;
    failed: number;
  }> {
    if (!pushTokens.length) {
      return { successful: 0, failed: 0 };
    }

    logger.info('Sending bulk APNs notifications', {
      count: pushTokens.length,
    });

    const results = await Promise.allSettled(
      pushTokens.map(token => this.sendUpdateNotification(token))
    );

    const successful = results.filter(
      result => result.status === 'fulfilled' && result.value === true
    ).length;

    const failed = results.length - successful;

    logger.info('Bulk APNs notifications completed', {
      total: pushTokens.length,
      successful,
      failed,
    });

    return { successful, failed };
  }

  /**
   * Shutdown the APNs provider
   */
  async shutdown(): Promise<void> {
    if (this.provider) {
      try {
        await this.provider.shutdown();
        logger.info('APNs provider shutdown completed');
      } catch (error) {
        logger.error('Error shutting down APNs provider', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Check if push notifications are available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.provider !== null;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
