import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { metricsService } from '../services/metrics.service';

const router = Router();

// Get GPU metrics
router.get('/gpus/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const metrics = await metricsService.getLatestMetrics(req.params.id);
    res.json({ success: true, data: metrics });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get metrics history
router.get('/gpus/:id/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const history = await metricsService.getMetricsHistory(req.params.id, hours);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get aggregated metrics
router.get('/gpus/:id/aggregated', authenticate, async (req: AuthRequest, res) => {
  try {
    const hours = parseInt(req.query.hours as string) || 24;
    const aggregated = await metricsService.getAggregatedMetrics(req.params.id, hours);
    res.json({ success: true, data: aggregated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get alerts
router.get('/gpus/:id/alerts', authenticate, async (req: AuthRequest, res) => {
  try {
    const alerts = await metricsService.checkAlerts(req.params.id);
    res.json({ success: true, data: alerts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
