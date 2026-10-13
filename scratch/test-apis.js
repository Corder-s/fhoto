// API smoke test for the Next.js route handlers.
//
// Usage:
//   SMOKE_BASE_URL=http://localhost:3000 node scratch/test-apis.js
//
// Always runs (no session needed): every protected route must refuse anonymous callers.
// Runs only when SMOKE_COOKIE (a Supabase session cookie header value for a CUSTOMER
// account, copied from a signed-in browser) and SMOKE_CREATOR_ID (an approved
// creator_profiles.id) are provided. Credentials are never stored in this file.
//
// Exits non-zero if any assertion fails. It never prints the cookie value.

const BASE = (process.env.SMOKE_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const COOKIE = process.env.SMOKE_COOKIE || '';
const CREATOR_ID = process.env.SMOKE_CREATOR_ID || '';

let failures = 0;
let passes = 0;

function check(name, ok, detail = '') {
  if (ok) {
    passes += 1;
    console.log(`PASS  ${name}${detail ? `  (${detail})` : ''}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${name}${detail ? `  (${detail})` : ''}`);
  }
}

async function request(method, path, { body, cookie } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, json };
}

async function anonymousChecks() {
  console.log('--- Anonymous callers must be refused ---');
  const cases = [
    ['POST', '/api/bookings/create', { creatorId: 'any', eventDate: '2030-01-01' }],
    ['POST', '/api/payments/create-intent', { bookingId: '00000000-0000-4000-8000-000000000000' }],
    ['POST', '/api/deliverables', { bookingId: '00000000-0000-4000-8000-000000000000', title: 'x' }],
    ['GET', '/api/deliverables?bookingId=00000000-0000-4000-8000-000000000000', undefined],
    ['POST', '/api/photographers/services', { title: 'x', basePrice: 1 }],
    ['GET', '/api/admin/stats', undefined],
    ['GET', '/api/admin/users', undefined],
  ];
  for (const [method, path, body] of cases) {
    const res = await request(method, path, { body });
    check(`${method} ${path} without session -> 401`, res.status === 401, `got ${res.status}`);
  }
}

async function authenticatedChecks() {
  if (!COOKIE || !CREATOR_ID) {
    console.log('--- Signed-in checks skipped (set SMOKE_COOKIE and SMOKE_CREATOR_ID to run) ---');
    return;
  }
  console.log('--- Signed-in customer checks ---');
  const session = await request('GET', '/api/auth/session', { cookie: COOKIE });
  check('GET /api/auth/session with cookie -> 200 authenticated', session.status === 200 && session.json?.authenticated === true, `got ${session.status}`);

  const booking = await request('POST', '/api/bookings/create', {
    cookie: COOKIE,
    body: {
      creatorId: CREATOR_ID,
      eventTitle: 'Smoke test booking',
      eventDate: '2030-01-15',
      eventLocation: 'Smoke test location',
      customerNotes: 'Automated smoke test',
      bookingType: 'scheduled',
    },
  });
  check('POST /api/bookings/create with session -> success', booking.status < 300 && booking.json?.success === true, `got ${booking.status}`);

  const bookingId = booking.json?.booking?.id;
  if (!bookingId) {
    check('booking id returned', false);
    return;
  }

  const invalidDrive = await request('POST', '/api/deliverables', {
    cookie: COOKIE,
    body: { bookingId, title: 'Bad link', deliverableType: 'raw_photos', storageProvider: 'google_drive', externalUrl: 'https://invalid-site.example/not-drive' },
  });
  check('POST /api/deliverables with non-Drive link -> 400', invalidDrive.status === 400, `got ${invalidDrive.status}`);

  const list = await request('GET', `/api/deliverables?bookingId=${bookingId}`, { cookie: COOKIE });
  check('GET /api/deliverables for own booking -> 200', list.status === 200, `got ${list.status}`);
}

async function main() {
  console.log(`=== API smoke test against ${BASE} ===`);
  await anonymousChecks();
  await authenticatedChecks();
  console.log(`\nResult: ${passes} passed, ${failures} failed`);
  if (failures > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Smoke test could not run:', err.message);
  process.exit(1);
});
