/**
 * Pure authorization and business-rule helpers shared by the server route
 * handlers. No I/O happens here so the rules can be unit tested directly.
 *
 * Note: this module is imported by server code only. It intentionally uses
 * relative imports so it can be compiled and tested outside the Next.js
 * bundler (see apps/web/test).
 */

export type AppRole = 'customer' | 'creator' | 'admin' | 'owner';

export const APP_ROLES: readonly AppRole[] = ['customer', 'creator', 'admin', 'owner'];

/**
 * Capabilities an administrator can be narrowed down to. The set mirrors the
 * `admin_permissions.permission` CHECK constraint in
 * supabase/migrations/20261013000002_owner_roles_admin_permissions_and_verification.sql.
 * `manage_administrators` is what makes an admin able to change other admins;
 * an owner always holds all five.
 */
export const ADMIN_PERMISSIONS = [
  'manage_photographer_verification',
  'manage_users',
  'manage_bookings',
  'manage_platform_settings',
  'manage_administrators',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  manage_photographer_verification: 'Review photographer verification',
  manage_users: 'Manage user accounts',
  manage_bookings: 'Manage bookings and disputes',
  manage_platform_settings: 'Change platform settings',
  manage_administrators: 'Grant or revoke administrator permissions',
};

/**
 * Maps a raw role string (from the database, a request, or legacy client
 * metadata) to a canonical application role. Unknown values return null so
 * they can never be interpreted as a privilege.
 */
export function normalizeRole(raw: unknown): AppRole | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  if (value === 'photographer') return 'creator';
  if (value === 'super_admin' || value === 'platform_owner') return 'owner';
  return (APP_ROLES as readonly string[]).includes(value) ? (value as AppRole) : null;
}

/** Normalizes a permission string; unknown values return null. */
export function normalizePermission(raw: unknown): AdminPermission | null {
  if (typeof raw !== 'string') return null;
  const value = raw.trim().toLowerCase();
  return (ADMIN_PERMISSIONS as readonly string[]).includes(value) ? (value as AdminPermission) : null;
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

/** The single role used by the UI for navigation. Owner outranks admin, admin outranks creator. */
export function primaryRole(roles: readonly AppRole[]): AppRole | null {
  if (roles.includes('owner')) return 'owner';
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('creator')) return 'creator';
  if (roles.includes('customer')) return 'customer';
  return null;
}

export function hasAnyRole(roles: readonly AppRole[], required: readonly AppRole[]): boolean {
  return required.some((role) => roles.includes(role));
}

/* ------------------------------------------------------------- permissions */

/**
 * Resolves the effective permission set from `admin_permissions` rows.
 *
 * An owner always holds every administrator capability. An admin with no rows
 * at all keeps the full set, which is what existing production accounts expect
 * until an owner narrows them down (the same rule `public.has_admin_permission()`
 * applies in the database).
 */
export function resolvePermissions(
  roles: readonly AppRole[],
  rows: ReadonlyArray<{ permission?: unknown }> | null | undefined
): AdminPermission[] {
  if (!roles.includes('admin') && !roles.includes('owner')) return [];
  if (roles.includes('owner')) return [...ADMIN_PERMISSIONS];

  const granted = new Set<AdminPermission>();
  for (const row of rows || []) {
    const permission = normalizePermission(row?.permission);
    if (permission) granted.add(permission);
  }
  if (granted.size === 0) return [...ADMIN_PERMISSIONS];
  return ADMIN_PERMISSIONS.filter((permission) => granted.has(permission));
}

export function hasPermission(
  roles: readonly AppRole[],
  permissions: readonly AdminPermission[],
  required?: AdminPermission | null
): boolean {
  const isPlatformAdmin = roles.includes('owner') || roles.includes('admin');
  if (!isPlatformAdmin) return false;
  if (roles.includes('owner')) return true;
  if (!required) return true;
  return permissions.includes(required);
}

/** Convenience for handlers: does this caller administer other administrators? */
export function canManageAdministrators(
  roles: readonly AppRole[],
  permissions: readonly AdminPermission[]
): boolean {
  return hasPermission(roles, permissions, 'manage_administrators');
}

