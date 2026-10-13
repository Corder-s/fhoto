import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, jsonError } from '@/lib/server/session';
import {
  ADMIN_PERMISSIONS,
  cleanText,
  isPlatformOwner,
  isUuid,
  normalizePermission,
  resolveRoleSet,
  permissionChangeGuard,
  resolvePermissions,
  type AdminPermission,
  type AppRole,
} from '@/lib/server/policy';

export const dynamic = 'force-dynamic';

/**
 * Administrators and their permissions.
 *
 * The owner dashboard (and any admin granted `manage_administrators`) uses this
 * to promote an existing registered account, narrow an admin's capabilities and
 * revoke access. Nothing here creates an authentication user: promotion always
 * targets a row in `profiles`, i.e. an account that already signed up, so no
 * duplicate login is ever made.
 *
 * Roles live in `user_roles`, which has no client write policy; the only way in
 * is this route, behind authorize(). The owner role additionally requires the
 * caller to be an owner.
 */

const ROLE_ADMIN = 'admin';
const ROLE_OWNER = 'owner';

interface AccountRow {
  id: string;
  full_name: string | null;
  email: string | null;
  account_status: string | null;
  created_at: string | null;
  user_roles: Array<{ role: string }> | null;
  admin_permissions: Array<{ permission: string }> | null;
  creator: { verification_status: string } | null;
}

async function loadOwnerCount(admin: SupabaseClient): Promise<number> {
  const { count } = await admin
    .from('user_roles')
    .select('id', { count: 'exact', head: true })
    .eq('role', ROLE_OWNER);
  return count ?? 0;
}

async function notify(admin: SupabaseClient, userId: string, title: string, body: string) {
  try {
    await admin.from('notifications').insert({ user_id: userId, notification_type: 'role_change', title, body });
  } catch (error) {
    // A missed notification must not roll back a completed role change.
    console.warn('Could not file the role-change notification:', error);
  }
}

function normalizePermissionList(raw: unknown): { permissions: AdminPermission[]; error?: string } {
  if (raw === undefined || raw === null) return { permissions: [] };
  if (!Array.isArray(raw)) return { permissions: [], error: 'permissions must be a list.' };
  const out = new Set<AdminPermission>();
  for (const value of raw) {
    if (value === 'all' || value === '*') return { permissions: [...ADMIN_PERMISSIONS] };
    const permission = normalizePermission(value);
    if (!permission) return { permissions: [], error: `Unknown permission: ${String(value)}` };
    out.add(permission);
  }
  return { permissions: ADMIN_PERMISSIONS.filter((permission) => out.has(permission)) };
}

/**
 * Resolves the target of a change to an existing registered account. A user id
 * or an e-mail is accepted; nothing is created when it is missing.
 */
async function resolveTarget(
  admin: SupabaseClient,
  body: Record<string, any>
): Promise<
  | { ok: true; user: { id: string; email: string | null; fullName: string | null } }
  | { ok: false; status: number; error: string }
> {
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const email = cleanText(body.email, 254)?.toLowerCase() || '';

  if (!userId && !email) {
    return { ok: false, status: 400, error: 'Provide the userId or the registered e-mail of the account to change.' };
  }
  if (userId && !isUuid(userId)) {
    return { ok: false, status: 400, error: 'Invalid userId.' };
  }

  let query = admin.from('profiles').select('id, email, full_name');
  query = userId ? query.eq('id', userId) : query.ilike('email', email);

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error('Target lookup failed:', error.message);
    return { ok: false, status: 500, error: 'Could not look up that account.' };
  }
  if (!data) {
    return {
      ok: false,
      status: 404,
      error: userId
        ? 'No registered account has that id. Administrators are promoted from existing sign-ups only.'
        : `No registered account was found for ${email}. Ask the person to sign up first; promoting never creates a second account.`,
    };
  }
  const row = data as { id: string; email?: string | null; full_name?: string | null };
  return { ok: true, user: { id: row.id, email: row.email ?? null, fullName: row.full_name ?? null } };
}

