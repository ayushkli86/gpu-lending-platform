import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Enable MIG on GPU
router.post('/gpus/:id/enable', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { profile } = req.body;
    res.json({
      success: true,
      data: {
        gpuId: id,
        migEnabled: true,
        profile,
        instances: []
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List MIG profiles
router.get('/profiles', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [
        { name: '1g.10gb', gpuSlices: 1, memoryGB: 10, price: 0.25 },
        { name: '2g.20gb', gpuSlices: 2, memoryGB: 20, price: 0.50 },
        { name: '3g.40gb', gpuSlices: 3, memoryGB: 40, price: 0.75 },
        { name: '7g.80gb', gpuSlices: 7, memoryGB: 80, price: 1.50 }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
