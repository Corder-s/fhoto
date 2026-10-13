/**
 * Safe internal URL redirection validator & Role Dashboard Resolver
 * Prevents open redirection attacks and enforces verified role-based routing.
 */

export function getRoleDashboard(role: string | null | undefined): string {
  switch (role) {
    case 'creator':
    case 'photographer':
      return '/photographer/dashboard';
    case 'admin':
      return '/admin/dashboard';
    case 'owner':
      return '/owner/dashboard';
    case 'customer':
    default:
      return '/customer/dashboard';
  }
}

export function sanitizeRedirectUrl(
  url: string | null | undefined,
  defaultUrl: string = '/customer/dashboard'
): string {
  if (!url) return defaultUrl;

  const trimmed = url.trim();

  // Must begin with a single slash '/'
  // Must NOT begin with '//' or '/\' (protocol-relative or Windows file trick)
  // Must NOT contain URI schemes like http:, https:, javascript:, data:
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('://') &&
    !trimmed.toLowerCase().startsWith('/javascript:')
  ) {
    return trimmed;
  }

  return defaultUrl;
}

/**
 * Resolves post-login redirection destination based on the verified role.
 * Critical Rule: Normal login must NEVER default to Explore Photographers or public marketing pages.
 */
export function resolvePostAuthRedirect(
  role: string | null | undefined,
  requestedUrl?: string | null
): string {
  const roleDashboard = getRoleDashboard(role);

  if (!requestedUrl) {
    return roleDashboard;
  }

  const sanitized = sanitizeRedirectUrl(requestedUrl, '');
  if (!sanitized) {
    return roleDashboard;
  }

  // Extract base path without query parameters or hash
  const basePath = sanitized.split('?')[0].split('#')[0].toLowerCase();

  // Direct deep link to specific public photographer profile (e.g. for booking continuation)
  if (basePath.startsWith('/photographers/')) {
    return sanitized;
  }

  // Public marketing, discovery, or auth pages must NEVER override the user's dashboard
  const publicPaths = [
    '/',
    '/explore',
    '/photographers',
    '/how-it-works',
    '/for-photographers',
    '/categories',
    '/stories',
    '/privacy',
    '/terms',
    '/cancellation',
    '/login',
    '/register',
    '/forgot-password',
  ];

  const isPublicMarketingPath =
    publicPaths.includes(basePath) ||
    basePath.startsWith('/explore/') ||
    basePath.startsWith('/how-it-works/') ||
    basePath.startsWith('/for-photographers/') ||
    basePath.startsWith('/categories/');

  if (isPublicMarketingPath) {
    return roleDashboard;
  }

  // Enforce role boundary protections
  if (role === 'customer') {
    if (sanitized.startsWith('/customer/')) {
      return sanitized;
    }
    return roleDashboard;
  }

  if (role === 'creator' || role === 'photographer') {
    if (sanitized.startsWith('/photographer/')) {
      return sanitized;
    }
    return roleDashboard;
  }

  if (role === 'admin') {
    if (sanitized.startsWith('/admin/')) {
      return sanitized;
    }
    return roleDashboard;
  }

  if (role === 'owner') {
    if (sanitized.startsWith('/owner/')) {
      return sanitized;
    }
    return roleDashboard;
  }

  return roleDashboard;
}
