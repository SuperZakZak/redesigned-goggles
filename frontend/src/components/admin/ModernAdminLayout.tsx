import React from 'react';

interface ModernAdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const ModernAdminLayout: React.FC<ModernAdminLayoutProps> = ({
  children,
  activeTab,
  onTabChange
}) => {
  const menuItems = [
    { id: 'clients', label: 'Clients', icon: '👥' },
    { id: 'card-templates', label: 'Card templates', icon: '🎨' },
    { id: 'integration', label: 'Integration', icon: '🔗' },
    { id: 'card-issuance', label: 'Card issuance', icon: '💳' },
    { id: 'accept-cards', label: 'Accept cards', icon: '✅' },
    { id: 'push-messages', label: 'Push messages', icon: '📱' },
    { id: 'triggers', label: 'Triggers', icon: '⚡' },
    { id: 'segments', label: 'Segments', icon: '📊' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'marketplace', label: 'Marketplace', icon: '🏪' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-xl font-semibold text-gray-900">Loy Admin</h1>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default ModernAdminLayout;
