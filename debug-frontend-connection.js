#!/usr/bin/env node

/**
 * Debug Frontend Connection Test
 * Helps identify which frontend version the user is testing
 */

const axios = require('axios');

const PORTS_TO_TEST = [3001, 3002, 8080];
const BACKEND_URL = 'http://localhost:3000';

async function testPort(port) {
  console.log(`\n🔍 Testing port ${port}...`);
  
  try {
    // Test if frontend is accessible
    const frontendResponse = await axios.get(`http://localhost:${port}`, { timeout: 2000 });
    console.log(`✅ Frontend accessible on port ${port}`);
    
    // Test if API proxy works
    try {
      const apiResponse = await axios.get(`http://localhost:${port}/api/v1/health`, { timeout: 2000 });
      console.log(`✅ API proxy working on port ${port}:`, apiResponse.data.message);
      
      // Test customer creation through this frontend
      const testCustomer = {
        firstName: 'Debug',
        lastName: 'Test',
        email: `debug-test-${port}-${Date.now()}@example.com`,
        phone: '+7 (999) 111-11-11' // Known duplicate phone
      };
      
      try {
        const createResponse = await axios.post(`http://localhost:${port}/api/v1/customers`, testCustomer, { timeout: 5000 });
        console.log(`❌ Port ${port}: Duplicate phone NOT blocked - customer created!`, createResponse.data.data?.customer?.id);
        return { port, status: 'demo_mode', message: 'Allows duplicate phone numbers' };
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`✅ Port ${port}: Duplicate phone correctly blocked`);
          return { port, status: 'real_backend', message: 'Correctly blocks duplicates' };
        } else {
          console.log(`⚠️ Port ${port}: Unexpected error:`, error.response?.data || error.message);
          return { port, status: 'error', message: error.message };
        }
      }
      
    } catch (apiError) {
      console.log(`❌ API proxy not working on port ${port}:`, apiError.message);
      return { port, status: 'no_proxy', message: 'API proxy not working' };
    }
    
  } catch (frontendError) {
    console.log(`❌ Frontend not accessible on port ${port}:`, frontendError.message);
    return { port, status: 'not_accessible', message: 'Frontend not accessible' };
  }
}

async function runDebugTest() {
  console.log('🚀 Debug Frontend Connection Test');
  console.log('==================================');
  
  // First, check backend
  try {
    const backendResponse = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is running:', backendResponse.data.message);
  } catch (error) {
    console.log('❌ Backend is not accessible:', error.message);
    return;
  }
  
  const results = [];
  
  for (const port of PORTS_TO_TEST) {
    const result = await testPort(port);
    results.push(result);
  }
  
  console.log('\n📊 Summary:');
  console.log('===========');
  
  results.forEach(result => {
    const statusIcon = {
      'real_backend': '✅',
      'demo_mode': '⚠️',
      'no_proxy': '❌',
      'not_accessible': '❌',
      'error': '❌'
    }[result.status] || '❓';
    
    console.log(`${statusIcon} Port ${result.port}: ${result.status} - ${result.message}`);
  });
  
  const realBackendPorts = results.filter(r => r.status === 'real_backend').map(r => r.port);
  const demoPorts = results.filter(r => r.status === 'demo_mode').map(r => r.port);
  
  console.log('\n🎯 Recommendations:');
  console.log('==================');
  
  if (realBackendPorts.length > 0) {
    console.log(`✅ Use port ${realBackendPorts[0]} for testing with real backend`);
    console.log(`   URL: http://localhost:${realBackendPorts[0]}`);
  }
  
  if (demoPorts.length > 0) {
    console.log(`⚠️  Avoid ports ${demoPorts.join(', ')} - they run in demo mode`);
  }
  
  console.log('\n💡 If you are experiencing duplicate registrations:');
  console.log('   1. Make sure you are using the correct port');
  console.log('   2. Check browser console for API connection errors');
  console.log('   3. Clear browser cache and reload the page');
}

// Run debug test
runDebugTest().catch(error => {
  console.error('💥 Debug test failed:', error);
  process.exit(1);
});
