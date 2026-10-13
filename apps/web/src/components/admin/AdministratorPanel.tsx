'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Crown,
  Eye,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';

/**
 * Administrator and permission management for the owner dashboard.
 *
 * Everything is a database write through /api/admin/roles: promoting an account
 * adds a `user_roles` row for an account that already signed up (no second login
 * is created), and the permission checkboxes replace rows in
 * `admin_permissions`. The list is re-read from the server after every change,
 * so a stale tab cannot show a permission that was already revoked elsewhere.
 *
 * Guard rails mirrored from the API (the server is authoritative; these only
 * stop obvious mis-clicks): an owner cannot be narrowed down, self-revoke is
 * refused, and the last owner cannot be removed.
 */

const PERMISSION_LABELS: Record<string, string> = {
  manage_photographer_verification: 'Review photographer verification',
  manage_users: 'Manage user accounts',
  manage_bookings: 'Manage bookings and disputes',
  manage_platform_settings: 'Change platform settings',
  manage_administrators: 'Grant or revoke administrator permissions',
};

const PERMISSION_HINTS: Record<string, string> = {
  manage_photographer_verification: 'Approve, reject or suspend photographer profiles in the admin dashboard.',
  manage_users: 'Suspend and reinstate customer and photographer accounts.',
  manage_bookings: 'Resolve disputes and force booking outcomes.',
  manage_platform_settings: 'Categories, fees and platform configuration.',
  manage_administrators: 'Let this admin add other admins and set their permissions.',
};

interface Account {
  id: string;
  fullName: string | null;
  email: string | null;
  accountStatus: string | null;
  createdAt: string | null;
  roles: string[];
  isOwner: boolean;
  isAdmin: boolean;
  isAdministrator: boolean;
  permissions: string[];
  hasExplicitPermissions: boolean;
  isPhotographer: boolean;
  photographerStatus: string | null;
  isSelf: boolean;
}

