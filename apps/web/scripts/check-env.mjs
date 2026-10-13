#!/usr/bin/env node
/**
 * Deployment environment check for apps/web.
 *
 * Run standalone:            npm run env:check            (from apps/web or the repo root)
 * Force missing values to fail the build:
 *                            STRICT_ENV_CHECK=true npm run build
 *
 * Local runs read apps/web/.env.local and apps/web/.env (process.env always wins).
 * On Vercel there is no .env file: the values come from the project dashboard
 * (Settings -> Environment Variables), and this script reports which ones are
 * absent for that deployment.
 *
 * Invalid values (a service-role key in a public variable, a secret Mapbox token
 * in NEXT_PUBLIC_MAPBOX_TOKEN, NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) always exit 1.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STRICT = process.argv.includes('--strict') || process.env.STRICT_ENV_CHECK === 'true';
const ON_VERCEL = Boolean(process.env.VERCEL);

const PLACEHOLDERS = [
  'your-project.supabase.co',
  'your_supabase_anon_key_here',
  'your_supabase_service_role_key_here',
  'your_gemini_api_key_here',
  'rzp_test_placeholder',
  'rzp_test_secret_placeholder',
];

/** name, requiredIn, kind, purpose */
const VARIABLES = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    requiredIn: 'production',
    kind: 'public',
    purpose: 'Supabase project URL. Sign-in, storage, and every data route.',
    source: 'Supabase dashboard -> Project Settings -> API -> Project URL',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    requiredIn: 'production',
    kind: 'public',
    purpose: 'Supabase anon key. Row Level Security protects the data.',
    source: 'Supabase dashboard -> Project Settings -> API -> anon public key',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    requiredIn: 'production',
    kind: 'server',
    purpose: 'Server-only key used by admin routes and the public creator listing.',
    source: 'Supabase dashboard -> Project Settings -> API -> service_role key',
  },
  {
    name: 'NEXT_PUBLIC_MAPBOX_TOKEN',
    requiredIn: 'never',
    kind: 'public',
    purpose: 'Venue map and search. Must be a public pk.* token.',
    source: 'Mapbox account -> Tokens -> public token',
  },
  {
    name: 'MAPBOX_ACCESS_TOKEN',
    requiredIn: 'never',
    kind: 'server',
    purpose: 'Server-side geocoding for /api/geocoding.',
    source: 'Mapbox account -> Tokens -> secret token',
  },
  {
    name: 'GEMINI_API_KEY',
    requiredIn: 'never',
    kind: 'server',
    purpose: 'AI assistant (/api/v1/ai/chat). Without it the route returns GEMINI_API_KEY_MISSING.',
    source: 'Google AI Studio -> API keys',
  },
  {
    name: 'GEMINI_MODEL',
    requiredIn: 'never',
    kind: 'server',
    purpose: 'AI model id. Defaults to gemini-1.5-flash when unset.',
    source: 'Optional override',
  },
  {
    name: 'NEST_API_BASE_URL',
    requiredIn: 'never',
    kind: 'server',
    purpose:
      'Origin of the NestJS service (apps/api). Enables the /api/v1/* proxy. Without it those paths 404.',
    source: 'Wherever apps/api runs, e.g. https://api.example.com',
  },
  {
    name: 'PAYMENT_PROVIDER_SECRET_KEY',
    requiredIn: 'never',
    kind: 'server',
    purpose:
      'Leave unset for sandbox test mode. When set, create-intent returns 501 and sandbox confirmation returns 403.',
    source: 'Gateway dashboard, once order creation is implemented',
  },
];

function parseEnvFile(file) {
  const out = {};
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return out;
  }
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

const fileValues = {
  ...parseEnvFile(path.join(appDir, '.env')),
  ...parseEnvFile(path.join(appDir, '.env.local')),
};

const get = (name) => {
  const fromProcess = process.env[name];
  if (fromProcess !== undefined && fromProcess !== '') return fromProcess;
  const fromFile = fileValues[name];
  return fromFile !== undefined && fromFile !== '' ? fromFile : '';
};

const jwtPayload = (token) => {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString());
  } catch {
    return null;
  }
};

const warnings = [];
const errors = [];
const missingRequired = [];
const configured = [];

