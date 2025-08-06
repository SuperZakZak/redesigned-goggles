// Common types used across the application

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationQuery {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BaseEntity {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorDetails {
  code: string;
  message: string;
  field?: string;
  value?: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export type TransactionType = 'credit' | 'debit' | 'bonus' | 'redemption';
export type CardType = 'loyalty' | 'membership' | 'discount';
export type WalletType = 'apple' | 'google';
