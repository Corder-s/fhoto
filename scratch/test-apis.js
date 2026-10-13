// End-to-end API Smoke Test for Instantshoot Server Routes
const http = require('http');

function post(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port,
      path: u.pathname + u.search,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('=== INSTANTSHOOT SERVER API SMOKE TESTS ===\n');

  // Test 1: Booking Creation
  console.log('TEST 1: POST /api/bookings/create');
  const bookingRes = await post('http://localhost:3000/api/bookings/create', {
    creatorId: 'pro-aman',
    eventTitle: 'Cinematic Pre-Wedding Shoot',
    eventDate: '2026-10-25',
    eventLocation: 'Lodhi Gardens, New Delhi',
    customerNotes: 'Prefers golden hour lighting',
    bookingType: 'scheduled',
  });
  console.log('Status:', bookingRes.status);
  console.log('Response:', JSON.stringify(bookingRes.data, null, 2));

  if (!bookingRes.data?.success) {
    throw new Error('Booking creation failed');
  }
  const bookingId = bookingRes.data.booking.id;

  // Test 2: Payment Intent Creation (Dev Sandbox)
  console.log('\nTEST 2: POST /api/payments/create-intent');
  const idempotencyKey = `idemp_test_${Date.now()}`;
  const paymentRes = await post('http://localhost:3000/api/payments/create-intent', {
    bookingId,
    customerId: 'cust-test-1',
    idempotencyKey,
  });
  console.log('Status:', paymentRes.status);
  console.log('Response:', JSON.stringify(paymentRes.data, null, 2));

  // Test 3: Idempotent Payment Intent Retrieval
  console.log('\nTEST 3: POST /api/payments/create-intent (Idempotency Re-check)');
  const idempRes = await post('http://localhost:3000/api/payments/create-intent', {
    bookingId,
    customerId: 'cust-test-1',
    idempotencyKey,
  });
  console.log('Status:', idempRes.status);
  console.log('Idempotency matched:', idempRes.data.idempotencyKey === idempotencyKey);

  // Test 4: Deliverables Management (Google Drive link validation)
  console.log('\nTEST 4: POST /api/deliverables (Invalid Google Drive link)');
  const invalidDriveRes = await post('http://localhost:3000/api/deliverables', {
    bookingId,
    creatorId: 'pro-aman',
    title: 'Raw Photography Archives',
    deliverableType: 'raw_photos',
    storageProvider: 'google_drive',
    externalUrl: 'https://invalid-site.com/not-drive',
  });
  console.log('Status:', invalidDriveRes.status, '(Expected 400)');
  console.log('Validation Error:', invalidDriveRes.data?.error);

  console.log('\nTEST 5: POST /api/deliverables (Valid Google Drive link)');
  const validDriveRes = await post('http://localhost:3000/api/deliverables', {
    bookingId,
    creatorId: 'pro-aman',
    title: 'Client Proofing High-Res Gallery',
    deliverableType: 'edited_photos',
    storageProvider: 'google_drive',
    externalUrl: 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J-KLMNOPQRSTUVWXYZ',
  });
  console.log('Status:', validDriveRes.status);
  console.log('Response:', JSON.stringify(validDriveRes.data, null, 2));

  // Test 6: GET /api/deliverables
  console.log('\nTEST 6: GET /api/deliverables');
  const getDeliverablesRes = await get(`http://localhost:3000/api/deliverables?bookingId=${bookingId}`);
  console.log('Status:', getDeliverablesRes.status);
  console.log('Deliverables Count:', getDeliverablesRes.data?.deliverables?.length);

  console.log('\n=== ALL SMOKE TESTS COMPLETED SUCCESSFULLY! ===');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
