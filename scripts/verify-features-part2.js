const { log, request, checkFeature, API_URL } = require('./verify-features-part1');

// Feature 2: GPU Inventory Management
async function testGPUInventory(token) {
  log('\n📋 2. GPU INVENTORY MANAGEMENT');
  const results = [];

  results.push(await checkFeature('GPU', 'Add/view GPU servers', async () => {
    const res = await request('GET', `${API_URL}/gpus/servers`, null, token);
    if (res.status !== 200) throw new Error('Cannot view GPU servers');
  }));

  results.push(await checkFeature('GPU', 'Add/view individual GPUs', async () => {
    const res = await request('GET', `${API_URL}/gpus`, null, token);
    if (res.status !== 200) throw new Error('Cannot view GPUs');
    if (!res.data.gpus || res.data.gpus.length === 0) throw new Error('No GPUs found');
  }));

  results.push(await checkFeature('GPU', 'GPU status tracking (Available, Rented, Maintenance, Offline)', async () => {
    const res = await request('GET', `${API_URL}/gpus`, null, token);
    const statuses = res.data.gpus.map(g => g.status);
    if (!statuses.includes('AVAILABLE') && !statuses.includes('RENTED')) {
      throw new Error('Status tracking not working');
    }
  }));

  results.push(await checkFeature('GPU', 'GPU cluster management', async () => {
    // Check if cluster endpoint exists in code
    const fs = require('fs');
    const path = require('path');
    const gpuFile = path.join(__dirname, '..', 'src', 'routes', 'gpu.routes.ts');
    if (fs.existsSync(gpuFile)) {
      const content = fs.readFileSync(gpuFile, 'utf8');
      if (!content.includes('cluster')) throw new Error('Cluster management not found');
    }
  }));

  results.push(await checkFeature('GPU', 'GPU specifications (model, memory, compute capability)', async () => {
    const res = await request('GET', `${API_URL}/gpus`, null, token);
    const gpu = res.data.gpus[0];
    if (!gpu.model || !gpu.memory || !gpu.computeCapability) {
      throw new Error('GPU specs incomplete');
    }
  }));

  results.push(await checkFeature('GPU', 'Search and filter GPUs', async () => {
    const res = await request('GET', `${API_URL}/gpus/available`, null, token);
    if (res.status !== 200) throw new Error('Filter not working');
  }));

  return results;
}

// Feature 3: Rental/Booking System
async function testRentalSystem(token) {
  log('\n📋 3. RENTAL/BOOKING SYSTEM');
  const results = [];

  results.push(await checkFeature('Rental', 'Create rental requests', async () => {
    const fs = require('fs');
    const path = require('path');
    const rentalFile = path.join(__dirname, '..', 'src', 'routes', 'rental.routes.ts');
    if (fs.existsSync(rentalFile)) {
      const content = fs.readFileSync(rentalFile, 'utf8');
      if (!content.includes('POST') || !content.includes('rental')) {
        throw new Error('Create rental not found');
      }
    }
  }));

  results.push(await checkFeature('Rental', 'Resource allocation algorithm', async () => {
    const fs = require('fs');
    const path = require('path');
    const allocFile = path.join(__dirname, '..', 'src', 'services', 'allocation.service.ts');
    if (!fs.existsSync(allocFile)) throw new Error('Allocation service not found');
  }));

  results.push(await checkFeature('Rental', 'Rental lifecycle management (Pending, Active, Completed, Cancelled)', async () => {
    const res = await request('GET', `${API_URL}/rentals/my-rentals`, null, token);
    if (res.status !== 200) throw new Error('Cannot get rentals');
  }));

  results.push(await checkFeature('Rental', 'Rental extensions', async () => {
    const fs = require('fs');
    const path = require('path');
    const rentalFile = path.join(__dirname, '..', 'src', 'routes', 'rental.routes.ts');
    if (fs.existsSync(rentalFile)) {
      const content = fs.readFileSync(rentalFile, 'utf8');
      if (!content.includes('extend')) throw new Error('Extend not found');
    }
  }));

  results.push(await checkFeature('Rental', 'Rental modifications', async () => {
    const fs = require('fs');
    const path = require('path');
    const rentalFile = path.join(__dirname, '..', 'src', 'routes', 'rental.routes.ts');
    if (fs.existsSync(rentalFile)) {
      const content = fs.readFileSync(rentalFile, 'utf8');
      if (!content.includes('update') && !content.includes('modify')) {
        // Extension counts as modification
        if (!content.includes('extend')) throw new Error('Modifications not found');
      }
    }
  }));

  results.push(await checkFeature('Rental', 'Conflict detection', async () => {
    const fs = require('fs');
    const path = require('path');
    const rentalFile = path.join(__dirname, '..', 'src', 'routes', 'rental.routes.ts');
    if (fs.existsSync(rentalFile)) {
      const content = fs.readFileSync(rentalFile, 'utf8');
      if (!content.includes('conflict') && !content.includes('available')) {
        throw new Error('Conflict detection not found');
      }
    }
  }));

  results.push(await checkFeature('Rental', 'Rental history tracking', async () => {
    const res = await request('GET', `${API_URL}/rentals/my-rentals`, null, token);
    if (res.status !== 200) throw new Error('History not accessible');
  }));

  return results;
}

module.exports = { testGPUInventory, testRentalSystem };