/**
 * GET /api/admin/roles?filter=administrators|all&search=<name or email>
 *
 * `administrators` (default) lists the accounts that hold admin or owner with
 * their effective permissions. `all` searches every registered account so an
 * owner can find the person to promote.
 */
export async function GET(req: NextRequest) {
  const auth = await authorizeAdmin('manage_administrators');
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  const params = new URL(req.url).searchParams;
  const filter = params.get('filter') || 'administrators';
  const search = (params.get('search') || '').trim().toLowerCase();
  if (!['administrators', 'all'].includes(filter)) {
    return jsonError(400, 'Unsupported filter.');
  }

  const caller = {
    id: user.id,
    isOwner: isPlatformOwner(user.roles),
    permissions: user.permissions,
  };

  let query = admin
    .from('profiles')
    .select(
      'id, full_name, email, account_status, created_at, user_roles ( role ), admin_permissions!user_id ( permission ), creator:creator_profiles!user_id ( verification_status )'
    )
    .order('created_at', { ascending: false })
    .limit(500);

  let adminFilterIds: string[] | null = null;
  if (filter === 'administrators') {
    const { data: roleRows, error: roleErr } = await admin
      .from('user_roles')
      .select('user_id, role')
      .in('role', [ROLE_ADMIN, ROLE_OWNER]);
    if (roleErr) {
      console.error('Administrator lookup failed:', roleErr.message);
      return jsonError(500, 'Could not load administrators.');
    }
    const ids = Array.from(new Set((roleRows || []).map((row: any) => row.user_id as string)));
    if (ids.length === 0) {
      return NextResponse.json({
        success: true,
        accounts: [],
        permissions: ADMIN_PERMISSIONS,
        ownerCount: 0,
        caller,
      });
    }
    adminFilterIds = ids;
    query = query.in('id', ids);
  }

  let { data, error } = await query;
  if (error) {
    console.warn('Roles primary lookup failed, retrying fallback without admin_permissions relation:', error.message);
    let fallbackQuery = admin
      .from('profiles')
      .select(
        'id, full_name, email, account_status, created_at, user_roles ( role ), creator:creator_profiles!user_id ( verification_status )'
      )
      .order('created_at', { ascending: false })
      .limit(500);
    if (adminFilterIds) {
      fallbackQuery = fallbackQuery.in('id', adminFilterIds);
    }
    const fallbackRes = await fallbackQuery;
    if (!fallbackRes.error && fallbackRes.data) {
      data = fallbackRes.data.map((r: any) => ({ ...r, admin_permissions: [] })) as any;
      error = null;
    }
  }

  if (error) {
    console.error('Account list failed:', error.message);
    return jsonError(500, 'Could not load accounts.');
  }

  let accounts = ((data || []) as unknown as AccountRow[]).map((row) => {
    // resolveRoleSet drops anything that is not a known role, so a stray row can
    // never turn into a privilege in the UI.
    const roles: AppRole[] = resolveRoleSet(row.user_roles || []);
    const isOwner = roles.includes(ROLE_OWNER);
    const isAdmin = roles.includes(ROLE_ADMIN);
    const permissionRows = row.admin_permissions || [];
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      accountStatus: row.account_status,
      createdAt: row.created_at,
      roles,
      isOwner,
      isAdmin,
      isAdministrator: isOwner || isAdmin,
      // An admin without rows keeps the inherited full set; the flag tells the UI
      // to label that as "all permissions (default)" rather than "none".
      permissions: resolvePermissions(roles, permissionRows),
      hasExplicitPermissions: permissionRows.length > 0 && !isOwner,
      isPhotographer: roles.includes('creator'),
      photographerStatus: row.creator?.verification_status ?? null,
      isSelf: row.id === user.id,
    };
  });

  if (search) {
    accounts = accounts.filter(
      (account) =>
        (account.email || '').toLowerCase().includes(search) ||
        (account.fullName || '').toLowerCase().includes(search)
    );
  }
  if (filter === 'administrators') {
    accounts = accounts.filter((account) => account.isAdministrator);
  }

  const ownerCount = filter === 'administrators' ? accounts.filter((account) => account.isOwner).length : await loadOwnerCount(admin);

  return NextResponse.json(
    { success: true, accounts, permissions: ADMIN_PERMISSIONS, ownerCount, caller },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * POST /api/admin/roles
 *
 * Body (one of):
 *   { action: 'promote', userId | email, permissions?: string[] }   grant the admin role
 *   { action: 'setPermissions', userId, permissions: string[] }     replace the grant set
 *   { action: 'revoke', userId }                                     remove the admin role and its grants
 *   { action: 'grantOwner' | 'revokeOwner', userId }                 owners only
 *
 * `promote` never creates an account: it resolves an existing registered user by
 * id or e-mail and adds a `user_roles` row for that same user id.
 */
export async function POST(req: NextRequest) {
  const auth = await authorizeAdmin('manage_administrators');
  if (!auth.ok) return auth.response;
  const { user, admin } = auth;

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, 'Invalid JSON payload.');
  }

  const action = cleanText(body.action, 40) || 'promote';
  const callerIsOwner: boolean = isPlatformOwner(user.roles);

  // Granting or revoking the owner role is an ownership transfer: owners only.
  if ((action === 'grantOwner' || action === 'revokeOwner') && !callerIsOwner) {
    return jsonError(403, 'Only a platform owner may change ownership.');
  }

  const target = await resolveTarget(admin, body);
  if (!target.ok) return jsonError(target.status, target.error);
  const targetUser = target.user;

  const now = new Date().toISOString();
  const { data: targetRoleRows, error: targetRoleErr } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', targetUser.id);
  if (targetRoleErr) return jsonError(500, 'Could not load that account’s roles.');

  const currentRoles = (targetRoleRows || []).map((row: any) => String(row.role));
  const targetIsOwner = currentRoles.includes(ROLE_OWNER);
  const targetIsAdmin = currentRoles.includes(ROLE_ADMIN);

  if (action === 'promote') {
    if (targetIsAdmin || targetIsOwner) {
      return jsonError(409, 'That account is already an administrator.');
    }
    const { error } = await admin
      .from('user_roles')
      .upsert({ user_id: targetUser.id, role: ROLE_ADMIN, created_at: now }, { onConflict: 'user_id,role' });
    if (error) {
      console.error('Admin grant failed:', error.message);
      return jsonError(500, 'Could not grant administrator access.');
    }

    // An explicit grant set narrows the account immediately; omitting it keeps
    // the inherited full set, which is the safer default for a fresh admin.
    const requested = normalizePermissionList(body.permissions);
    if (requested.error) return jsonError(400, requested.error);
    if (requested.permissions.length > 0) {
      const { error: permErr } = await admin
        .from('admin_permissions')
        .upsert(
          requested.permissions.map((permission) => ({
            user_id: targetUser.id,
            permission,
            granted_by: user.id,
            created_at: now,
          })),
          { onConflict: 'user_id,permission' }
        );
      if (permErr) {
        console.error('Permission grant after promotion failed:', permErr.message);
        return jsonError(500, 'Administrator was added but the permissions could not be saved.');
      }
    }

    await notify(
      admin,
      targetUser.id,
      'You are now an administrator',
      'Your SnapShoot account has administrator access. Review photographer verifications from the admin dashboard.'
    );

    return NextResponse.json({
      success: true,
      account: { id: targetUser.id, email: targetUser.email, roles: [...currentRoles, ROLE_ADMIN] },
      permissions: requested.permissions.length > 0 ? requested.permissions : [...ADMIN_PERMISSIONS],
      message: `${targetUser.email || targetUser.fullName || 'That account'} can now open the admin dashboard with the same sign-in. No new account was created.`,
    });
  }

  if (action === 'setPermissions') {
    if (targetIsOwner) {
      return jsonError(403, 'An owner always holds every permission and cannot be narrowed down.');
    }
    if (!targetIsAdmin) return jsonError(409, 'That account is not an administrator.');

    const requested = normalizePermissionList(body.permissions);
    if (requested.error) return jsonError(400, requested.error);
    const nextPermissions = requested.permissions;

    const { data: existingRows } = await admin
      .from('admin_permissions')
      .select('permission')
      .eq('user_id', targetUser.id);
    const targetOwnsAdminManagement = resolvePermissions([ROLE_ADMIN], existingRows || []).includes(
      'manage_administrators'
    );

    const guard = permissionChangeGuard({
      callerIsOwner,
      callerUserId: user.id,
      targetUserId: targetUser.id,
      targetIsOwner,
      nextPermissions,
      targetOwnsAdminManagement,
    });
    if (guard) return jsonError(400, guard);

    // An empty set means "back to the inherited full set", which is modelled by
    // deleting the rows rather than by a wildcard grant.
    const { error: deleteErr } = await admin.from('admin_permissions').delete().eq('user_id', targetUser.id);
    if (deleteErr) {
      console.error('Permission reset failed:', deleteErr.message);
      return jsonError(500, 'Could not update permissions.');
    }
    if (nextPermissions.length > 0) {
      const { error: insertErr } = await admin.from('admin_permissions').insert(
        nextPermissions.map((permission) => ({
          user_id: targetUser.id,
          permission,
          granted_by: user.id,
          created_at: now,
        }))
      );
      if (insertErr) {
        console.error('Permission insert failed:', insertErr.message);
        return jsonError(500, 'Could not save permissions.');
      }
    }

    return NextResponse.json({
      success: true,
      account: { id: targetUser.id, permissions: nextPermissions },
      effectivePermissions: nextPermissions.length === 0 ? [...ADMIN_PERMISSIONS] : nextPermissions,
      inherited: nextPermissions.length === 0,
      message:
        nextPermissions.length === 0
          ? 'Permissions cleared: this administrator is back on the full default set.'
          : `Permissions updated (${nextPermissions.length} of ${ADMIN_PERMISSIONS.length}).`,
    });
  }

  if (action === 'revoke') {
    if (targetUser.id === user.id) {
      return jsonError(403, 'You cannot revoke your own administrator access.');
    }
    if (targetIsOwner && !callerIsOwner) {
      return jsonError(403, 'Only a platform owner may change an owner account.');
    }
    const { error } = await admin.from('user_roles').delete().eq('user_id', targetUser.id).eq('role', ROLE_ADMIN);
    if (error) {
      console.error('Admin revoke failed:', error.message);
      return jsonError(500, 'Could not revoke administrator access.');
    }
    await admin.from('admin_permissions').delete().eq('user_id', targetUser.id);
    return NextResponse.json({
      success: true,
      account: { id: targetUser.id, roles: currentRoles.filter((role) => role !== ROLE_ADMIN) },
      message: 'Administrator access revoked. Any photographer or customer access on that account is unchanged.',
    });
  }

  if (action === 'grantOwner') {
    if (targetIsOwner) return jsonError(409, 'That account is already an owner.');
    const { error } = await admin
      .from('user_roles')
      .upsert({ user_id: targetUser.id, role: ROLE_OWNER, created_at: now }, { onConflict: 'user_id,role' });
    if (error) {
      console.error('Owner grant failed:', error.message);
      return jsonError(500, 'Could not grant ownership.');
    }
    // Owners are unrestricted, so leftover narrow grants would be confusing.
    await admin.from('admin_permissions').delete().eq('user_id', targetUser.id);
    return NextResponse.json({ success: true, message: 'Ownership granted to that account.' });
  }

  if (action === 'revokeOwner') {
    if (targetUser.id === user.id) {
      return jsonError(403, 'You cannot revoke your own ownership while signed in as that owner.');
    }
    if ((await loadOwnerCount(admin)) <= 1) {
      return jsonError(
        409,
        'This platform must always have at least one owner. Grant ownership to another account first.'
      );
    }
    const { error } = await admin.from('user_roles').delete().eq('user_id', targetUser.id).eq('role', ROLE_OWNER);
    if (error) {
      console.error('Owner revoke failed:', error.message);
      return jsonError(500, 'Could not revoke ownership.');
    }
    return NextResponse.json({ success: true, message: 'Ownership revoked from that account.' });
  }

  return jsonError(400, `Unknown action: ${action}`);
}
