// Register module-alias for production builds
require('module-alias/register');

import { config } from '@/config/app';
import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { connectRedis, disconnectRedis } from '@/config/redis';
import { passService } from '@/services/pass.service';
import createApp from './app';

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close database connections
    await disconnectDatabase();
    await disconnectRedis();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  }
};

// Start server
const startServer = async (): Promise<void> => {
  // Setup global error handlers FIRST to catch any startup errors
  process.on('unhandledRejection', (reason: unknown) => {
    console.error('💥 Unhandled Rejection at:', reason);
    logger.error('Unhandled Promise Rejection', { reason });
    process.exit(1);
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('💥 Uncaught Exception:', error);
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  try {
    console.log('🔵 [1/5] Starting server...');

    // Connect to databases
    await connectDatabase();
    console.log('🔵 [2/5] Database connected.');
    await connectRedis();
    console.log('🔵 [3/5] Redis connected.');

    // Initialize services
    await passService.initialize();
    console.log('🔵 [4/5] Services initialized.');

    // Create Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log('🟢 [5/5] Server started successfully.');
      logger.info('Server started successfully', {
        port: config.port,
        environment: config.nodeEnv,
        apiPrefix: config.apiPrefix,
      });
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : '',
    });
    process.exit(1);
  }
};

// Start the application
startServer();
