import { Router } from 'express';

const router = Router();

// Mock data
const mockGPUs = [
  { id: '1', model: 'NVIDIA A100', memory: 40960, status: 'AVAILABLE', computeCapability: '8.0', server: { name: 'GPU Server 1', location: 'US-East' } },
  { id: '2', model: 'NVIDIA H100', memory: 80960, status: 'AVAILABLE', computeCapability: '9.0', server: { name: 'GPU Server 1', location: 'US-East' } },
  { id: '3', model: 'NVIDIA RTX 4090', memory: 24576, status: 'RENTED', computeCapability: '8.9', server: { name: 'GPU Server 2', location: 'US-West' } },
  { id: '4', model: 'NVIDIA V100', memory: 32768, status: 'AVAILABLE', computeCapability: '7.0', server: { name: 'GPU Server 2', location: 'US-West' } },
];

const mockPlans = [
  { id: '1', name: 'Starter', description: 'Perfect for small projects', monthlyPrice: 99.99, gpuAllocation: 1 },
  { id: '2', name: 'Professional', description: 'For growing teams', monthlyPrice: 299.99, gpuAllocation: 3 },
  { id: '3', name: 'Enterprise', description: 'Unlimited power', monthlyPrice: 999.99, gpuAllocation: 10 },
];

const mockUser = {
  id: '1',
  email: 'user@example.com',
  name: 'Test User',
  role: 'USER'
};

const mockToken = 'mock-jwt-token-12345';

// Mock auth
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Accept any credentials for testing
  if (email && password) {
    const isAdmin = email.includes('admin');
    const user = {
      id: '1',
      email: email,
      name: email.split('@')[0],
      role: isAdmin ? 'ADMIN' : 'USER'
    };
    
    // Set cookies for session tracking
    res.cookie('auth_token', mockToken, { 
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: false, // Allow JS access for demo
      sameSite: 'strict'
    });
    res.cookie('user_email', email, { 
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: false
    });
    
    res.json({ token: mockToken, user, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'Email and password required' });
  }
});

router.post('/auth/register', (req, res) => {
  res.status(201).json({ message: 'User registered successfully', user: mockUser });
});

// Mock GPUs
router.get('/gpus', (req, res) => {
  res.json({ gpus: mockGPUs, count: mockGPUs.length });
});

router.get('/gpus/servers', (req, res) => {
  const servers = [
    { id: '1', name: 'GPU Server 1', hostname: 'gpu-server-01', ipAddress: '192.168.1.100', location: 'US-East', gpus: mockGPUs.slice(0, 2) },
    { id: '2', name: 'GPU Server 2', hostname: 'gpu-server-02', ipAddress: '192.168.1.101', location: 'US-West', gpus: mockGPUs.slice(2, 4) }
  ];
  res.json({ servers });
});

router.get('/gpus/available', (req, res) => {
  const available = mockGPUs.filter(g => g.status === 'AVAILABLE');
  res.json({ gpus: available, count: available.length });
});

// Mock rentals
router.get('/rentals/my-rentals', (req, res) => {
  res.json({
    rentals: [
      {
        id: 'rental-1',
        gpu: { model: 'NVIDIA A100' },
        status: 'ACTIVE',
        startTime: new Date().toISOString(),
        hourlyRate: 2.50
      }
    ],
    count: 1
  });
});

// Mock subscriptions
router.get('/subscriptions/plans', (req, res) => {
  res.json({ plans: mockPlans });
});

router.post('/subscriptions', (req, res) => {
  res.status(201).json({ subscription: { id: '1', planId: req.body.planId, status: 'TRIAL' } });
});

// Mock admin
router.get('/admin/stats', (req, res) => {
  res.json({
    totalUsers: 42,
    totalGPUs: 128,
    activeRentals: 15,
    totalRevenue: 12450.50
  });
});

export default router;
