import winston from 'winston';
import path from 'path';

interface LoggerConfig {
  level: string;
  logFile: string;
  maxSize: string;
  maxFiles: string;
}

const getLoggerConfig = (): LoggerConfig => ({
  level: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || './logs/app.log',
  maxSize: process.env.LOG_MAX_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '14d',
});

const config = getLoggerConfig();

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta,
    });
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create transports
const transports: winston.transport[] = [
  // File transport for all logs
  new winston.transports.File({
    filename: config.logFile,
    level: config.level,
    format: logFormat,
    maxsize: parseInt(config.maxSize.replace('m', '')) * 1024 * 1024,
    maxFiles: parseInt(config.maxFiles.replace('d', ''), 10),
    tailable: true,
  }),
  
  // Separate file for errors
  new winston.transports.File({
    filename: path.join(path.dirname(config.logFile), 'error.log'),
    level: 'error',
    format: logFormat,
    maxsize: parseInt(config.maxSize.replace('m', '')) * 1024 * 1024,
    maxFiles: parseInt(config.maxFiles.replace('d', ''), 10),
    tailable: true,
  }),
];

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(path.dirname(config.logFile), 'exceptions.log'),
    format: logFormat,
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(path.dirname(config.logFile), 'rejections.log'),
    format: logFormat,
  })
);

// Export helper functions
export const logInfo = (message: string, meta?: object): void => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: Error | object): void => {
  logger.error(message, { error });
};

export const logWarn = (message: string, meta?: object): void => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: object): void => {
  logger.debug(message, meta);
};
