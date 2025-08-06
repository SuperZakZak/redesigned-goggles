/**
 * Google Wallet API Types
 * Following Google Wallet REST API v1 specification
 */

export interface GoogleWalletLoyaltyClass {
  id: string;
  issuerName: string;
  programName: string;
  programLogo?: {
    sourceUri: {
      uri: string;
    };
  };
  accountIdLabel?: string;
  accountNameLabel?: string;
  programDetails?: string;
  rewardsTier?: string;
  rewardsTierLabel?: string;
  secondaryRewardsTier?: string;
  secondaryRewardsTierLabel?: string;
  localizedIssuerName?: {
    defaultValue: {
      language: string;
      value: string;
    };
  };
  localizedProgramName?: {
    defaultValue: {
      language: string;
      value: string;
    };
  };
  hexBackgroundColor?: string;
  locations?: Array<{
    latitude: number;
    longitude: number;
  }>;
  reviewStatus?: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  version?: string;
}

export interface GoogleWalletLoyaltyObject {
  id: string;
  classId: string;
  state: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'INACTIVE';
  accountId: string;
  accountName: string;
  loyaltyPoints?: {
    balance: {
      string: string;
    };
    label?: string;
    localizedLabel?: {
      defaultValue: {
        language: string;
        value: string;
      };
    };
  };
  secondaryLoyaltyPoints?: {
    balance: {
      string: string;
    };
    label?: string;
  };
  linkedOfferIds?: string[];
  hasUsers?: boolean;
  smartTapRedemptionValue?: string;
  barcode?: {
    type: 'QR_CODE' | 'PDF_417' | 'AZTEC' | 'CODE_128';
    value: string;
    alternateText?: string;
  };
  heroImage?: {
    sourceUri: {
      uri: string;
    };
  };
  textModulesData?: Array<{
    header: string;
    body: string;
    id: string;
  }>;
  linksModuleData?: {
    uris: Array<{
      uri: string;
      description: string;
    }>;
  };
  imageModulesData?: Array<{
    mainImage: {
      sourceUri: {
        uri: string;
      };
    };
    id: string;
  }>;
  messages?: Array<{
    header: string;
    body: string;
    kind?: string;
  }>;
  validTimeInterval?: {
    start?: {
      date: string;
    };
    end?: {
      date: string;
    };
  };
  version?: string;
}

export interface GoogleWalletAddToWalletLink {
  saveUrl: string;
}

export interface GoogleWalletServiceConfig {
  applicationName: string;
  issuerId: string;
  serviceAccountKeyPath: string;
  loyaltyClassId: string;
  origins: string[];
}

export interface GoogleWalletPassData {
  customerId: string;
  customerName: string;
  balance: number;
  level?: string;
  qrCode?: string;
  additionalInfo?: Record<string, string>;
}

export interface GoogleWalletWebhookPayload {
  eventType: 'save' | 'del';
  expTimeMillis: string;
  nonce: string;
  objectId: string;
  classId: string;
}

export type GoogleWalletError = {
  code: number;
  message: string;
  details?: Array<{
    '@type': string;
    [key: string]: unknown;
  }>;
};
