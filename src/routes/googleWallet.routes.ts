import { Router } from 'express';
import { googleWalletController } from '../controllers/googleWallet.controller';
import { apiLimiter } from '../utils/rateLimiter';

const router = Router();

/**
 * Google Wallet Routes
 * All routes are prefixed with /api/v1/google-wallet
 */

// Apply rate limiting to all Google Wallet routes
router.use(apiLimiter);

/**
 * @route   POST /api/v1/google-wallet/passes
 * @desc    Create Google Wallet pass for customer
 * @access  Public
 */
router.post('/passes', googleWalletController.createPass.bind(googleWalletController));

/**
 * @route   GET /api/v1/google-wallet/passes/:customerId/link
 * @desc    Generate "Add to Google Wallet" link
 * @access  Public
 */
router.get('/passes/:customerId/link', googleWalletController.generateAddToWalletLink.bind(googleWalletController));

/**
 * @route   PUT /api/v1/google-wallet/passes/:customerId/balance
 * @desc    Update Google Wallet pass balance
 * @access  Public
 */
router.put('/passes/:customerId/balance', googleWalletController.updateBalance.bind(googleWalletController));

/**
 * @route   POST /api/v1/google-wallet/webhook
 * @desc    Handle Google Wallet webhook
 * @access  Public
 */
router.post('/webhook', googleWalletController.handleWebhook.bind(googleWalletController));

/**
 * @route   GET /api/v1/google-wallet/status
 * @desc    Get Google Wallet service status
 * @access  Public
 */
router.get('/status', googleWalletController.getStatus.bind(googleWalletController));

export default router;
