import { Request, Response } from 'express';
import { passService } from '@/services/passService';
import Joi from 'joi';
import { sendSuccess, sendError } from '@/utils/response';
import { logger } from '@/config/logger';

// Схема валидации для входящих данных
const createPassSchema = Joi.object({
  customerId: Joi.string().required(),
});

class PassController {
  /**
   * Создает и возвращает карту Apple Wallet.
   */
  public async createApplePass(req: Request, res: Response): Promise<void> {
    try {
      // 1. Валидация входящих данных
      const { error, value } = createPassSchema.validate(req.body);
      if (error) {
        return sendError(res, 'Validation failed', 400, error.details);
      }

      const { customerId } = value;

      logger.info('Generating Apple Wallet pass', { customerId });

      // 2. Генерация карты через сервис (сервис сам получит данные клиента)
      const passBuffer = await passService.generateApplePass({ customerId });

      // 3. Отправка .pkpass файла
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename="loyalty-card-${customerId}.pkpass"`);
      res.status(201).send(passBuffer);

      logger.info('Apple Wallet pass generated successfully', { customerId });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create Apple Wallet pass', { error: errorMessage, customerId: req.body.customerId });
      return sendError(res, 'Failed to generate Apple Wallet pass', 500, errorMessage);
    }
  }
}

export const passController = new PassController();
