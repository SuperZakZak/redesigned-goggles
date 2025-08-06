import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { apiLimiter } from '../utils/rateLimiter';

const router = Router();
const customerController = new CustomerController();

// Apply rate limiting to all customer routes
router.use(apiLimiter);

// Customer CRUD operations
router.post('/', customerController.createCustomer.bind(customerController));
router.get('/stats', customerController.getCustomerStats.bind(customerController));
router.get('/:id', customerController.getCustomer.bind(customerController));
router.put('/:id', customerController.updateCustomer.bind(customerController));
router.get('/', customerController.getCustomers.bind(customerController));

// Balance operations
router.post('/:id/credit', customerController.creditBalance.bind(customerController));
router.post('/:id/debit', customerController.debitBalance.bind(customerController));

// Transaction history
router.get('/:id/transactions', customerController.getCustomerTransactions.bind(customerController));

// Apple Wallet pass generation
router.get('/:id/pass/apple', customerController.generateApplePass.bind(customerController));

export default router;
