// scripts/test-endpoints.js
// Loops through all endpoints and reports pass/fail

const BASE = 'http://localhost:3000/api/v1';
let token = '';
let rentalId = '';
let invoiceId = '';

const results = [];

async function req(method, path, body, expectedStatus = 200) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    const pass = res.status === expectedStatus;
    results.push({ pass, method, path, status: res.status, expected: expectedStatus });
    if (!pass) console.error(`  FAIL  [${res.status}] ${method} ${path} (expected ${expectedStatus})`);
    else       console.log (`  PASS  [${res.status}] ${method} ${path}`);
    return { ok: pass, data, status: res.status };
  } catch (e) {
    results.push({ pass: false, method, path, status: 'ERR', expected: expectedStatus });
    console.error(`  ERROR ${method} ${path} - ${e.message}`);
    return { ok: false, data: {}, status: 0 };
  }
}

async function run() {
  console.log('\n=== GPU Lending Platform - Endpoint Test Loop ===\n');

  // Auth
  console.log('--- Auth ---');
  const login = await req('POST', '/auth/login', { email: 'user@example.com', password: 'user123' });
  if (login.data.token) token = login.data.token;
  await req('POST', '/auth/register', { name: 'Test', email: 'test@test.com', password: 'pass1234' }, 201);

  // GPUs
  console.log('\n--- GPUs ---');
  await req('GET', '/gpus');
  await req('GET', '/gpus?page=1&limit=2');
  await req('GET', '/gpus/available');
  await req('GET', '/gpus/servers');
  await req('GET', '/gpus/compare');
  await req('GET', '/gpus/compare?minMemory=30000&maxPrice=4&sortBy=hourlyRate&order=asc');

  // Rentals
  console.log('\n--- Rentals ---');
  await req('GET', '/rentals/my-rentals');
  const createRental = await req('POST', '/rentals', { gpuId: '1', hours: 2 }, 201);
  if (createRental.data.rental) rentalId = createRental.data.rental.id;
  await req('POST', '/rentals', { gpuId: '999', hours: 1 }, 404);       // not found
  await req('POST', '/rentals', { gpuId: '3', hours: 1 }, 409);         // already rented
  if (rentalId) {
    await req('POST', `/rentals/${rentalId}/extend`, { hours: 1 });
    await req('POST', `/rentals/${rentalId}/end`);
    await req('POST', `/rentals/${rentalId}/end`, {}, 409);              // already ended
  }

  // Invoices
  console.log('\n--- Invoices ---');
  const invList = await req('GET', '/invoices/my-invoices');
  if (invList.data.invoices?.length) invoiceId = invList.data.invoices[0].id;
  if (invoiceId) {
    await req('POST', `/invoices/${invoiceId}/pay`);
    await req('POST', `/invoices/${invoiceId}/pay`, {}, 409);            // already paid
  }
  await req('POST', '/invoices/nonexistent/pay', {}, 404);

  // Subscriptions
  console.log('\n--- Subscriptions ---');
  await req('GET', '/subscriptions/plans');
  await req('POST', '/subscriptions', { planId: '1' }, 201);

  // Waitlist
  console.log('\n--- Waitlist ---');
  await req('POST', '/gpus/3/waitlist', { userId: 'user-test' }, 201);
  await req('POST', '/gpus/3/waitlist', { userId: 'user-test' }, 409);  // duplicate
  await req('GET',  '/gpus/3/waitlist');
  await req('GET',  '/gpus/3/waitlist/user-test/status');
  await req('POST', '/gpus/999/waitlist', { userId: 'x' }, 404);        // bad gpu
  await req('DELETE', '/gpus/3/waitlist', { userId: 'user-test' });

  // Admin
  console.log('\n--- Admin ---');
  await req('GET', '/admin/stats');
  await req('GET', '/admin/users');
  await req('GET', '/admin/users?page=1&limit=2');
  await req('GET', '/admin/rentals');

  // Summary
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n=== Results: ${passed} passed, ${failed} failed out of ${results.length} tests ===`);

  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter(r => !r.pass).forEach(r => {
      console.log(`  [${r.status}] ${r.method} ${r.path} (expected ${r.expected})`);
    });
    process.exit(1);
  } else {
    console.log('\nAll tests passed.');
    process.exit(0);
  }
}

run();
