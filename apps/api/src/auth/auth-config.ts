import { randomBytes } from 'crypto';
import { ServiceUnavailableException } from '@nestjs/common';

/**
 * Configuration shared by the NestJS auth service, the JWT module and the JWT guard.
 *
 * The NestJS API has a development-only mock login (fixed IDs, no password check).
 * It is OFF unless ENABLE_MOCK_AUTH=true and NODE_ENV is not "production".
 * Real identity is provided by Supabase Auth in the web app.
 */

let ephemeralDevSecret: string | undefined;

export function isMockAuthEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ENABLE_MOCK_AUTH === 'true';
}

export function requireMockAuth(): void {
  if (!isMockAuthEnabled()) {
    throw new ServiceUnavailableException(
      'Mock authentication is disabled. Sign in through the web application.',
    );
  }
}

/**
 * Returns the HS256 signing secret. There is no hardcoded fallback:
 *  - production requires JWT_ACCESS_SECRET (at least 32 characters) and fails closed otherwise;
 *  - development uses JWT_ACCESS_SECRET when set, otherwise a random per-process secret
 *    (tokens do not survive a restart).
 */
export function getJwtSecret(): string {
  const configured = process.env.JWT_ACCESS_SECRET;
  if (configured) {
    if (process.env.NODE_ENV === 'production' && configured.length < 32) {
      throw new Error('JWT_ACCESS_SECRET must be at least 32 characters in production.');
    }
    return configured;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_ACCESS_SECRET must be set in production.');
  }
  if (!ephemeralDevSecret) {
    ephemeralDevSecret = randomBytes(32).toString('hex');
  }
  return ephemeralDevSecret;
}

/** Mock sessions are short-lived. */
export const MOCK_TOKEN_TTL = '1h';

/**
 * Payment gateway secrets. Live secrets must come from the environment.
 * Production without a configured secret fails closed. Development uses a random
 * per-process value, so a signature can never be forged with a publicly known string.
 */
const ephemeralGatewaySecrets: Record<string, string> = {};

export function getGatewaySecret(name: 'RAZORPAY_KEY_SECRET' | 'RAZORPAY_WEBHOOK_SECRET'): string {
  const configured = process.env[name];
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new ServiceUnavailableException(`${name} is not configured.`);
  }
  if (!ephemeralGatewaySecrets[name]) {
    ephemeralGatewaySecrets[name] = randomBytes(32).toString('hex');
  }
  return ephemeralGatewaySecrets[name];
}

/**
 * Sandbox shortcut signatures used by the automated tests (e.g. `valid_test_signature_*`).
 * Only honoured in non-production mock mode; they are never accepted in production.
 */
export function isTestSignatureAllowed(): boolean {
  return isMockAuthEnabled();
}