export const AdministratorPanel: React.FC<{ canManage: boolean }> = ({ canManage }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [knownPermissions, setKnownPermissions] = useState<string[]>(Object.keys(PERMISSION_LABELS));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});

  const [promoteEmail, setPromoteEmail] = useState('');
  const [promotePermissions, setPromotePermissions] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<Array<{ id: string; fullName: string | null; email: string | null; roles: string[] }>>([]);
  const [searching, setSearching] = useState(false);

  const flash = useCallback((text: string, tone: 'ok' | 'error' = 'ok') => {
    setNotice({ text, tone });
    setTimeout(() => setNotice(null), 6000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/roles?filter=administrators', { cache: 'no-store', credentials: 'same-origin' });
      const body = (await res.json().catch(() => ({}))) as { accounts?: Account[]; permissions?: string[]; error?: string };
      if (!res.ok) throw new Error(body.error || `Could not load administrators (${res.status})`);
      const list = body.accounts || [];
      setAccounts(list);
      setKnownPermissions(body.permissions?.length ? body.permissions : Object.keys(PERMISSION_LABELS));
      // Draft state follows the server; an unchecked box is a pending change, not a lie.
      setDrafts((prev) => {
        const next: Record<string, string[]> = { ...prev };
        for (const account of list) {
          if (account.isOwner) continue;
          next[account.id] = account.hasExplicitPermissions ? account.permissions : knownPermissionsAll(list, body.permissions);
        }
        return next;
      });
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Could not load administrators.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const ownerCount = useMemo(() => accounts.filter((account) => account.isOwner).length, [accounts]);

  const searchCandidates = async () => {
    const term = promoteEmail.trim();
    if (term.length < 3) {
      flash('Enter at least 3 characters of the registered e-mail address.', 'error');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/roles?filter=all&search=${encodeURIComponent(term)}`, {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      const body = (await res.json().catch(() => ({}))) as { accounts?: Account[]; error?: string };
      if (!res.ok) throw new Error(body.error || 'Search failed.');
      setCandidates(
        (body.accounts || []).map((account) => ({
          id: account.id,
          fullName: account.fullName,
          email: account.email,
          roles: account.roles,
        }))
      );
      if ((body.accounts || []).length === 0) {
        flash('No registered account matches that address. Promotions only apply to existing sign-ups — no account is created here.');
      }
    } catch (err: any) {
      flash(err?.message || 'Search failed.', 'error');
    } finally {
      setSearching(false);
    }
  };

  const post = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    if (!res.ok) throw new Error(body.error || 'The change was not saved.');
    return body;
  };

  const promote = async (userId: string, email: string | null) => {
    setBusyId(userId);
    try {
      const body = await post({ action: 'promote', userId, email, permissions: promotePermissions });
      flash(body.message || 'Administrator added.');
      setCandidates([]);
      setPromoteEmail('');
      setPromotePermissions([]);
      await load();
    } catch (err: any) {
      flash(err?.message || 'Could not promote that account.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const savePermissions = async (account: Account) => {
    setBusyId(account.id);
    try {
      const body = await post({ action: 'setPermissions', userId: account.id, permissions: drafts[account.id] || [] });
      flash(body.message || 'Permissions updated.');
      await load();
    } catch (err: any) {
      flash(err?.message || 'Could not update permissions.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const revoke = async (account: Account) => {
    setBusyId(account.id);
    try {
      const body = await post({ action: 'revoke', userId: account.id });
      flash(body.message || 'Administrator access revoked.');
      await load();
    } catch (err: any) {
      flash(err?.message || 'Could not revoke access.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const transfer = async (account: Account, action: 'grantOwner' | 'revokeOwner') => {
    setBusyId(account.id);
    try {
      const body = await post({ action, userId: account.id });
      flash(body.message || 'Ownership updated.');
      await load();
    } catch (err: any) {
      flash(err?.message || 'Could not change ownership.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const toggle = (accountId: string, permission: string) => {
    setDrafts((prev) => {
      const current = prev[accountId] || [];
      return {
        ...prev,
        [accountId]: current.includes(permission) ? current.filter((value) => value !== permission) : [...current, permission],
      };
    });
  };

  return (
    <section id="administrators" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#FF6E00]" />
          <h3 className="text-sm font-black text-[#1A1816]">Administrators &amp; permissions</h3>
          <span className="text-[10px] font-bold text-[#8C847A]">
            {loading ? 'loading…' : `${accounts.length} accounts • ${ownerCount} owner${ownerCount === 1 ? '' : 's'}`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-[#736B63] hover:text-[#1A1816] cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload</span>
        </button>
      </div>

      {!canManage && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] font-semibold text-amber-900">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Read-only: your account does not hold “Grant or revoke administrator permissions”.</span>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] font-semibold text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className={`rounded-xl px-3 py-2 text-[11px] font-bold text-white ${notice.tone === 'error' ? 'bg-red-600' : 'bg-[#1A1816]'}`}
        >
          {notice.text}
        </div>
      )}

      {canManage && (
        <div className="rounded-2xl border border-[#E8E2D8] bg-[#FFF8F2] p-3 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#8C847A]">Promote an existing account</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A69F96]" />
              <input
                value={promoteEmail}
                onChange={(event) => setPromoteEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    searchCandidates();
                  }
                }}
                placeholder="Registered e-mail, e.g. priya@example.com"
                className="w-full rounded-xl border border-[#E8E2D8] bg-white pl-8 pr-2 py-2 text-[11px] text-[#1A1816]"
              />
            </div>
            <button
              type="button"
              onClick={searchCandidates}
              disabled={searching}
              className="px-3 py-2 rounded-xl bg-[#1A1816] text-white text-[11px] font-bold disabled:opacity-60 cursor-pointer"
            >
              {searching ? 'Searching…' : 'Find account'}
            </button>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="text-[10px] font-bold text-[#736B63]">Initial permissions (none selected = full default set):</span>
            {knownPermissions.map((permission) => (
              <label key={permission} className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#5A544D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={promotePermissions.includes(permission)}
                  onChange={() =>
                    setPromotePermissions((prev) =>
                      prev.includes(permission) ? prev.filter((value) => value !== permission) : [...prev, permission]
                    )
                  }
                />
                <span>{PERMISSION_LABELS[permission] || permission}</span>
              </label>
            ))}
          </div>

          {candidates.length > 0 && (
            <ul className="space-y-1 pt-1 border-t border-[#F3E7DC]">
              {candidates.map((candidate) => (
                <li key={candidate.id} className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="min-w-0 truncate font-semibold text-[#1A1816]">
                    {candidate.fullName || 'Unnamed'} • {candidate.email || 'no e-mail'}
                    <span className="ml-1 text-[10px] font-bold text-[#8C847A]">[{candidate.roles.join(', ') || 'customer'}]</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => promote(candidate.id, candidate.email)}
                    disabled={busyId === candidate.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Make admin</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-[#E8E2D8] divide-y divide-[#F2ECE3]">
        {accounts.length === 0 && !loading && (
          <p className="text-xs text-[#8C847A] py-6 text-center">No administrators yet.</p>
        )}
        {accounts.map((account) => {
          const selected = drafts[account.id] || [];
          const dirty = !account.isOwner && JSON.stringify([...selected].sort()) !== JSON.stringify([...account.permissions].sort());
          return (
            <div key={account.id} className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1A1816] truncate inline-flex items-center gap-1.5">
                    {account.fullName || 'Unnamed account'}
                    {account.isOwner && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#FFF2E8] border border-[#FFDFC6] text-[9px] font-black text-[#B24E00]">
                        <Crown className="w-2.5 h-2.5" />
                        OWNER
                      </span>
                    )}
                    {account.isSelf && <span className="text-[9px] font-bold text-[#8C847A]">(you)</span>}
                  </p>
                  <p className="text-[10px] text-[#8C847A] truncate">
                    {account.email || '—'} • {account.roles.join(' / ') || 'no role'}
                    {account.isPhotographer ? ` • photographer: ${account.photographerStatus}` : ''}
                    {account.accountStatus && account.accountStatus !== 'active' ? ` • ${account.accountStatus}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {canManage && account.isOwner && (
                    <button
                      type="button"
                      disabled={busyId === account.id || ownerCount <= 1 || account.isSelf}
                      title={
                        account.isSelf
                          ? 'You cannot revoke your own ownership.'
                          : ownerCount <= 1
                            ? 'The platform must always keep at least one owner.'
                            : 'Revoke ownership'
                      }
                      onClick={() => transfer(account, 'revokeOwner')}
                      className="p-1 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-40 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canManage && !account.isOwner && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === account.id}
                        onClick={() => savePermissions(account)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                          dirty ? 'bg-[#FF6E00] text-white' : 'bg-white border border-[#E8E2D8] text-[#A69F96]'
                        } disabled:opacity-50`}
                      >
                        Save permissions
                      </button>
                      <button
                        type="button"
                        disabled={busyId === account.id || account.isSelf}
                        title={account.isSelf ? 'You cannot revoke your own administrator access.' : 'Revoke administrator access'}
                        onClick={() => revoke(account)}
                        className="p-1 rounded-md text-red-600 hover:bg-red-50 disabled:opacity-40 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {canManage && !account.isAdministrator && (
                    <span className="text-[10px] font-bold text-[#8C847A] inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" /> not an admin
                    </span>
                  )}
                </div>
              </div>

              {account.isOwner ? (
                <p className="text-[10px] font-semibold text-[#736B63]">
                  Owners hold every permission and may change ownership. Use “Promote an existing account” to add
                  another owner before removing one.
                </p>
              ) : (
                <div className="space-y-1">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {knownPermissions.map((permission) => (
                      <label
                        key={permission}
                        title={PERMISSION_HINTS[permission] || permission}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#5A544D] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          disabled={!canManage || busyId === account.id}
                          checked={selected.includes(permission)}
                          onChange={() => toggle(account.id, permission)}
                        />
                        <span>{PERMISSION_LABELS[permission] || permission}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#A69F96]">
                    {account.hasExplicitPermissions
                      ? `${selected.length} of ${knownPermissions.length} selected.`
                      : 'No explicit grants: this admin currently inherits the full default set. Saving an explicit list narrows it.'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

/**
 * An admin with no rows inherits every permission, so the checkbox draft starts
 * checked rather than empty — otherwise the first save would silently strip the
 * capabilities it was meant to keep.
 */
function knownPermissionsAll(_accounts: Account[], permissions?: string[]): string[] {
  return permissions?.length ? permissions : Object.keys(PERMISSION_LABELS);
}

export default AdministratorPanel;
