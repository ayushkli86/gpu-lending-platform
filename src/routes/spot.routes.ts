import { Router } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { spotService } from '../services/spot.service';
import { z } from 'zod';

const router = Router();

const createRequestSchema = z.object({
  gpuType: z.string().min(1),
  maxPrice: z.number().positive(),
  duration: z.number().int().positive(),
});

// Create spot request
router.post('/request', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = createRequestSchema.parse(req.body);
    const request = await spotService.createRequest({
      userId: req.user!.id,
      ...data,
    });
    res.json({ success: true, data: request });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List spot requests
router.get('/requests', authenticate, async (req: AuthRequest, res) => {
  try {
    const requests = await spotService.listRequests(req.user!.id);
    res.json({ success: true, data: requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel spot request
router.delete('/requests/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await spotService.cancelRequest(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
