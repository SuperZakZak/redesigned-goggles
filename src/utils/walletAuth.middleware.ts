import { Request, Response, NextFunction } from 'express';
import { config } from '../config/app';
import { logger } from '../config/logger';
import { createResponse } from './response';

/**
 * Middleware to validate Apple Wallet web service authentication
 * Apple sends Authorization: ApplePass <authenticationToken>
 * where authenticationToken should match the passTypeIdentifier
 */
export const validateAppleWalletAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      logger.warn('Missing Authorization header for Apple Wallet request', {
        path: req.path,
        method: req.method,
      });
      res.status(401).json(createResponse(false, 'Authorization required'));
      return;
    }

    // Check if it's an ApplePass authorization
    if (!authHeader.startsWith('ApplePass ')) {
      logger.warn('Invalid Authorization header format for Apple Wallet request', {
        path: req.path,
        method: req.method,
        authHeader: authHeader.substring(0, 20) + '...',
      });
      res.status(401).json(createResponse(false, 'Invalid authorization format'));
      return;
    }

    // Extract the authentication token
    const authToken = authHeader.substring('ApplePass '.length);

    // Validate against configured pass type identifier
    const expectedPassTypeId = config.appleWallet.passTypeId;
    
    if (!expectedPassTypeId) {
      logger.error('Apple Wallet pass type ID not configured');
      res.status(500).json(createResponse(false, 'Service configuration error'));
      return;
    }

    if (authToken !== expectedPassTypeId) {
      logger.warn('Invalid authentication token for Apple Wallet request', {
        path: req.path,
        method: req.method,
        expectedToken: expectedPassTypeId,
        receivedToken: authToken.substring(0, 20) + '...',
      });
      res.status(401).json(createResponse(false, 'Invalid authentication token'));
      return;
    }

    // Authentication successful
    logger.debug('Apple Wallet authentication successful', {
      path: req.path,
      method: req.method,
      passTypeId: expectedPassTypeId,
    });

    next();

  } catch (error) {
    logger.error('Error in Apple Wallet authentication middleware', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method,
    });
    res.status(500).json(createResponse(false, 'Internal server error'));
  }
};

/**
 * Middleware to validate Apple Wallet request parameters
 */
export const validateWalletParams = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { passTypeIdentifier, serialNumber, deviceLibraryIdentifier } = req.params;

    // Validate pass type identifier matches configuration
    if (passTypeIdentifier && passTypeIdentifier !== config.appleWallet.passTypeId) {
      logger.warn('Invalid pass type identifier in request', {
        path: req.path,
        expected: config.appleWallet.passTypeId,
        received: passTypeIdentifier,
      });
      res.status(404).json(createResponse(false, 'Pass type not found'));
      return;
    }

    // Validate serial number format (should be a valid ObjectId)
    if (serialNumber && !isValidObjectId(serialNumber)) {
      logger.warn('Invalid serial number format', {
        path: req.path,
        serialNumber,
      });
      res.status(400).json(createResponse(false, 'Invalid serial number format'));
      return;
    }

    // Validate device library identifier format
    if (deviceLibraryIdentifier && deviceLibraryIdentifier.length < 10) {
      logger.warn('Invalid device library identifier format', {
        path: req.path,
        deviceLibraryIdentifier: deviceLibraryIdentifier.substring(0, 8) + '...',
      });
      res.status(400).json(createResponse(false, 'Invalid device identifier format'));
      return;
    }

    next();

  } catch (error) {
    logger.error('Error in wallet parameter validation middleware', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      params: req.params,
    });
    res.status(500).json(createResponse(false, 'Internal server error'));
  }
};

/**
 * Helper function to validate ObjectId format
 */
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

export default {
  validateAppleWalletAuth,
  validateWalletParams,
};
