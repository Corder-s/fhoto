import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDir, '../..');

/**
 * The web app imports `@snapshoot/shared`, which ships compiled output from
 * packages/shared/dist. Anything running `next build` without that artifact
 * fails with "Module not found: Can't resolve '@snapshoot/shared'".
 *
 * `npm run build` and `npm run dev:web` compile it first (see the `prebuild`
 * script), so this check only fires when a host or a developer bypasses the
 * package scripts. It turns an opaque webpack error into a one-line fix.
 */
const sharedDistEntry = path.join(repoRoot, 'packages/shared/dist/index.js');
if (!fs.existsSync(sharedDistEntry)) {
  throw new Error(
    [
      '',
      '[snapshoot] @snapshoot/shared is not built (packages/shared/dist/index.js is missing).',
      '           Build it first, then rerun this command:',
      '',
      '             npm run build:shared          # from the repository root',
      '             npx tsc -p ../../packages/shared/tsconfig.json   # from apps/web',
      '',
      '           `npm run build` and `npm run dev:web` already do this for you.',
      '',
    ].join('\n'),
  );
}

/**
 * The legacy NestJS service (apps/api) serves the `/api/v1/*` endpoints that the
 * web app does not implement itself. Locally it runs on port 4000; in a hosted
 * deployment it must be reached by URL.
 *
 * Set NEST_API_BASE_URL (or API_BASE_URL) in the Vercel dashboard to enable the
 * proxy. When it is unset, no rewrite is registered and `/api/v1/*` requests
 * that the web app does not serve return 404 instead of a connection error.
 */
function normalizeApiOrigin(raw) {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim().replace(/\/+$/, '');
  // Accept both "https://api.example.com" and "https://api.example.com/api/v1".
  return trimmed.endsWith('/api/v1') ? trimmed.slice(0, -'/api/v1'.length) : trimmed;
}

const apiOrigin = normalizeApiOrigin(process.env.NEST_API_BASE_URL || process.env.API_BASE_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@snapshoot/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    if (!apiOrigin) return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
