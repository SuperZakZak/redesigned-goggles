const express = require('express');
const path = require('path');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// Mock customer data
const mockCustomers = [
  {
    _id: '507f1f77bcf86cd799439011',
    customerId: 'CUST001',
    name: 'Иван Петров',
    phone: '+79991234567',
    email: 'ivan.petrov@example.com',
    balance: 1250,
    totalSpent: 5670,
    isActive: true,
    createdAt: '2024-01-15T10:30:00.000Z',
    metadata: {
      registrationSource: 'web',
      lastActivity: '2024-01-20T14:22:00.000Z'
    }
  },
  {
    _id: '507f1f77bcf86cd799439012',
    customerId: 'CUST002',
    name: 'Мария Сидорова',
    phone: '+79997654321',
    email: 'maria.sidorova@example.com',
    balance: 890,
    totalSpent: 3240,
    isActive: true,
    createdAt: '2024-01-18T16:45:00.000Z',
    metadata: {
      registrationSource: 'pos',
      lastActivity: '2024-01-22T11:15:00.000Z'
    }
  },
  {
    _id: '507f1f77bcf86cd799439013',
    customerId: 'CUST003',
    name: 'Алексей Козлов',
    phone: '+79995555555',
    email: 'alex.kozlov@example.com',
    balance: 2100,
    totalSpent: 8900,
    isActive: true,
    createdAt: '2024-01-10T09:20:00.000Z',
    metadata: {
      registrationSource: 'admin',
      lastActivity: '2024-01-25T13:40:00.000Z'
    }
  },
  {
    _id: '507f1f77bcf86cd799439014',
    customerId: 'CUST004',
    name: 'Елена Волкова',
    phone: '+79998888888',
    balance: 450,
    totalSpent: 1200,
    isActive: false,
    createdAt: '2024-01-05T12:10:00.000Z',
    metadata: {
      registrationSource: 'web',
      lastActivity: '2024-01-12T17:30:00.000Z'
    }
  },
  {
    _id: '507f1f77bcf86cd799439015',
    customerId: 'CUST005',
    name: 'Дмитрий Новиков',
    phone: '+79993333333',
    email: 'dmitry.novikov@example.com',
    balance: 3200,
    totalSpent: 12500,
    isActive: true,
    createdAt: '2024-01-01T08:00:00.000Z',
    metadata: {
      registrationSource: 'web',
      lastActivity: '2024-01-26T19:45:00.000Z'
    }
  }
];

// Mock transactions
const mockTransactions = [
  {
    _id: '507f1f77bcf86cd799439021',
    type: 'credit',
    amount: 500,
    balanceBefore: 750,
    balanceAfter: 1250,
    description: 'Бонус за покупку',
    timestamp: '2024-01-20T14:22:00.000Z',
    source: 'pos'
  },
  {
    _id: '507f1f77bcf86cd799439022',
    type: 'debit',
    amount: 200,
    balanceBefore: 950,
    balanceAfter: 750,
    description: 'Оплата заказа',
    timestamp: '2024-01-19T12:15:00.000Z',
    source: 'pos'
  },
  {
    _id: '507f1f77bcf86cd799439023',
    type: 'credit',
    amount: 100,
    balanceBefore: 850,
    balanceAfter: 950,
    description: 'Начисление администратором',
    timestamp: '2024-01-18T10:30:00.000Z',
    source: 'admin'
  }
];

// Admin API endpoints
app.get('/api/v1/admin/customers', (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  
  let filteredCustomers = [...mockCustomers];
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCustomers = filteredCustomers.filter(customer => 
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.includes(search) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
  
  const totalPages = Math.ceil(filteredCustomers.length / limit);
  
  res.json({
    success: true,
    data: {
      items: paginatedCustomers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredCustomers.length,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
});

app.get('/api/v1/admin/customers/:customerId', (req, res) => {
  const { customerId } = req.params;
  
  const customer = mockCustomers.find(c => c._id === customerId);
  
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'CUSTOMER_NOT_FOUND'
    });
  }
  
  // Add recent transactions
  const customerWithTransactions = {
    ...customer,
    recentTransactions: mockTransactions
  };
  
  res.json({
    success: true,
    data: customerWithTransactions
  });
});

app.put('/api/v1/admin/customers/:customerId', (req, res) => {
  const { customerId } = req.params;
  const updates = req.body;
  
  const customerIndex = mockCustomers.findIndex(c => c._id === customerId);
  
  if (customerIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'CUSTOMER_NOT_FOUND'
    });
  }
  
  // Update customer
  mockCustomers[customerIndex] = {
    ...mockCustomers[customerIndex],
    ...updates,
    metadata: {
      ...mockCustomers[customerIndex].metadata,
      lastActivity: new Date().toISOString()
    }
  };
  
  res.json({
    success: true,
    data: mockCustomers[customerIndex]
  });
});

app.post('/api/v1/admin/customers/:customerId/balance', (req, res) => {
  const { customerId } = req.params;
  const { amount, operation, description } = req.body;
  
  const customerIndex = mockCustomers.findIndex(c => c._id === customerId);
  
  if (customerIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'CUSTOMER_NOT_FOUND'
    });
  }
  
  const customer = mockCustomers[customerIndex];
  const balanceBefore = customer.balance;
  
  // Update balance
  if (operation === 'credit') {
    customer.balance += amount;
  } else {
    customer.balance = Math.max(0, customer.balance - amount);
  }
  
  const balanceAfter = customer.balance;
  
  // Create transaction record
  const transaction = {
    _id: Date.now().toString(),
    type: operation,
    amount,
    balanceBefore,
    balanceAfter,
    description,
    timestamp: new Date().toISOString(),
    source: 'admin'
  };
  
  // Add to transactions (in real app this would be saved to DB)
  mockTransactions.unshift(transaction);
  
  // Update customer metadata
  customer.metadata.lastActivity = new Date().toISOString();
  
  res.json({
    success: true,
    data: {
      customer,
      transaction
    }
  });
});

app.get('/api/v1/admin/customers/:customerId/transactions', (req, res) => {
  const { customerId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const customer = mockCustomers.find(c => c._id === customerId);
  
  if (!customer) {
    return res.status(404).json({
      success: false,
      error: 'CUSTOMER_NOT_FOUND'
    });
  }
  
  // Apply pagination to transactions
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedTransactions = mockTransactions.slice(startIndex, endIndex);
  
  const totalPages = Math.ceil(mockTransactions.length / limit);
  
  res.json({
    success: true,
    data: {
      data: paginatedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: mockTransactions.length,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }
  });
});

app.delete('/api/v1/admin/customers/:customerId', (req, res) => {
  const { customerId } = req.params;
  
  const customerIndex = mockCustomers.findIndex(c => c._id === customerId);
  
  if (customerIndex === -1) {
    return res.status(404).json({
      success: false,
      error: 'CUSTOMER_NOT_FOUND'
    });
  }
  
  // Soft delete - mark as inactive
  mockCustomers[customerIndex].isActive = false;
  mockCustomers[customerIndex].metadata.deletedAt = new Date().toISOString();
  
  res.json({
    success: true,
    data: { deleted: true }
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Admin Demo Server running at http://localhost:${PORT}`);
  console.log(`📱 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`🔧 Registration: http://localhost:${PORT}/register`);
});
