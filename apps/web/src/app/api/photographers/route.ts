import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolveSlugSearchTerm, getPhotographerSlug } from '@/lib/photographerSlug';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    const category = searchParams.get('category');
    const query = searchParams.get('q');
    const creatorId = searchParams.get('id');

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseServerClient();

    if (!client) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    let queryBuilder = client
      .from('creator_profiles')
      .select(`
        id,
        user_id,
        professional_name,
        biography,
        experience_years,
        city,
        state,
        service_radius,
        portfolio_url,
        cover_image_url,
        base_address,
        base_latitude,
        base_longitude,
        included_travel_km,
        travel_fee_per_km,
        min_travel_fee,
        verification_status,
        average_rating,
        total_reviews,
        is_available,
        created_at
      `)
      .order('average_rating', { ascending: false });

    if (creatorId) {
      const { isUuid: isIdUuid, searchTerm } = resolveSlugSearchTerm(creatorId);
      if (isIdUuid) {
        queryBuilder = queryBuilder.or(`id.eq.${creatorId},user_id.eq.${creatorId}`);
      } else if (searchTerm) {
        queryBuilder = queryBuilder.ilike('professional_name', `%${searchTerm}%`);
      }
      queryBuilder = queryBuilder.limit(1);
    } else {
      // Only platform-approved photographers are publicly discoverable in the marketplace directory.
      queryBuilder = queryBuilder.eq('verification_status', 'approved').limit(60);
    }

    if (location && location !== 'All Locations') {
      queryBuilder = queryBuilder.ilike('city', `%${location}%`);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error fetching creators from Supabase:', error.message);
      return NextResponse.json({ error: 'Could not load photographers.' }, { status: 500 });
    }

    const creators = data || [];
    const creatorIds = creators.map((c: any) => c.id);
    const userIds = creators.map((c: any) => c.user_id).filter(Boolean);

    // Fetch active services, portfolio items, and user profiles concurrently
    const servicesPromise = creatorIds.length > 0
      ? client
          .from('creator_services')
          .select('id, creator_id, title, description, base_price, duration_minutes, delivery_time_hours, instant_booking_enabled, is_active')
          .eq('is_active', true)
          .in('creator_id', creatorIds)
          .order('base_price', { ascending: true })
      : Promise.resolve({ data: [] });

    const portfolioPromise = creatorIds.length > 0
      ? client
          .from('creator_portfolio_items')
          .select('id, creator_id, title, preview_url, media_type, display_order, is_published')
          .eq('is_published', true)
          .in('creator_id', creatorIds)
          .order('display_order', { ascending: true })
          .limit(creatorId ? 50 : creatorIds.length * 4)
      : Promise.resolve({ data: [] });

    const profilesPromise = userIds.length > 0
      ? client
          .from('profiles')
          .select('id, avatar_url, full_name')
          .in('id', userIds)
      : Promise.resolve({ data: [] });

    const [servicesResult, portfolioResult, profilesResult] = await Promise.all([
      servicesPromise,
      portfolioPromise,
      profilesPromise,
    ]);

    const directServices = servicesResult.data || [];
    const directPortfolio = portfolioResult.data || [];
    const profileRows = profilesResult.data || [];

    const servicesByCreator: Record<string, any[]> = {};
    directServices.forEach((s: any) => {
      if (!servicesByCreator[s.creator_id]) {
        servicesByCreator[s.creator_id] = [];
      }
      servicesByCreator[s.creator_id].push(s);
    });

    const portfolioByCreator: Record<string, any[]> = {};
    directPortfolio.forEach((p: any) => {
      if (!portfolioByCreator[p.creator_id]) {
        portfolioByCreator[p.creator_id] = [];
      }
      portfolioByCreator[p.creator_id].push(p);
    });

    const profilesByUser: Record<string, any> = {};
    profileRows.forEach((p: any) => {
      profilesByUser[p.id] = p;
    });

    // Format results to standard API structure
    const photographers = creators.map((cp: any) => {
      const services = (servicesByCreator[cp.id] || []).filter((s: any) => s.is_active !== false);
      const minPrice = services.reduce(
        (min: number, s: any) => Math.min(min, Number(s.base_price) || 2000),
        services.length > 0 ? Number(services[0].base_price) || 2000 : 2499
      );

      const portfolio = (portfolioByCreator[cp.id] || []).sort(
        (a: any, b: any) => (a.display_order || 0) - (b.display_order || 0)
      );

      const primaryCover = cp.cover_image_url || portfolio[0]?.preview_url || cp.portfolio_url || '/reference-assets/seller_banner_photographer.jpg';
      const secondaryCover = portfolio[1]?.preview_url || primaryCover;

      const userProfile = profilesByUser[cp.user_id];
      const userAvatar = userProfile?.avatar_url || null;
      const isPortfolioImg = cp.portfolio_url && /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(cp.portfolio_url);
      const resolvedAvatar = userAvatar || (isPortfolioImg ? cp.portfolio_url : null) || primaryCover;

      // Extract specialty chips from service titles or bio
      const specialties: string[] = services.map((s: any) => s.title.replace(/\b(Shoot|Package|Session)\b/gi, '').trim());
      if (specialties.length === 0) {
        specialties.push('Portraits', 'Couples', 'Reels');
      }

      return {
        id: cp.id,
        slug: getPhotographerSlug(cp.professional_name, cp.id),
        userId: cp.user_id,
        name: cp.professional_name,
        bio: cp.biography,
        tagline: cp.biography ? cp.biography.slice(0, 90) + '...' : 'Verified Creative Specialist',
        experienceYears: cp.experience_years,
        city: cp.city,
        state: cp.state,
        baseAddress: cp.base_address || cp.city,
        serviceRadiusKm: cp.service_radius || 25,
        includedTravelKm: cp.included_travel_km ?? 10,
        travelFeePerKm: cp.travel_fee_per_km !== null ? Number(cp.travel_fee_per_km) : 20,
        minTravelFee: cp.min_travel_fee !== null ? Number(cp.min_travel_fee) : 0,
        locationArea: `${cp.city}, ${cp.state || 'India'}`,
        startingPriceInr: minPrice,
        rating: Number(cp.average_rating) || 5.0,
        reviewCount: cp.total_reviews || 0,
        availabilityStatus: cp.is_available ? 'Available Today' : 'Book in Advance',
        avatarUrl: resolvedAvatar,
        coverImageUrl: primaryCover,
        secondaryCoverUrl: secondaryCover,
        isVerified: cp.verification_status === 'approved',
        specialties: specialties.slice(0, 3),
        services: services.map((s: any) => ({
          id: s.id,
          name: s.title,
          description: s.description,
          priceInr: Number(s.base_price),
          durationMinutes: s.duration_minutes,
          deliveryHours: s.delivery_time_hours || 48,
          isInstantBooking: s.instant_booking_enabled,
        })),
        portfolio: portfolio.map((p: any) => ({
          id: p.id,
          title: p.title,
          url: p.preview_url,
          mediaType: p.media_type || 'photo',
        })),
      };
    });

    return NextResponse.json(
      {
        success: true,
        count: photographers.length,
        photographers,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Could not load photographers.' }, { status: 500 });
  }
}
