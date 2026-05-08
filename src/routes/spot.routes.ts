import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create spot request
router.post('/request', authenticate, async (req, res) => {
  try {
    const { gpuType, maxPrice, duration } = req.body;
    res.json({
      success: true,
      data: {
        id: 'spot-' + Date.now(),
        gpuType,
        maxPrice,
        duration,
        status: 'PENDING',
        estimatedSavings: maxPrice * 0.65
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List spot requests
router.get('/requests', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
