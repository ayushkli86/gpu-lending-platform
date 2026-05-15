import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

const router = Router();

// ─── Rate Limiting (improvement #7) ───────────────────────────────────────
const limiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false });
router.use(limiter);

// ─── In-memory state ──────────────────────────────────────────────────────
const mockGPUs: any[] = [
  { id: '1', model: 'NVIDIA A100',    memory: 40960, status: 'AVAILABLE', computeCapability: '8.0', server: { name: 'GPU Server 1', location: 'US-East' } },
  { id: '2', model: 'NVIDIA H100',    memory: 80960, status: 'AVAILABLE', computeCapability: '9.0', server: { name: 'GPU Server 1', location: 'US-East' } },
  { id: '3', model: 'NVIDIA RTX 4090',memory: 24576, status: 'RENTED',    computeCapability: '8.9', server: { name: 'GPU Server 2', location: 'US-West' } },
  { id: '4', model: 'NVIDIA V100',    memory: 32768, status: 'AVAILABLE', computeCapability: '7.0', server: { name: 'GPU Server 2', location: 'US-West' } },
];

const mockPlans = [
  { id: '1', name: 'Starter',      description: 'For small projects', monthlyPrice: 99.99,  gpuAllocation: 1  },
  { id: '2', name: 'Professional', description: 'For growing teams',  monthlyPrice: 299.99, gpuAllocation: 3  },
  { id: '3', name: 'Enterprise',   description: 'Unlimited scale',    monthlyPrice: 999.99, gpuAllocation: 10 },
];

const mockUsers = [
  { id: '1', email: 'admin@gpulending.com', name: 'Admin User',  role: 'ADMIN', createdAt: '2024-01-01T00:00:00Z' },
  { id: '2', email: 'user@example.com',     name: 'Test User',   role: 'USER',  createdAt: '2024-02-01T00:00:00Z' },
  { id: '3', email: 'alice@example.com',    name: 'Alice Smith', role: 'USER',  createdAt: '2024-03-01T00:00:00Z' },
];

const rentals: any[] = [
  { id: 'rental-1', userId: '2', gpuId: '3', gpu: { model: 'NVIDIA RTX 4090' }, status: 'ACTIVE', startTime: new Date().toISOString(), endTime: null, hourlyRate: 1.80 },
];

const invoices: any[] = [
  { id: 'inv-1', invoiceNumber: 'INV-0001', userId: '2', rentalId: 'rental-1', status: 'PENDING', amount: 43.20, tax: 4.32, totalAmount: 47.52, dueDate: new Date(Date.now() + 7*86400000).toISOString(), paidAt: null },
];

const waitlist: any[] = [];

const gpuPricing = [
  { model: 'NVIDIA A100',     memory: 40960, hourlyRate: 3.20, dailyRate: 64.00,  monthlyRate: 1600.00, computeCapability: '8.0', availability: 'HIGH'   },
  { model: 'NVIDIA H100',     memory: 80960, hourlyRate: 5.50, dailyRate: 110.00, monthlyRate: 2750.00, computeCapability: '9.0', availability: 'LOW'    },
  { model: 'NVIDIA RTX 4090', memory: 24576, hourlyRate: 1.80, dailyRate: 36.00,  monthlyRate: 900.00,  computeCapability: '8.9', availability: 'MEDIUM' },
  { model: 'NVIDIA V100',     memory: 32768, hourlyRate: 2.10, dailyRate: 42.00,  monthlyRate: 1050.00, computeCapability: '7.0', availability: 'HIGH'   },
];

// ─── Pagination helper ────────────────────────────────────────────────────
function paginate<T>(arr: T[], page: number, limit: number) {
  const total = arr.length;
  const pages = Math.ceil(total / limit);
  const data = arr.slice((page - 1) * limit, page * limit);
  return { data, total, page, pages, limit };
}

// ─── Auth ─────────────────────────────────────────────────────────────────
router.post('/auth/login', authLimiter, (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(401).json({ error: 'Email and password required' });
  const user = { id: '1', email, name: email.split('@')[0], role: email.includes('admin') ? 'ADMIN' : 'USER' };
  res.json({ token: 'test-jwt-token-12345', user, message: 'Login successful' });
});

