import mongoose from 'mongoose';
import { CustomerRepository, CustomerSearchFilters } from './repositories/customerRepository';
import { TransactionRepository } from './repositories/transactionRepository';
import { WalletDeviceRepository } from './repositories/walletDeviceRepository';
import { ICustomer } from '../models/customer';
import { ITransaction } from '../models/transaction';
import { PaginationOptions, PaginatedResult } from './repositories/baseRepository';
import { logger } from '../config/logger';
import { pushNotificationService } from './pushNotification.service';
import { walletService } from './wallet.service';

export interface CreateCustomerData {
  name: string;
  phone?: string;
  registrationSource?: 'web' | 'pos' | 'admin';
}

export interface UpdateCustomerData {
  name?: string;
  phone?: string;
  isActive?: boolean;
}

export interface BalanceOperationData {
  customerId: string;
  amount: number;
  description: string;
  source: 'pos' | 'admin' | 'bonus' | 'refund' | 'purchase';
  metadata?: {
    posTransactionId?: string;
    adminUserId?: string;
    orderId?: string;
    campaignId?: string;
    notes?: string;
  };
}

export class CustomerService {
  private customerRepository: CustomerRepository;
  private transactionRepository: TransactionRepository;
  private walletDeviceRepository: WalletDeviceRepository;

  constructor() {
    this.customerRepository = new CustomerRepository();
    this.transactionRepository = new TransactionRepository();
    this.walletDeviceRepository = new WalletDeviceRepository();
  }

  async createCustomer(data: CreateCustomerData): Promise<ICustomer> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    const logContext = { 
      requestId,
      name: data.name,
      phone: data.phone ? '***' : undefined,
      registrationSource: data.registrationSource || 'web'
    };

    try {
      logger.info('Starting customer creation', logContext);
      
      // Check phone if provided
      if (data.phone) {
        const existingPhone = await this.customerRepository.findByPhone(data.phone);
        if (existingPhone) {
          const error = new Error('Customer with this phone already exists');
          (error as any).code = 'DUPLICATE_PHONE';
          throw error;
        }
      }

      const customerData = {
        ...data,
        balance: 0,
        isActive: true,
        metadata: {
          registrationSource: data.registrationSource || 'web',
          lastActivity: new Date(),
          totalTransactions: 0,
          totalSpent: 0
        }
      };

      logger.debug('Creating customer record', { ...logContext, hasPhone: !!data.phone });
      const customer = await this.customerRepository.create(customerData);
      
      // Create wallet passes for the new customer
      try {
        // Initialize wallet services
        await walletService.initialize();
        
        // Create Google Wallet pass (non-blocking)
        walletService.createGoogleWalletPass(customer).catch(error => {
          logger.warn('Failed to create Google Wallet pass for new customer', {
            customerId: customer._id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        });
        
        logger.debug('Wallet pass creation initiated', { customerId: customer._id });
      } catch (walletError) {
        // Log error but don't fail customer creation
        logger.warn('Failed to initialize wallet services for new customer', {
          customerId: customer._id,
          error: walletError instanceof Error ? walletError.message : 'Unknown error'
        });
      }
      
      const duration = Date.now() - startTime;
      logger.info('Customer created successfully', { 
        ...logContext,
        customerId: customer._id,
        duration,
        status: 'success'
      });

      return customer;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.code || 'UNKNOWN_ERROR';
      
      logger.error('Failed to create customer', { 
        ...logContext,
        error: errorMessage,
        errorCode,
        duration,
        status: 'error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Re-throw with additional context
      if (error instanceof Error) {
        const enhancedError = new Error(errorMessage);
        (enhancedError as any).code = errorCode;
        if (error.stack) {
          enhancedError.stack = error.stack;
        }
        throw enhancedError;
      }
      
      throw error;
    }
  }

  async getCustomerById(customerId: string): Promise<ICustomer | null> {
    try {
      return await this.customerRepository.findById(customerId);
    } catch (error) {
      logger.error('Failed to get customer by ID', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId 
      });
      throw error;
    }
  }



  async getCustomerByCardNumber(cardNumber: string): Promise<ICustomer | null> {
    try {
      return await this.customerRepository.findByCardNumber(cardNumber);
    } catch (error) {
      logger.error('Failed to get customer by card number', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        cardNumber 
      });
      throw error;
    }
  }

  async updateCustomer(
    customerId: string, 
    data: UpdateCustomerData
  ): Promise<ICustomer | null> {
    try {
      // Check if phone is being updated and doesn't conflict
      if (data.phone) {
        const existingPhone = await this.customerRepository.findByPhone(data.phone);
        if (existingPhone && existingPhone._id.toString() !== customerId) {
          throw new Error('Customer with this phone already exists');
        }
      }

      const updateData = {
        ...data,
        'metadata.lastActivity': new Date()
      };

      const updated = await this.customerRepository.updateById(customerId, updateData);
      
      if (updated) {
        logger.info('Customer updated successfully', { 
          customerId,
          updatedFields: Object.keys(data) 
        });
      }

      return updated;
    } catch (error) {
      logger.error('Failed to update customer', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
        data 
      });
      throw error;
    }
  }

