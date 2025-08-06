import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { passService } from '@/services/passService';
import { sendSuccess } from '@/utils/response';
import { logger } from '@/config/logger';

const issueSchema = Joi.object({
  customerId: Joi.string().required(),
});

export const issueApplePass = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = issueSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    const pkpass = await passService.generateApplePass(value);
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', 'attachment; filename="loy.pkpass"');
    return res.status(200).send(pkpass);
  } catch (err) {
    logger.error('Failed to issue Apple pass', { error: (err as Error).message });
    return next(err);
  }
};

const registerSchema = Joi.object({
  serial: Joi.string().required(),
  deviceLibraryId: Joi.string().required(),
  pushToken: Joi.string().required(),
});

export const registerDevice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = registerSchema.validate({ ...req.params, ...req.body });
    if (error) return res.status(400).json({ success: false, message: error.message });

    await passService.registerDevice(value.serial, value.deviceLibraryId, value.pushToken);
    return sendSuccess(res, null, 'Device registered');
  } catch (err) {
    return next(err);
  }
};

export const triggerPushUpdate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serialNumber } = req.params as { serialNumber: string };
    await passService.pushUpdate(serialNumber);
    return sendSuccess(res, null, 'Push triggered');
  } catch (err) {
    return next(err);
  }
};