/** Only an owner may hand out (or revoke) the owner role itself. */
export function isPlatformOwner(roles: readonly AppRole[]): boolean {
  return roles.includes('owner');
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

/* --------------------------------------------------- photographer verification */

export type VerificationStatus = 'unsubmitted' | 'pending' | 'approved' | 'rejected' | 'suspended';

export const VERIFICATION_STATUSES: readonly VerificationStatus[] = [
  'unsubmitted',
  'pending',
  'approved',
  'rejected',
  'suspended',
];

/**
 * A creator is discoverable and bookable in exactly one state. `suspended` and
 * `pending` are kept out of the directory by the same predicate, which is the
 * publication rule the listing routes apply (`verification_status = 'approved'`).
 */
export function isPubliclyListedCreator(verificationStatus: string | null | undefined): boolean {
  return verificationStatus === 'approved';
}

/** An applicant may file when they have never been approved or were turned down. */
export function canFileVerificationApplication(verificationStatus: string | null | undefined): boolean {
  return ['unsubmitted', 'rejected', 'suspended', null, undefined].includes(
    verificationStatus as VerificationStatus | null | undefined
  );
}

/** Human explanation for refusing a new application, or null when filing is allowed. */
export function verificationFilingBlockReason(verificationStatus: string | null | undefined): string | null {
  if (verificationStatus === 'pending') {
    return 'Your application is already under review. You will be notified when a decision is made.';
  }
  if (verificationStatus === 'approved') {
    return 'Your photographer profile is already verified. Use the onboarding form to update your details.';
  }
  return null;
}

/** Document kinds the verification form accepts. Mirrors the API contract. */
export const VERIFICATION_DOCUMENT_TYPES = [
  'government_id',
  'address_proof',
  'gst_certificate',
  'equipment_invoice',
  'business_registration',
  'portfolio_sample',
  'other',
] as const;
export type VerificationDocumentType = (typeof VERIFICATION_DOCUMENT_TYPES)[number];

export const GOVERNMENT_ID_TYPES = ['aadhaar', 'pan', 'passport', 'driving_licence', 'voter_id'] as const;
export type GovernmentIdType = (typeof GOVERNMENT_ID_TYPES)[number];

export type ReviewDecision = 'approve' | 'reject' | 'needs_info';

export interface VerificationDecisionResult {
  ok: true;
  status: 'approved' | 'rejected' | 'needs_info';
  /** The creator_profiles.verification_status value the platform stores for this outcome. */
  profileStatus: VerificationStatus;
  historyLabel: string;
}

/**
 * Maps a reviewer action to the persisted states.
 *
 * `needs_info` deliberately leaves the profile in `pending`: the photographer
 * is still awaiting review, they just have to supply something first. Rejecting
 * and asking for more information both require a written reason so the
 * photographer sees an explanation instead of a dead end.
 */
export function verificationDecision(
  action: unknown,
  reason?: unknown
): VerificationDecisionResult | { ok: false; status: number; error: string } {
  const hasReason = typeof reason === 'string' && reason.trim().length >= 4;

  if (action === 'approve') {
    return {
      ok: true,
      status: 'approved',
      profileStatus: 'approved',
      historyLabel: 'Photographer verification approved',
    };
  }
  if (action === 'reject') {
    if (!hasReason) {
      return { ok: false, status: 400, error: 'A rejection must include a reason for the photographer.' };
    }
    return {
      ok: true,
      status: 'rejected',
      profileStatus: 'rejected',
      historyLabel: 'Photographer verification rejected',
    };
  }
  if (action === 'needs_info') {
    if (!hasReason) {
      return { ok: false, status: 400, error: 'Requesting more information must say what is missing.' };
    }
    return {
      ok: true,
      status: 'needs_info',
      profileStatus: 'pending',
      historyLabel: 'Photographer verification: more information requested',
    };
  }
  return { ok: false, status: 400, error: `Unknown review action: ${String(action)}` };
}

/**
 * Keeps only the tail of an identifier. Full document numbers must never reach
 * the database; the reviewer only needs to match a last-4 against the upload.
 */
export function maskIdentifier(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const compact = value.replace(/[^0-9A-Za-z]/g, '');
  if (compact.length < 4) return null;
  return `•••• ${compact.slice(-4).toUpperCase()}`;
}

/**
 * Storage object paths are `<auth uid>/<file>`. The check rejects traversal and
 * absolute URLs so a submission can never point at another user's object.
 */
export function isSafeStorageObjectPath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 400) return false;
  if (trimmed.includes('://') || trimmed.startsWith('/')) return false;
  const parts = trimmed.split('/');
  if (parts.length < 2 || parts.length > 6) return false;
  return parts.every((part) => /^[A-Za-z0-9][A-Za-z0-9._@-]{0,127}$/.test(part));
}

