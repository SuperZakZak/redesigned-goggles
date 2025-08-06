import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { apiLimiter } from '../utils/rateLimiter';

const router = Router();

// Apply rate limiting to admin routes
router.use(apiLimiter);

// Customer management routes
router.get('/customers', adminController.getCustomers.bind(adminController));
router.get('/customers/:customerId', adminController.getCustomerById.bind(adminController));
router.put('/customers/:customerId', adminController.updateCustomer.bind(adminController));
router.delete('/customers/:customerId', adminController.deleteCustomer.bind(adminController));

// Balance management routes
router.post('/customers/:customerId/balance', adminController.updateBalance.bind(adminController));

// Transaction routes
router.get('/customers/:customerId/transactions', adminController.getCustomerTransactions.bind(adminController));

export default router;
