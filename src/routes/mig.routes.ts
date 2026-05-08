import { Router } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { migService } from '../services/mig.service';
import { z } from 'zod';

const router = Router();

const enableMIGSchema = z.object({
  profile: z.string().min(1),
});

// Enable MIG on GPU
router.post('/gpus/:id/enable', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { profile } = enableMIGSchema.parse(req.body);
    const gpu = await migService.enableMIG(req.params.id, profile);
    res.json({ success: true, data: gpu });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create MIG instance
router.post('/gpus/:id/instances', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { profile } = enableMIGSchema.parse(req.body);
    const instance = await migService.createInstance(req.params.id, profile);
    res.json({ success: true, data: instance });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List MIG instances
router.get('/gpus/:id/instances', authenticate, async (req: AuthRequest, res) => {
  try {
    const instances = await migService.listInstances(req.params.id);
    res.json({ success: true, data: instances });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List MIG profiles
router.get('/profiles', authenticate, async (req: AuthRequest, res) => {
  try {
    const profiles = migService.getProfiles();
    res.json({ success: true, data: profiles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
