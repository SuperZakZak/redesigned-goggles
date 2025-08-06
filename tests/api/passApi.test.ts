import request from 'supertest';
import createApp from '@/app';
import { passService } from '@/services/passService';

jest.mock('@/services/passService');

const mockedService = passService as jest.Mocked<typeof passService>;

const app = createApp();
const api = '/api/v1';

describe('Apple Pass API', () => {
  beforeAll(() => {
    mockedService.generateApplePass.mockResolvedValue(Buffer.from('fakepkpass'));
  });

  it('should issue pkpass', async () => {
    const res = await request(app)
      .post(`${api}/passes/apple`)
      .send({ customerId: '123456789012' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toBe('application/vnd.apple.pkpass');
  });
});
