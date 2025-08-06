import { Router } from 'express';
import customerRoutes from './customerRoutes';
import passRoutes from './passRoutes';
import walletRoutes from './wallet.route';
import googleWalletRoutes from './googleWallet.routes';
import adminRoutes from './adminRoutes';

const router = Router();

// API routes
router.use('/customers', customerRoutes);
router.use('/passes', passRoutes);

// Apple Wallet web service routes (mounted separately for Apple's requirements)
router.use('/wallet', walletRoutes);

// Google Wallet API routes
router.use('/google-wallet', googleWalletRoutes);

// Admin panel routes
router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Loy API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
