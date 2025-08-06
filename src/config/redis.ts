import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

class RedisConnection {
  private client: RedisClientType | null = null;
  private config: RedisConfig;

  constructor() {
    const password = process.env.REDIS_PASSWORD;
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      ...(password && { password }),
      db: parseInt(process.env.REDIS_DB || '0', 10),
    };
  }

  async connect(): Promise<RedisClientType> {
    try {
      if (this.client && this.client.isOpen) {
        return this.client;
      }

      const clientOptions: any = {
        socket: {
          host: this.config.host,
          port: this.config.port,
        },
        database: this.config.db,
      };

      if (this.config.password) {
        clientOptions.password = this.config.password;
      }

      this.client = createClient(clientOptions);

      this.client.on('error', (error: Error) => {
        logger.error('Redis connection error', { error: error.message });
      });

      this.client.on('connect', () => {
        logger.info('Redis connected successfully', {
          host: this.config.host,
          port: this.config.port,
          db: this.config.db,
        });
      });

      this.client.on('ready', () => {
        logger.info('Redis ready for commands');
      });

      this.client.on('end', () => {
        logger.warn('Redis connection ended');
      });

      await this.client.connect();
      return this.client;

    } catch (error) {
      logger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.client.isOpen) {
        await this.client.quit();
        logger.info('Redis disconnected successfully');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  getClient(): RedisClientType | null {
    return this.client;
  }
}

export const redisConnection = new RedisConnection();
export const connectRedis = (): Promise<RedisClientType> => redisConnection.connect();
export const disconnectRedis = (): Promise<void> => redisConnection.disconnect();
export const getRedisClient = (): RedisClientType | null => redisConnection.getClient();
