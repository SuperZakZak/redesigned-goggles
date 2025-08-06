// MongoDB initialization script for Loy project
db = db.getSiblingDB('loy_dev');

// Create collections with validation
db.createCollection('customers', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'phone', 'firstName', 'lastName'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
        },
        phone: {
          bsonType: 'string',
          pattern: '^\\+?[1-9]\\d{1,14}$'
        },
        firstName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        },
        lastName: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 50
        }
      }
    }
  }
});

db.createCollection('transactions', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['customerId', 'type', 'amount', 'timestamp'],
      properties: {
        customerId: {
          bsonType: 'objectId'
        },
        type: {
          bsonType: 'string',
          enum: ['credit', 'debit', 'bonus', 'redemption']
        },
        amount: {
          bsonType: 'number',
          minimum: 0
        }
      }
    }
  }
});

db.createCollection('cardtemplates', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'type', 'isActive'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 1,
          maxLength: 100
        },
        type: {
          bsonType: 'string',
          enum: ['loyalty', 'membership', 'discount']
        },
        isActive: {
          bsonType: 'bool'
        }
      }
    }
  }
});

// Create indexes for performance
db.customers.createIndex({ email: 1 }, { unique: true });
db.customers.createIndex({ phone: 1 }, { unique: true });
db.customers.createIndex({ createdAt: 1 });

db.transactions.createIndex({ customerId: 1 });
db.transactions.createIndex({ timestamp: -1 });
db.transactions.createIndex({ customerId: 1, timestamp: -1 });

db.cardtemplates.createIndex({ name: 1 }, { unique: true });
db.cardtemplates.createIndex({ isActive: 1 });

print('MongoDB initialization completed for Loy project');