/** Value-level checks. Return an error/warning string, or null. */
function inspect(spec, value) {
  if (PLACEHOLDERS.some((placeholder) => value.includes(placeholder))) {
    return { level: 'warn', message: 'still holds the placeholder value from the example file' };
  }

  if (spec.name === 'NEXT_PUBLIC_SUPABASE_URL') {
    if (!/^https?:\/\//.test(value)) {
      return { level: 'error', message: 'must be a full URL, for example https://project.supabase.co' };
    }
    if (!/^https:/.test(value)) {
      return { level: 'warn', message: 'should use https, not http' };
    }
  }

  if (spec.name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' || spec.name === 'SUPABASE_SERVICE_ROLE_KEY') {
    const payload = jwtPayload(value);
    if (payload) {
      if (spec.name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && payload.role === 'service_role') {
        return {
          level: 'error',
          message: 'is a service_role key. It must never be exposed to the browser - use the anon key',
        };
      }
      if (spec.name === 'SUPABASE_SERVICE_ROLE_KEY' && payload.role === 'anon') {
        return { level: 'error', message: 'is the anon key, not the service_role key' };
      }
    } else if (!value.startsWith('eyJ')) {
      return { level: 'warn', message: 'does not look like a Supabase JWT (expected it to start with eyJ)' };
    }
  }

  if (spec.name === 'NEXT_PUBLIC_MAPBOX_TOKEN' && !value.startsWith('pk.')) {
    return { level: 'error', message: 'must be a public token starting with pk. - never a sk.* secret token' };
  }

  if (spec.name === 'MAPBOX_ACCESS_TOKEN' && value.startsWith('pk.')) {
    return { level: 'warn', message: 'looks like a public token; server geocoding usually needs a secret token' };
  }

  if (spec.name === 'GEMINI_API_KEY' && !value.startsWith('AIza')) {
    return { level: 'warn', message: 'does not look like a Google AI Studio key (expected it to start with AIza)' };
  }

  if (spec.name === 'NEST_API_BASE_URL') {
    if (!/^https?:\/\//.test(value)) {
      return { level: 'error', message: 'must be a full origin, for example https://api.example.com' };
    }
    if (ON_VERCEL && /localhost|127\.0\.0\.1/.test(value)) {
      return { level: 'error', message: 'points at localhost, which is unreachable from Vercel' };
    }
  }

  return null;
}

for (const spec of VARIABLES) {
  const value = get(spec.name);
  if (!value) {
    if (spec.requiredIn === 'production') {
      missingRequired.push(spec);
    } else {
      warnings.push(`${spec.name} is not set - ${spec.purpose}`);
    }
    continue;
  }
  const finding = inspect(spec, value);
  if (finding?.level === 'error') {
    errors.push(`${spec.name} ${finding.message}`);
  } else if (finding?.level === 'warn') {
    warnings.push(`${spec.name} ${finding.message}`);
  } else {
    configured.push(spec.name);
  }
}

const publicSecret = get('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
if (publicSecret) {
  errors.push(
    'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is set. Server secrets must never use the NEXT_PUBLIC_ prefix - delete it and rotate the key.',
  );
}

const line = (label, message) => console.log(`  ${label} ${message}`);
console.log('');
console.log('snapshoot web - environment check');
console.log(`  target: ${ON_VERCEL ? `Vercel (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unknown'})` : 'local'}`);
console.log(`  strict: ${STRICT ? 'yes (missing required values fail the build)' : 'no'}`);
console.log('');

if (configured.length) {
  console.log(`Configured (${configured.length}): ${configured.join(', ')}`);
  console.log('');
}

if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  for (const warning of warnings) line('-', warning);
  console.log('');
}

if (missingRequired.length) {
  console.log(
    `${STRICT ? 'Missing required values' : 'Missing required values (warnings unless STRICT_ENV_CHECK=true)'} (${missingRequired.length}):`,
  );
  for (const spec of missingRequired) {
    line('!', `${spec.name} - ${spec.purpose}`);
    line(' ', `${' '.repeat(spec.name.length)}  get it from: ${spec.source}`);
    line(
      ' ',
      `${' '.repeat(spec.name.length)}  Vercel: Settings -> Environment Variables -> key ${spec.name}, ${
        spec.kind === 'public' ? 'any environment' : 'Production and Preview'
      }`,
    );
  }
  console.log('');
  if (!ON_VERCEL) {
    console.log('  Locally: cp apps/web/.env.local.example apps/web/.env.local and fill in the values above.');
    console.log('  Variables prefixed NEXT_PUBLIC_ are inlined at build time; restart or rebuild after changing them.');
    console.log('');
  }
}

if (errors.length) {
  console.log(`Errors (${errors.length}):`);
  for (const error of errors) line('x', error);
  console.log('');
}

if (errors.length || (STRICT && missingRequired.length)) {
  console.log('Environment check failed.');
  console.log('');
  process.exit(1);
}

console.log('Environment check passed.');
console.log('');
