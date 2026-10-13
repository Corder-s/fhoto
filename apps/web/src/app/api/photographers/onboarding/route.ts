import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { cleanText, isSafeHttpsUrl, matchesSessionUser } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/photographers/onboarding
 * Returns the onboarding state for the signed-in user: active categories, their
 * profile, creator profile, portfolio and active packages.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  if (!matchesSessionUser(user.id, new URL(req.url).searchParams.get('userId'))) {
    return jsonError(403, 'You can only view your own onboarding data.');
  }

  try {
    const { data: categories } = await admin
      .from('service_categories')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name', { ascending: true });

    const { data: profile } = await admin
      .from('profiles')
      .select('id, full_name, email, phone_number, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    const { data: creatorProfile } = await admin
      .from('creator_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let portfolioItems: any[] = [];
    let services: any[] = [];

    if (creatorProfile?.id) {
      const { data: portfolioData } = await admin
        .from('creator_portfolio_items')
        .select('*')
        .eq('creator_id', creatorProfile.id)
        .order('display_order', { ascending: true });
      portfolioItems = portfolioData || [];

      const { data: servicesData } = await admin
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
  } catch (err) {
    console.error('Error fetching creator onboarding data:', err);
    return jsonError(500, 'Could not load onboarding data.');
  }
}

/**
 * POST /api/photographers/onboarding
 * Submits (or re-submits) the photographer application for the signed-in user.
 * The application moves to 'pending' for platform review. An already approved
 * creator keeps their approval when they edit their details.
 */
export async function POST(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  if (!matchesSessionUser(user.id, body.userId)) {
    return jsonError(403, 'You can only submit your own application.');
  }

  const { personal, professional, portfolioItems = [], services = [] } = body;
  if (!Array.isArray(portfolioItems) || !Array.isArray(services)) {
    return jsonError(400, 'portfolioItems and services must be lists.');
  }

  try {
    const fullName = cleanText(personal?.name, 120);
    const phone = typeof personal?.phone === 'string' ? personal.phone.trim().slice(0, 20) : undefined;
    if (fullName || phone) {
      const { error: profileErr } = await admin
        .from('profiles')
        .update({
          ...(fullName ? { full_name: fullName } : {}),
          ...(phone !== undefined ? { phone_number: phone || null } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (profileErr) return jsonError(500, 'Could not save personal details.');
    }

    // Grant the creator role (idempotent). Approval itself is never set here.
    const { error: roleErr } = await admin
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'creator' }, { onConflict: 'user_id,role' });
    if (roleErr) return jsonError(500, 'Could not register the photographer role.');

    const { data: existing } = await admin
      .from('creator_profiles')
      .select('id, verification_status')
      .eq('user_id', user.id)
      .maybeSingle();

    const nextStatus = existing?.verification_status === 'approved' ? 'approved' : 'pending';

    const creatorPayload = {
      user_id: user.id,
      professional_name: cleanText(personal?.name, 120) || 'Professional Creator',
      biography: cleanText(professional?.bio, 2000) || '',
      experience_years: Math.min(Math.max(Number.parseInt(professional?.experienceYears, 10) || 1, 0), 80),
      city: cleanText(personal?.city, 80) || 'Delhi NCR',
      state: 'Delhi',
      service_radius: 25,
      verification_status: nextStatus,
      is_available: true,
      updated_at: new Date().toISOString(),
    };

    const { data: creatorProfile, error: creatorErr } = await admin
      .from('creator_profiles')
      .upsert(creatorPayload, { onConflict: 'user_id' })
      .select('id')
      .single();

    if (creatorErr || !creatorProfile) {
      console.error('Error saving creator profile:', creatorErr?.message);
      return jsonError(500, 'Could not save your photographer profile.');
    }
    const creatorId = creatorProfile.id;

    // Portfolio: replace this creator's items (no foreign keys reference them).
    const portfolioRows = portfolioItems
      .map((item: any, idx: number) => ({ item, idx }))
      .filter(({ item }) => isSafeHttpsUrl(item?.imageUrl || item?.preview_url))
      .map(({ item, idx }) => ({
        creator_id: creatorId,
        title: cleanText(item.title, 150) || `Portfolio Sample #${idx + 1}`,
        description: cleanText(item.category, 500) || 'Portfolio Showcase',
        media_type: 'photo',
        preview_url: item.imageUrl || item.preview_url,
        display_order: idx,
        is_published: true,
      }));
    const { error: clearPortfolioErr } = await admin.from('creator_portfolio_items').delete().eq('creator_id', creatorId);
    if (clearPortfolioErr) return jsonError(500, 'Could not update portfolio.');
    if (portfolioRows.length > 0) {
      const { error } = await admin.from('creator_portfolio_items').insert(portfolioRows);
      if (error) return jsonError(500, 'Could not save portfolio items.');
    }

    // Packages: packages referenced by bookings are deactivated rather than deleted.
    const { data: currentServices } = await admin
      .from('creator_services')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('is_active', true);
    if (currentServices && currentServices.length > 0) {
      const { error: deactivateErr } = await admin
        .from('creator_services')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('creator_id', creatorId)
        .eq('is_active', true);
      if (deactivateErr) return jsonError(500, 'Could not update packages.');
    }
    const serviceRows = services
      .filter((srv: any) => srv && Number.isFinite(Number(srv.priceInr ?? srv.base_price)))
      .map((srv: any) => ({
        creator_id: creatorId,
        title: cleanText(srv.title, 150) || 'Standard Shoot Package',
        description: cleanText(srv.description, 2000) || 'Professional photography coverage with high-resolution digital delivery.',
        base_price: Math.max(0, Number(srv.priceInr ?? srv.base_price)),
        currency: 'INR',
        duration_minutes: Math.max(1, Math.round((Number(srv.durationHours) || 2) * 60)),
        delivery_time_hours: 48,
        service_type: 'scheduled',
        instant_booking_enabled: true,
        is_active: true,
      }));
    if (serviceRows.length > 0) {
      const { error } = await admin.from('creator_services').insert(serviceRows);
      if (error) return jsonError(500, 'Could not save packages.');
    }

    return NextResponse.json({
      success: true,
      creatorId,
      verificationStatus: nextStatus,
      referenceCode: `ONB-${user.id.slice(0, 8).toUpperCase()}`,
      message:
        nextStatus === 'approved'
          ? 'Your photographer profile has been updated.'
          : 'Your photographer application was submitted for review.',
    });
  } catch (err) {
    console.error('Error submitting creator onboarding:', err);
    return jsonError(500, 'Could not submit your application.');
  }
}
