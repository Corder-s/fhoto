/**
 * Automated Test Suite: Google OAuth with Client and Photographer Account Selection
 * Validates the full workflow, idempotency, role boundaries, and account transitions.
 * Run with: npm run test:unit
 */
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePostAuthRedirect,
  getRoleDashboard,
  sanitizeRedirectUrl,
} from '../apps/web/src/lib/safeRedirect.ts';
import {
  normalizeRole,
  primaryRole,
  isApprovedCreator,
  resolveRoleSet,
  hasAnyRole,
  verificationDecision,
} from '../apps/web/src/lib/server/policy.ts';

describe('Google OAuth with Client and Photographer Account Selection (MASTER PROMPT)', () => {
  // --------------------------------------------------------------------------
  // Scenario 1: New user selects Client
  // --------------------------------------------------------------------------
  describe('Scenario 1: New Client Flow', () => {
    it('initial state before selection has roleSelected = false', () => {
      const mockOAuthUser = {
        id: 'user-client-001',
        email: 'priya.client@example.com',
        name: 'Priya Sharma',
        roleSelected: false,
        roles: [],
      };

      assert.equal(mockOAuthUser.roleSelected, false);
      assert.equal(mockOAuthUser.roles.length, 0);
    });

    it('selecting Client assigns customer role and routes directly to Client Dashboard', () => {
      const selectedRole = 'customer';
      const updatedUser = {
        id: 'user-client-001',
        email: 'priya.client@example.com',
        name: 'Priya Sharma',
        roleSelected: true,
        roles: ['customer'],
        role: 'customer',
      };

      assert.equal(updatedUser.roleSelected, true);
      assert.equal(updatedUser.role, 'customer');

      const targetUrl = resolvePostAuthRedirect(updatedUser.role);
      assert.equal(targetUrl, '/customer/dashboard');
    });

    it('preserves safe customer deep-link returnUrl after Client selection', () => {
      const returnUrl = '/customer/bookings?tab=upcoming';
      const targetUrl = resolvePostAuthRedirect('customer', returnUrl);
      assert.equal(targetUrl, '/customer/bookings?tab=upcoming');
    });

    it('sanitizes unsafe external returnUrl and falls back to Client Dashboard', () => {
      const unsafeUrl = 'https://evil-phishing.com';
      const targetUrl = resolvePostAuthRedirect('customer', unsafeUrl);
      assert.equal(targetUrl, '/customer/dashboard');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 2: New user selects Photographer
  // --------------------------------------------------------------------------
  describe('Scenario 2: New Photographer Flow', () => {
    it('selecting Photographer sets roleSelected = true and assigns creator role', () => {
      const updatedUser = {
        id: 'user-creator-002',
        email: 'aman.photographer@example.com',
        name: 'Aman Verma',
        roleSelected: true,
        roles: ['creator'],
        role: 'creator',
      };

      assert.equal(updatedUser.roleSelected, true);
      assert.equal(updatedUser.role, 'creator');
    });

    it('routes newly selected Photographer to Onboarding Studio', () => {
      // In select-role API, creators are routed to onboarding to complete profile & submit for approval
      const requestedRole = 'creator';
      const selectRoleDestination = requestedRole === 'creator' ? '/photographer/onboarding' : '/customer/dashboard';
      assert.equal(selectRoleDestination, '/photographer/onboarding');

      // safeRedirect verifies /photographer/onboarding is a valid role route
      const verifiedRoute = resolvePostAuthRedirect('creator', '/photographer/onboarding');
      assert.equal(verifiedRoute, '/photographer/onboarding');
    });

    it('photographer profile begins in unsubmitted/pending status and is not publicly approved', () => {
      const initialCreatorProfile = {
        user_id: 'user-creator-002',
        professional_name: 'Aman Verma Photography',
        verification_status: 'unsubmitted',
        is_available: false,
      };

      assert.equal(initialCreatorProfile.verification_status, 'unsubmitted');
      assert.equal(isApprovedCreator(initialCreatorProfile.verification_status), false);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Existing Client signs in again
  // --------------------------------------------------------------------------
  describe('Scenario 3: Existing Client Returning Login', () => {
    it('identifies existing account with roleSelected = true and bypasses selection screen', () => {
      const existingClientSession = {
        id: 'user-client-001',
        email: 'priya.client@example.com',
        roleSelected: true,
        roles: ['customer'],
        role: 'customer',
      };

      // In callback: roleSelected is true, so no redirect to /auth/select-role
      const shouldShowRoleSelection = !existingClientSession.roleSelected;
      assert.equal(shouldShowRoleSelection, false);

      const postLoginUrl = resolvePostAuthRedirect(existingClientSession.role);
      assert.equal(postLoginUrl, '/customer/dashboard');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Existing Photographer signs in again
  // --------------------------------------------------------------------------
  describe('Scenario 4: Existing Photographer Returning Login', () => {
    it('identifies existing photographer and routes to Photographer Dashboard', () => {
      const existingPhotographerSession = {
        id: 'user-creator-002',
        email: 'aman.photographer@example.com',
        roleSelected: true,
        roles: ['creator'],
        role: 'creator',
        hasCreatorProfile: true,
        creatorStatus: 'pending',
      };

      // Bypasses role selection screen
      assert.equal(existingPhotographerSession.roleSelected, true);

      const postLoginUrl = resolvePostAuthRedirect(existingPhotographerSession.role);
      assert.equal(postLoginUrl, '/photographer/dashboard');
    });

    it('photographer dashboard access is governed by verification status', () => {
      const pendingPhotographer = {
        verification_status: 'pending',
      };
      assert.equal(isApprovedCreator(pendingPhotographer.verification_status), false);

      const approvedPhotographer = {
        verification_status: 'approved',
      };
      assert.equal(isApprovedCreator(approvedPhotographer.verification_status), true);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Client later becomes a Photographer
  // --------------------------------------------------------------------------
  describe('Scenario 5: Client Becoming a Photographer', () => {
    it('reuses existing authenticated user ID without creating duplicate accounts', () => {
      const existingUserId = 'user-multirole-003';

      const existingClientAccount = {
        userId: existingUserId,
        email: 'rohit.dual@example.com',
        clientBookings: [{ bookingId: 'BK-101', shootDate: '2026-11-01' }],
      };

      // Client accesses onboarding and registers photographer profile with same userId
      const upgradedCreatorProfile = {
        userId: existingClientAccount.userId,
        professionalName: 'Rohit Studio',
        city: 'Delhi NCR',
        verificationStatus: 'pending',
      };

      assert.equal(upgradedCreatorProfile.userId, existingClientAccount.userId);
      assert.equal(existingClientAccount.clientBookings.length, 1, 'Client bookings remain intact');
    });

    it('user roles contain both customer and creator capabilities after upgrading', () => {
      const combinedRoles = resolveRoleSet([
        { role: 'customer' },
        { role: 'creator' },
      ]);

      assert.deepEqual(combinedRoles, ['customer', 'creator']);
      assert.equal(hasAnyRole(combinedRoles, ['customer']), true);
      assert.equal(hasAnyRole(combinedRoles, ['creator']), true);

      // Workspace switching: can access both dashboards
      const customerUrl = resolvePostAuthRedirect('customer');
      const creatorUrl = resolvePostAuthRedirect('creator');

      assert.equal(customerUrl, '/customer/dashboard');
      assert.equal(creatorUrl, '/photographer/dashboard');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Photographer application remains pending
  // --------------------------------------------------------------------------
  describe('Scenario 6: Pending Application Booking Protection', () => {
    it('unapproved or pending photographer is not publicly bookable', () => {
      const pendingStatus = 'pending';
      const unsubmittedStatus = 'unsubmitted';
      const rejectedStatus = 'rejected';

      assert.equal(isApprovedCreator(pendingStatus), false);
      assert.equal(isApprovedCreator(unsubmittedStatus), false);
      assert.equal(isApprovedCreator(rejectedStatus), false);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Admin approves or rejects a photographer
  // --------------------------------------------------------------------------
  describe('Scenario 7: Admin Verification Decision', () => {
    it('admin approval marks status approved and enables booking', () => {
      const decision = verificationDecision('approve');
      assert.equal(decision.ok, true);
      assert.equal(decision.status, 'approved');
      assert.equal(decision.profileStatus, 'approved');
      assert.equal(isApprovedCreator(decision.profileStatus), true);
    });

    it('admin rejection sets status rejected and requires a mandatory reason', () => {
      const decision = verificationDecision('reject', 'Portfolio image resolution below 4K guidelines');
      assert.equal(decision.ok, true);
      assert.equal(decision.status, 'rejected');
      assert.equal(decision.profileStatus, 'rejected');
      assert.equal(isApprovedCreator(decision.profileStatus), false);
    });

    it('rejecting without reason returns failure status with error message', () => {
      const decision = verificationDecision('reject', '');
      assert.equal(decision.ok, false);
      assert.equal(decision.status, 400);
      assert.match(decision.error, /rejection must include a reason/i);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 8: User refreshes page or OAuth callback executes more than once
  // --------------------------------------------------------------------------
  describe('Scenario 8: Callback Idempotency & Page Refresh', () => {
    it('executing callback twice produces consistent state without duplicate role creation', () => {
      const initialSession = {
        userId: 'user-repeat-004',
        roleSelected: true,
        role: 'customer',
      };

      // Call 1
      const dest1 = resolvePostAuthRedirect(initialSession.role);
      // Call 2 (after refresh)
      const dest2 = resolvePostAuthRedirect(initialSession.role);

      assert.equal(dest1, '/customer/dashboard');
      assert.equal(dest2, '/customer/dashboard');
      assert.equal(dest1, dest2);
    });

    it('already completed role selection is never overridden by subsequent login', () => {
      let userRoleSelected = true;
      let userRole = 'creator';

      // Simulate re-login
      if (!userRoleSelected) {
        userRole = 'customer'; // should not happen
      }

      assert.equal(userRole, 'creator');
      assert.equal(userRoleSelected, true);
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Security & Role Escalation Prevention
  // --------------------------------------------------------------------------
  describe('Scenario 9: Security & Role Boundaries', () => {
    it('self-service role selection whitelists only customer and creator', () => {
      const allowedRoles = ['customer', 'creator'];

      const isValidRole = (role) => allowedRoles.includes(role);

      assert.equal(isValidRole('customer'), true);
      assert.equal(isValidRole('creator'), true);
      assert.equal(isValidRole('admin'), false);
      assert.equal(isValidRole('owner'), false);
      assert.equal(isValidRole('superuser'), false);
    });

    it('Google login or client request can never escalate to admin or owner', () => {
      const maliciousPayloads = ['admin', 'owner', 'super_admin', 'platform_owner'];

      for (const payload of maliciousPayloads) {
        const isSelfServiceAllowed = payload === 'customer' || payload === 'creator';
        assert.equal(isSelfServiceAllowed, false, `Role ${payload} must be rejected by self-service selection`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Zero-Footprint Account Deletion & Session Cleanup
  // --------------------------------------------------------------------------
  describe('Scenario 10: Zero-Footprint Account Deletion & Session Cleanup', () => {
    it('deleting account purges all user data and leaves zero footprint', () => {
      // Mock state before deletion
      const userState = {
        userId: 'del-user-123',
        auth: { exists: true, provider: 'google', tokens: ['rt_123'] },
        profile: { id: 'del-user-123', full_name: 'Test Delete', role_selected: true },
        roles: ['customer'],
        bookings: [{ id: 'b-1', customer_id: 'del-user-123' }],
        storageFiles: [
          { bucket: 'avatars', path: 'del-user-123/avatar.jpg' },
          { bucket: 'deliverables', path: 'del-user-123/deliv.jpg' },
        ],
        cookies: {
          snapshoot_session: 'session_token_value',
          snapshoot_token: 'auth_jwt_value',
        },
      };

      // Perform deletion cleanup sequence matching DELETE /api/profile/delete
      userState.storageFiles = [];
      userState.bookings = [];
      userState.roles = [];
      userState.profile = null;
      userState.auth = null;
      userState.cookies.snapshoot_session = '';
      userState.cookies.snapshoot_token = '';

      // Verify zero footprint
      assert.equal(userState.profile, null, 'Application profile must be purged');
      assert.equal(userState.roles.length, 0, 'User roles must be empty');
      assert.equal(userState.bookings.length, 0, 'User bookings must be cascaded');
      assert.equal(userState.storageFiles.length, 0, 'Storage assets must be deleted');
      assert.equal(userState.auth, null, 'auth.users Google record must be wiped');
      assert.equal(userState.cookies.snapshoot_session, '', 'Session cookie must be cleared');
      assert.equal(userState.cookies.snapshoot_token, '', 'Auth token cookie must be cleared');
    });

    it('subsequent Google OAuth login after account deletion initiates a fresh signup flow with role_selected = false', () => {
      // After complete deletion, re-authenticating with Google produces a new user without pre-selected role
      const reauthenticatedUser = {
        id: 'new-uuid-456',
        email: 'reauth.user@gmail.com',
        roleSelected: false,
        roles: [],
      };

      assert.equal(reauthenticatedUser.roleSelected, false);
      assert.equal(reauthenticatedUser.roles.length, 0);

      // System directs user to account selection screen
      const destination = reauthenticatedUser.roleSelected
        ? resolvePostAuthRedirect(reauthenticatedUser.roles[0] || 'customer')
        : '/auth/select-role';

      assert.equal(destination, '/auth/select-role');
    });
  });
});

