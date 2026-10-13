import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/me?userId=<UUID>
 * Retrieves authenticated user's profile, creator profile (if any), and real dashboard stats from Supabase.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    // 1. Fetch user profile from public.profiles
    const { data: profile, error: profileErr } = await client
      .from('profiles')
      .select('id, full_name, email, phone_number, avatar_url, account_status, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr) {
      console.error('Error fetching profile:', profileErr);
      return NextResponse.json({ success: false, error: profileErr.message }, { status: 500 });
    }

    // 2. Fetch role from public.user_roles
    const { data: roleRecord } = await client
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    // 3. Fetch creator profile ONLY if user is a creator
    let creatorProfile = null;
    const isCreatorRole = roleRecord?.role === 'creator' || roleRecord?.role === 'photographer';
    
    const { data: dbCreatorProfile, error: creatorErr } = await client
      .from('creator_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (creatorErr) {
      console.error('Error fetching creator profile:', creatorErr);
    } else if (dbCreatorProfile) {
      creatorProfile = dbCreatorProfile;
    }

    const determinedRole = roleRecord?.role || (creatorProfile ? 'creator' : 'customer');

    // 4. Compute real dashboard stats from database
    let totalBookings = 0;
    let newRequests = 0;
    let upcomingShoots = 0;
    let monthEarnings = 0;
    let totalReviews = creatorProfile?.total_reviews || 0;
    let averageRating = creatorProfile?.average_rating ? Number(creatorProfile.average_rating) : 5.0;

    if (creatorProfile?.id) {
      // Calculate real bookings stats from public.bookings
      const { data: bookings } = await client
        .from('bookings')
        .select('id, booking_status, payment_status, agreed_service_price, event_date, created_at')
        .eq('creator_id', creatorProfile.id);

      if (bookings && bookings.length > 0) {
        totalBookings = bookings.length;
        newRequests = bookings.filter((b) => b.booking_status === 'pending' || b.booking_status === 'requested').length;
        upcomingShoots = bookings.filter((b) =>
          b.booking_status === 'confirmed' ||
          b.booking_status === 'accepted' ||
          b.booking_status === 'in_progress'
        ).length;

        // Calculate current month earnings from completed bookings
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        monthEarnings = bookings
          .filter((b) => {
            if (b.booking_status !== 'completed') return false;
            const bDate = new Date(b.event_date || b.created_at);
            return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
          })
          .reduce((sum, b) => sum + (Number(b.agreed_service_price) || 0), 0);
      }
    }

    return NextResponse.json({
      success: true,
      role: determinedRole,
      profile: profile || null,
      creatorProfile: creatorProfile || null,
      stats: {
        totalBookings,
        newRequests,
        upcomingShoots,
        monthEarnings,
        totalReviews,
        averageRating,
        profileViews: 0,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/profile/me GET:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/profile/me
 * Authoritatively updates user profile and/or creator profile in Supabase.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, profileData, creatorData } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const client = admin || getSupabaseBrowserClient();

    if (!client) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 503 });
    }

    const nowIso = new Date().toISOString();

    // 1. Update public.profiles if profileData is supplied
    let updatedProfile = null;
    if (profileData && Object.keys(profileData).length > 0) {
      const updatePayload: Record<string, any> = {
        updated_at: nowIso,
      };

      if (profileData.fullName !== undefined) updatePayload.full_name = profileData.fullName.trim();
      if (profileData.phone !== undefined) updatePayload.phone_number = profileData.phone.trim();
      if (profileData.avatarUrl !== undefined) updatePayload.avatar_url = profileData.avatarUrl;

      const { data, error: pErr } = await client
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single();

      if (pErr) {
        console.error('Failed to update profiles table:', pErr);
        return NextResponse.json({ success: false, error: pErr.message }, { status: 500 });
      }
      updatedProfile = data;

      // Also update auth user metadata so session remains in sync
      if (admin) {
        await admin.auth.admin.updateUserById(userId, {
          user_metadata: {
            full_name: updatePayload.full_name,
            phone: updatePayload.phone_number,
            avatar_url: updatePayload.avatar_url,
          },
        }).catch((e) => console.warn('Could not sync auth metadata:', e));
      }
    }

    // 2. Update public.creator_profiles if creatorData is supplied
    let updatedCreatorProfile = null;
    if (creatorData && Object.keys(creatorData).length > 0) {
      const creatorPayload: Record<string, any> = {
        updated_at: nowIso,
      };

      if (creatorData.professionalName !== undefined) creatorPayload.professional_name = creatorData.professionalName.trim();
      if (creatorData.biography !== undefined) creatorPayload.biography = creatorData.biography.trim();
      if (creatorData.experienceYears !== undefined) creatorPayload.experience_years = Number(creatorData.experienceYears) || 1;
      if (creatorData.city !== undefined) creatorPayload.city = creatorData.city.trim();
      if (creatorData.state !== undefined) creatorPayload.state = creatorData.state.trim();
      if (creatorData.serviceRadius !== undefined) creatorPayload.service_radius = Number(creatorData.serviceRadius) || 25;
      if (creatorData.portfolioUrl !== undefined) creatorPayload.portfolio_url = creatorData.portfolioUrl;

      const { data, error: cErr } = await client
        .from('creator_profiles')
        .upsert(
          {
            user_id: userId,
            ...creatorPayload,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (cErr) {
        console.error('Failed to update creator_profiles table:', cErr);
        return NextResponse.json({ success: false, error: cErr.message }, { status: 500 });
      }
      updatedCreatorProfile = data;
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      creatorProfile: updatedCreatorProfile,
      message: 'Profile updated successfully in Supabase.',
    });
  } catch (err: any) {
    console.error('Error in /api/profile/me PATCH:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
