const { createClient } = require('@supabase/supabase-js');

// Development seed script. Nothing is hardcoded: configure these environment variables
// (never commit their values):
//   NEXT_PUBLIC_SUPABASE_URL      - your Supabase project URL (a non-production project)
//   SUPABASE_SERVICE_ROLE_KEY     - service role key (server-only)
//   SEED_CREATOR_PASSWORD         - initial password for the seeded creator accounts (12+ chars)
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SEED_PASSWORD = process.env.SEED_CREATOR_PASSWORD;

if (!url || !serviceKey || !SEED_PASSWORD || SEED_PASSWORD.length < 12) {
  console.error(
    'Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SEED_CREATOR_PASSWORD (12+ characters) before running this seed.'
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey);

const CREATORS_DATA = [
  {
    email: 'aman.verma.creator@instantshoot.in',
    password: SEED_PASSWORD,
    fullName: 'Aman Verma',
    phone: '+91 9876543201',
    avatarUrl: '/reference-assets/avatar_aman.jpg',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    serviceRadius: 35,
    bio: 'Master of natural light, editorial portraits, and cinematic couple stories with 6+ years experience across Delhi NCR and destination venues.',
    years: 6,
    rating: 4.95,
    reviews: 148,
    portfolio: [
      {
        title: 'Golden Hour Couple Story',
        description: 'Sunset couple portraiture with warm tones and cinematic bokeh.',
        previewUrl: '/reference-assets/aman_c1.jpg',
      },
      {
        title: 'Urban Portrait Series',
        description: 'Modern editorial street portraits in Delhi NCR.',
        previewUrl: '/reference-assets/cat_portrait.jpg',
      },
      {
        title: 'Outdoor Atmosphere Scene',
        description: 'Natural light storytelling in Greater Noida parks.',
        previewUrl: '/reference-assets/hero_scene.jpg',
      },
    ],
    services: [
      {
        title: '60-Min Express Portrait Shoot',
        description: 'Includes 15 professionally color-graded photos and rapid 48h delivery.',
        price: 2499,
        duration: 60,
        type: 'instant',
        instantBooking: true,
      },
      {
        title: 'Couple & Pre-Wedding Cinematic Session',
        description: '2-hour scenic location shoot with 35 edited photos and vertical reel teaser.',
        price: 4999,
        duration: 120,
        type: 'scheduled',
        instantBooking: false,
      },
    ],
  },
  {
    email: 'riya.sen.creator@instantshoot.in',
    password: SEED_PASSWORD,
    fullName: 'Riya Sen',
    phone: '+91 9876543202',
    avatarUrl: '/reference-assets/avatar_riya.jpg',
    city: 'South Delhi',
    state: 'Delhi',
    serviceRadius: 40,
    bio: 'Fashion editorial photographer and viral video creator specializing in high-engagement Instagram reels and commercial branding.',
    years: 5,
    rating: 4.98,
    reviews: 210,
    portfolio: [
      {
        title: 'Editorial Studio Mood',
        description: 'Commercial lighting setup for luxury apparel and jewelry.',
        previewUrl: '/reference-assets/riya_c1.jpg',
      },
      {
        title: 'Dynamic Vertical Reels',
        description: 'Color-graded fast-cut reels optimized for TikTok and Instagram algorithms.',
        previewUrl: '/reference-assets/cat_reels.jpg',
      },
    ],
    services: [
      {
        title: '90-Min Reels & Creator Package',
        description: '3 edited 4K vertical reels with royalty-free audio sync + 10 stills.',
        price: 3200,
        duration: 90,
        type: 'instant',
        instantBooking: true,
      },
      {
        title: 'Commercial Fashion Staging',
        description: 'Half-day studio lighting with mood board styling and 25 retouched lookbook images.',
        price: 7500,
        duration: 240,
        type: 'scheduled',
        instantBooking: false,
      },
    ],
  },
  {
    email: 'karan.malhotra.creator@instantshoot.in',
    password: SEED_PASSWORD,
    fullName: 'Karan Malhotra',
    phone: '+91 9876543203',
    avatarUrl: '/reference-assets/avatar_karan.jpg',
    city: 'Noida',
    state: 'Uttar Pradesh',
    serviceRadius: 45,
    bio: 'Documentary wedding specialist and candid event storyteller with Sony Alpha G-Master camera systems and fast 24-hour turnaround.',
    years: 8,
    rating: 4.92,
    reviews: 95,
    portfolio: [
      {
        title: 'Candid Celebrations',
        description: 'Real-time joy, dance floor highlights, and authentic emotional moments.',
        previewUrl: '/reference-assets/karan_c1.jpg',
      },
      {
        title: 'Social Gala Coverage',
        description: 'Full ceremony documentation with multi-angle lighting.',
        previewUrl: '/reference-assets/cat_events.jpg',
      },
    ],
    services: [
      {
        title: '3-Hour Birthday & Event Coverage',
        description: 'High-speed event capture with 80+ processed images delivered in 24 hours.',
        price: 4500,
        duration: 180,
        type: 'scheduled',
        instantBooking: true,
      },
      {
        title: 'Full-Day Wedding Storytelling',
        description: 'Comprehensive wedding coverage from morning prep to evening reception.',
        price: 18500,
        duration: 600,
        type: 'scheduled',
        instantBooking: false,
      },
    ],
  },
  {
    email: 'arjun.kapoor.visuals@instantshoot.in',
    password: SEED_PASSWORD,
    fullName: 'Arjun Kapoor',
    phone: '+91 9876543204',
    avatarUrl: '/reference-assets/avatar_aman.jpg',
    city: 'Gurugram',
    state: 'Haryana',
    serviceRadius: 30,
    bio: 'Corporate headshot specialist, commercial product photographer, and executive summit storyteller across Cyber City and Golf Course Road.',
    years: 7,
    rating: 4.89,
    reviews: 78,
    portfolio: [
      {
        title: 'Executive Headshot Series',
        description: 'Clean modern LinkedIn and corporate board portraits.',
        previewUrl: '/reference-assets/cat_portrait.jpg',
      },
      {
        title: 'Commercial Product Cataloging',
        description: 'Studio tabletop lighting for e-commerce and packaging.',
        previewUrl: '/reference-assets/hero_scene.jpg',
      },
    ],
    services: [
      {
        title: 'Executive Corporate Headshots',
        description: 'Up to 5 team members with studio backdrop & natural lighting.',
        price: 3800,
        duration: 90,
        type: 'instant',
        instantBooking: true,
      },
      {
        title: 'Product Catalog Staging (10 SKUs)',
        description: 'High-detail product stills with isolated white and styled backgrounds.',
        price: 5500,
        duration: 180,
        type: 'scheduled',
        instantBooking: false,
      },
    ],
  },
  {
    email: 'meera.singhal.creator@instantshoot.in',
    password: SEED_PASSWORD,
    fullName: 'Meera Singhal',
    phone: '+91 9876543205',
    avatarUrl: '/reference-assets/avatar_riya.jpg',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    serviceRadius: 25,
    bio: 'Creative campus storyteller, graduation portraitist, and budget-friendly couple photographer across Knowledge Park, Pari Chowk, and Tech Zone.',
    years: 4,
    rating: 4.96,
    reviews: 112,
    portfolio: [
      {
        title: 'Campus & Graduation Memories',
        description: 'Vibrant outdoor portraits celebrating milestones and student life.',
        previewUrl: '/reference-assets/aman_c1.jpg',
      },
      {
        title: 'Creative Golden Hour Session',
        description: 'Artistic framing and warm pastel grading.',
        previewUrl: '/reference-assets/cat_reels.jpg',
      },
    ],
    services: [
      {
        title: '45-Min Express Student / Solo Shoot',
        description: '10 edited photos ready for Instagram & LinkedIn within 24h.',
        price: 1999,
        duration: 45,
        type: 'instant',
        instantBooking: true,
      },
      {
        title: 'Sunset Couple Story in Greater Noida',
        description: '90-min romantic outdoor session with 25 color-corrected portraits.',
        price: 3499,
        duration: 90,
        type: 'scheduled',
        instantBooking: true,
      },
    ],
  },
  {
    email: 'devika.roy.cinema@instantshoot.in',
    password: SEED_PASSWORD,
    fullName: 'Devika Roy',
    phone: '+91 9876543206',
    avatarUrl: '/reference-assets/avatar_karan.jpg',
    city: 'Mumbai',
    state: 'Maharashtra',
    serviceRadius: 50,
    bio: 'Cinematographer and colorist crafting cinematic 4K video reels, luxury destination wedding films, and brand films with anamorphic lenses.',
    years: 9,
    rating: 4.97,
    reviews: 134,
    portfolio: [
      {
        title: 'Cinematic Fashion Film',
        description: 'Graded in DaVinci Resolve with film emulation LUTs.',
        previewUrl: '/reference-assets/riya_c1.jpg',
      },
      {
        title: 'Wedding Highlights Narrative',
        description: 'Emotion-driven cinema edits with synchronized audio sound design.',
        previewUrl: '/reference-assets/cat_events.jpg',
      },
    ],
    services: [
      {
        title: '4K Cinematic Highlight Reel',
        description: 'Custom music synchronization, drone clips, and vertical format delivery.',
        price: 5000,
        duration: 120,
        type: 'instant',
        instantBooking: true,
      },
      {
        title: 'Full Day Destination Cinema',
        description: 'Multi-camera setup with gimbal, audio recording, and full feature film.',
        price: 22000,
        duration: 480,
        type: 'scheduled',
        instantBooking: false,
      },
    ],
  },
];

async function seedAll() {
  console.log(`Starting seed of ${CREATORS_DATA.length} verified creators...`);

  for (const c of CREATORS_DATA) {
    console.log(`Seeding: ${c.fullName} (${c.city})...`);

    // 1. Create or fetch auth user
    let userId;
    const { data: userCreated, error: createErr } = await admin.auth.admin.createUser({
      email: c.email,
      password: c.password,
      email_confirm: true,
      user_metadata: {
        full_name: c.fullName,
        role: 'creator',
        city: c.city,
      },
    });

    if (createErr) {
      if (createErr.message.includes('already registered')) {
        const { data: usersList } = await admin.auth.admin.listUsers();
        const existing = usersList.users.find((u) => u.email === c.email);
        if (existing) userId = existing.id;
      } else {
        console.error(`Auth user error for ${c.email}:`, createErr.message);
        continue;
      }
    } else {
      userId = userCreated.user.id;
    }

    if (!userId) continue;

    // 2. Profile upsert
    await admin.from('profiles').upsert(
      {
        id: userId,
        full_name: c.fullName,
        email: c.email,
        phone_number: c.phone,
        avatar_url: c.avatarUrl,
        account_status: 'active',
      },
      { onConflict: 'id' }
    );

    // 3. Creator profile upsert
    const { data: creatorProfile, error: cpErr } = await admin
      .from('creator_profiles')
      .upsert(
        {
          user_id: userId,
          professional_name: c.fullName,
          biography: c.bio,
          experience_years: c.years,
          city: c.city,
          state: c.state,
          service_radius: c.serviceRadius,
          portfolio_url: c.portfolio[0].previewUrl,
          verification_status: 'approved',
          average_rating: c.rating,
          total_reviews: c.reviews,
          is_available: true,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (cpErr) {
      console.error(`Creator profile error for ${c.fullName}:`, cpErr.message);
      continue;
    }

    // 4. Portfolio items
    await admin.from('creator_portfolio_items').delete().eq('creator_id', creatorProfile.id);
    const portfolioRows = c.portfolio.map((p, idx) => ({
      creator_id: creatorProfile.id,
      title: p.title,
      description: p.description,
      media_type: 'photo',
      preview_url: p.previewUrl,
      display_order: idx + 1,
      is_published: true,
    }));
    await admin.from('creator_portfolio_items').insert(portfolioRows);

    // 5. Services
    await admin.from('creator_services').delete().eq('creator_id', creatorProfile.id);
    const serviceRows = c.services.map((s) => ({
      creator_id: creatorProfile.id,
      title: s.title,
      description: s.description,
      base_price: s.price,
      duration_minutes: s.duration,
      delivery_time_hours: 48,
      service_type: s.type,
      instant_booking_enabled: s.instantBooking,
      is_active: true,
    }));
    await admin.from('creator_services').insert(serviceRows);

    console.log(`✓ Seeded ${c.fullName} successfully!`);
  }

  console.log('Seeding process finished!');
}

seedAll().catch((err) => console.error('Fatal seed error:', err));
