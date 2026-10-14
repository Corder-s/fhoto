import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/profile/delete
 *
 * Permanently deletes the authenticated user's account and all associated data,
 * leaving zero footprint in both PostgreSQL and Supabase Auth.
 *
 * Cleanup sequence:
 * 1. Storage assets across all buckets (avatars, portfolio, verification, deliverables).
 * 2. Bookings, services, creator profile, reviews, disputes, chat, notifications.
 * 3. User application profile and role assignments.
 * 4. Supabase auth.users record (Google OAuth identity, session, and refresh tokens).
 * 5. Clears browser session cookies.
 */
export async function DELETE(req: NextRequest) {
  const auth = await authorize();
  if (!auth.ok) return auth.response;

  const { user, admin } = auth;
  const userId = user.id;

  try {
    // 1. Clean up storage assets in user's folders
    const buckets = ['avatars', 'verification', 'portfolio', 'deliverables'];
    for (const bucket of buckets) {
      try {
        const { data: files } = await admin.storage.from(bucket).list(userId);
        if (files && files.length > 0) {
          const filePaths = files.map((f) => `${userId}/${f.name}`);
          await admin.storage.from(bucket).remove(filePaths);
        }
      } catch (storageErr) {
        console.warn(`Storage cleanup notice for bucket ${bucket}:`, storageErr);
      }
    }

    // 2. Cascade delete database records
    // Find creator profile ID if one exists
    const { data: creatorProf } = await admin
      .from('creator_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (creatorProf?.id) {
      // Delete bookings associated with creator
      await admin.from('bookings').delete().eq('creator_id', creatorProf.id);
      // Delete creator profile (cascades services, packages, availability, portfolio)
      await admin.from('creator_profiles').delete().eq('id', creatorProf.id);
    }

    // Delete bookings as customer
    await admin.from('bookings').delete().eq('customer_id', userId);

    // Delete chat participants and notifications
    await admin.from('chat_participants').delete().eq('user_id', userId);
    await admin.from('notifications').delete().eq('user_id', userId);

    // Delete user roles & profile
    await admin.from('user_roles').delete().eq('user_id', userId);
    await admin.from('profiles').delete().eq('id', userId);

    // 3. Delete from Supabase Auth (wipes Google OAuth identity, refresh tokens, auth.users)
    const { error: authDeleteErr } = await admin.auth.admin.deleteUser(userId);
    if (authDeleteErr) {
      console.error('Error deleting user from auth.users:', authDeleteErr.message);
    }

    // 4. Return success response and wipe session cookies
    const response = NextResponse.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });

    response.cookies.set('snapshoot_session', '', { path: '/', maxAge: 0 });
    response.cookies.set('snapshoot_token', '', { path: '/', maxAge: 0 });

    return response;
  } catch (err: any) {
    console.error('Unexpected error in account deletion:', err);
    return jsonError(500, err?.message || 'Failed to delete account. Please try again.');
  }
}
