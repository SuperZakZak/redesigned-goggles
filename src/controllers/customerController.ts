import { Request, Response } from 'express';
import { CustomerService, CreateCustomerData, UpdateCustomerData, BalanceOperationData } from '../services/customerService';
import { validateCustomerData, validateBalanceOperation } from '../utils/validation';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../config/logger';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  async createCustomer(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(2, 15);
    
    const logContext = {
      requestId,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      body: { ...req.body, phone: req.body.phone ? '***' : undefined },
    };

    try {
      logger.info('Creating customer', logContext);
      
      const validationResult = validateCustomerData(req.body);
      if (!validationResult.isValid) {
        logger.warn('Validation failed', { ...logContext, errors: validationResult.errors });
        sendError(res, 'Validation failed', 400, validationResult.errors);
        return;
      }

      const customerData: CreateCustomerData = {
        name: req.body.name,
        phone: req.body.phone,
        registrationSource: req.body.registrationSource || 'web'
      };

      const customer = await this.customerService.createCustomer(customerData);
      const duration = Date.now() - startTime;

      logger.info('Customer created successfully', { 
        ...logContext,
        customerId: customer._id,
        name: customer.name,
        duration,
        status: 'success'
      });

      sendSuccess(res, {
        customer: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          cardNumber: customer.cardNumber,
          balance: customer.balance,
          isActive: customer.isActive,
          createdAt: customer.createdAt
        }
      }, 'Customer created successfully', 201);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const duration = Date.now() - startTime;
      
      logger.error('Failed to create customer', { 
        ...logContext,
        error: errorMessage,
        duration,
        status: 'error',
        stack: error instanceof Error ? error.stack : undefined
      });

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          sendError(res, error.message, 409);
          return;
        }
        
        if (error.name === 'ValidationError') {
          sendError(res, 'Validation error', 400, { details: error.message });
          return;
        }
        
        if (error.name === 'MongoServerError') {
          logger.error('MongoDB error', { 
            ...logContext,
            error: error.message,
            code: (error as any).code,
            stack: error.stack
          });
        }
      }
      
      // Default error response
      sendError(res, 'Internal server error', 500, { requestId });
    }
  }

  async getCustomer(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      const customer = await this.customerService.getCustomerById(id);
      if (!customer) {
        sendError(res, 'Customer not found', 404);
        return;
      }

      sendSuccess(res, {
        customer: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          cardNumber: customer.cardNumber,
          balance: customer.balance,
          isActive: customer.isActive,
          walletCards: customer.walletCards,
          metadata: customer.metadata,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        }
      }, 'Customer retrieved successfully');
    } catch (error) {
      logger.error('Failed to get customer via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: req.params.id,
        ip: req.ip 
      });

      sendError(res, 'Internal server error', 500);
    }
  }

  async updateCustomer(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      const updateData: UpdateCustomerData = {};
      
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      if (Object.keys(updateData).length === 0) {
        sendError(res, 'No fields to update', 400);
        return;
      }

      const customer = await this.customerService.updateCustomer(id, updateData);
      if (!customer) {
        sendError(res, 'Customer not found', 404);
        return;
      }

      logger.info('Customer updated via API', { 
        customerId: id,
        updatedFields: Object.keys(updateData),
        ip: req.ip 
      });

      sendSuccess(res, {
        customer: {
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          cardNumber: customer.cardNumber,
          balance: customer.balance,
          isActive: customer.isActive,
          updatedAt: customer.updatedAt
        }
      }, 'Customer updated successfully');
    } catch (error) {
      logger.error('Failed to update customer via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: req.params.id,
        body: req.body,
        ip: req.ip 
      });

      if (error instanceof Error && error.message.includes('already exists')) {
        sendError(res, error.message, 409);
      } else {
        sendError(res, 'Internal server error', 500);
      }
    }
  }

  async getCustomers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const sortField = req.query.sortField as string || 'createdAt';
      const sortOrder: 1 | -1 = req.query.sortOrder === 'asc' ? 1 : -1;

      const filters: any = {};
      
      if (req.query.email) filters.email = req.query.email as string;
      if (req.query.phone) filters.phone = req.query.phone as string;
      if (req.query.isActive === 'true') filters.isActive = true;
      if (req.query.isActive === 'false') filters.isActive = false;
      if (req.query.registrationSource) {
        filters.registrationSource = req.query.registrationSource as string;
      }
      if (req.query.search) filters.searchTerm = req.query.search as string;
      if (req.query.dateFrom) filters.dateFrom = new Date(req.query.dateFrom as string);
      if (req.query.dateTo) filters.dateTo = new Date(req.query.dateTo as string);

      const options = {
        page,
        limit,
        sort: { [sortField]: sortOrder } as Record<string, 1 | -1>
      };

      const result = await this.customerService.searchCustomers(filters, options);

      sendSuccess(res, {
        customers: result.data.map(customer => ({
          id: customer._id,
          name: customer.name,
          phone: customer.phone,
          cardNumber: customer.cardNumber,
          balance: customer.balance,
          isActive: customer.isActive,
          metadata: customer.metadata,
          createdAt: customer.createdAt
        })),
        pagination: result.pagination
      }, 'Customers retrieved successfully');
    } catch (error) {
      logger.error('Failed to get customers via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query,
        ip: req.ip 
      });

      sendError(res, 'Internal server error', 500);
    }
  }

  async creditBalance(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      const validationResult = validateBalanceOperation(req.body);
      if (!validationResult.isValid) {
        sendError(res, 'Validation failed', 400, validationResult.errors);
        return;
      }

      const operationData: BalanceOperationData = {
        customerId: id,
        amount: req.body.amount,
        description: req.body.description,
        source: req.body.source,
        metadata: req.body.metadata
      };

      const result = await this.customerService.creditBalance(operationData);

      logger.info('Balance credited via API', { 
        customerId: id,
        amount: req.body.amount,
        transactionId: result.transaction._id,
        ip: req.ip 
      });

      sendSuccess(res, {
        customer: {
          id: result.customer._id,
          balance: result.customer.balance
        },
        transaction: {
          id: result.transaction._id,
          type: result.transaction.type,
          amount: result.transaction.amount,
          balanceBefore: result.transaction.balanceBefore,
          balanceAfter: result.transaction.balanceAfter,
          description: result.transaction.description,
          createdAt: result.transaction.createdAt
        }
      }, 'Balance credited successfully');
    } catch (error) {
      logger.error('Failed to credit balance via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: req.params.id,
        body: req.body,
        ip: req.ip 
      });

      if (error instanceof Error && error.message === 'Customer not found') {
        sendError(res, error.message, 404);
      } else if (error instanceof Error && error.message === 'Customer account is inactive') {
        sendError(res, error.message, 400);
      } else {
        sendError(res, 'Internal server error', 500);
      }
    }
  }

  async debitBalance(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      const validationResult = validateBalanceOperation(req.body);
      if (!validationResult.isValid) {
        sendError(res, 'Validation failed', 400, validationResult.errors);
        return;
      }

      const operationData: BalanceOperationData = {
        customerId: id,
        amount: req.body.amount,
        description: req.body.description,
        source: req.body.source,
        metadata: req.body.metadata
      };

      const result = await this.customerService.debitBalance(operationData);

      logger.info('Balance debited via API', { 
        customerId: id,
        amount: req.body.amount,
        transactionId: result.transaction._id,
        ip: req.ip 
      });

      sendSuccess(res, {
        customer: {
          id: result.customer._id,
          balance: result.customer.balance
        },
        transaction: {
          id: result.transaction._id,
          type: result.transaction.type,
          amount: result.transaction.amount,
          balanceBefore: result.transaction.balanceBefore,
          balanceAfter: result.transaction.balanceAfter,
          description: result.transaction.description,
          createdAt: result.transaction.createdAt
        }
      }, 'Balance debited successfully');
    } catch (error) {
      logger.error('Failed to debit balance via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: req.params.id,
        body: req.body,
        ip: req.ip 
      });

      if (error instanceof Error && error.message === 'Customer not found') {
        sendError(res, error.message, 404);
      } else if (error instanceof Error && 
                 (error.message === 'Customer account is inactive' || 
                  error.message === 'Insufficient balance')) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, 'Internal server error', 500);
      }
    }
  }

  async getCustomerTransactions(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      if (!id) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      
      const options = {
        page,
        limit,
        sort: { createdAt: -1 as const }
      };

      const result = await this.customerService.getCustomerTransactions(id, options);

      sendSuccess(res, {
        transactions: result.data.map(transaction => ({
          id: transaction._id,
          type: transaction.type,
          amount: transaction.amount,
          balanceBefore: transaction.balanceBefore,
          balanceAfter: transaction.balanceAfter,
          description: transaction.description,
          source: transaction.source,
          status: transaction.status,
          createdAt: transaction.createdAt,
          processedAt: transaction.processedAt
        })),
        pagination: result.pagination
      }, 'Customer transactions retrieved successfully');
    } catch (error) {
      logger.error('Failed to get customer transactions via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: req.params.id,
        query: req.query,
        ip: req.ip 
      });

      sendError(res, 'Internal server error', 500);
    }
  }

  async getCustomerStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.customerService.getCustomerStats();

      sendSuccess(res, { stats }, 'Customer statistics retrieved successfully');
    } catch (error) {
      logger.error('Failed to get customer stats via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip 
      });

      sendError(res, 'Internal server error', 500);
    }
  }

  async generateApplePass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        sendError(res, 'Customer ID is required', 400);
        return;
      }

      // Find customer
      const customer = await this.customerService.getCustomerById(id);
      if (!customer) {
        sendError(res, 'Customer not found', 404);
        return;
      }

      // Generate Apple Wallet pass using wallet service
      const { generatePass } = await import('../services/wallet.service');
      const passBuffer = await generatePass(customer);
      
      // Set appropriate headers for .pkpass file
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename="loyalty-card-${customer.cardNumber}.pkpass"`);
      res.setHeader('Content-Length', passBuffer.length);
      
      // Send the pass file
      res.send(passBuffer);
      
      logger.info('Apple Wallet pass generated successfully', {
        customerId: id,
        cardNumber: customer.cardNumber,
        passSize: passBuffer.length
      });
      
    } catch (error) {
      logger.error('Failed to generate Apple Wallet pass', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId: req.params.id,
        ip: req.ip
      });
      
      sendError(res, 'Failed to generate Apple Wallet pass', 500);
    }
  }
}
