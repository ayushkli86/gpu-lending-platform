import request from 'supertest';
import express from 'express';
import migRoutes from '../mig.routes';

const app = express();
app.use(express.json());
app.use('/api/mig', migRoutes);

describe('MIG Routes', () => {
  describe('POST /api/mig/enable', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/mig/enable')
        .send({
          gpuId: 'gpu1',
          profile: '1g.10gb',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/mig/profiles', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/mig/profiles');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/mig/instance', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/mig/instance')
        .send({
          gpuId: 'gpu1',
          profile: '1g.10gb',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/mig/instances/:gpuId', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/mig/instances/gpu1');

      expect(response.status).toBe(401);
    });
  });
});
