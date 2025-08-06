const API_BASE_URL = 'http://localhost:3000/api/v1';

interface Customer {
  id: string;
  _id?: string;
  name: string;
  fullName?: string;
  cardNumber: string;
  phone: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  email?: string;
  // Optional fields that may not exist in API response
  bonus?: number;
  discount?: number;
  telegramBot?: boolean;
  totalSpent?: number;
  totalTransactions?: number;
  metadata?: {
    registrationSource?: string;
    lastActivity?: string;
    totalTransactions?: number;
    totalSpent?: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please try again later.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      throw error;
    }
  }

  // Customer endpoints
  async getCustomers(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<ApiResponse<PaginatedResponse<Customer>>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const endpoint = `/admin/customers${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ApiResponse<PaginatedResponse<Customer>>>(endpoint);
  }

  async getCustomer(id: string): Promise<ApiResponse<Customer>> {
    return this.request<ApiResponse<Customer>>(`/admin/customers/${id}`);
  }

  async updateCustomer(id: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> {
    return this.request<ApiResponse<Customer>>(`/admin/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateCustomerBalance(
    id: string,
    data: { amount: number; type: 'credit' | 'debit'; description?: string }
  ): Promise<ApiResponse<Customer>> {
    return this.request<ApiResponse<Customer>>(`/admin/customers/${id}/balance`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/admin/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async getCustomerTransactions(id: string): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/admin/customers/${id}/transactions`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const apiService = new ApiService();
export type { Customer, ApiResponse, PaginatedResponse };
