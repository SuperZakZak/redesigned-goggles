import React, { useState, useEffect } from 'react';
import { apiService, Customer } from '../../services/api';

interface ModernClientsTableProps {
  onCustomerSelect?: (customer: Customer) => void;
}

const ModernClientsTable: React.FC<ModernClientsTableProps> = ({ onCustomerSelect }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadCustomers = async (searchQuery?: string, pageNum: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getCustomers({
        page: pageNum,
        limit: 20,
        search: searchQuery
      });

      if (response.success && response.data && response.data.data) {
        setCustomers(response.data.data);
        setTotalPages(response.data.pagination?.pages || 1);
        setPage(pageNum);
      } else {
        throw new Error(response.error || 'Failed to load customers');
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
      
      // Fallback to mock data if API fails
      const mockCustomers: Customer[] = [
        {
          id: '1',
          name: 'Alexia',
          cardNumber: '1404',
          phone: '+35677385177',
          balance: 1.85,
          isActive: true,
          createdAt: '2025-08-06T10:00:00.000Z',
          updatedAt: '2025-08-06T10:00:00.000Z',
          bonus: 5.00,
          discount: 0.00,
          telegramBot: false
        },
        {
          id: '2',
          name: 'Svetlana Guzovskaia',
          cardNumber: '1403',
          phone: '+351926021799',
          balance: 1.85,
          isActive: true,
          createdAt: '2025-08-06T10:00:00.000Z',
          updatedAt: '2025-08-06T10:00:00.000Z',
          bonus: 5.00,
          discount: 0.00,
          telegramBot: false
        },
        {
          id: '3',
          name: 'Zak',
          cardNumber: '1402',
          phone: '+887787982291',
          balance: 0.00,
          isActive: true,
          createdAt: '2025-08-06T10:00:00.000Z',
          updatedAt: '2025-08-06T10:00:00.000Z',
          bonus: 5.00,
          discount: 0.00,
          telegramBot: true
        },
        {
          id: '4',
          name: 'Rita Toropova',
          cardNumber: '1401',
          phone: '+34604049422',
          balance: 0.00,
          isActive: true,
          createdAt: '2025-08-06T10:00:00.000Z',
          updatedAt: '2025-08-06T10:00:00.000Z',
          bonus: 5.00,
          discount: 0.00,
          telegramBot: false
        },
        {
          id: '5',
          name: 'Anton',
          cardNumber: '1400',
          phone: '+351937824377',
          balance: 13.60,
          isActive: true,
          createdAt: '2025-08-06T10:00:00.000Z',
          updatedAt: '2025-08-06T10:00:00.000Z',
          bonus: 5.00,
          discount: 0.00,
          telegramBot: false
        }
      ];
      
      setCustomers(mockCustomers);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        loadCustomers(searchTerm, 1);
      } else {
        loadCustomers();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handlePageChange = (newPage: number) => {
    loadCustomers(searchTerm, newPage);
  };

  const formatBalance = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '0.00';
    }
    return amount.toFixed(2);
  };

  if (loading && (!customers || customers.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Clients</h2>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              Add Client
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  API connection failed: {error}. Showing demo data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Card
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telegram bot
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bonus
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers && customers.length > 0 ? customers.map((customer) => (
              <tr 
                key={customer.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onCustomerSelect?.(customer)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300"
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {customer.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.cardNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      customer.telegramBot ? 'bg-green-400' : 'bg-gray-300'
                    }`}></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatBalance(customer.balance)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatBalance(customer.bonus)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatBalance(customer.discount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.phone}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {loading ? 'Loading clients...' : (searchTerm ? 'No clients found matching your search.' : 'No clients found.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {false && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm ? 'No clients found matching your search.' : 'No clients found.'}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernClientsTable;
