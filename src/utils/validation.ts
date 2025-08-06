import Joi from 'joi';
import { ValidationError } from '../types/common';

// Common validation schemas
export const commonSchemas = {
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  name: Joi.string().min(1).max(50).trim().required(),
  amount: Joi.number().min(0).precision(2).required(),
  date: Joi.date().iso(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  },
};

// Customer validation schemas
export const customerSchemas = {
  create: Joi.object({
    name: commonSchemas.name,
    phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    registrationSource: Joi.string().valid('web', 'pos', 'admin').default('web')
  }),

  update: Joi.object({
    name: commonSchemas.name.optional(),
    phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional(),
    isActive: Joi.boolean().optional()
  }).min(1),

  query: Joi.object({
    ...commonSchemas.pagination,
    search: Joi.string().optional(),
    email: Joi.string().optional(),
    phone: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
    registrationSource: Joi.string().valid('web', 'pos', 'admin').optional(),
    dateFrom: commonSchemas.date.optional(),
    dateTo: commonSchemas.date.optional(),
    lastVisitAfter: commonSchemas.date.optional(),
    lastVisitBefore: commonSchemas.date.optional(),
  }),
};

// Balance operation validation schemas
export const balanceOperationSchemas = {
  operation: Joi.object({
    amount: Joi.number().positive().precision(2).required(),
    description: Joi.string().min(1).max(255).required(),
    source: Joi.string().valid('pos', 'admin', 'bonus', 'refund', 'purchase').required(),
    metadata: Joi.object({
      posTransactionId: Joi.string().optional(),
      adminUserId: Joi.string().optional(),
      orderId: Joi.string().optional(),
      campaignId: Joi.string().optional(),
      notes: Joi.string().max(500).optional()
    }).optional()
  })
};

// Transaction validation schemas
export const transactionSchemas = {
  query: Joi.object({
    ...commonSchemas.pagination,
    customerId: commonSchemas.objectId.optional(),
    type: Joi.string().valid('credit', 'debit').optional(),
    source: Joi.string().valid('pos', 'admin', 'bonus', 'refund', 'purchase').optional(),
    status: Joi.string().valid('pending', 'completed', 'failed', 'cancelled').optional(),
    dateFrom: commonSchemas.date.optional(),
    dateTo: commonSchemas.date.optional(),
    amountMin: Joi.number().min(0).optional(),
    amountMax: Joi.number().min(0).optional()
  })
};

// Validation helper function
export const validateSchema = <T>(
  schema: Joi.ObjectSchema<T>,
  data: unknown
): { value: T; errors?: ValidationError[] } => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const errors: ValidationError[] = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value,
    }));

    return { value, errors };
  }

  return { value };
};

// Specific validation functions for controllers
export const validateCustomerData = (data: any): { isValid: boolean; errors?: ValidationError[] } => {
  const { value, errors } = validateSchema(customerSchemas.create, data);
  return {
    isValid: !errors,
    ...(errors && { errors })
  };
};

export const validateBalanceOperation = (data: any): { isValid: boolean; errors?: ValidationError[] } => {
  const { value, errors } = validateSchema(balanceOperationSchemas.operation, data);
  return {
    isValid: !errors,
    ...(errors && { errors })
  };
};

// Middleware validation helper
export const createValidationMiddleware = <T>(schema: Joi.ObjectSchema<T>) => {
  return (req: any, res: any, next: any): void => {
    const { value, errors } = validateSchema(schema, req.body);

    if (errors) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    req.validatedBody = value;
    next();
  };
};
