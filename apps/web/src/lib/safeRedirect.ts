/**
 * Safe internal URL redirection validator
 * Prevents open redirection attacks by strictly validating internal paths.
 */
export function sanitizeRedirectUrl(
  url: string | null | undefined,
  defaultUrl: string = '/explore'
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
