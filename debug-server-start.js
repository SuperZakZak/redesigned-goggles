// Debug script to find where server startup fails
console.log('🔍 Starting debug script...');

// Test 1: Basic imports
try {
  console.log('🔍 [1/6] Testing basic imports...');
  require('module-alias/register');
  console.log('✅ module-alias registered');
  
  const { config } = require('./dist/config/app');
  console.log('✅ config imported:', { port: config.port, nodeEnv: config.nodeEnv });
  
  const { logger } = require('./dist/config/logger');
  console.log('✅ logger imported');
  logger.info('Logger test message');
  
} catch (error) {
  console.error('❌ Import error:', error.message);
  process.exit(1);
}

// Test 2: Database connection
try {
  console.log('🔍 [2/6] Testing database connection...');
  const { connectDatabase } = require('./dist/config/database');
  
  connectDatabase().then(() => {
    console.log('✅ Database connected successfully');
    
    // Test 3: Redis connection
    console.log('🔍 [3/6] Testing Redis connection...');
    const { connectRedis } = require('./dist/config/redis');
    
    return connectRedis();
  }).then(() => {
    console.log('✅ Redis connected successfully');
    
    // Test 4: Pass service initialization
    console.log('🔍 [4/6] Testing pass service initialization...');
    const { passService } = require('./dist/services/pass.service');
    
    return passService.initialize();
  }).then(() => {
    console.log('✅ Pass service initialized successfully');
    
    // Test 5: Express app creation
    console.log('🔍 [5/6] Testing Express app creation...');
    const createApp = require('./dist/app').default;
    const app = createApp();
    console.log('✅ Express app created successfully');
    
    // Test 6: Server start
    console.log('🔍 [6/6] Testing server start...');
    const server = app.listen(3001, () => {
      console.log('✅ Server started successfully on port 3001');
      console.log('🎉 All tests passed! Server should work normally.');
      
      // Keep server running for a few seconds
      setTimeout(() => {
        console.log('🔍 Shutting down test server...');
        server.close(() => {
          console.log('✅ Test completed successfully');
          process.exit(0);
        });
      }, 3000);
    });
    
  }).catch(error => {
    console.error('❌ Initialization error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  });
  
} catch (error) {
  console.error('❌ Sync error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
