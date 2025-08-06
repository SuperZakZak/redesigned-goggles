import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '@/types/common';
import { logger } from '@/config/logger';

// Success response helper
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

// Error response helper
export const sendError = (
  res: Response,
  error: string,
  statusCode = 500,
  details?: unknown
): void => {
  const response: ApiResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  // Log error details for debugging
  logger.error('API Error Response', {
    statusCode,
    error,
    details,
  });

  res.status(statusCode).json(response);
};

// Paginated response helper
export const sendPaginatedResponse = <T>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): void => {
  const totalPages = Math.ceil(total / limit);
  
  const paginatedResponse: PaginatedResponse<T> = {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };

  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: paginatedResponse,
    ...(message && { message }),
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
};

// Validation error response
export const sendValidationError = (
  res: Response,
  errors: Array<{ field: string; message: string; value?: unknown }>
): void => {
  const response: ApiResponse = {
    success: false,
    error: 'Validation failed',
    timestamp: new Date().toISOString(),
  };

  res.status(400).json({
    ...response,
    errors,
  });
};

// Not found response
export const sendNotFound = (res: Response, resource = 'Resource'): void => {
  sendError(res, `${resource} not found`, 404);
};

// Unauthorized response
export const sendUnauthorized = (res: Response, message = 'Unauthorized'): void => {
  sendError(res, message, 401);
};

// Forbidden response
export const sendForbidden = (res: Response, message = 'Forbidden'): void => {
  sendError(res, message, 403);
};

// Conflict response
export const sendConflict = (res: Response, message = 'Resource already exists'): void => {
  sendError(res, message, 409);
};

// Too many requests response
export const sendTooManyRequests = (res: Response, message = 'Too many requests'): void => {
  sendError(res, message, 429);
};

// Generic response creator
export const createResponse = <T>(
  success: boolean,
  message: string,
  data?: T
): ApiResponse<T> => {
  return {
    success,
    message,
    ...(data !== undefined && { data }),
    timestamp: new Date().toISOString(),
  };
};
