import rateLimit from 'express-rate-limit';
import { config } from '../config/app';
import { sendTooManyRequests } from './response';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendTooManyRequests(res, 'Too many requests from this IP, please try again later');
  },
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    sendTooManyRequests(res, 'Too many authentication attempts, please try again later');
  },
});

// Wallet creation rate limiter
export const walletLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 wallet creations per hour
  message: 'Too many wallet creation requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    sendTooManyRequests(res, 'Too many wallet creation requests, please try again later');
  },
});
