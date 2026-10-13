import { OwnerDashboardView } from '../../../../components/owner/OwnerDashboardView';

/**
 * /owner/dashboard
 *
 * Executive view of the platform plus the owner-only controls for administrators
 * and their permissions. All figures come from /api/owner/stats and all writes
 * go through /api/admin/roles, which is why nothing here is rendered from
 * fixtures: an owner-facing screen with invented revenue would be worse than one
 * that reports what the database actually holds.
 */
export default function OwnerDashboardPage() {
  return <OwnerDashboardView />;
}
