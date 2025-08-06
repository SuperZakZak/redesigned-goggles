import { BaseEntity } from './common';

export interface Customer extends BaseEntity {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  balance: number;
  totalSpent: number;
  totalEarned: number;
  isActive: boolean;
  lastVisit?: Date;
  metadata?: Record<string, unknown>;
}

export interface CreateCustomerData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  metadata?: Record<string, unknown>;
}

export interface UpdateCustomerData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CustomerQuery extends Partial<Customer> {
  search?: string;
  minBalance?: number;
  maxBalance?: number;
  minTotalSpent?: number;
  maxTotalSpent?: number;
  isActive?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  lastVisitAfter?: Date;
  lastVisitBefore?: Date;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersToday: number;
  newCustomersThisWeek: number;
  newCustomersThisMonth: number;
  averageBalance: number;
  totalBalance: number;
  averageSpent: number;
  totalSpent: number;
}
