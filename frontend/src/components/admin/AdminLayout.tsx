import { ReactNode } from 'react'
import { NavigationHeader } from '@/components/ui/NavigationHeader'

interface AdminLayoutProps {
  title: string
  children: ReactNode
  showBack?: boolean
  onBack?: () => void
}

export function AdminLayout({ title, children, showBack = false, onBack }: AdminLayoutProps) {
  return (
    <div className="screen-container">
      <NavigationHeader 
        title={title}
        showBack={showBack}
        onBack={onBack}
      />
      
      <div className="content-container">
        {children}
      </div>
    </div>
  )
}
