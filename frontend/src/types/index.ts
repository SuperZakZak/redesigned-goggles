export interface Customer {
  id?: string;
  name: string;
  phone: string;
  cardNumber?: string;
  balance?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface RegistrationFormData {
  name: string;
  phone: string;
}

export interface WalletPass {
  id: string;
  customerId: string;
  passUrl?: string;
  downloadUrl?: string;
  qrCode?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CustomerCreationResponse {
  customer: Customer;
}

export type DeviceType = 'ios' | 'android' | 'other';

export type RegistrationStep = 'form' | 'wallet' | 'download' | 'success';

export interface RegistrationState {
  step: RegistrationStep;
  customer: Customer | null;
  walletPass: WalletPass | null;
  deviceType: DeviceType;
  isLoading: boolean;
  error: string | null;
}

export interface ValidationErrors {
  name?: string;
  phone?: string;
}
