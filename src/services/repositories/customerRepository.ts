import { FilterQuery } from 'mongoose';
import { Customer, ICustomer } from '../../models/customer';
import { BaseRepository, PaginationOptions, PaginatedResult } from './baseRepository';
import { logger } from '../../config/logger';

export interface CustomerSearchFilters {
  email?: string;
  phone?: string;
  cardNumber?: string;
  isActive?: boolean;
  registrationSource?: 'web' | 'pos' | 'admin';
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
}

export class CustomerRepository extends BaseRepository<ICustomer> {
  constructor() {
    super(Customer);
  }



  async findByCardNumber(cardNumber: string): Promise<ICustomer | null> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    const logContext = { 
      requestId,
      cardNumber: cardNumber ? `${cardNumber.substring(0, 4)}...${cardNumber.slice(-4)}` : 'none',
      operation: 'findByCardNumber'
    };

    try {
      logger.debug('Searching for customer by card number', logContext);
      
      if (!cardNumber) {
        const error = new Error('Card number is required');
        (error as any).code = 'VALIDATION_ERROR';
        throw error;
      }

      const result = await this.model.findOne({ cardNumber }).lean().exec();
      
      const duration = Date.now() - startTime;
      logger.debug('Card number search completed', { 
        ...logContext, 
        duration,
        found: !!result,
        status: 'success'
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorCode = (error as any)?.code || 'DATABASE_ERROR';
      
      logger.error('Failed to find customer by card number', { 
        ...logContext,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode,
        duration,
        status: 'error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Re-throw with additional context
      if (error instanceof Error) {
        const enhancedError = new Error(error.message);
        (enhancedError as any).code = errorCode;
        if (error.stack) enhancedError.stack = error.stack;
        throw enhancedError;
      }
      
      throw error;
    }
  }

  async findByPhone(phone: string): Promise<ICustomer | null> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    const logContext = { 
      requestId,
      phone: phone ? '***' + phone.slice(-4) : 'none',
      operation: 'findByPhone'
    };

    try {
      logger.debug('Searching for customer by phone', logContext);
      
      if (!phone) {
        const error = new Error('Phone number is required');
        (error as any).code = 'VALIDATION_ERROR';
        throw error;
      }

      const result = await this.model.findOne({ phone }).lean().exec();
      
      const duration = Date.now() - startTime;
      logger.debug('Phone search completed', { 
        ...logContext, 
        duration,
        found: !!result,
        status: 'success'
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorCode = (error as any)?.code || 'DATABASE_ERROR';
      
      logger.error('Failed to find customer by phone', { 
        ...logContext,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorCode,
        duration,
        status: 'error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Re-throw with additional context
      if (error instanceof Error) {
        const enhancedError = new Error(error.message);
        (enhancedError as any).code = errorCode;
        if (error.stack) enhancedError.stack = error.stack;
        throw enhancedError;
      }
      
      throw error;
    }
  }

  async search(
    filters: CustomerSearchFilters,
    options: PaginationOptions
  ): Promise<PaginatedResult<ICustomer>> {
    try {
      const query: FilterQuery<ICustomer> = {};

      // Direct field filters
      if (filters.email) {
        query.email = { $regex: filters.email, $options: 'i' };
      }
      
      if (filters.phone) {
        query.phone = { $regex: filters.phone, $options: 'i' };
      }
      
      if (filters.cardNumber) {
        query.cardNumber = filters.cardNumber;
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      if (filters.registrationSource) {
        query['metadata.registrationSource'] = filters.registrationSource;
      }

      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) {
          query.createdAt.$gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          query.createdAt.$lte = filters.dateTo;
        }
      }

      // General search term (searches in name, email, phone)
      if (filters.searchTerm) {
        const searchRegex = { $regex: filters.searchTerm, $options: 'i' };
        query.$or = [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex }
        ];
      }

      return await this.findMany(query, options);
    } catch (error) {
      logger.error('Failed to search customers', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        options 
      });
      throw error;
    }
  }

  async updateBalance(
    customerId: string, 
    newBalance: number
  ): Promise<ICustomer | null> {
    try {
      const updated = await this.model.findByIdAndUpdate(
        customerId,
        { 
          balance: newBalance,
          'metadata.lastActivity': new Date()
        },
        { new: true }
      ).exec();

      if (updated) {
        logger.info('Customer balance updated', { 
          customerId,
          newBalance,
          previousBalance: updated.balance 
        });
      }

      return updated;
    } catch (error) {
      logger.error('Failed to update customer balance', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
        newBalance 
      });
      throw error;
    }
  }

  async incrementTransactionStats(
    customerId: string,
    amount: number
  ): Promise<ICustomer | null> {
    try {
      return await this.model.findByIdAndUpdate(
        customerId,
        {
          $inc: {
            'metadata.totalTransactions': 1,
            'metadata.totalSpent': amount
          },
          $set: {
            'metadata.lastActivity': new Date()
          }
        },
        { new: true }
      ).exec();
    } catch (error) {
      logger.error('Failed to increment customer transaction stats', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
        amount 
      });
      throw error;
    }
  }

  async updateWalletCard(
    customerId: string,
    walletType: 'appleWallet' | 'googleWallet',
    cardData: any
  ): Promise<ICustomer | null> {
    try {
      const updateData = {
        [`walletCards.${walletType}`]: {
          ...cardData,
          lastUpdated: new Date()
        }
      };

      return await this.model.findByIdAndUpdate(
        customerId,
        updateData,
        { new: true }
      ).exec();
    } catch (error) {
      logger.error('Failed to update wallet card', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
        walletType 
      });
      throw error;
    }
  }

  async getActiveCustomersCount(): Promise<number> {
    try {
      return await this.model.countDocuments({ isActive: true });
    } catch (error) {
      logger.error('Failed to get active customers count', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  async getCustomersByRegistrationSource(): Promise<Record<string, number>> {
    try {
      const result = await this.model.aggregate([
        {
          $group: {
            _id: '$metadata.registrationSource',
            count: { $sum: 1 }
          }
        }
      ]);

      return result.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      logger.error('Failed to get customers by registration source', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}
