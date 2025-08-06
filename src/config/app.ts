import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  corsOrigin: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  appleWallet: {
    teamId: string;
    passTypeId: string;
    certificatePath: string;
    certificatePassword: string;
  };
  apns: {
    cert: string;
    key: string;
    passphrase?: string | undefined;
  };
  googleWallet: {
    serviceAccountEmail: string;
    serviceAccountFile: string;
    applicationName: string;
    issuerId: string;
  };
}

const validateRequiredEnvVars = (): void => {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ FATAL ERROR: Missing required environment variables:');
    console.error(`- ${missing.join('\n- ')}`);
    console.error('Please add them to your .env file before starting the server.');
    process.exit(1);
  }
};

const getAppConfig = (): AppConfig => {
  validateRequiredEnvVars();

  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      refreshSecret: process.env.JWT_REFRESH_SECRET!,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    },
    appleWallet: {
      teamId: process.env.APPLE_WALLET_TEAM_ID || '',
      passTypeId: process.env.APPLE_WALLET_PASS_TYPE_ID || '',
      certificatePath: process.env.APPLE_WALLET_CERTIFICATE_PATH || '',
      certificatePassword: process.env.APPLE_WALLET_CERTIFICATE_PASSWORD || '',
    },
    apns: {
      cert: process.env.APNS_CERT_PATH || '',
      key: process.env.APNS_KEY_PATH || '',
      passphrase: process.env.APNS_PASSPHRASE ? process.env.APNS_PASSPHRASE : undefined,
    },
    googleWallet: {
      serviceAccountEmail: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL || '',
      serviceAccountFile: process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_FILE || '',
      applicationName: process.env.GOOGLE_WALLET_APPLICATION_NAME || 'Loy Digital Loyalty',
      issuerId: process.env.GOOGLE_WALLET_ISSUER_ID || '',
    },
  };
};

export const config = getAppConfig();

export const isDevelopment = (): boolean => config.nodeEnv === 'development';
export const isProduction = (): boolean => config.nodeEnv === 'production';
export const isTest = (): boolean => config.nodeEnv === 'test';
