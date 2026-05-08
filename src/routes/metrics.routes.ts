import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get GPU metrics
router.get('/gpus/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    res.json({
      success: true,
      data: {
        gpuId: id,
        utilization: Math.random() * 100,
        memoryUsed: Math.floor(Math.random() * 80000),
        memoryTotal: 80000,
        temperature: 65 + Math.random() * 20,
        powerDraw: 250 + Math.random() * 100,
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get metrics history
router.get('/gpus/:id/history', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const history = Array.from({ length: 10 }, (_, i) => ({
      utilization: Math.random() * 100,
      memoryUsed: Math.floor(Math.random() * 80000),
      temperature: 65 + Math.random() * 20,
      timestamp: new Date(Date.now() - i * 60000)
    }));
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
