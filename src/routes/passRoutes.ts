import { Router } from 'express';
import { passController } from '@/controllers/pass.controller';

const router = Router();

// Роут для создания карты Apple Wallet
router.post('/apple', passController.createApplePass);

export default router;
