import type { Customer, WalletPass, ApiResponse, RegistrationFormData, CustomerCreationResponse } from '@/types'

const API_BASE_URL = '/api/v1'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    console.log(`🔗 API Request: ${config.method || 'GET'} ${url}`)
    const response = await fetch(url, config)
    
    if (!response.ok) {
      let errorMessage = 'API request failed'
      
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
        
        // Handle specific error cases
        if (response.status === 409) {
          if (errorMessage.includes('phone')) {
            errorMessage = 'Клиент с таким номером телефона уже зарегистрирован'
          } else if (errorMessage.includes('email')) {
            errorMessage = 'Клиент с таким email уже зарегистрирован'
          }
        }
      } catch {
        // If we can't parse error response, use default message
      }
      
      console.error(`❌ API Error: ${response.status} - ${errorMessage}`)
      throw new ApiError(response.status, errorMessage)
    }

    const data = await response.json()
    console.log(`✅ API Success: ${url}`, data.success ? '✓' : '?')
    return data
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    
    // Network or other errors
    console.error('🚫 Network Error:', error)
    throw new ApiError(0, 'Ошибка сети. Проверьте подключение к интернету.')
  }
}

export const api = {
  // Create customer
  async createCustomer(data: RegistrationFormData): Promise<ApiResponse<CustomerCreationResponse>> {
    return apiRequest<CustomerCreationResponse>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Generate Apple Wallet pass
  async generateAppleWalletPass(customerId: string): Promise<ApiResponse<WalletPass>> {
    // Use working fallback endpoint instead of broken /api/v1/passes/apple
    const url = '/apple' // Direct fallback endpoint that works
    
    const config: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customerId }),
    }

    try {
      console.log(`🔗 API Request: POST ${url}`)
      const response = await fetch(url, config)
      
      if (!response.ok) {
        let errorMessage = 'Apple Wallet generation failed'
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If we can't parse error response, use default message
        }
        
        console.error(`❌ Apple Wallet Error: ${response.status} - ${errorMessage}`)
        throw new ApiError(response.status, errorMessage)
      }

      // For Apple Wallet, we expect a binary .pkpass file, not JSON
      // Create a download URL for the generated pass
      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      
      console.log(`✅ Apple Wallet Success: Generated .pkpass file`)
      return {
        success: true,
        data: {
          id: 'apple-pass-' + Date.now(),
          customerId,
          downloadUrl,
        },
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // Network or other errors
      console.error('🚫 Apple Wallet Network Error:', error)
      throw new ApiError(0, 'Ошибка сети при создании Apple Wallet карты.')
    }
  },

  // Get Google Wallet link
  async getGoogleWalletLink(customerId: string): Promise<ApiResponse<{ link: string }>> {
    return apiRequest<{ link: string }>(`/google-wallet/passes/${customerId}/link`)
  },

  // Generate QR code for wallet pass
  async generateQRCode(customerId: string): Promise<ApiResponse<{ qrCode: string }>> {
    return apiRequest<{ qrCode: string }>(`/wallet/qr/${customerId}`)
  },
}

// Demo mode fallback (for development)
export const demoApi = {
  async createCustomer(data: RegistrationFormData): Promise<ApiResponse<Customer>> {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate network delay
    
    return {
      success: true,
      data: {
        id: 'demo-' + Date.now(),
        name: data.name,
        phone: data.phone,
        createdAt: new Date().toISOString(),
      },
    }
  },

  async generateAppleWalletPass(customerId: string): Promise<ApiResponse<WalletPass>> {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    return {
      success: true,
      data: {
        id: 'pass-' + Date.now(),
        customerId,
        downloadUrl: '/demo/loyalty-card.pkpass',
      },
    }
  },

  async getGoogleWalletLink(customerId: string): Promise<ApiResponse<{ link: string }>> {
    await new Promise(resolve => setTimeout(resolve, 1200))
    
    return {
      success: true,
      data: {
        link: `https://pay.google.com/gp/v/save/demo-${customerId}`,
      },
    }
  },

  async generateQRCode(_customerId: string): Promise<ApiResponse<{ qrCode: string }>> {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    return {
      success: true,
      data: {
        qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
      },
    }
  },
}

// Always use real API when backend is available
// Demo API is only for standalone demos without backend
export const apiService = api
