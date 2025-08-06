import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config/app';
import { logger } from './config/logger';
import { apiLimiter } from './utils/rateLimiter';
import { errorHandler, notFoundHandler } from './utils/errorHandler';
import { sendSuccess } from './utils/response';
import apiRoutes from './routes/index';

// Create Express application
const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  app.use(apiLimiter);

  // Request logging middleware
  app.use((req: Request, res: Response, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    });

    next();
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
    }, 'Service is healthy');
  });

  // Static files (React frontend)
  app.use(express.static('frontend/dist'));

  // Direct Apple Wallet route (fallback for routing issues)
  app.post('/apple', async (req, res) => {
    try {
      // Validate input
      const { customerId } = req.body;
      if (!customerId) {
        res.status(400).json({ message: 'Ошибка валидации', details: [{ message: '"customerId" is required', path: ['customerId'], type: 'any.required' }] });
        return;
      }

      // Import services directly
      const { passService } = require('./services/passService');
      const passBuffer = await passService.generateApplePass({ customerId });
      
      res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
      res.setHeader('Content-Disposition', `attachment; filename="loyalty-card-${customerId}.pkpass"`);
      res.status(201).send(passBuffer);
      
      logger.info('Apple Wallet pass generated successfully via fallback route', { customerId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Apple Wallet fallback route error', { error: errorMessage, customerId: req.body.customerId });
      res.status(500).json({ message: 'Failed to generate Apple Wallet pass', error: errorMessage });
    }
  });

  // API routes
  app.use(config.apiPrefix, apiRoutes);

  // React Router fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
