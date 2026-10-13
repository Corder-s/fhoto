// Unit tests for the pure authorization and business rules used by the web route handlers
// (apps/web/src/lib/server/policy.ts). Run with: npm run test:unit
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../apps/web/src/lib/server/policy.ts';

describe('role resolution', () => {
  it('normalizes known roles and rejects unknown ones', () => {
    assert.equal(policy.normalizeRole('creator'), 'creator');
    assert.equal(policy.normalizeRole('ADMIN'), 'admin');
    // 'owner' became a real role with the owner dashboard migration.
    assert.equal(policy.normalizeRole('owner'), 'owner');
    assert.equal(policy.normalizeRole(undefined), null);
    assert.equal(policy.normalizeRole('superuser'), null);
    assert.equal(policy.normalizeRole('service_role'), null);
  });

  it('ranks owner above admin above creator above customer', () => {
    assert.equal(policy.primaryRole(['admin', 'owner']), 'owner');
    assert.equal(policy.primaryRole(['creator', 'admin']), 'admin');
    assert.equal(policy.primaryRole(['owner']), 'owner');
  });

  it('resolves a role set from user_roles rows, ignoring junk', () => {
    const roles = policy.resolveRoleSet([{ role: 'customer' }, { role: 'creator' }, { role: 'bogus' }]);
    assert.deepEqual([...roles].sort(), ['creator', 'customer']);
    assert.deepEqual(policy.resolveRoleSet([]), []);
  });

  it('picks admin above creator above customer as the primary role', () => {
    assert.equal(policy.primaryRole(['customer', 'creator']), 'creator');
    assert.equal(policy.primaryRole(['customer', 'creator', 'admin']), 'admin');
    assert.equal(policy.primaryRole([]), null);
  });

  it('hasAnyRole matches only when one required role is held', () => {
    assert.equal(policy.hasAnyRole(['customer'], ['admin']), false);
    assert.equal(policy.hasAnyRole(['customer', 'creator'], ['creator']), true);
  });
});

describe('account and creator status', () => {
  it('only active accounts pass', () => {
    assert.equal(policy.isAccountActive('active'), true);
    assert.equal(policy.isAccountActive('suspended'), false);
    assert.equal(policy.isAccountActive('pending_verification'), false);
    assert.equal(policy.isAccountActive(null), false);
  });

  it('only approved creators are treated as approved', () => {
    assert.equal(policy.isApprovedCreator('approved'), true);
    assert.equal(policy.isApprovedCreator('pending'), false);
    assert.equal(policy.isApprovedCreator('rejected'), false);
    assert.equal(policy.isApprovedCreator('unsubmitted'), false);
  });
});

describe('ownership helpers', () => {
  const me = '11111111-1111-4111-8111-111111111111';
  it('accepts omitted IDs and the caller\'s own ID only', () => {
    assert.equal(policy.matchesSessionUser(me, undefined), true);
    assert.equal(policy.matchesSessionUser(me, ''), true);
    assert.equal(policy.matchesSessionUser(me, me), true);
    assert.equal(policy.matchesSessionUser(me, '22222222-2222-4222-8222-222222222222'), false);
    assert.equal(policy.matchesSessionUser(me, 42), false);
  });

  it('validates UUIDs strictly (blocks PostgREST filter injection via IDs)', () => {
    assert.equal(policy.isUuid(me), true);
    assert.equal(policy.isUuid('x,user_id.eq.y'), false);
    assert.equal(policy.isUuid('1) or (true'), false);
    assert.equal(policy.isUuid(null), false);
  });
});

describe('customer cancellation', () => {
  it('allows cancelling only before the shoot has started', () => {
    for (const s of ['pending', 'accepted', 'confirmed']) assert.equal(policy.canCustomerCancel(s), true, s);
    for (const s of ['in_progress', 'completed', 'cancelled', 'disputed', 'rejected']) {
      assert.equal(policy.canCustomerCancel(s), false, s);
    }
  });
});