  async searchCustomers(
    filters: CustomerSearchFilters,
    options: PaginationOptions
  ): Promise<PaginatedResult<ICustomer>> {
    try {
      return await this.customerRepository.search(filters, options);
    } catch (error) {
      logger.error('Failed to search customers', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        options 
      });
      throw error;
    }
  }

  async creditBalance(data: BalanceOperationData): Promise<{
    customer: ICustomer;
    transaction: ITransaction;
  }> {
    try {
      const customer = await this.customerRepository.findById(data.customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      if (!customer.isActive) {
        throw new Error('Customer account is inactive');
      }

      const balanceBefore = customer.balance;
      const balanceAfter = balanceBefore + data.amount;

      // Create transaction record
      const transactionData = {
        customerId: new mongoose.Types.ObjectId(data.customerId),
        type: 'credit' as const,
        amount: data.amount,
        balanceBefore,
        balanceAfter,
        description: data.description,
        source: data.source,
        metadata: data.metadata || {},
        status: 'completed' as const
      };

      const transaction = await this.transactionRepository.create(transactionData);

      // Update customer balance and stats
      const updatedCustomer = await this.customerRepository.updateBalance(
        data.customerId,
        balanceAfter
      );

      if (!updatedCustomer) {
        throw new Error('Failed to update customer balance');
      }

      logger.info('Balance credited successfully', { 
        customerId: data.customerId,
        amount: data.amount,
        balanceBefore,
        balanceAfter,
        transactionId: transaction._id 
      });

      // Send push notification to update Apple Wallet passes
      try {
        await this.sendWalletUpdateNotification(new mongoose.Types.ObjectId(data.customerId));
      } catch (notificationError) {
        // Log error but don't fail the transaction
        logger.warn('Failed to send wallet update notification', {
          customerId: data.customerId,
          error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
        });
      }

      return {
        customer: updatedCustomer,
        transaction
      };
    } catch (error) {
      logger.error('Failed to credit balance', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        data 
      });
      throw error;
    }
  }

  async debitBalance(data: BalanceOperationData): Promise<{
    customer: ICustomer;
    transaction: ITransaction;
  }> {
    try {
      const customer = await this.customerRepository.findById(data.customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      if (!customer.isActive) {
        throw new Error('Customer account is inactive');
      }

      if (customer.balance < data.amount) {
        throw new Error('Insufficient balance');
      }

      const balanceBefore = customer.balance;
      const balanceAfter = balanceBefore - data.amount;

      // Create transaction record
      const transactionData = {
        customerId: new mongoose.Types.ObjectId(data.customerId),
        type: 'debit' as const,
        amount: data.amount,
        balanceBefore,
        balanceAfter,
        description: data.description,
        source: data.source,
        metadata: data.metadata || {},
        status: 'completed' as const
      };

      const transaction = await this.transactionRepository.create(transactionData);

      // Update customer balance and increment transaction stats
      const updatedCustomer = await this.customerRepository.updateBalance(
        data.customerId,
        balanceAfter
      );

      if (!updatedCustomer) {
        throw new Error('Failed to update customer balance');
      }

      // Increment transaction stats for purchases
      if (data.source === 'purchase') {
        await this.customerRepository.incrementTransactionStats(
          data.customerId,
          data.amount
        );
      }

      logger.info('Balance debited successfully', { 
        customerId: data.customerId,
        amount: data.amount,
        balanceBefore,
        balanceAfter,
        transactionId: transaction._id 
      });

      // Send push notification to update Apple Wallet passes
      try {
        await this.sendWalletUpdateNotification(new mongoose.Types.ObjectId(data.customerId));
      } catch (notificationError) {
        // Log error but don't fail the transaction
        logger.warn('Failed to send wallet update notification', {
          customerId: data.customerId,
          error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
        });
      }

      return {
        customer: updatedCustomer,
        transaction
      };
    } catch (error) {
      logger.error('Failed to debit balance', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        data 
      });
      throw error;
    }
  }

  async getCustomerTransactions(
    customerId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<ITransaction>> {
    try {
      return await this.transactionRepository.findByCustomerId(customerId, options);
    } catch (error) {
      logger.error('Failed to get customer transactions', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
        options 
      });
      throw error;
    }
  }

  async getCustomersList(options: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedResult<ICustomer>> {
    try {
      const filters: CustomerSearchFilters = {};
      
      if (options.search) {
        // Search by name or phone
        filters.searchTerm = options.search;
      }

      return await this.customerRepository.search(filters, {
        page: options.page,
        limit: options.limit
      });
    } catch (error) {
      logger.error('Failed to get customers list', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        options 
      });
      throw error;
    }
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        return false;
      }

      // Soft delete - mark as inactive
      const updated = await this.customerRepository.updateById(customerId, {
        isActive: false,
        'metadata.deletedAt': new Date(),
        'metadata.lastActivity': new Date()
      });

      if (updated) {
        logger.info('Customer soft deleted', { customerId });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to delete customer', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId 
      });
      throw error;
    }
  }

  async updateBalance(
    customerId: string,
    amount: number,
    operation: 'credit' | 'debit',
    metadata: {
      description: string;
      channel: string;
      operatorId: string;
    }
  ): Promise<{ customer: ICustomer; transaction: ITransaction }> {
    try {
      const balanceData: BalanceOperationData = {
        customerId,
        amount,
        description: metadata.description,
        source: 'admin',
        metadata: {
          adminUserId: metadata.operatorId,
          notes: `${operation} operation via admin panel`
        }
      };

      if (operation === 'credit') {
        return await this.creditBalance(balanceData);
      } else {
        return await this.debitBalance(balanceData);
      }
    } catch (error) {
      logger.error('Failed to update balance', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
        amount,
        operation 
      });
      throw error;
    }
  }

  async getCustomerStats(): Promise<{
    totalCustomers: number;
    activeCustomers: number;
    customersBySource: Record<string, number>;
  }> {
    try {
      const [activeCustomers, customersBySource] = await Promise.all([
        this.customerRepository.getActiveCustomersCount(),
        this.customerRepository.getCustomersByRegistrationSource()
      ]);
      
      // Calculate total customers (active + inactive)
      // For now, we'll use a simple approach - this can be optimized later
      const inactiveFilters = { isActive: false };
      const inactiveResult = await this.customerRepository.search(inactiveFilters, { page: 1, limit: 1 });
      const totalCustomers = activeCustomers + inactiveResult.pagination.total;

      return {
        totalCustomers,
        activeCustomers,
        customersBySource
      };
    } catch (error) {
      logger.error('Failed to get customer stats', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  /**
   * Send push notification to update Apple Wallet passes for a customer
   */
  private async sendWalletUpdateNotification(customerId: mongoose.Types.ObjectId): Promise<void> {
    try {
      // Get push tokens for customer's active devices
      const pushTokens = await this.walletDeviceRepository.getPushTokensByCustomerId(customerId);

      if (pushTokens.length === 0) {
        logger.debug('No active wallet devices found for customer', { customerId });
        return;
      }

      // Mark passes as updated
      await this.walletDeviceRepository.markPassesAsUpdated(customerId);

      // Send push notifications
      const result = await pushNotificationService.sendBulkUpdateNotifications(pushTokens);

      logger.info('Wallet update notifications sent', {
        customerId,
        totalDevices: pushTokens.length,
        successful: result.successful,
        failed: result.failed,
      });

    } catch (error) {
      logger.error('Error sending wallet update notifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
      });
      throw error;
    }
  }
}