router.post('/auth/register', authLimiter, (req: Request, res: Response) => {
  res.status(201).json({ message: 'User registered successfully', user: { id: '99', ...req.body, role: 'USER' } });
});

// ─── GPUs with pagination (#5) ────────────────────────────────────────────
router.get('/gpus', (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const result = paginate(mockGPUs, page, limit);
  res.json({ gpus: result.data, ...result });
});

router.get('/gpus/servers', (req: Request, res: Response) => {
  res.json({ servers: [
    { id: '1', name: 'GPU Server 1', hostname: 'gpu-server-01', ipAddress: '192.168.1.100', location: 'US-East', gpus: mockGPUs.slice(0, 2) },
    { id: '2', name: 'GPU Server 2', hostname: 'gpu-server-02', ipAddress: '192.168.1.101', location: 'US-West', gpus: mockGPUs.slice(2, 4) },
  ]});
});

router.get('/gpus/available', (req: Request, res: Response) => {
  const available = mockGPUs.filter(g => g.status === 'AVAILABLE');
  res.json({ gpus: available, count: available.length });
});

// GPU price comparison with filters (#4) ──────────────────────────────────
router.get('/gpus/compare', (req: Request, res: Response) => {
  const { sortBy = 'hourlyRate', order = 'asc', minMemory, maxPrice } = req.query;
  let results = [...gpuPricing];
  if (minMemory) results = results.filter(g => g.memory >= Number(minMemory));
  if (maxPrice)  results = results.filter(g => g.hourlyRate <= Number(maxPrice));
  results.sort((a: any, b: any) => {
    const diff = a[sortBy as string] - b[sortBy as string];
    return order === 'desc' ? -diff : diff;
  });
  res.json({ comparison: results, count: results.length, bestValue: results[0] || null });
});

// ─── Rentals (#1) ─────────────────────────────────────────────────────────
router.get('/rentals/my-rentals', (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const result = paginate(rentals, page, limit);
  res.json({ rentals: result.data, ...result });
});

