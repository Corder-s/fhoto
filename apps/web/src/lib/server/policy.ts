/**
 * Pure authorization and business-rule helpers shared by the server route
 * handlers. No I/O happens here so the rules can be unit tested directly.
 *
 * Note: this module is imported by server code only. It intentionally uses
 * relative imports so it can be compiled and tested outside the Next.js
 * bundler (see apps/web/test).
 */

export type AppRole = 'customer' | 'creator' | 'admin';

export const APP_ROLES: readonly AppRole[] = ['customer', 'creator', 'admin'];

/**
 * Maps a raw role string (from the database, a request, or legacy client
 * metadata) to a canonical application role. Unknown values return null so
 * they can never be interpreted as a privilege.
 */
export function normalizeRole(raw: unknown): AppRole | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  if (value === 'photographer') return 'creator';
  return (APP_ROLES as readonly string[]).includes(value) ? (value as AppRole) : null;
}

/** Deduplicated, validated role list from `user_roles` rows. */
export function resolveRoleSet(rows: ReadonlyArray<{ role?: unknown }>): AppRole[] {
  const set = new Set<AppRole>();
  for (const row of rows) {
    const role = normalizeRole(row.role);
    if (role) set.add(role);
  }
  return APP_ROLES.filter((role) => set.has(role));
}

/** The single role used by the UI for navigation. Admin outranks creator, creator outranks customer. */
export function primaryRole(roles: readonly AppRole[]): AppRole | null {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('creator')) return 'creator';
  if (roles.includes('customer')) return 'customer';
  return null;
}

export function hasAnyRole(roles: readonly AppRole[], required: readonly AppRole[]): boolean {
  return required.some((role) => roles.includes(role));
}

/** Only fully active accounts may use the platform. */
export function isAccountActive(accountStatus: string | null | undefined): boolean {
  return accountStatus === 'active';
}

/** Creators may be discovered and receive bookings only after platform approval. */
export function isApprovedCreator(verificationStatus: string | null | undefined): boolean {
  return verificationStatus === 'approved';
}

/**
 * A request may name a user ID (legacy clients send `userId`), but the value
 * must match the authenticated caller. Omitted IDs are fine.
 */
export function matchesSessionUser(sessionUserId: string, requestedUserId: unknown): boolean {
  if (requestedUserId === undefined || requestedUserId === null || requestedUserId === '') return true;
  return typeof requestedUserId === 'string' && requestedUserId === sessionUserId;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

/* ------------------------------------------------------------------ bookings */

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';

/** Customers can cancel only while the shoot has not started and is not already cancelled or closed. */
export function canCustomerCancel(status: string): boolean {
  return ['pending', 'accepted', 'confirmed'].includes(status);
}

export type PhotographerBookingAction =
  | { ok: true; nextStatus: BookingStatus | null; milestone: string | null; historyReason: string }
  | { ok: false; status: number; error: string };

/**
 * Photographer actions on a booking and the status they produce.
 *
 * - `on_the_way` / `arrived_at_venue` are field milestones. The booking_status
 *   CHECK constraint has no such values, so they are recorded in
 *   booking_status_history and the status remains `confirmed`.
 * - Terminal bookings (completed, cancelled, rejected) cannot be re-opened.
 */
export function photographerBookingAction(
  current: string,
  action: string,
  newStatus?: string,
  reason?: string
): PhotographerBookingAction {
  const conflict = (msg: string): PhotographerBookingAction => ({ ok: false, status: 409, error: msg });

  if (action === 'accept' || action === 'approve') {
    if (current !== 'pending') return conflict(`A booking in status "${current}" cannot be accepted.`);
    return { ok: true, nextStatus: 'confirmed', milestone: null, historyReason: 'Photographer accepted and confirmed booking assignment' };
  }

  if (action === 'decline' || action === 'reject') {
    if (current === 'confirmed' || current === 'in_progress') {
      return {
        ok: false,
        status: 403,
        error: 'Confirmed shoots cannot be directly declined. Please submit a cancellation request to Admin.',
      };
    }
    if (current !== 'pending') return conflict(`A booking in status "${current}" cannot be declined.`);
    return {
      ok: true,
      nextStatus: 'rejected',
      milestone: null,
      historyReason: `Photographer declined booking request: ${reason || 'Schedule conflict'}`,
    };
  }

  if (action === 'request_cancellation') {
    if (!['accepted', 'confirmed', 'in_progress'].includes(current)) {
      return conflict(`A booking in status "${current}" cannot receive a cancellation request.`);
    }
    return {
      ok: true,
      nextStatus: 'disputed',
      milestone: null,
      historyReason: `[Photographer Emergency Cancellation Request]: ${reason || 'Unforeseen conflict'}`,
    };
  }

  if (action === 'update_status') {
    if (newStatus === 'on_the_way' || newStatus === 'arrived_at_venue') {
      if (current !== 'confirmed') return conflict(`A booking in status "${current}" cannot be updated to ${newStatus}.`);
      return { ok: true, nextStatus: null, milestone: newStatus, historyReason: `Photographer status: ${newStatus}` };
    }
    if (newStatus === 'in_progress') {
      if (current !== 'confirmed') return conflict(`A booking in status "${current}" cannot be started.`);
      return { ok: true, nextStatus: 'in_progress', milestone: null, historyReason: 'Shoot progressed to in_progress' };
    }
    if (newStatus === 'completed') {
      if (current !== 'confirmed' && current !== 'in_progress') {
        return conflict(`A booking in status "${current}" cannot be completed.`);
      }
      return { ok: true, nextStatus: 'completed', milestone: null, historyReason: 'Shoot progressed to completed' };
    }
    return { ok: false, status: 400, error: `Invalid status transition: ${newStatus}` };
  }

  return { ok: false, status: 400, error: `Unknown action: ${action}` };
}

/* ----------------------------------------------------------------- utilities */

/** Strings from user input are trimmed and length-limited before persistence. */
export function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

/** Only https URLs may be stored as avatar or external links. */
export function isSafeHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}
