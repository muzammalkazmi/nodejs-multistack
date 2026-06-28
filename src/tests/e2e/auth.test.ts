import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../config/db';

describe('Auth Endpoints (E2E)', () => {
  const testUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    password: 'password123',
    phone: '1234567890'
  };

  describe('POST /api/v1/auth/register', () => {
    it('should create a new user successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user).not.toHaveProperty('password');

      // Verify in DB
      const dbUser = await prisma.user.findUnique({ where: { email: testUser.email } });
      expect(dbUser).not.toBeNull();
    });

    it('should fail with validation error when email is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...testUser, email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation failed');
    });

    it('should fail when email already exists', async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);
      
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email already in use');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(testUser);
    });

    it('should login successfully and set HttpOnly cookies', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe(testUser.email);
      
      // Check cookies
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c: string) => c.startsWith('accessToken='))).toBeTruthy();
      expect(cookies.some((c: string) => c.startsWith('refreshToken='))).toBeTruthy();
    });

    it('should fail with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });
});
