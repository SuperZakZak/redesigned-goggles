import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { RedisMemoryServer } from 'redis-memory-server';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let mongoServer: MongoMemoryServer;
let redisServer: RedisMemoryServer;

// Setup before all tests
beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);

  // Start in-memory Redis
  redisServer = new RedisMemoryServer();
  await redisServer.start();
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await redisServer.stop();
});

// Clear database before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections;
  
  await Promise.all(
    Object.values(collections).map(async (collection) => {
      if (collection) {
        await collection.deleteMany({});
      }
    })
  );
});
