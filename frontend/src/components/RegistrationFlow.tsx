import { useRegistration } from '@/hooks/useRegistration'
import { RegistrationForm } from './screens/RegistrationForm'
import { WalletSelection } from './screens/WalletSelection'
import { DownloadScreen } from './screens/DownloadScreen'
import { SuccessScreen } from './screens/SuccessScreen'
import { LoadingOverlay } from './ui/LoadingOverlay'

export function RegistrationFlow() {
  const registration = useRegistration()

  const renderScreen = () => {
    switch (registration.step) {
      case 'form':
        return <RegistrationForm onSubmit={registration.registerCustomer} />
      case 'wallet':
        return (
          <WalletSelection
            deviceType={registration.deviceType}
            onAppleWallet={registration.addToAppleWallet}
            onGoogleWallet={registration.addToGoogleWallet}
            onSkip={() => registration.setStep('download')}
            onBack={() => registration.setStep('form')}
          />
        )
      case 'download':
        return (
          <DownloadScreen
            customer={registration.customer}
            walletPass={registration.walletPass}
            qrCode={registration.walletPass?.qrCode}
            onGenerateQR={registration.generateQRCode}
            onRetryApple={registration.addToAppleWallet}
            onRetryGoogle={registration.addToGoogleWallet}
            onSuccess={() => registration.setStep('success')}
            onBack={() => registration.setStep('wallet')}
            deviceType={registration.deviceType}
          />
        )
      case 'success':
        return (
          <SuccessScreen
            customer={registration.customer}
            onStartOver={registration.reset}
          />
        )
      default:
        return <RegistrationForm onSubmit={registration.registerCustomer} />
    }
  }

  return (
    <div className="screen-container">
      {/* Status bar spacer for mobile */}
      <div className="status-bar-spacer" />
      
      {/* Error display */}
      {registration.error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4 animate-fade-in">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{registration.error}</p>
            </div>
            <button
              onClick={() => registration.setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1">
        {renderScreen()}
      </div>

      {/* Loading overlay */}
      {registration.isLoading && <LoadingOverlay />}
    </div>
  )
}
