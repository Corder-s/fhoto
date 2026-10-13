import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    // 1. Fetch available platform service categories
    const { data: categories } = await client
      .from('service_categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (!userId) {
      return NextResponse.json({
        success: true,
        isNew: true,
        categories: categories || [],
        profile: null,
        creatorProfile: null,
        portfolioItems: [],
        services: [],
      });
    }

    // 2. Fetch user profile
    const { data: profile } = await client
      .from('profiles')
      .select('id, full_name, email, phone_number, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    // 3. Fetch creator profile
    const { data: creatorProfile } = await client
      .from('creator_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    let portfolioItems: any[] = [];
    let services: any[] = [];

    if (creatorProfile?.id) {
      // 4. Fetch creator portfolio items
      const { data: portfolioData } = await client
        .from('creator_portfolio_items')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('display_order', { ascending: true });

      portfolioItems = portfolioData || [];

      // 5. Fetch creator services
      const { data: servicesData } = await client
        .from('creator_services')
        .select('*, service_categories(name)')
        .eq('creator_id', creatorProfile.id)
        .eq('is_active', true);

      services = servicesData || [];
    }

    return NextResponse.json({
      success: true,
      categories: categories || [],
      profile,
      creatorProfile,
      portfolioItems,
      services,
    });
  } catch (err: any) {
    console.error('Error fetching creator onboarding data:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      personal,
      professional,
      portfolioItems = [],
      services = [],
      verification,
    } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required to submit creator onboarding.' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database service unavailable' }, { status: 503 });
    }

    // 1. Update Profile Information (Full Name, Phone)
    if (personal?.name || personal?.phone) {
      await client
        .from('profiles')
        .update({
          full_name: personal.name,
          phone_number: personal.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    // 2. Ensure Role is 'creator' in user_roles
    await client
      .from('user_roles')
      .upsert(
        { user_id: userId, role: 'creator' },
        { onConflict: 'user_id, role' }
      );

    // 3. Upsert Creator Profile in creator_profiles
    const creatorPayload: any = {
      user_id: userId,
      professional_name: personal?.name || 'Professional Creator',
      biography: professional?.bio || '',
      experience_years: Number(professional?.experienceYears) || 1,
      city: personal?.city || 'Delhi NCR',
      state: 'Delhi',
      service_radius: 25,
      verification_status: 'pending', // transitioned to pending approval
      is_available: true,
      updated_at: new Date().toISOString(),
    };

    const { data: creatorProfile, error: creatorErr } = await client
      .from('creator_profiles')
      .upsert(creatorPayload, { onConflict: 'user_id' })
      .select('id')
      .single();

    if (creatorErr) {
      console.error('Error saving creator profile:', creatorErr);
      return NextResponse.json({ success: false, error: creatorErr.message }, { status: 500 });
    }

    const creatorId = creatorProfile.id;

    // 4. Sync Portfolio Items (Replace or Insert)
    if (Array.isArray(portfolioItems)) {
      // Clear existing items for this creator to avoid stale duplicates
      await client
        .from('creator_portfolio_items')
        .delete()
        .eq('creator_id', creatorId);

      if (portfolioItems.length > 0) {
        const portfolioInserts = portfolioItems.map((item: any, idx: number) => ({
          creator_id: creatorId,
          title: item.title || `Portfolio Sample #${idx + 1}`,
          description: item.category || 'Portfolio Showcase',
          media_type: 'photo',
          preview_url: item.imageUrl || item.preview_url,
          display_order: idx,
          is_published: true,
        }));

        await client
          .from('creator_portfolio_items')
          .insert(portfolioInserts);
      }
    }

    // 5. Sync Services
    if (Array.isArray(services)) {
      await client
        .from('creator_services')
        .delete()
        .eq('creator_id', creatorId);

      if (services.length > 0) {
        const serviceInserts = services.map((srv: any) => ({
          creator_id: creatorId,
          title: srv.title || 'Standard Shoot Package',
          description: srv.description || 'Professional photography coverage with high-resolution digital delivery.',
          base_price: Number(srv.priceInr || srv.base_price) || 4999,
          currency: 'INR',
          duration_minutes: (Number(srv.durationHours) || 2) * 60,
          delivery_time_hours: 48,
          service_type: 'scheduled',
          instant_booking_enabled: true,
          is_active: true,
        }));

        await client
          .from('creator_services')
          .insert(serviceInserts);
      }
    }

    const referenceCode = `ONB-${userId.slice(0, 8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      creatorId,
      referenceCode,
      message: 'Creator onboarding application submitted to Supabase successfully.',
    });
  } catch (err: any) {
    console.error('Error submitting creator onboarding:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
