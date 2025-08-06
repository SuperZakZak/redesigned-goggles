import { Router } from 'express';
import WalletController from '../controllers/wallet.controller';
import { validateAppleWalletAuth, validateWalletParams } from '../utils/walletAuth.middleware';

const router = Router();
const walletController = new WalletController();

/**
 * Apple Wallet Web Service Routes
 * These endpoints are required by Apple for pass updates
 */

// Apply Apple Wallet authentication to all routes
router.use(validateAppleWalletAuth);
router.use(validateWalletParams);

/**
 * Register device for pass updates
 * POST /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber
 */
router.post(
  '/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
  walletController.registerDevice
);

/**
 * Get serial numbers of passes that need updates
 * GET /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier
 */
router.get(
  '/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier',
  walletController.getUpdatablePasses
);

/**
 * Get the latest version of a pass
 * GET /v1/passes/:passTypeIdentifier/:serialNumber
 */
router.get(
  '/v1/passes/:passTypeIdentifier/:serialNumber',
  walletController.getLatestPass
);

/**
 * Unregister device from pass updates
 * DELETE /v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber
 */
router.delete(
  '/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
  walletController.unregisterDevice
);

/**
 * Log errors from devices
 * POST /v1/log
 */
router.post('/v1/log', walletController.logError);

export default router;
