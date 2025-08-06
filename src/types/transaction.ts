import { BaseEntity, TransactionType } from './common';

export interface Transaction extends BaseEntity {
  customerId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  reference?: string;
  balanceBefore: number;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
}

export interface CreateTransactionData {
  customerId: string;
  type: TransactionType;
  amount: number;
  description?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionQuery {
  customerId?: string;
  type?: TransactionType;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: Date;
  dateTo?: Date;
  reference?: string;
  search?: string;
}

export interface TransactionStats {
  totalTransactions: number;
  totalCredits: number;
  totalDebits: number;
  totalBonuses: number;
  totalRedemptions: number;
  averageTransactionAmount: number;
  transactionsToday: number;
  transactionsThisWeek: number;
  transactionsThisMonth: number;
}
