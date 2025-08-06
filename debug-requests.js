#!/usr/bin/env node

/**
 * Debug Request Logger
 * Intercepts and logs all requests to customer creation endpoint
 */

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`\n🔍 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('📝 Headers:', JSON.stringify(req.headers, null, 2));
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Mock customer creation endpoint
app.post('/api/v1/customers', (req, res) => {
  console.log('\n🎯 CUSTOMER CREATION REQUEST RECEIVED:');
  console.log('=====================================');
  console.log('📱 Phone:', req.body.phone);
  console.log('📧 Email:', req.body.email);
  console.log('👤 Name:', req.body.firstName, req.body.lastName);
  console.log('🔤 Phone format analysis:');
  console.log('  - Length:', req.body.phone?.length);
  console.log('  - Characters:', req.body.phone?.split('').map(c => `'${c}'`).join(', '));
  console.log('  - Encoded:', encodeURIComponent(req.body.phone || ''));
  
  // Always return success to see how many requests come through
  res.json({
    success: true,
    data: {
      customer: {
        id: `debug-${Date.now()}`,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phone: req.body.phone,
        cardNumber: '1234567890',
        balance: 0,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    },
    message: 'DEBUG: Customer created successfully',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'DEBUG SERVER: Loy API is running',
    timestamp: new Date().toISOString(),
    version: 'debug-1.0.0'
  });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`🐛 Debug server running on http://localhost:${PORT}`);
  console.log('📋 This server will log all customer creation requests');
  console.log('💡 Update your React app to point to this server temporarily');
  console.log(`   Change API_BASE_URL to 'http://localhost:${PORT}/api/v1'`);
});