router.post('/rentals', (req: Request, res: Response) => {
  const { gpuId, hours = 1 } = req.body;
  const gpu = mockGPUs.find(g => g.id === gpuId);
  if (!gpu) return res.status(404).json({ error: 'GPU not found' });
  if (gpu.status !== 'AVAILABLE') return res.status(409).json({ error: 'GPU is not available' });

  gpu.status = 'RENTED';
  const pricing = gpuPricing.find(p => p.model === gpu.model);
  const hourlyRate = pricing?.hourlyRate || 2.00;
  const rental = {
    id: `rental-${Date.now()}`,
    userId: '1',
    gpuId,
    gpu: { model: gpu.model },
    status: 'ACTIVE',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + hours * 3600000).toISOString(),
    hourlyRate,
  };
  rentals.push(rental);

  // Auto-generate invoice
  const amount = hourlyRate * hours;
  const tax = +(amount * 0.1).toFixed(2);
  invoices.push({
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-${String(invoices.length + 1).padStart(4, '0')}`,
    userId: '1',
    rentalId: rental.id,
    status: 'PENDING',
    amount: +amount.toFixed(2),
    tax,
    totalAmount: +(amount + tax).toFixed(2),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    paidAt: null,
  });

  res.status(201).json({ rental });
});

router.post('/rentals/:id/end', (req: Request, res: Response) => {
  const rental = rentals.find(r => r.id === req.params.id);
  if (!rental) return res.status(404).json({ error: 'Rental not found' });
  if (rental.status !== 'ACTIVE') return res.status(409).json({ error: 'Rental is not active' });

  rental.status = 'COMPLETED';
  rental.actualEndTime = new Date().toISOString();
  const gpu = mockGPUs.find(g => g.id === rental.gpuId);
  if (gpu) {
    gpu.status = 'AVAILABLE';
    // Notify waitlist
    const next = waitlist.find(w => w.gpuId === rental.gpuId);
    if (next) next.notified = true;
  }
  res.json({ message: 'Rental ended', rental });
});

router.post('/rentals/:id/extend', (req: Request, res: Response) => {
  const rental = rentals.find(r => r.id === req.params.id);
  if (!rental) return res.status(404).json({ error: 'Rental not found' });
  if (rental.status !== 'ACTIVE') return res.status(409).json({ error: 'Rental is not active' });

  const { hours = 1 } = req.body;
  rental.endTime = new Date(new Date(rental.endTime).getTime() + hours * 3600000).toISOString();
  res.json({ message: `Rental extended by ${hours} hour(s)`, rental });
});

// ─── Invoices (#2) ────────────────────────────────────────────────────────
router.get('/invoices/my-invoices', (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const result = paginate(invoices, page, limit);
  res.json({ invoices: result.data, ...result });
});

router.post('/invoices/:id/pay', (req: Request, res: Response) => {
  const invoice = invoices.find(i => i.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (invoice.status === 'PAID') return res.status(409).json({ error: 'Invoice already paid' });

  invoice.status = 'PAID';
  invoice.paidAt = new Date().toISOString();
  res.json({ message: 'Invoice paid successfully', invoice });
});

// ─── Subscriptions ────────────────────────────────────────────────────────
router.get('/subscriptions/plans', (req: Request, res: Response) => {
  res.json({ plans: mockPlans });
});

router.post('/subscriptions', (req: Request, res: Response) => {
  res.status(201).json({ subscription: { id: '1', planId: req.body.planId, status: 'TRIAL' } });
});

// ─── Admin (#3) ───────────────────────────────────────────────────────────
router.get('/admin/stats', (req: Request, res: Response) => {
  res.json({
    totalUsers: mockUsers.length,
    totalGPUs: mockGPUs.length,
    activeRentals: rentals.filter(r => r.status === 'ACTIVE').length,
    totalRevenue: invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.totalAmount, 0),
  });
});

router.get('/admin/users', (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const result = paginate(mockUsers, page, limit);
  res.json({ users: result.data, ...result });
});

router.get('/admin/rentals', (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const result = paginate(rentals, page, limit);
  res.json({ rentals: result.data, ...result });
});

// ─── Waitlist with notification status (#6) ───────────────────────────────
router.post('/gpus/:gpuId/waitlist', (req: Request, res: Response) => {
  const { gpuId } = req.params;
  const { userId = 'user-1' } = req.body;
  const gpu = mockGPUs.find(g => g.id === gpuId);
  if (!gpu) return res.status(404).json({ error: 'GPU not found' });
  if (waitlist.find(w => w.gpuId === gpuId && w.userId === userId))
    return res.status(409).json({ error: 'Already on waitlist' });
  const entry = { id: `wl-${Date.now()}`, userId, gpuId, joinedAt: new Date().toISOString(), position: waitlist.filter(w => w.gpuId === gpuId).length + 1, notified: false };
  waitlist.push(entry);
  res.status(201).json({ message: 'Added to waitlist', entry });
});

router.get('/gpus/:gpuId/waitlist', (req: Request, res: Response) => {
  const gpu = mockGPUs.find(g => g.id === req.params.gpuId);
  if (!gpu) return res.status(404).json({ error: 'GPU not found' });
  const entries = waitlist.filter(w => w.gpuId === req.params.gpuId);
  res.json({ gpuId: req.params.gpuId, gpu: gpu.model, waitlist: entries, count: entries.length });
});

// Notification status endpoint
router.get('/gpus/:gpuId/waitlist/:userId/status', (req: Request, res: Response) => {
  const entry = waitlist.find(w => w.gpuId === req.params.gpuId && w.userId === req.params.userId);
  if (!entry) return res.status(404).json({ error: 'Not on waitlist' });
  res.json({ notified: entry.notified, position: entry.position, entry });
});

router.delete('/gpus/:gpuId/waitlist', (req: Request, res: Response) => {
  const { userId = 'user-1' } = req.body;
  const idx = waitlist.findIndex(w => w.gpuId === req.params.gpuId && w.userId === userId);
  if (idx === -1) return res.status(404).json({ error: 'Not on waitlist' });
  waitlist.splice(idx, 1);
  res.json({ message: 'Removed from waitlist' });
});

export default router;
