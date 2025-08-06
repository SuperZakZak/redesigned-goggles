import { useState, useEffect } from 'react'
import { AdminLayout } from './AdminLayout'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { ChevronRightIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline'

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
}

interface CustomerListResponse {
  success: boolean
  data: {
    items: Customer[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
}

interface CustomerListProps {
  onSelectCustomer: (customer: Customer) => void
}

export function CustomerList({ onSelectCustomer }: CustomerListProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })

      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`/api/v1/admin/customers?${params}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: CustomerListResponse = await response.json()

      if (result.success) {
        setCustomers(result.data.items)
        setCurrentPage(result.data.pagination.page)
        setTotalPages(result.data.pagination.pages)
      } else {
        throw new Error('Failed to fetch customers')
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers(1, searchTerm)
  }, [searchTerm])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    fetchCustomers(page, searchTerm)
  }

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('ru-RU').format(balance)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatPhone = (phone?: string) => {
    if (!phone) return 'Не указан'
    // Format +79991234567 to +7 (999) 123-45-67
    if (phone.startsWith('+7') && phone.length === 12) {
      return `+7 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10)}`
    }
    return phone
  }

  return (
    <AdminLayout title="Клиенты">
      {loading && <LoadingOverlay />}
      
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Поиск по имени или телефону..."
            value={searchTerm}
            onChange={handleSearch}
            className="ios-input pl-10"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-ios p-4">
            <p className="text-red-600 text-sm">{error}</p>
            <button 
              onClick={() => fetchCustomers(currentPage, searchTerm)}
              className="ios-button-secondary mt-2 text-sm"
            >
              Повторить попытку
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && customers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Клиенты не найдены' : 'Нет клиентов'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Попробуйте изменить поисковый запрос'
                : 'Клиенты появятся здесь после регистрации'
              }
            </p>
          </div>
        )}

        {/* Customer List */}
        {!loading && !error && customers.length > 0 && (
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer._id}
                onClick={() => onSelectCustomer(customer)}
                className="bg-white border border-gray-200 rounded-ios p-4 cursor-pointer 
                         hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-medium text-gray-900 truncate">
                        {customer.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-semibold text-ios-blue">
                          {formatBalance(customer.balance)} ₽
                        </span>
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        📱 {formatPhone(customer.phone)}
                      </p>
                      {customer.email && (
                        <p className="text-sm text-gray-600">
                          ✉️ {customer.email}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Потрачено: {formatBalance(customer.totalSpent)} ₽
                        </p>
                        <p className="text-xs text-gray-500">
                          Регистрация: {formatDate(customer.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      customer.isActive ? 'bg-ios-green' : 'bg-gray-400'
                    }`} />
                    <span className="text-xs text-gray-500">
                      {customer.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    ID: {customer.customerId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="ios-button-secondary disabled:opacity-50"
            >
              Назад
            </button>
            
            <span className="text-sm text-gray-600">
              Страница {currentPage} из {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="ios-button-secondary disabled:opacity-50"
            >
              Далее
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
