import test, { describe, it, beforeEach, afterEach } from 'node:test';
import * as assert from 'node:assert';
import { AuthService } from '../src/auth/auth.service';
import { getGatewaySecret, getJwtSecret, isMockAuthEnabled, isTestSignatureAllowed } from '../src/auth/auth-config';
import { SubscriptionsService } from '../src/subscriptions/subscriptions.service';
import { PlanTier } from '@snapshoot/shared';
import { JwtService } from '@nestjs/jwt';
import { RoleType } from '@snapshoot/shared';

/**
 * Regression tests for the mock-auth lockdown:
 * the mock login is off by default, can never mint ADMIN/OWNER tokens,
 * and has no hardcoded JWT secret fallback.
 */
describe('Mock auth lockdown', () => {
  const saved = {
    ENABLE_MOCK_AUTH: process.env.ENABLE_MOCK_AUTH,
    NODE_ENV: process.env.NODE_ENV,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  };
  const service = new AuthService(new JwtService({ secret: 'unused-in-these-tests' }), {} as any);

  beforeEach(() => {
    delete process.env.ENABLE_MOCK_AUTH;
    delete process.env.NODE_ENV;
    delete process.env.JWT_ACCESS_SECRET;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete (process.env as any)[key];
      else (process.env as any)[key] = value;
    }
  });

  it('is disabled unless ENABLE_MOCK_AUTH=true', async () => {
    assert.equal(isMockAuthEnabled(), false);
    await assert.rejects(() => service.verifyOtp('9811234567', '123456', RoleType.CUSTOMER), {
      name: 'ServiceUnavailableException',
    });
    await assert.rejects(() => service.loginWithPassword('a@b.co', RoleType.CUSTOMER), {
      name: 'ServiceUnavailableException',
    });
    await assert.rejects(() => service.requestOtp('9811234567'), { name: 'ServiceUnavailableException' });
  });

  it('is disabled in production even when the flag is set', async () => {
    process.env.ENABLE_MOCK_AUTH = 'true';
    process.env.NODE_ENV = 'production';
    assert.equal(isMockAuthEnabled(), false);
    await assert.rejects(() => service.verifyOtp('9811234567', '123456', RoleType.CUSTOMER), {
      name: 'ServiceUnavailableException',
    });
  });

  it('never mints ADMIN or OWNER sessions from a request body', async () => {
    process.env.ENABLE_MOCK_AUTH = 'true';
    await assert.rejects(() => service.loginWithPassword('x@y.co', RoleType.ADMIN), { name: 'ForbiddenException' });
    await assert.rejects(() => service.loginWithPassword('x@y.co', RoleType.OWNER), { name: 'ForbiddenException' });
    await assert.rejects(() => service.verifyOtp('9811234567', '123456', RoleType.ADMIN), { name: 'ForbiddenException' });
  });

  it('issues a short-lived customer token when enabled in development', async () => {
    process.env.ENABLE_MOCK_AUTH = 'true';
    const res = await service.loginWithPassword('x@y.co', RoleType.CUSTOMER);
    assert.deepEqual(res.user.roles, [RoleType.CUSTOMER]);
    assert.ok(res.accessToken);
  });

  it('accepts only the development OTP when enabled, and rejects others', async () => {
    process.env.ENABLE_MOCK_AUTH = 'true';
    const ok = await service.verifyOtp('9811234567', '123456', RoleType.CUSTOMER);
    assert.ok(ok.accessToken);
    await assert.rejects(() => service.verifyOtp('9811234567', '000000', RoleType.CUSTOMER), {
      name: 'UnauthorizedException',
    });
  });

  it('does not return the OTP in requestOtp responses', async () => {
    process.env.ENABLE_MOCK_AUTH = 'true';
    const res = await service.requestOtp('9811234567');
    assert.equal(res.success, true);
    assert.doesNotMatch(res.message, /123456/);
  });

  it('password reset is not implemented in the API (handled by Supabase in the web app)', async () => {
    await assert.rejects(() => service.requestPasswordReset('x@y.co', 'email'), { name: 'NotImplementedException' });
  });

  it('fails closed in production without JWT_ACCESS_SECRET', () => {
    process.env.NODE_ENV = 'production';
    assert.throws(() => getJwtSecret(), /JWT_ACCESS_SECRET must be set/);
  });

  it('rejects a short JWT_ACCESS_SECRET in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_ACCESS_SECRET = 'too-short';
    assert.throws(() => getJwtSecret(), /at least 32 characters/);
  });

  it('uses a random development secret when none is configured (no hardcoded fallback)', () => {
    const secret = getJwtSecret();
    assert.ok(secret.length >= 32);
    assert.doesNotMatch(secret, /snapshoot_jwt_super_secret/);
    assert.equal(getJwtSecret(), secret);
  });
});

describe('Payment and webhook signature lockdown', () => {
  const saved = {
    ENABLE_MOCK_AUTH: process.env.ENABLE_MOCK_AUTH,
    NODE_ENV: process.env.NODE_ENV,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  };

  beforeEach(() => {
    delete process.env.ENABLE_MOCK_AUTH;
    delete process.env.NODE_ENV;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    delete process.env.RAZORPAY_KEY_SECRET;
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete (process.env as any)[key];
      else (process.env as any)[key] = value;
    }
  });

  it('refuses the sandbox test-signature shortcuts unless mock mode is enabled outside production', () => {
    assert.equal(isTestSignatureAllowed(), false);
    process.env.ENABLE_MOCK_AUTH = 'true';
    process.env.NODE_ENV = 'production';
    assert.equal(isTestSignatureAllowed(), false);
  });

  it('fails closed for gateway secrets in production when they are not configured', () => {
    process.env.NODE_ENV = 'production';
    assert.throws(() => getGatewaySecret('RAZORPAY_WEBHOOK_SECRET'), { name: 'ServiceUnavailableException' });
    assert.throws(() => getGatewaySecret('RAZORPAY_KEY_SECRET'), { name: 'ServiceUnavailableException' });
  });

  it('never uses a publicly known placeholder secret in development', () => {
    const secret = getGatewaySecret('RAZORPAY_WEBHOOK_SECRET');
    assert.ok(secret.length >= 32);
    assert.doesNotMatch(secret, /placeholder/);
  });

  it('rejects a forged webhook that carries the old sandbox signature in production', async () => {
    process.env.ENABLE_MOCK_AUTH = 'true';
    process.env.NODE_ENV = 'production';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'a-configured-webhook-secret-of-sufficient-length';
    const svc = new SubscriptionsService({} as any);
    await assert.rejects(
      () => svc.processWebhook({ event: 'payment.captured', id: 'evt_forged' } as any, 'test_webhook_valid_signature'),
      { name: 'UnauthorizedException', message: /Invalid Razorpay webhook signature/ },
    );
  });

  it('rejects a forged payment-verification claim that uses the sandbox shortcut in production', async () => {
    process.env.ENABLE_MOCK_AUTH = 'true';
    process.env.NODE_ENV = 'production';
    process.env.RAZORPAY_KEY_SECRET = 'a-configured-key-secret-of-sufficient-length';
    const svc = new SubscriptionsService({} as any);
    await assert.rejects(
      () =>
        svc.verifyCheckout('11111111-1111-4111-8111-111111111111', {
          tier: PlanTier.PRO,
          gatewayPaymentId: 'pay_forged',
          gatewaySubscriptionId: 'sub_forged',
          signature: 'valid_test_signature_forged',
        } as any),
      { name: 'UnauthorizedException', message: /signature verification failed/ },
    );
  });
});
