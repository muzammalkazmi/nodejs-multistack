import request from 'supertest';
import { app } from '../../app';

describe('User Endpoints (E2E)', () => {
  const testUser = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    password: 'securepassword',
  };

  let cookies: string[] = [];
  let userId: string = '';

  beforeEach(async () => {
    // 1. Register
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);
    
    userId = registerRes.body.data.user.id;

    // 2. Login to get cookies
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    cookies = loginRes.headers['set-cookie'];
  });

  describe('GET /api/v1/users', () => {
    it('should return a list of users when authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should fail if unauthenticated', async () => {
      const res = await request(app).get('/api/v1/users');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return a specific user by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(200);
      expect(res.body.data.user.id).toBe(userId);
      expect(res.body.data.user.email).toBe(testUser.email);
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update user details successfully', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${userId}`)
        .set('Cookie', cookies)
        .send({
          firstName: 'Janet'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.firstName).toBe('Janet');
      expect(res.body.data.user.lastName).toBe('Doe');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should delete a user successfully', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${userId}`)
        .set('Cookie', cookies);

      expect(res.status).toBe(204);

      // Verify deletion
      const fetchRes = await request(app)
        .get(`/api/v1/users/${userId}`)
        .set('Cookie', cookies);

      expect(fetchRes.status).toBe(404);
    });
  });
});
