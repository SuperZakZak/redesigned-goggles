import React, { useState } from 'react';
import ModernAdminLayout from './ModernAdminLayout';
import ModernClientsTable from './ModernClientsTable';

interface Customer {
  id: string;
  name: string;
  cardNumber: string;
  phone: string;
  balance: number;
  bonus: number;
  discount: number;
  telegramBot?: boolean;
  email?: string;
  joinDate?: string;
  totalSpent?: number;
  totalTransactions?: number;
}

const ModernAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('clients');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedCustomer(null);
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    console.log('Selected customer:', customer);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'clients':
        return (
          <ModernClientsTable 
            onCustomerSelect={handleCustomerSelect}
          />
        );
      
      case 'card-templates':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Card Templates</h3>
              <p className="text-gray-500">Manage your loyalty card templates</p>
            </div>
          </div>
        );
      
      case 'integration':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Integration</h3>
              <p className="text-gray-500">Configure API integrations</p>
            </div>
          </div>
        );
      
      case 'finance':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Finance</h3>
              <p className="text-gray-500">Financial reports and analytics</p>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">⚙️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
              <p className="text-gray-500">System configuration</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-gray-500">This feature is under development</p>
            </div>
          </div>
        );
    }
  };

  return (
    <ModernAdminLayout 
      activeTab={activeTab} 
      onTabChange={handleTabChange}
    >
      {renderContent()}
    </ModernAdminLayout>
  );
};

export default ModernAdminPanel;