export interface SanitizedVerificationDocument {
  type: VerificationDocumentType;
  storage_path: string | null;
  external_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
}

export interface SanitizedVerificationSubmission {
  legal_name: string;
  contact_phone: string | null;
  government_id_type: GovernmentIdType | null;
  government_id_masked: string | null;
  gstin: string | null;
  business_name: string | null;
  equipment_summary: string | null;
  categories: string[];
  city: string | null;
  state: string | null;
  service_radius_km: number | null;
  portfolio_url: string | null;
  documents: SanitizedVerificationDocument[];
  applicant_notes: string | null;
}

export const MAX_VERIFICATION_DOCUMENTS = 12;
/** The `creator-verification` bucket rejects anything larger (25 MB). */
export const MAX_VERIFICATION_DOCUMENT_BYTES = 25 * 1024 * 1024;

const PHONE_RE = /^[+]?[0-9][0-9\s\-()]{5,19}$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/;

function normalizeDocumentType(value: unknown): VerificationDocumentType {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return (VERIFICATION_DOCUMENT_TYPES as readonly string[]).includes(raw)
    ? (raw as VerificationDocumentType)
    : 'other';
}

/**
 * Validates and normalizes a verification application.
 *
 * Rules worth knowing:
 * - `governmentIdNumber` is reduced to a mask before it is returned; a raw
 *   number is never persisted. `governmentIdMasked` is accepted for clients that
 *   already masked on the device.
 * - Each document must carry either a storage object path in the caller's own
 *   folder or an https link.
 * - Unknown keys are dropped, so a payload cannot smuggle a status or a role.
 */