describe('photographer booking transitions', () => {
  it('accepts only pending bookings and confirms them', () => {
    const r = policy.photographerBookingAction('pending', 'accept');
    assert.equal(r.ok, true);
    assert.equal(r.nextStatus, 'confirmed');
    const bad = policy.photographerBookingAction('cancelled', 'accept');
    assert.equal(bad.ok, false);
    assert.equal(bad.status, 409);
  });

  it('never re-opens a cancelled booking through accept', () => {
    assert.equal(policy.photographerBookingAction('cancelled', 'approve').ok, false);
    assert.equal(policy.photographerBookingAction('rejected', 'accept').ok, false);
  });

  it('cannot decline a confirmed shoot directly (must request cancellation)', () => {
    const r = policy.photographerBookingAction('confirmed', 'decline');
    assert.equal(r.ok, false);
    assert.equal(r.status, 403);
  });

  it('declines pending requests to rejected', () => {
    const r = policy.photographerBookingAction('pending', 'reject', undefined, 'Clash');
    assert.equal(r.ok, true);
    assert.equal(r.nextStatus, 'rejected');
    assert.match(r.historyReason, /Clash/);
  });

  it('turns cancellation requests into disputed for admin review', () => {
    for (const s of ['accepted', 'confirmed', 'in_progress']) {
      const r = policy.photographerBookingAction(s, 'request_cancellation');
      assert.equal(r.ok, true, s);
      assert.equal(r.nextStatus, 'disputed');
    }
    assert.equal(policy.photographerBookingAction('pending', 'request_cancellation').ok, false);
  });

  it('logs field milestones without changing booking_status (DB has no such status)', () => {
    for (const m of ['on_the_way', 'arrived_at_venue']) {
      const r = policy.photographerBookingAction('confirmed', 'update_status', m);
      assert.equal(r.ok, true, m);
      assert.equal(r.nextStatus, null, m);
      assert.equal(r.milestone, m);
      assert.equal(policy.photographerBookingAction('pending', 'update_status', m).ok, false);
    }
  });

  it('starts and completes shoots in order', () => {
    assert.equal(policy.photographerBookingAction('confirmed', 'update_status', 'in_progress').nextStatus, 'in_progress');
    assert.equal(policy.photographerBookingAction('confirmed', 'update_status', 'completed').nextStatus, 'completed');
    assert.equal(policy.photographerBookingAction('in_progress', 'update_status', 'completed').nextStatus, 'completed');
    assert.equal(policy.photographerBookingAction('pending', 'update_status', 'completed').ok, false);
    assert.equal(policy.photographerBookingAction('completed', 'update_status', 'in_progress').ok, false);
  });

  it('rejects unknown actions and statuses', () => {
    assert.equal(policy.photographerBookingAction('confirmed', 'delete_everything').ok, false);
    assert.equal(policy.photographerBookingAction('confirmed', 'update_status', 'refunded').ok, false);
  });
});

describe('input helpers', () => {
  it('cleanText trims, rejects empty input, and limits length', () => {
    assert.equal(policy.cleanText('  hello  ', 10), 'hello');
    assert.equal(policy.cleanText('   ', 10), null);
    assert.equal(policy.cleanText(123, 10), null);
    assert.equal(policy.cleanText('abcdefghij', 4), 'abcd');
  });

  it('isSafeHttpsUrl accepts only https URLs', () => {
    assert.equal(policy.isSafeHttpsUrl('https://images.example.com/a.jpg'), true);
    assert.equal(policy.isSafeHttpsUrl('http://images.example.com/a.jpg'), false);
    assert.equal(policy.isSafeHttpsUrl('javascript:alert(1)'), false);
    assert.equal(policy.isSafeHttpsUrl('blob:https://app.example/123'), false);
    assert.equal(policy.isSafeHttpsUrl(''), false);
    assert.equal(policy.isSafeHttpsUrl(undefined), false);
  });
});

