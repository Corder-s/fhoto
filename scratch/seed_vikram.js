const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: 'apps/web/.env.local' });
dotenv.config({ path: '.env' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing Supabase URL or service key');
  process.exit(1);
}

const admin = createClient(url, serviceKey);

async function seedVikram() {
  console.log('Seeding Vikramaditya Rathore into Supabase...');

  const email = 'vikram.rathore.creator@instantshoot.in';
  const password = 'CreatorPass2026!#';

  // 1. Create or retrieve auth user
  const { data: userList } = await admin.auth.admin.listUsers();
  let user = userList?.users?.find(u => u.email === email);

  if (!user) {
    const { data: createdUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: 'Vikramaditya Rathore',
        name: 'Vikramaditya Rathore',
        role: 'creator',
        phone: '+91 9876543207'
      }
    });

    if (createErr) {
      console.error('Error creating user:', createErr);
      return;
    }
    user = createdUser.user;
    console.log('Created auth user:', user.id);
  } else {
    console.log('Found existing auth user:', user.id);
  }

  // 2. Upsert profile
  const { error: profileErr } = await admin.from('profiles').upsert({
    id: user.id,
    full_name: 'Vikramaditya Rathore',
    email,
    phone_number: '+91 9876543207',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    account_status: 'active'
  });
  if (profileErr) console.error('Error in profiles upsert:', profileErr);

  // 3. Insert user_roles if not exists
  const { data: existingRole } = await admin.from('user_roles').select('id').eq('user_id', user.id);
  if (!existingRole || existingRole.length === 0) {
    const { error: roleErr } = await admin.from('user_roles').insert({
      user_id: user.id,
      role: 'creator'
    });
    if (roleErr) console.error('Error in user_roles insert:', roleErr);
    else console.log('Assigned creator role to user');
  } else {
    console.log('User already has role in user_roles');
  }

  // 4. Upsert creator_profile
  let { data: existingCp } = await admin.from('creator_profiles').select('id').eq('user_id', user.id).single();
  let creatorId = existingCp?.id;

  if (!creatorId) {
    const { data: newCp, error: cpErr } = await admin.from('creator_profiles').insert({
      user_id: user.id,
      professional_name: 'Vikramaditya Rathore',
      biography: 'Vikram brings cinematic grandeur to couples and wedding parties across northern India, pairing medium-format cameras with cinema drone systems.',
      experience_years: 11,
      city: 'Delhi NCR',
      state: 'Delhi',
      service_radius: 50,
      portfolio_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
      verification_status: 'approved',
      average_rating: 4.95,
      total_reviews: 240,
      is_available: true
    }).select('id').single();

    if (cpErr) {
      console.error('Error inserting creator profile:', cpErr);
      return;
    }
    creatorId = newCp.id;
    console.log('Created creator profile:', creatorId);
  } else {
    console.log('Found existing creator profile:', creatorId);
    await admin.from('creator_profiles').update({
      professional_name: 'Vikramaditya Rathore',
      biography: 'Vikram brings cinematic grandeur to couples and wedding parties across northern India, pairing medium-format cameras with cinema drone systems.',
      experience_years: 11,
      city: 'Delhi NCR',
      state: 'Delhi',
      service_radius: 50,
      portfolio_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
      verification_status: 'approved',
      average_rating: 4.95,
      total_reviews: 240,
      is_available: true
    }).eq('id', creatorId);
  }

  // 5. Upsert services
  const services = [
    {
      creator_id: creatorId,
      title: 'Royal Pre-Wedding Stills',
      description: 'Heritage Location Scouting\nHasselblad 100MP Master Capture\n4K Aerial Drone Coverage\nPrivate VIP Proofing Cloud',
      base_price: 3500,
      duration_minutes: 180,
      delivery_time_hours: 48,
      instant_booking_enabled: false,
      is_active: true
    },
    {
      creator_id: creatorId,
      title: 'Grand Narrative Production',
      description: 'Multi-Operator Cinema Team\n8K Drone Video Footage\nArchival Fine-Art Print Box\nComplete Escrow Protection',
      base_price: 8500,
      duration_minutes: 480,
      delivery_time_hours: 72,
      instant_booking_enabled: false,
      is_active: true
    },
    {
      creator_id: creatorId,
      title: 'Instant Express Portrait Session',
      description: '60-min express portrait shoot with 15 master edits and 24h delivery.',
      base_price: 2499,
      duration_minutes: 60,
      delivery_time_hours: 24,
      instant_booking_enabled: true,
      is_active: true
    }
  ];

  // Clear existing services for this creator to avoid duplicates
  await admin.from('creator_services').delete().eq('creator_id', creatorId);
  const { error: srvErr } = await admin.from('creator_services').insert(services);
  if (srvErr) console.error('Error inserting services:', srvErr);
  else console.log('Inserted 3 services for Vikram');

  // 6. Upsert portfolio items
  const portfolio = [
    {
      creator_id: creatorId,
      title: 'Fortress Courtyard Pre-Wedding',
      description: 'Royal heritage pre-wedding portraiture captured on medium format.',
      preview_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      media_type: 'photo',
      display_order: 1
    },
    {
      creator_id: creatorId,
      title: 'Sunset Lake Aerial 8K',
      description: 'Monumental 8K drone aerial framing over Udaipur lakes.',
      preview_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
      media_type: 'photo',
      display_order: 2
    },
    {
      creator_id: creatorId,
      title: 'Heritage Archway Silhouette',
      description: 'Atmospheric light framing through ancient Rajasthani arches.',
      preview_url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
      media_type: 'photo',
      display_order: 3
    },
    {
      creator_id: creatorId,
      title: 'Monochrome Fine-Art Framing',
      description: 'Timeless black-and-white portrait study.',
      preview_url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80',
      media_type: 'photo',
      display_order: 4
    }
  ];

  await admin.from('creator_portfolio_items').delete().eq('creator_id', creatorId);
  const { error: portErr } = await admin.from('creator_portfolio_items').insert(portfolio);
  if (portErr) console.error('Error inserting portfolio:', portErr);
  else console.log('Inserted 4 portfolio items for Vikram');

  console.log('Vikram successfully seeded! Creator ID:', creatorId, 'User ID:', user.id);
}

seedVikram();
