import { NextRequest, NextResponse } from 'next/server';
import { authorize, jsonError } from '@/lib/server/session';

import { cleanText, isUuid, resolvePermissions, resolveRoleSet } from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/users?filter=all|customers|photographers|administrators&search=<text>
 * Lists accounts with their roles and account status.
 * Requires the `manage_users` administrator permission (owners always hold it,
 * and an admin with no explicit grants inherits it).
 */
export async function GET(req: NextRequest) {
  const auth = await authorize({ roles: ['admin', 'owner'], permission: 'manage_users' });
  if (!auth.ok) return auth.response;
  const { admin } = auth;

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') || 'all';
  const search = (searchParams.get('search') || '').trim().toLowerCase();
  if (!['all', 'customers', 'photographers', 'administrators'].includes(filter)) {
    return jsonError(400, 'Unsupported filter.');
  }

  const { data, error } = await admin
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      phone_number,
      account_status,
      created_at,
      user_roles ( role ),
      admin_permissions ( permission ),
      creator:creator_profiles!user_id ( id, verification_status )
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return jsonError(500, 'Could not load users.');

  let users = (data || []).map((p: any) => {
    const roles: import('@/lib/server/policy').AppRole[] = resolveRoleSet(p.user_roles || []);
    const permissions = resolvePermissions(roles, p.admin_permissions || []);
    return {
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      phone: p.phone_number,
      accountStatus: p.account_status,
      createdAt: p.created_at,
      roles,
      permissions,
      isAdministrator: roles.includes('admin') || roles.includes('owner'),
      isOwner: roles.includes('owner'),
      hasExplicitPermissions: (p.admin_permissions || []).length > 0,
      isPhotographer: roles.includes('creator'),
      creatorStatus: Array.isArray(p.creator) ? p.creator[0]?.verification_status ?? null : p.creator?.verification_status ?? null,
    };
  });

  if (filter === 'customers') users = users.filter((u) => u.roles.includes('customer') && !u.isPhotographer);
  if (filter === 'photographers') users = users.filter((u) => u.isPhotographer);
  if (filter === 'administrators') users = users.filter((u) => u.isAdministrator);
  if (search) {
    users = users.filter(
      (u) =>
        (u.fullName || '').toLowerCase().includes(search) ||
        (u.email || '').toLowerCase().includes(search)
    );
  }

  return NextResponse.json({ success: true, users });
}

/**
 * PATCH /api/admin/users
 * Body: { userId, accountStatus: 'active' | 'suspended' }
 *
 * Requires the `manage_users` permission. Roles and permissions are not changed
 * here: they belong to /api/admin/roles, which is owner-gated.
 */
export async function PATCH(req: NextRequest) {
  const auth = await authorize({ roles: ['admin', 'owner'], permission: 'manage_users' });
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const { userId } = body;
  const accountStatus = cleanText(body.accountStatus, 30);
  if (!isUuid(userId)) return jsonError(400, 'Invalid userId.');
  if (accountStatus !== 'active' && accountStatus !== 'suspended') {
    return jsonError(400, 'accountStatus must be "active" or "suspended".');
  }
  if (userId === user.id) return jsonError(403, 'You cannot change the status of your own account.');

  // Only an owner may suspend another owner: otherwise any admin with the
  // manage_users permission could lock the platform's highest-privilege account.
  if (!user.roles.includes('owner')) {
    const { data: targetRoles } = await admin.from('user_roles').select('role').eq('user_id', userId);
    if ((targetRoles || []).some((row: any) => row.role === 'owner')) {
      return jsonError(403, 'Only a platform owner may change the status of an owner account.');
    }
  }

  const { data, error } = await admin
    .from('profiles')
    .update({ account_status: accountStatus, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, account_status')
    .maybeSingle();

  if (error) return jsonError(500, 'Could not update the account.');
  if (!data) return jsonError(404, 'User not found.');
  return NextResponse.json({ success: true, account: data });
}
