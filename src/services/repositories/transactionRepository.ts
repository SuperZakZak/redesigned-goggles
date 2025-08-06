import { FilterQuery } from 'mongoose';
import { Transaction, ITransaction } from '../../models/transaction';
import { BaseRepository, PaginationOptions, PaginatedResult } from './baseRepository';
import { logger } from '../../config/logger';

export interface TransactionSearchFilters {
  customerId?: string;
  type?: 'credit' | 'debit';
  source?: 'pos' | 'admin' | 'bonus' | 'refund' | 'purchase';
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: number;
  amountMax?: number;
}

export class TransactionRepository extends BaseRepository<ITransaction> {
  constructor() {
    super(Transaction);
  }

  async findByCustomerId(
    customerId: string,
    options: PaginationOptions
  ): Promise<PaginatedResult<ITransaction>> {
    try {
      return await this.findMany({ customerId }, options);
    } catch (error) {
      logger.error('Failed to find transactions by customer ID', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId 
      });
      throw error;
    }
  }

  async search(
    filters: TransactionSearchFilters,
    options: PaginationOptions
  ): Promise<PaginatedResult<ITransaction>> {
    try {
      const query: FilterQuery<ITransaction> = {};

      // Direct field filters
      if (filters.customerId) {
        query.customerId = filters.customerId;
      }
      
      if (filters.type) {
        query.type = filters.type;
      }
      
      if (filters.source) {
        query.source = filters.source;
      }
      
      if (filters.status) {
        query.status = filters.status;
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

      // Amount range filter
      if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
        query.amount = {};
        if (filters.amountMin !== undefined) {
          query.amount.$gte = filters.amountMin;
        }
        if (filters.amountMax !== undefined) {
          query.amount.$lte = filters.amountMax;
        }
      }

      return await this.findMany(query, options);
    } catch (error) {
      logger.error('Failed to search transactions', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        options 
      });
      throw error;
    }
  }

  async findPendingTransactions(): Promise<ITransaction[]> {
    try {
      return await this.model.find({ status: 'pending' }).exec();
    } catch (error) {
      logger.error('Failed to find pending transactions', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  async updateStatus(
    transactionId: string,
    status: 'pending' | 'completed' | 'failed' | 'cancelled'
  ): Promise<ITransaction | null> {
    try {
      const updated = await this.model.findByIdAndUpdate(
        transactionId,
        { 
          status,
          ...(status === 'completed' && { processedAt: new Date() })
        },
        { new: true }
      ).exec();

      if (updated) {
        logger.info('Transaction status updated', { 
          transactionId,
          status,
          customerId: updated.customerId 
        });
      }

      return updated;
    } catch (error) {
      logger.error('Failed to update transaction status', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId,
        status 
      });
      throw error;
    }
  }

  async getTransactionStats(customerId?: string): Promise<{
    totalTransactions: number;
    totalCredits: number;
    totalDebits: number;
    pendingCount: number;
  }> {
    try {
      const matchStage = customerId ? { customerId } : {};
      
      const result = await this.model.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalCredits: {
              $sum: {
                $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0]
              }
            },
            totalDebits: {
              $sum: {
                $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0]
              }
            },
            pendingCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            }
          }
        }
      ]);

      return result[0] || {
        totalTransactions: 0,
        totalCredits: 0,
        totalDebits: 0,
        pendingCount: 0
      };
    } catch (error) {
      logger.error('Failed to get transaction stats', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId 
      });
      throw error;
    }
  }

  async getTransactionsBySource(): Promise<Record<string, number>> {
    try {
      const result = await this.model.aggregate([
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 }
          }
        }
      ]);

      return result.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      logger.error('Failed to get transactions by source', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  async getRecentTransactions(
    limit: number = 10
  ): Promise<ITransaction[]> {
    try {
      return await this.model
        .find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('customerId', 'firstName lastName email')
        .exec();
    } catch (error) {
      logger.error('Failed to get recent transactions', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        limit 
      });
      throw error;
    }
  }
}
