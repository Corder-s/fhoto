const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== RUNNING PHASE 8 VERIFICATION TESTS ===\n');

  // Test 1: Slug resolution for pro-vikram
  console.log('TEST 1: API resolution of slug pro-vikram');
  const resVikram = await get('http://localhost:3000/api/photographers?id=pro-vikram');
  const jsonVikram = JSON.parse(resVikram.body);
  console.log('Status:', resVikram.status);
  console.log('Success:', jsonVikram.success);
  console.log('Count:', jsonVikram.count);
  console.log('Name:', jsonVikram.photographers?.[0]?.name);
  console.log('Slug:', jsonVikram.photographers?.[0]?.slug);
  console.log('Services Count:', jsonVikram.photographers?.[0]?.services?.length);
  console.log('Portfolio Items:', jsonVikram.photographers?.[0]?.portfolio?.length);
  if (jsonVikram.photographers?.[0]?.name !== 'Vikramaditya Rathore') {
    throw new Error('TEST 1 FAILED: Did not return Vikramaditya Rathore');
  }
  console.log('✓ TEST 1 PASSED\n');

  // Test 2: Slug resolution for pro-aman
  console.log('TEST 2: API resolution of slug pro-aman');
  const resAman = await get('http://localhost:3000/api/photographers?id=pro-aman');
  const jsonAman = JSON.parse(resAman.body);
  console.log('Name:', jsonAman.photographers?.[0]?.name);
  console.log('Slug:', jsonAman.photographers?.[0]?.slug);
  if (!jsonAman.photographers?.[0]?.name.includes('Aman')) {
    throw new Error('TEST 2 FAILED');
  }
  console.log('✓ TEST 2 PASSED\n');

  // Test 3: Invalid slug handling
  console.log('TEST 3: API resolution of invalid slug');
  const resInvalid = await get('http://localhost:3000/api/photographers?id=invalid-random-slug-12345');
  const jsonInvalid = JSON.parse(resInvalid.body);
  console.log('Count:', jsonInvalid.count);
  if (jsonInvalid.count !== 0) {
    throw new Error('TEST 3 FAILED: Invalid slug should return 0 photographers');
  }
  console.log('✓ TEST 3 PASSED\n');

  // Test 4: Public profile route /photographers/pro-vikram
  console.log('TEST 4: GET /photographers/pro-vikram SSR HTML');
  const pageVikram = await get('http://localhost:3000/photographers/pro-vikram');
  console.log('Status:', pageVikram.status);
  const containsSnapshoot = pageVikram.body.includes('SNAPSHOOT');
  const containsLoadingOrVikram = pageVikram.body.includes('Loading verified artist profile from Supabase') || pageVikram.body.includes('Vikramaditya');
  const containsDashboardSidebar = pageVikram.body.includes('PhotographerSidebar') || pageVikram.body.includes('SellerDashboardView');
  console.log('Contains Public Marketplace Branding:', containsSnapshoot);
  console.log('Contains Valid Profile State:', containsLoadingOrVikram);
  console.log('Contains PhotographerSidebar/Dashboard:', containsDashboardSidebar);
  if (!containsSnapshoot || !containsLoadingOrVikram || containsDashboardSidebar) {
    throw new Error('TEST 4 FAILED: Profile page invalid or contained sidebar');
  }
  console.log('✓ TEST 4 PASSED\n');

  // Test 5: Customer routes existence
  console.log('TEST 5: Customer routes accessibility');
  const customerRoutes = [
    '/customer/dashboard',
    '/customer/bookings',
    '/customer/favorites',
    '/customer/messages',
    '/customer/profile',
    '/customer/settings'
  ];
  for (const route of customerRoutes) {
    const r = await get(`http://localhost:3000${route}`);
    console.log(`Route ${route}: status ${r.status}`);
    if (r.status !== 200 && r.status !== 307 && r.status !== 308) {
      throw new Error(`TEST 5 FAILED on ${route}`);
    }
  }
  console.log('✓ TEST 5 PASSED\n');

  // Test 6: Photographer routes existence
  console.log('TEST 6: Photographer dashboard routes accessibility');
  const photographerRoutes = [
    '/photographer/dashboard',
    '/photographer/profile',
    '/photographer/portfolio',
    '/photographer/packages',
    '/photographer/availability',
    '/photographer/bookings',
    '/photographer/messages',
    '/photographer/earnings',
    '/photographer/settings'
  ];
  for (const route of photographerRoutes) {
    const r = await get(`http://localhost:3000${route}`);
    console.log(`Route ${route}: status ${r.status}`);
    if (r.status !== 200 && r.status !== 307 && r.status !== 308) {
      throw new Error(`TEST 6 FAILED on ${route}`);
    }
  }
  console.log('✓ TEST 6 PASSED\n');

  // Test 7: Public Marketplace routes
  console.log('TEST 7: Public marketplace routes');
  const publicRoutes = [
    '/explore',
    '/services',
    '/categories',
    '/how-it-works',
    '/login',
    '/register'
  ];
  for (const route of publicRoutes) {
    const r = await get(`http://localhost:3000${route}`);
    console.log(`Route ${route}: status ${r.status}`);
    if (r.status !== 200) {
      throw new Error(`TEST 7 FAILED on ${route}`);
    }
  }
  console.log('✓ TEST 7 PASSED\n');

  console.log('ALL PHASE 8 TESTS PASSED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
