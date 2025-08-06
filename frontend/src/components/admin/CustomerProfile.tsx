import { useState, useEffect } from 'react'
import { AdminLayout } from './AdminLayout'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { 
  PencilIcon, 
  PlusIcon, 
  MinusIcon,
  ClockIcon,
  CreditCardIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon
} from '@heroicons/react/24/outline'

interface Customer {
  _id: string
  customerId: string
  name: string
  phone?: string
  email?: string
  balance: number
  totalSpent: number
  isActive: boolean
  createdAt: string
  metadata?: {
    registrationSource?: string
    lastActivity?: string
  }
  recentTransactions?: Transaction[]
}

interface Transaction {
  _id: string
  type: 'credit' | 'debit'
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  timestamp: string
  source: string
}

interface CustomerProfileProps {
  customerId: string
  onBack: () => void
}

export function CustomerProfile({ customerId, onBack }: CustomerProfileProps) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [balanceMode, setBalanceMode] = useState<'credit' | 'debit' | null>(null)
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [balanceForm, setBalanceForm] = useState({
    amount: '',
    description: ''
  })

  const fetchCustomer = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/admin/customers/${customerId}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setCustomer(result.data)
        setEditForm({
          name: result.data.name || '',
          phone: result.data.phone || '',
          email: result.data.email || ''
        })
      } else {
        throw new Error('Failed to fetch customer')
      }
    } catch (err) {
      console.error('Error fetching customer:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomer()
  }, [customerId])

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const response = await fetch(`/api/v1/admin/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          phone: editForm.phone.trim() || undefined,
          email: editForm.email.trim() || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update customer')
      }

      const result = await response.json()
      
      if (result.success) {
        setCustomer(result.data)
        setEditMode(false)
      }
    } catch (err) {
      console.error('Error updating customer:', err)
      setError(err instanceof Error ? err.message : 'Failed to update customer')
    } finally {
      setLoading(false)
    }
  }

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!balanceMode || !balanceForm.amount || !balanceForm.description.trim()) {
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/v1/admin/customers/${customerId}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(balanceForm.amount),
          operation: balanceMode,
          description: balanceForm.description.trim()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update balance')
      }

      const result = await response.json()
      
      if (result.success) {
        // Refresh customer data
        await fetchCustomer()
        setBalanceMode(null)
        setBalanceForm({ amount: '', description: '' })
      }
    } catch (err) {
      console.error('Error updating balance:', err)
      setError(err instanceof Error ? err.message : 'Failed to update balance')
    } finally {
      setLoading(false)
    }
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ru-RU').format(balance)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPhone = (phone?: string) => {
    if (!phone) return 'Не указан'
    if (phone.startsWith('+7') && phone.length === 12) {
      return `+7 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10)}`
    }
    return phone
  }

  if (loading && !customer) {
    return (
      <AdminLayout title="Профиль клиента" showBack onBack={onBack}>
        <LoadingOverlay />
      </AdminLayout>
    )
  }

  if (error && !customer) {
    return (
      <AdminLayout title="Профиль клиента" showBack onBack={onBack}>
        <div className="bg-red-50 border border-red-200 rounded-ios p-4">
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={fetchCustomer}
            className="ios-button-secondary mt-2 text-sm"
          >
            Повторить попытку
          </button>
        </div>
      </AdminLayout>
    )
  }

  if (!customer) {
    return (
      <AdminLayout title="Профиль клиента" showBack onBack={onBack}>
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Клиент не найден
          </h3>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Профиль клиента" showBack onBack={onBack}>
      {loading && <LoadingOverlay />}
      
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-ios p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Customer Info Card */}
        <div className="bg-white border border-gray-200 rounded-ios p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Информация о клиенте
            </h2>
            <button
              onClick={() => setEditMode(!editMode)}
              className="ios-button-secondary"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              {editMode ? 'Отмена' : 'Редактировать'}
            </button>
          </div>

          {editMode ? (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя и фамилия *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="ios-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="ios-input"
                  placeholder="+7 (999) 999-99-99"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="ios-input"
                  placeholder="email@example.com"
                />
              </div>
              
              <div className="flex space-x-3">
                <button type="submit" className="ios-button-primary flex-1">
                  Сохранить
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditMode(false)}
                  className="ios-button-secondary flex-1"
                >
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-900 font-medium">{customer.name}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <PhoneIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">{formatPhone(customer.phone)}</span>
              </div>
              
              {customer.email && (
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{customer.email}</span>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                <CreditCardIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">ID: {customer.customerId}</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-5 w-5 text-gray-400" />
                <span className="text-gray-600">
                  Регистрация: {formatDate(customer.createdAt)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Balance Card */}
        <div className="bg-white border border-gray-200 rounded-ios p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Баланс</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setBalanceMode('credit')}
                className="ios-button-secondary text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Начислить
              </button>
              <button
                onClick={() => setBalanceMode('debit')}
                className="ios-button-secondary text-sm"
              >
                <MinusIcon className="h-4 w-4 mr-1" />
                Списать
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-ios-blue bg-opacity-10 rounded-ios">
              <p className="text-sm text-gray-600 mb-1">Текущий баланс</p>
              <p className="text-2xl font-bold text-ios-blue">
                {formatBalance(customer.balance)} ₽
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-ios">
              <p className="text-sm text-gray-600 mb-1">Потрачено всего</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatBalance(customer.totalSpent)} ₽
              </p>
            </div>
          </div>

          {balanceMode && (
            <form onSubmit={handleBalanceSubmit} className="space-y-4 p-4 bg-gray-50 rounded-ios">
              <h3 className="font-medium text-gray-900">
                {balanceMode === 'credit' ? 'Начисление баллов' : 'Списание баллов'}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сумма *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balanceForm.amount}
                  onChange={(e) => setBalanceForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="ios-input"
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание *
                </label>
                <input
                  type="text"
                  value={balanceForm.description}
                  onChange={(e) => setBalanceForm(prev => ({ ...prev, description: e.target.value }))}
                  className="ios-input"
                  placeholder="Причина операции"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button type="submit" className="ios-button-primary flex-1">
                  {balanceMode === 'credit' ? 'Начислить' : 'Списать'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setBalanceMode(null)
                    setBalanceForm({ amount: '', description: '' })
                  }}
                  className="ios-button-secondary flex-1"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Recent Transactions */}
        {customer.recentTransactions && customer.recentTransactions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-ios p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Последние операции
            </h2>
            
            <div className="space-y-3">
              {customer.recentTransactions.map((transaction) => (
                <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-ios">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        transaction.type === 'credit' ? 'bg-ios-green' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaction.timestamp)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'credit' ? 'text-ios-green' : 'text-red-500'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatBalance(transaction.amount)} ₽
                    </p>
                    <p className="text-xs text-gray-500">
                      Баланс: {formatBalance(transaction.balanceAfter)} ₽
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
