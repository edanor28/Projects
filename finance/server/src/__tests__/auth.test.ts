import request from 'supertest';
import app from '../index';

describe('Auth token endpoint', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.CLIENT_ID = 'test-client';
    process.env.CLIENT_SECRET = 'test-secret';
    process.env.JWT_SECRET = 'jwt-test-secret';
  });
  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 for invalid credentials', async () => {
    const res = await request(app).post('/api/auth/token').send({ client_id: 'x', client_secret: 'y' });
    expect(res.status).toBe(401);
  });

  it('returns access_token for valid credentials', async () => {
    const res = await request(app).post('/api/auth/token').send({ client_id: 'test-client', client_secret: 'test-secret' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('token_type', 'Bearer');
  });
});
