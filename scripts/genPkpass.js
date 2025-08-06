require('dotenv').config();
require('tsconfig-paths/register');
const fs = require('fs');
const mongoose = require('mongoose');
// eslint-disable-next-line import/no-dynamic-require, global-require
require('ts-node/register');
const createApp = require('../src/app').default;
const request = require('supertest');

(async () => {
  try {
    console.log('⏳  Connecting to Mongo…');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loy_dev');
    const app = createApp();

    console.log('➕  Creating test customer…');
    const customerRes = await request(app)
      .post('/api/v1/customers')
      .send({
        email: `pkpass-test-${Date.now()}@example.com`,
        firstName: 'Pass',
        lastName: 'Test',
        phone: '+70000000000',
        registrationSource: 'api',
      })
      .set('Content-Type', 'application/json');

    if (customerRes.status !== 201) {
      throw new Error(`Customer create failed: ${JSON.stringify(customerRes.body)}`);
    }
    const id = customerRes.body.data.customer.id;
    console.log('🪪  Customer id:', id);

    console.log('🎫  Requesting .pkpass…');
    const passRes = await request(app)
      .post('/api/v1/passes/apple')
      .buffer()
      .parse((res, cb) => {
        res.setEncoding('binary');
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => cb(null, Buffer.from(data, 'binary')));
      })
      .send({ customerId: id })
      .set('Content-Type', 'application/json');

    if (passRes.status !== 200) {
      throw new Error(`Pass generation failed: ${passRes.text}`);
    }

    fs.writeFileSync('loy-test.pkpass', passRes.body);
    console.log(`✅  loy-test.pkpass создан (${passRes.body.length} bytes)`);
  } catch (err) {
    console.error('💥  ERROR:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
