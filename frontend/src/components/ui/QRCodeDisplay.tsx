import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  data: string
  size?: number
}

export function QRCodeDisplay({ data, size = 200 }: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const url = await QRCode.toDataURL(data, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        
        setQrCodeUrl(url)
      } catch (err) {
        console.error('Error generating QR code:', err)
        setError('Ошибка при создании QR-кода')
      } finally {
        setIsLoading(false)
      }
    }

    if (data) {
      generateQRCode()
    }
  }, [data, size])

  if (isLoading) {
    return (
      <div className="qr-container mb-8">
        <div className="text-center">
          <div className="inline-block p-4 bg-white rounded-xl">
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="loading-spinner"></div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Генерация QR-кода...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="qr-container mb-8">
        <div className="text-center">
          <div className="inline-block p-4 bg-white rounded-xl">
            <div className="w-48 h-48 bg-red-50 rounded-lg flex items-center justify-center">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="qr-container mb-8">
      <div className="text-center">
        <div className="inline-block p-4 bg-white rounded-xl">
          <img 
            src={qrCodeUrl} 
            alt="QR Code" 
            className="rounded-lg"
            width={size}
            height={size}
          />
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Отсканируйте QR-код камерой телефона для добавления карты
        </p>
      </div>
    </div>
  )
}
