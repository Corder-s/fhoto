export enum RoleType {
  CUSTOMER = 'CUSTOMER',
  PHOTOGRAPHER = 'PHOTOGRAPHER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum VerificationStatus {
  UNSUBMITTED = 'UNSUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  /** Published state withdrawn by the platform; the sign-in keeps working. */
  SUSPENDED = 'SUSPENDED',
}

/**
 * Supabase role values in `user_roles.role`. The web app enforces these in
 * `apps/web/src/lib/server/policy.ts`; `RoleType` above is the NestJS API's own
 * uppercase vocabulary and is not the same thing.
 */
export enum AppRoleType {
  CUSTOMER = 'customer',
  CREATOR = 'creator',
  ADMIN = 'admin',
  OWNER = 'owner',
}

/** Rows in `admin_permissions.permission`. An owner implicitly holds all of them. */
export enum AdminPermissionType {
  MANAGE_PHOTOGRAPHER_VERIFICATION = 'manage_photographer_verification',
  MANAGE_USERS = 'manage_users',
  MANAGE_BOOKINGS = 'manage_bookings',
  MANAGE_PLATFORM_SETTINGS = 'manage_platform_settings',
  MANAGE_ADMINISTRATORS = 'manage_administrators',
}

export enum BookingStatus {
  REQUESTED = 'REQUESTED',
  ACCEPTED = 'ACCEPTED',
  ON_THE_WAY = 'ON_THE_WAY',
  ARRIVED = 'ARRIVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum BookingType {
  INSTANT = 'INSTANT',
  SCHEDULED = 'SCHEDULED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PayoutStatus {
  IN_ESCROW = 'IN_ESCROW',
  QUEUED = 'QUEUED',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  DISPUTED = 'DISPUTED',
}

export enum PlanTier {
  FREE = 'FREE',
  PRO = 'PRO',
  BUSINESS = 'BUSINESS',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELED = 'CANCELED',
  TRIALING = 'TRIALING',
}

export enum BillingInterval {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export enum ClientStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  VIP = 'VIP',
}

export enum StudioRole {
  OWNER = 'OWNER',
  LEAD_PHOTOGRAPHER = 'LEAD_PHOTOGRAPHER',
  ASSOCIATE_SHOOTER = 'ASSOCIATE_SHOOTER',
  EDITOR = 'EDITOR',
}
