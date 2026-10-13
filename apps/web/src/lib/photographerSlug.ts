/**
 * Canonical photographer slug generation and resolution utility
 * Provides stable, unique, SEO-friendly handles for public photographer profiles.
 */

const KNOWN_SLUG_MAP: Record<string, string> = {
  'vikramaditya rathore': 'pro-vikram',
  'vikram rathore': 'pro-vikram',
  'aman verma': 'pro-aman',
  'riya sen': 'pro-riya',
  'karan malhotra': 'pro-karan',
  'arjun kapoor': 'pro-arjun',
  'meera singhal': 'pro-meera',
  'devika roy': 'pro-devika',
  'raju': 'pro-raju',
};

const REVERSE_SLUG_MAP: Record<string, string> = {
  'pro-vikram': 'Vikramaditya Rathore',
  'vikram': 'Vikramaditya Rathore',
  'pro-aman': 'Aman Verma',
  'aman': 'Aman Verma',
  'pro-riya': 'Riya Sen',
  'riya': 'Riya Sen',
  'pro-karan': 'Karan Malhotra',
  'karan': 'Karan Malhotra',
  'pro-arjun': 'Arjun Kapoor',
  'arjun': 'Arjun Kapoor',
  'pro-meera': 'Meera Singhal',
  'meera': 'Meera Singhal',
  'pro-devika': 'Devika Roy',
  'devika': 'Devika Roy',
  'pro-raju': 'raju',
  'raju': 'raju',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return UUID_REGEX.test(value.trim());
}

export function getPhotographerSlug(name: string, fallbackId?: string): string {
  if (!name) return fallbackId ? `pro-${fallbackId}` : 'pro-creator';
  const cleanName = name.trim().toLowerCase();

  if (KNOWN_SLUG_MAP[cleanName]) {
    return KNOWN_SLUG_MAP[cleanName];
  }

  for (const [key, slug] of Object.entries(KNOWN_SLUG_MAP)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return slug;
    }
  }

  const generated = cleanName.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return generated ? `pro-${generated}` : fallbackId || 'pro-creator';
}

export function resolveSlugSearchTerm(slugOrId: string): {
  isUuid: boolean;
  cleanIdentifier: string;
  searchTerm?: string;
} {
  const clean = (slugOrId || '').trim();
  if (isUuid(clean)) {
    return { isUuid: true, cleanIdentifier: clean };
  }

  const lowerSlug = clean.toLowerCase();
  if (REVERSE_SLUG_MAP[lowerSlug]) {
    return {
      isUuid: false,
      cleanIdentifier: clean,
      searchTerm: REVERSE_SLUG_MAP[lowerSlug],
    };
  }

  // Remove leading 'pro-' and hyphens to search by first name or word
  const stripped = lowerSlug.replace(/^pro-/, '').replace(/-/g, ' ').trim();
  const firstWord = stripped.split(' ')[0];

  return {
    isUuid: false,
    cleanIdentifier: clean,
    searchTerm: firstWord || stripped || clean,
  };
}
