import { Request, Response } from 'express';
import { CustomerService } from '../services/customerService';
import { logger } from '../config/logger';
import { sendSuccess, sendError } from '../utils/response';
import mongoose from 'mongoose';
import Joi from 'joi';

const customerService = new CustomerService();

// Validation schemas
const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^\+7\d{10}$/).optional(),
  email: Joi.string().email().optional(),
});

const updateBalanceSchema = Joi.object({
  amount: Joi.number().required(),
  operation: Joi.string().valid('credit', 'debit').required(),
  description: Joi.string().min(1).max(200).required(),
});

// Helper function to validate ObjectId
const validateObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export class AdminController {
  // Get all customers with pagination
  async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      logger.info('Admin: Getting customers list', { page, limit, search });

      const result = await customerService.getCustomersList({
        page,
        limit,
        search,
      });

      sendSuccess(res, result);
    } catch (error) {
      logger.error('Admin: Failed to get customers', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      sendError(res, 'CUSTOMERS_FETCH_FAILED', 500);
    }
  }

  // Get customer by ID with full details
  async getCustomerById(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.params.customerId;

      if (!customerId || !validateObjectId(customerId)) {
        sendError(res, 'INVALID_CUSTOMER_ID', 400);
        return;
      }

      logger.info('Admin: Getting customer details', { customerId });

      const customer = await customerService.getCustomerById(customerId);
      if (!customer) {
        sendError(res, 'CUSTOMER_NOT_FOUND', 404);
        return;
      }

      // Get recent transactions
      const transactions = await customerService.getCustomerTransactions(
        customerId,
        { page: 1, limit: 10 }
      );

      const customerDetails = {
        ...customer.toObject(),
        recentTransactions: transactions.data,
      };

      sendSuccess(res, customerDetails);
    } catch (error) {
      logger.error('Admin: Failed to get customer', { 
        customerId: req.params.customerId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      sendError(res, 'CUSTOMER_FETCH_FAILED', 500);
    }
  }

  // Update customer profile
  async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.params.customerId;
      
      if (!customerId || !validateObjectId(customerId)) {
        sendError(res, 'INVALID_CUSTOMER_ID', 400);
        return;
      }

      // Validate request body
      const { error, value } = updateCustomerSchema.validate(req.body);
      if (error) {
        sendError(res, 'VALIDATION_ERROR', 400, error.details);
        return;
      }

      logger.info('Admin: Updating customer', { customerId, updates: value });

      const updatedCustomer = await customerService.updateCustomer(
        customerId,
        value
      );

      if (!updatedCustomer) {
        sendError(res, 'CUSTOMER_NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, updatedCustomer);
    } catch (error) {
      logger.error('Admin: Failed to update customer', { 
        customerId: req.params.customerId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      sendError(res, 'CUSTOMER_UPDATE_FAILED', 500);
    }
  }

  // Update customer balance
  async updateBalance(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.params.customerId;
      
      if (!customerId || !validateObjectId(customerId)) {
        sendError(res, 'INVALID_CUSTOMER_ID', 400);
        return;
      }

      // Validate request body
      const { error, value } = updateBalanceSchema.validate(req.body);
      if (error) {
        sendError(res, 'VALIDATION_ERROR', 400, error.details);
        return;
      }

      const { amount, operation, description } = value;

      logger.info('Admin: Updating customer balance', { 
        customerId, 
        amount, 
        operation, 
        description 
      });

      const result = await customerService.updateBalance(
        customerId,
        amount,
        operation,
        {
          description,
          channel: 'admin',
          operatorId: 'admin', // TODO: Get from auth context
        }
      );

      sendSuccess(res, result);
    } catch (error) {
      logger.error('Admin: Failed to update balance', { 
        customerId: req.params.customerId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      sendError(res, 'BALANCE_UPDATE_FAILED', 500);
    }
  }

  // Get customer transactions
  async getCustomerTransactions(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.params.customerId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!customerId || !validateObjectId(customerId)) {
        sendError(res, 'INVALID_CUSTOMER_ID', 400);
        return;
      }

      logger.info('Admin: Getting customer transactions', { customerId, page, limit });

      const result = await customerService.getCustomerTransactions(
        customerId,
        { page, limit }
      );

      sendSuccess(res, result);
    } catch (error) {
      logger.error('Admin: Failed to get transactions', { 
        customerId: req.params.customerId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      sendError(res, 'TRANSACTIONS_FETCH_FAILED', 500);
    }
  }

  // Delete customer (soft delete)
  async deleteCustomer(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.params.customerId;
      
      if (!customerId || !validateObjectId(customerId)) {
        sendError(res, 'INVALID_CUSTOMER_ID', 400);
        return;
      }

      logger.info('Admin: Deleting customer', { customerId });

      const result = await customerService.deleteCustomer(customerId);
      
      if (!result) {
        sendError(res, 'CUSTOMER_NOT_FOUND', 404);
        return;
      }

      sendSuccess(res, { deleted: true });
    } catch (error) {
      logger.error('Admin: Failed to delete customer', { 
        customerId: req.params.customerId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      sendError(res, 'CUSTOMER_DELETE_FAILED', 500);
    }
  }
}

export const adminController = new AdminController();
