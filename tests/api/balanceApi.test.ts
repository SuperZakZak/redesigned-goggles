import request from 'supertest';
import createApp from '@/app';
import { config } from '@/config/app';

const app = createApp();
const api = config.apiPrefix;

describe('Balance operations API', () => {
  let customerId: string;

  beforeEach(async () => {
    // новый клиент перед каждым тестом (глобальный beforeEach очищает БД)
    const res = await request(app)
      .post(`${api}/customers`)
      .send({
        email: `balance-${Date.now()}@example.com`,
        firstName: 'Баланс',
        lastName: 'Тест',
        phone: '+7-900-000-00-00',
        registrationSource: 'web',
      })
      .set('Content-Type', 'application/json');

    customerId = res.body.data.customer.id;
  });

  it('should credit and debit balance sequentially', async () => {

    const creditRes = await request(app)
      .post(`${api}/customers/${customerId}/credit`)
      .send({
        amount: 150,
        description: 'Test credit',
        source: 'admin',
      })
      .set('Content-Type', 'application/json');

    expect(creditRes.status).toBe(200);
    expect(creditRes.body.success).toBe(true);
    expect(creditRes.body.data.customer.balance).toBe(150);

    // debit 50
    const debitRes = await request(app)
      .post(`${api}/customers/${customerId}/debit`)
      .send({
        amount: 50,
        description: 'Test purchase',
        source: 'purchase',
      })
      .set('Content-Type', 'application/json');

    expect(debitRes.status).toBe(200);
    expect(debitRes.body.success).toBe(true);
    expect(debitRes.body.data.customer.balance).toBe(100);
  });

  it('should return customer stats', async () => {
    const res = await request(app).get(`${api}/customers/stats`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stats.totalCustomers).toBeDefined();
  });
});