export function sanitizeVerificationSubmission(
  body: Record<string, any>
): { ok: true; value: SanitizedVerificationSubmission } | { ok: false; status: number; error: string } {
  const legal_name = cleanText(body.legalName ?? body.legal_name ?? body.name, 120);
  if (!legal_name) {
    return { ok: false, status: 400, error: 'Your legal name (as printed on your ID) is required.' };
  }

  const governmentIdTypeRaw = typeof body.governmentIdType === 'string' ? body.governmentIdType.trim().toLowerCase() : '';
  if (!governmentIdTypeRaw) {
    return { ok: false, status: 400, error: 'Select the type of government ID you uploaded.' };
  }
  if (!(GOVERNMENT_ID_TYPES as readonly string[]).includes(governmentIdTypeRaw)) {
    return { ok: false, status: 400, error: 'Unsupported government ID type.' };
  }

  const phoneCandidate = typeof body.contactPhone === 'string' ? body.contactPhone.trim() : '';
  if (phoneCandidate && !PHONE_RE.test(phoneCandidate)) {
    return { ok: false, status: 400, error: 'Contact number must be a valid phone number.' };
  }

  const gstinCandidate = typeof body.gstin === 'string' ? body.gstin.trim().toUpperCase().replace(/\s/g, '') : '';
  if (gstinCandidate && !GSTIN_RE.test(gstinCandidate)) {
    return { ok: false, status: 400, error: 'GSTIN must be the 15-character GST number (for example 07ABCDE1234F1Z5).' };
  }

  const masked =
    maskIdentifier(body.governmentIdMasked) ??
    maskIdentifier(body.governmentIdNumber) ??
    maskIdentifier(body.governmentId);

  const rawDocuments = Array.isArray(body.documents) ? body.documents : [];
  if (rawDocuments.length > MAX_VERIFICATION_DOCUMENTS) {
    return { ok: false, status: 400, error: `Upload at most ${MAX_VERIFICATION_DOCUMENTS} documents.` };
  }
  const documents: SanitizedVerificationDocument[] = [];
  for (const doc of rawDocuments) {
    const storage_path = isSafeStorageObjectPath(doc?.storagePath ?? doc?.storage_path)
      ? String(doc.storagePath ?? doc.storage_path).trim()
      : null;
    const external = doc?.externalUrl ?? doc?.external_url;
    const external_url = isSafeHttpsUrl(external) ? external.trim() : null;
    if (!storage_path && !external_url) continue;

    const sizeRaw = Number(doc?.sizeBytes ?? doc?.size_bytes);
    documents.push({
      type: normalizeDocumentType(doc?.type ?? doc?.documentType),
      storage_path,
      external_url,
      file_name: cleanText(doc?.fileName ?? doc?.file_name, 200),
      mime_type: cleanText(doc?.mimeType ?? doc?.mime_type, 120),
      size_bytes: Number.isFinite(sizeRaw) && sizeRaw > 0 ? Math.min(Math.round(sizeRaw), MAX_VERIFICATION_DOCUMENT_BYTES) : null,
    });
  }
  if (documents.length === 0) {
    return { ok: false, status: 400, error: 'Attach at least one verification document (your government ID).' };
  }
  if (!documents.some((doc) => doc.type === 'government_id')) {
    return { ok: false, status: 400, error: 'A government ID document is required.' };
  }

  const categories = Array.isArray(body.categories)
    ? Array.from(
        new Set(
          body.categories
            .map((value: unknown) => cleanText(value, 60))
            .filter((value: string | null): value is string => Boolean(value))
        )
      ).slice(0, 20)
    : [];

  const radiusRaw = Number(body.serviceRadiusKm ?? body.service_radius_km);
  const service_radius_km = Number.isFinite(radiusRaw) ? Math.min(Math.max(Math.round(radiusRaw), 1), 500) : null;

  return {
    ok: true,
    value: {
      legal_name,
      contact_phone: phoneCandidate || null,
      government_id_type: governmentIdTypeRaw as GovernmentIdType,
      government_id_masked: masked,
      gstin: gstinCandidate || null,
      business_name: cleanText(body.businessName ?? body.business_name, 140),
      equipment_summary: cleanText(body.equipmentSummary ?? body.equipment_summary, 2000),
      categories,
      city: cleanText(body.city, 80),
      state: cleanText(body.state, 80),
      service_radius_km,
      portfolio_url: isSafeHttpsUrl(body.portfolioUrl) ? String(body.portfolioUrl).trim() : null,
      documents,
      applicant_notes: cleanText(body.notes ?? body.applicantNotes, 2000),
    },
  };
}

/**
 * Guards permission changes so an administrator cannot lock themselves out, and
 * so an owner-only privilege cannot be handed out or narrowed by a non-owner.
 * Returns an error message, or null when the change may proceed. Keeping the last
 * owner on the platform is checked by the route, which is the only place that can
 * count the rows.
 */
export function permissionChangeGuard(options: {
  callerIsOwner: boolean;
  callerUserId: string;
  targetUserId: string;
  targetIsOwner: boolean;
  nextPermissions: readonly AdminPermission[];
  targetOwnsAdminManagement: boolean;
}): string | null {
  const { callerIsOwner, callerUserId, targetUserId, targetIsOwner, nextPermissions, targetOwnsAdminManagement } =
    options;

  if (targetIsOwner) {
    if (!callerIsOwner) return 'Only a platform owner may change an owner’s permissions.';
    if (nextPermissions.length !== ADMIN_PERMISSIONS.length) {
      return 'An owner always holds every permission; the full set must be submitted.';
    }
    return null;
  }

  // An admin who can manage administrators must not silently strip their own
  // ability to keep doing it (self-lockout guard).
  if (callerUserId === targetUserId && targetOwnsAdminManagement && !nextPermissions.includes('manage_administrators')) {
    return 'You cannot revoke your own administrator-management permission while you hold it.';
  }
  if (nextPermissions.length === 0) {
    return 'An administrator needs at least one permission. Revoke the admin role instead.';
  }
  return null;
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
