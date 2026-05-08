import request from 'supertest';
import express from 'express';
import spotRoutes from '../spot.routes';

const app = express();
app.use(express.json());
app.use('/api/spot', spotRoutes);

describe('Spot Routes', () => {
  describe('POST /api/spot/request', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/spot/request')
        .send({
          gpuType: 'H100',
          maxPrice: 2.0,
          duration: 24,
        });

      expect(response.status).toBe(401);
    });

    it('should validate request body', async () => {
      const response = await request(app)
        .post('/api/spot/request')
        .set('Authorization', 'Bearer invalid-token')
        .send({
          gpuType: '',
          maxPrice: -1,
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/spot/requests', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/spot/requests');

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/spot/request/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/spot/request/123');

      expect(response.status).toBe(401);
    });
  });
});
