import { useState, useCallback } from 'react'
import { useMutation } from 'react-query'
import type { RegistrationState, RegistrationFormData } from '../types'
import { detectDevice } from '../lib/utils'
import { api } from '../lib/api'

const initialState: RegistrationState = {
  step: 'form',
  customer: null,
  walletPass: null,
  deviceType: detectDevice(),
  isLoading: false,
  error: null,
}

export function useRegistration() {
  const [state, setState] = useState<RegistrationState>(initialState)

  const setStep = useCallback((step: RegistrationState['step']) => {
    setState(prev => ({ ...prev, step, error: null }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }))
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }, [])

  // Customer creation mutation
  const customerMutation = useMutation<any, Error, RegistrationFormData>({
    mutationFn: (data: RegistrationFormData) => api.createCustomer(data),
    onMutate: () => {
      setLoading(true)
      setError(null)
    },
    onSuccess: (response: any) => {
      console.log('🔍 Customer API Response:', response)
      if (response.success && response.data) {
        console.log('✅ Customer created successfully:', response.data)
        console.log('🔍 Customer data from API:', response.data.customer)
        console.log('🔍 Customer ID:', response.data.customer?.id)
        console.log('🔍 Customer Name:', response.data.customer?.name)
        
        setState(prev => {
          const newState = {
            ...prev,
            customer: response.data.customer,
            isLoading: false,
            step: 'wallet' as const,
          }
          console.log('🔍 New state after customer creation:', newState)
          return newState
        })
      } else {
        console.error('❌ Customer creation failed:', response.error)
        setError(response.error || 'Ошибка при создании аккаунта')
        setLoading(false)
      }
    },
    onError: (error: any) => {
      console.error('❌ Customer creation error:', error)
      
      // Handle specific API errors
      if (error.status === 409) {
        setError(error.message || 'Клиент с такими данными уже зарегистрирован')
      } else if (error.status === 400) {
        setError('Проверьте правильность введенных данных')
      } else if (error.status === 0) {
        setError('Не удается подключиться к серверу. Проверьте интернет-соединение.')
      } else {
        setError(error.message || 'Ошибка при создании аккаунта')
      }
      
      setLoading(false)
    },
  })

  // Apple Wallet mutation
  const appleWalletMutation = useMutation({
    mutationFn: (customerId: string) => api.generateAppleWalletPass(customerId),
    onMutate: () => {
      setLoading(true)
      setError(null)
    },
    onSuccess: (response: any) => {
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          walletPass: response.data!,
          isLoading: false,
        }))
        
        // Trigger download if URL is available
        if (response.data.downloadUrl) {
          window.location.href = response.data.downloadUrl
          setTimeout(() => setStep('success'), 2000)
        }
      } else {
        setError(response.error || 'Ошибка при создании карты Apple Wallet')
        setStep('download')
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Ошибка при создании карты Apple Wallet')
      setStep('download')
    },
  })

  // Google Wallet mutation
  const googleWalletMutation = useMutation({
    mutationFn: (customerId: string) => api.getGoogleWalletLink(customerId),
    onMutate: () => {
      setLoading(true)
      setError(null)
    },
    onSuccess: (response: any) => {
      if (response.success && response.data) {
        window.open(response.data.link, '_blank')
        setLoading(false)
        setTimeout(() => setStep('success'), 1500)
      } else {
        setError(response.error || 'Ошибка при создании карты Google Wallet')
        setStep('download')
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Ошибка при создании карты Google Wallet')
      setStep('download')
    },
  })

  // QR Code mutation
  const qrCodeMutation = useMutation({
    mutationFn: (customerId: string) => api.generateQRCode(customerId),
    onMutate: () => {
      setLoading(true)
      setError(null)
    },
    onSuccess: (response: any) => {
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          walletPass: {
            ...prev.walletPass!,
            qrCode: response.data!.qrCode,
          },
          isLoading: false,
        }))
      } else {
        setError(response.error || 'Ошибка при создании QR-кода')
      }
    },
    onError: (error: any) => {
      setError(error.message || 'Ошибка при создании QR-кода')
    },
  })

  const registerCustomer = useCallback((data: RegistrationFormData) => {
    customerMutation.mutate(data)
  }, [customerMutation])

  const addToAppleWallet = useCallback(() => {
    console.log('🍎 Apple Wallet button clicked!', { customerId: state.customer?.id })
    if (state.customer?.id) {
      console.log('🍎 Starting Apple Wallet generation...', state.customer.id)
      appleWalletMutation.mutate(state.customer.id)
    } else {
      console.error('❌ No customer ID available for Apple Wallet generation')
    }
  }, [state.customer?.id, appleWalletMutation])

  const addToGoogleWallet = useCallback(() => {
    if (state.customer?.id) {
      googleWalletMutation.mutate(state.customer.id)
    }
  }, [state.customer?.id, googleWalletMutation])

  const generateQRCode = useCallback(() => {
    if (state.customer?.id) {
      qrCodeMutation.mutate(state.customer.id)
    }
  }, [state.customer?.id, qrCodeMutation])

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  return {
    ...state,
    setStep,
    setError,
    registerCustomer,
    addToAppleWallet,
    addToGoogleWallet,
    generateQRCode,
    reset,
  }
}
