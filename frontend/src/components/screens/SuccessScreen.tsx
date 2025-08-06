import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { NavigationHeader } from '@/components/ui/NavigationHeader'
import type { Customer } from '@/types'

interface SuccessScreenProps {
  customer: Customer | null
  onStartOver: () => void
}

export function SuccessScreen({ customer, onStartOver }: SuccessScreenProps) {
  return (
    <div className="screen-container">
      <NavigationHeader 
        title="Готово!" 
        showBack={false}
      />
      
      <div className="content-container">
        <div className="text-center">
          <CheckCircleIcon className="success-icon" />
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Поздравляем, {customer?.name}!
          </h2>
          
          <p className="text-gray-600 mb-8">
            Ваша карта лояльности успешно создана и готова к использованию
          </p>

          <div className="bg-ios-lightGray rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Что дальше?</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-ios-blue rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <p>Предъявляйте карту при каждой покупке для накопления баллов</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-ios-blue rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <p>Следите за балансом баллов в мобильном приложении</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-ios-blue rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-white text-xs font-bold">3</span>
                </div>
                <p>Получайте уведомления о специальных предложениях</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => window.location.href = '/app'}
              className="w-full ios-button-primary"
            >
              Перейти в приложение
            </button>
            
            <button
              onClick={onStartOver}
              className="w-full ios-button-secondary"
            >
              Зарегистрировать еще одну карту
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Нужна помощь?{' '}
              <a href="/support" className="text-ios-blue hover:underline">
                Обратитесь в службу поддержки
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