describe('administrator permissions', () => {
  const ALL = policy.ADMIN_PERMISSIONS;

  it('gives owners every permission', () => {
    assert.deepEqual(policy.resolvePermissions(['owner'], []), [...ALL]);
    assert.equal(policy.hasPermission(['owner'], [], 'manage_administrators'), true);
  });

  it('treats an admin with no rows as unrestricted (legacy accounts)', () => {
    assert.deepEqual(policy.resolvePermissions(['admin'], []), [...ALL]);
    assert.equal(policy.hasPermission(['admin'], ALL, 'manage_users'), true);
  });

  it('narrows an admin down as soon as one permission is recorded', () => {
    const roles = ['admin'];
    const rows = [{ permission: 'manage_photographer_verification' }, { permission: 'not_a_permission' }];
    assert.deepEqual(policy.resolvePermissions(roles, rows), ['manage_photographer_verification']);
    assert.equal(policy.hasPermission(roles, ['manage_photographer_verification'], 'manage_users'), false);
    assert.equal(policy.hasPermission(roles, ['manage_photographer_verification'], 'manage_photographer_verification'), true);
  });

  it('grants no permissions to non-administrators', () => {
    assert.deepEqual(policy.resolvePermissions(['creator'], [{ permission: 'manage_users' }]), []);
    assert.equal(policy.hasPermission(['customer'], [], 'manage_users'), false);
    assert.deepEqual(policy.resolvePermissions([], null), []);
  });

  it('passes a request with no specific permission to any administrator', () => {
    assert.equal(policy.hasPermission(['admin'], [], undefined), true);
    assert.equal(policy.hasPermission(['creator'], [], undefined), false);
  });

  it('blocks self-lockout and owner removal', () => {
    const guard = policy.permissionChangeGuard({
      callerIsOwner: false,
      callerUserId: 'u1',
      targetUserId: 'u1',
      targetIsOwner: false,
      nextPermissions: ['manage_users'],
      targetOwnsAdminManagement: true,
    });
    assert.match(guard, /revoke your own administrator-management permission/);

    const empty = policy.permissionChangeGuard({
      callerIsOwner: true,
      callerUserId: 'owner',
      targetUserId: 'u2',
      targetIsOwner: false,
      nextPermissions: [],
      targetOwnsAdminManagement: false,
    });
    assert.match(empty, /at least one permission/);

    const ownerNarrow = policy.permissionChangeGuard({
      callerIsOwner: false,
      callerUserId: 'u1',
      targetUserId: 'owner',
      targetIsOwner: true,
      nextPermissions: ['manage_users'],
      targetOwnsAdminManagement: true,
    });
    assert.match(ownerNarrow, /Only a platform owner/);

    assert.equal(
      policy.permissionChangeGuard({
        callerIsOwner: true,
        callerUserId: 'owner',
        targetUserId: 'u2',
        targetIsOwner: false,
        nextPermissions: ['manage_users'],
        targetOwnsAdminManagement: false,
      }),
      null
    );
  });
});

