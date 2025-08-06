import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const walletConfig = {
  // Apple Wallet - Support both new and legacy env var names
  appleTeamId: process.env.APPLE_WALLET_TEAM_ID || process.env.APPLE_TEAM_ID || '',
  applePassTypeId: process.env.APPLE_WALLET_PASS_TYPE_ID || process.env.APPLE_PASS_TYPE_ID || '',
  appleCertPath:
    process.env.APPLE_WALLET_CERTIFICATE_PATH ||
    process.env.APPLE_CERT_PATH ||
    path.resolve('certificates', 'Certificates.p12'),
  appleCertPassword: process.env.APPLE_WALLET_CERTIFICATE_PASSWORD || process.env.APPLE_CERT_PASSWORD || '',
  appleWwdrPath: process.env.APPLE_WWDR_PATH || path.resolve('certificates', 'pass(2).cer'),
  
  // Google Wallet
  googleApplicationName: process.env.GOOGLE_APPLICATION_NAME || 'Loy Digital Loyalty Platform',
  googleIssuerId: process.env.GOOGLE_WALLET_ISSUER_ID || '',
  googleServiceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || path.resolve('certificates', 'google-service-account.json'),
  googleLoyaltyClassId: process.env.GOOGLE_LOYALTY_CLASS_ID || '',
  googleOrigins: process.env.GOOGLE_WALLET_ORIGINS?.split(',') || ['https://localhost:3000'],
};

// Validation warnings
if (!walletConfig.appleTeamId || !walletConfig.applePassTypeId) {
  // eslint-disable-next-line no-console
  console.warn('[walletConfig] Apple Wallet env vars are not fully set.');
}

if (!walletConfig.googleIssuerId || !walletConfig.googleLoyaltyClassId) {
  // eslint-disable-next-line no-console
  console.warn('[walletConfig] Google Wallet env vars are not fully set.');
}
