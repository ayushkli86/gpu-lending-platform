import express from 'express';
import dotenv from 'dotenv';
import { configureSecurity } from './config/security';
import logger from './config/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
configureSecurity(app);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info('Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Date.now() - start,
    });
  });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), features: ['spot', 'mig', 'metrics'] });
});

// Import routes
import spotRoutes from './routes/spot.routes';
import migRoutes from './routes/mig.routes';
import metricsRoutes from './routes/metrics.routes';

// Mount routes
app.use('/api/v1/spot', spotRoutes);
app.use('/api/v1/mig', migRoutes);
app.use('/api/v1/metrics', metricsRoutes);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📊 Features: Spot Instances, GPU Sharing (MIG), Enhanced Monitoring`);
});
