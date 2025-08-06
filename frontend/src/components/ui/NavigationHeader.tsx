import { ChevronLeftIcon } from '@heroicons/react/24/outline'

interface NavigationHeaderProps {
  title: string
  onBack?: () => void
  showBack?: boolean
}

export function NavigationHeader({ title, onBack, showBack = true }: NavigationHeaderProps) {
  return (
    <div className="navigation-header">
      <div className="flex items-center">
        {showBack && onBack && (
          <button onClick={onBack} className="back-button">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900 ml-2">{title}</h1>
      </div>
    </div>
  )
}
