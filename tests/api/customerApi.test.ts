import request from 'supertest';
import createApp from '@/app';
import { config } from '@/config/app';

describe('Customer API', () => {
  const app = createApp();
  const apiPrefix = config.apiPrefix;

  it('GET /health should return 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /customers should create a customer and return 201', async () => {
    const res = await request(app)
      .post(`${apiPrefix}/customers`)
      .send({
        email: `test-${Date.now()}@example.com`,
        firstName: 'Иван',
        lastName: 'Петров',
        phone: '+7-900-123-45-67',
        registrationSource: 'web',
      })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data?.customer).toBeDefined();
    expect(res.body.data.customer.email).toMatch(/@example.com$/);
  });

  it('GET /customers should return customer list', async () => {
    const res = await request(app).get(`${apiPrefix}/customers`).query({ page: 1, limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.customers)).toBe(true);
  });
});
