// Unit tests for the pure authorization and business rules used by the web route handlers
// (apps/web/src/lib/server/policy.ts). Run with: npm run test:unit
import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../apps/web/src/lib/server/policy.ts';

describe('role resolution', () => {
  it('normalizes known roles and rejects unknown ones', () => {
    assert.equal(policy.normalizeRole('creator'), 'creator');
    assert.equal(policy.normalizeRole('ADMIN'), 'admin');
    assert.equal(policy.normalizeRole('owner'), null);
    assert.equal(policy.normalizeRole(undefined), null);
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
