import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';
import { cleanText, isSafeHttpsUrl, matchesSessionUser } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/profile/me
 * Returns the authenticated user's profile, creator profile (if any) and dashboard
 * statistics computed from the database. Identity comes from the session only.
 * An optional `userId` query parameter is accepted for backward compatibility but
 * must match the session user, otherwise the request is rejected.
 */
export async function GET(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const requested = new URL(req.url).searchParams.get('userId');
  if (!matchesSessionUser(user.id, requested)) {
    return jsonError(403, 'You can only access your own profile.');
  }

  try {
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('id, full_name, email, phone_number, avatar_url, account_status, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (profileErr) {
      console.error('Error fetching profile:', profileErr.message);
      return jsonError(500, 'Could not load profile.');
    }

    const { data: creatorProfile, error: creatorErr } = await admin
      .from('creator_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (creatorErr) {
      console.error('Error fetching creator profile:', creatorErr.message);
    }

    const stats = {
      totalBookings: 0,
      newRequests: 0,
      upcomingShoots: 0,
      monthEarnings: 0,
      totalReviews: creatorProfile?.total_reviews || 0,
      averageRating: creatorProfile?.average_rating ? Number(creatorProfile.average_rating) : 5.0,
      profileViews: 0,
    };

    if (creatorProfile?.id) {
      const { data: bookings } = await admin
        .from('bookings')
        .select('id, booking_status, payment_status, agreed_service_price, event_date, created_at')
        .eq('creator_id', creatorProfile.id);

      if (bookings && bookings.length > 0) {
        stats.totalBookings = bookings.length;
        stats.newRequests = bookings.filter((b) => b.booking_status === 'pending').length;
        stats.upcomingShoots = bookings.filter((b) =>
          b.booking_status === 'confirmed' || b.booking_status === 'in_progress'
        ).length;

        const now = new Date();
        stats.monthEarnings = bookings
          .filter((b) => {
            if (b.booking_status !== 'completed') return false;
            const bDate = new Date(b.event_date || b.created_at);
            return bDate.getMonth() === now.getMonth() && bDate.getFullYear() === now.getFullYear();
          })
          .reduce((sum, b) => sum + (Number(b.agreed_service_price) || 0), 0);
      }
    }

    return NextResponse.json({
      success: true,
      role: user.role,
      roles: user.roles,
      profile: profile || null,
      creatorProfile: creatorProfile || null,
      stats,
    });
  } catch (err) {
    console.error('Error in /api/profile/me GET:', err);
    return jsonError(500, 'Could not load profile.');
  }
}

/**
 * PATCH /api/profile/me
 * Updates the authenticated user's profile. Creator fields require the creator
 * role. Verification status, ratings and account status are never writable here.
 */
export async function PATCH(req: NextRequest) {
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
    return jsonError(403, 'You can only update your own profile.');
  }

  const { profileData, creatorData } = body;
  const nowIso = new Date().toISOString();

  // Validate everything before writing anything.
  const profileUpdate: Record<string, unknown> = {};
  if (profileData && typeof profileData === 'object') {
    if (profileData.fullName !== undefined) {
      const name = cleanText(profileData.fullName, 120);
      if (!name) return jsonError(400, 'Full name cannot be empty.');
      profileUpdate.full_name = name;
    }
    if (profileData.phone !== undefined) {
      const phone = typeof profileData.phone === 'string' ? profileData.phone.trim().slice(0, 20) : '';
      if (phone && !/^[+0-9 ()-]{6,20}$/.test(phone)) {
        return jsonError(400, 'Please provide a valid phone number.');
      }
      profileUpdate.phone_number = phone || null;
    }
    if (profileData.avatarUrl !== undefined) {
      if (profileData.avatarUrl === null || profileData.avatarUrl === '') {
        profileUpdate.avatar_url = null;
      } else if (isSafeHttpsUrl(profileData.avatarUrl)) {
        profileUpdate.avatar_url = profileData.avatarUrl;
      } else {
        return jsonError(400, 'Avatar must be an https URL.');
      }
    }
  }

  const creatorUpdate: Record<string, unknown> = {};
  if (creatorData && typeof creatorData === 'object' && Object.keys(creatorData).length > 0) {
    if (!user.roles.includes('creator')) {
      return jsonError(403, 'Only photographer accounts can update creator details.');
    }
    if (creatorData.professionalName !== undefined) {
      const v = cleanText(creatorData.professionalName, 120);
      if (!v) return jsonError(400, 'Professional name cannot be empty.');
      creatorUpdate.professional_name = v;
    }
    if (creatorData.biography !== undefined) {
      creatorUpdate.biography = cleanText(creatorData.biography, 2000) || '';
    }
    if (creatorData.experienceYears !== undefined) {
      const years = Number(creatorData.experienceYears);
      if (!Number.isInteger(years) || years < 0 || years > 80) {
        return jsonError(400, 'Experience must be a whole number of years between 0 and 80.');
      }
      creatorUpdate.experience_years = years;
    }
    if (creatorData.city !== undefined) {
      const v = cleanText(creatorData.city, 80);
      if (!v) return jsonError(400, 'City cannot be empty.');
      creatorUpdate.city = v;
    }
    if (creatorData.state !== undefined) {
      creatorUpdate.state = cleanText(creatorData.state, 80) || 'Delhi';
    }
    if (creatorData.serviceRadius !== undefined) {
      const radius = Number(creatorData.serviceRadius);
      if (!Number.isInteger(radius) || radius < 1 || radius > 500) {
        return jsonError(400, 'Service radius must be between 1 and 500 km.');
      }
      creatorUpdate.service_radius = radius;
    }
    if (creatorData.portfolioUrl !== undefined) {
      if (creatorData.portfolioUrl === null || creatorData.portfolioUrl === '') {
        creatorUpdate.portfolio_url = null;
      } else if (isSafeHttpsUrl(creatorData.portfolioUrl)) {
        creatorUpdate.portfolio_url = creatorData.portfolioUrl;
      } else {
        return jsonError(400, 'Portfolio link must be an https URL.');
      }
    }
  }

  try {
    let updatedProfile = null;
    if (Object.keys(profileUpdate).length > 0) {
      const { data, error } = await admin
        .from('profiles')
        .update({ ...profileUpdate, updated_at: nowIso })
        .eq('id', user.id)
        .select()
        .single();
      if (error) {
        console.error('Failed to update profiles table:', error.message);
        return jsonError(500, 'Could not update profile.');
      }
      updatedProfile = data;

      // Keep auth metadata (display name, avatar) in step with the profile row.
      await admin.auth.admin
        .updateUserById(user.id, {
          user_metadata: {
            full_name: profileUpdate.full_name,
            phone: profileUpdate.phone_number,
            avatar_url: profileUpdate.avatar_url,
          },
        })
        .catch((e) => console.warn('Could not sync auth metadata:', e));
    }

    let updatedCreatorProfile = null;
    if (Object.keys(creatorUpdate).length > 0) {
      const { data, error } = await admin
        .from('creator_profiles')
        .update({ ...creatorUpdate, updated_at: nowIso })
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) {
        console.error('Failed to update creator_profiles table:', error.message);
        return jsonError(500, 'Could not update creator profile.');
      }
      updatedCreatorProfile = data;
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      creatorProfile: updatedCreatorProfile,
      message: 'Profile updated successfully.',
    });
  } catch (err) {
    console.error('Error in /api/profile/me PATCH:', err);
    return jsonError(500, 'Could not update profile.');
  }
}
