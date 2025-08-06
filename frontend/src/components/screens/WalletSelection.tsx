import { NavigationHeader } from '@/components/ui/NavigationHeader'
import type { DeviceType } from '@/types'

interface WalletSelectionProps {
  deviceType: DeviceType
  onAppleWallet: () => void
  onGoogleWallet: () => void
  onSkip: () => void
  onBack: () => void
}

export function WalletSelection({
  deviceType,
  onAppleWallet,
  onGoogleWallet,
  onSkip,
  onBack,
}: WalletSelectionProps) {
  const showAppleWallet = deviceType === 'ios'
  const showGoogleWallet = deviceType === 'android'
  const showBothWallets = deviceType === 'other'

  return (
    <div className="screen-container">
      <NavigationHeader 
        title="Добавить в кошелек" 
        onBack={onBack}
      />
      
      <div className="content-container">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-ios-green rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Регистрация завершена!
          </h2>
          <p className="text-gray-600">
            Добавьте карту лояльности в ваш кошелек для удобного использования
          </p>
        </div>

        <div className="space-y-4">
          {(showAppleWallet || showBothWallets) && (
            <button
              onClick={onAppleWallet}
              className="w-full wallet-button-apple"
            >
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Добавить в Apple Wallet
            </button>
          )}

          {(showGoogleWallet || showBothWallets) && (
            <button
              onClick={onGoogleWallet}
              className="w-full wallet-button-google"
            >
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Добавить в Google Pay
            </button>
          )}

          {showBothWallets && (
            <div className="text-center py-2">
              <span className="text-gray-400 text-sm">или</span>
            </div>
          )}

          <button
            onClick={onSkip}
            className="w-full ios-button-secondary"
          >
            Скачать карту
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Вы сможете добавить карту в кошелек позже через настройки приложения
          </p>
        </div>
      </div>
    </div>
  )
}