describe('photographer verification rules', () => {
  it('publishes only approved creators', () => {
    assert.equal(policy.isPubliclyListedCreator('approved'), true);
    for (const hidden of ['pending', 'rejected', 'suspended', 'unsubmitted', null]) {
      assert.equal(policy.isPubliclyListedCreator(hidden), false, hidden);
    }
  });

  it('allows filing only before approval or after a rejection', () => {
    assert.equal(policy.canFileVerificationApplication('unsubmitted'), true);
    assert.equal(policy.canFileVerificationApplication('rejected'), true);
    assert.equal(policy.canFileVerificationApplication('suspended'), true);
    assert.equal(policy.canFileVerificationApplication('pending'), false);
    assert.equal(policy.canFileVerificationApplication('approved'), false);
    assert.match(policy.verificationFilingBlockReason('approved'), /already verified/i);
  });

  it('maps decisions onto profile states and requires a written reason', () => {
    assert.deepEqual(
      policy.verificationDecision('approve'),
      { ok: true, status: 'approved', profileStatus: 'approved', historyLabel: 'Photographer verification approved' }
    );
    assert.equal(policy.verificationDecision('reject').ok, false);
    assert.equal(policy.verificationDecision('reject', 'blurry ID scan').status, 'rejected');
    assert.equal(policy.verificationDecision('needs_info', 'need GST certificate').profileStatus, 'pending');
    assert.equal(policy.verificationDecision('force_approve').status, 400);
  });

  it('masks identifiers instead of storing them', () => {
    assert.equal(policy.maskIdentifier('1234 5678 9012'), '•••• 9012');
    // Keeps the final four characters of whatever was typed, spaces removed.
    assert.equal(policy.maskIdentifier('ABCDE1234F'), '•••• 234F');
    assert.equal(policy.maskIdentifier('  07ABCDE1234F1Z5  '), '•••• F1Z5');
    assert.equal(policy.maskIdentifier('abc'), null);
    assert.equal(policy.maskIdentifier(undefined), null);
  });

  it('accepts only own-folder storage paths', () => {
    assert.equal(policy.isSafeStorageObjectPath('u-1/aadhaar.jpg'), true);
    assert.equal(policy.isSafeStorageObjectPath('u-1/2026-10-13/x.pdf'), true);
    assert.equal(policy.isSafeStorageObjectPath('../etc/passwd'), false);
    assert.equal(policy.isSafeStorageObjectPath('/u-1/a.pdf'), false);
    assert.equal(policy.isSafeStorageObjectPath('https://evil.test/a.pdf'), false);
    assert.equal(policy.isSafeStorageObjectPath('a/../../b'), false);
  });

  it('requires a name, an ID type and a government ID document', () => {
    assert.equal(policy.sanitizeVerificationSubmission({}).ok, false);
    assert.equal(
      policy.sanitizeVerificationSubmission({ legalName: 'Aman Verma' }).ok,
      false,
      'an ID type is required'
    );
    const minimal = policy.sanitizeVerificationSubmission({
      legalName: 'Aman Verma',
      governmentIdType: 'aadhaar',
      governmentIdNumber: '1234 5678 9012',
      documents: [{ type: 'government_id', storagePath: 'u-1/id.jpg', fileName: 'id.jpg', sizeBytes: 12000 }],
    });
    assert.equal(minimal.ok, true);
    assert.equal(minimal.value.government_id_masked, '•••• 9012');
    assert.equal(minimal.value.government_id_number, undefined, 'the raw number is never carried through');
    assert.equal('status' in minimal.value, false, 'a payload cannot set its own review status');
  });

  it('rejects junk documents, bad phone numbers and bad GSTINs', () => {
    const base = {
      legalName: 'Aman Verma',
      governmentIdType: 'aadhaar',
      documents: [{ type: 'government_id', storagePath: 'u-1/id.jpg' }],
    };
    assert.equal(policy.sanitizeVerificationSubmission({ ...base, contactPhone: 'call me' }).ok, false);
    assert.equal(policy.sanitizeVerificationSubmission({ ...base, gstin: 'NOTAGSTIN' }).ok, false);
    assert.equal(policy.sanitizeVerificationSubmission({ ...base, documents: [{ type: 'other', note: 'no file' }] }).ok, false);
    const ok = policy.sanitizeVerificationSubmission({ ...base, gstin: '07ABCDE1234F1Z5', contactPhone: '+91 98765 43210' });
    assert.equal(ok.ok, true);
    assert.equal(ok.value.gstin, '07ABCDE1234F1Z5');
  });

  it('drops unknown categories and caps the list', () => {
    const result = policy.sanitizeVerificationSubmission({
      legalName: 'Aman Verma',
      governmentIdType: 'pan',
      documents: [{ type: 'government_id', externalUrl: 'https://drive.google.com/file/d/1/view' }],
      categories: ['Wedding', '  Wedding  ', '', 42, 'Events', ...Array.from({ length: 30 }, (_, i) => `cat-${i}`)],
    });
    assert.equal(result.ok, true);
    assert.equal(result.value.categories[0], 'Wedding');
    assert.ok(result.value.categories.length <= 20);
  });
});
