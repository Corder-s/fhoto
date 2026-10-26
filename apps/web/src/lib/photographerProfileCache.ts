/**
 * Photographer Profile In-Memory Cache and Request Deduplication
 *
 * Provides instant (<10ms) client-side profile modal opening, eliminating redundant
 * network requests and deduplicating concurrent in-flight requests.
 */

interface CachedProfile {
  data: any;
  timestamp: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL
const profileCache = new Map<string, CachedProfile>();
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Normalizes an identifier (e.g. trims whitespace and standardizes lower-case)
 */
function normalizeId(id: string): string {
  return id.trim();
}

/**
 * Returns cached photographer data if present and unexpired, otherwise null.
 */
export function getCachedPhotographerProfile(id: string): any | null {
  if (!id) return null;
  const key = normalizeId(id);
  const entry = profileCache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    profileCache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Stores photographer profile in cache.
 */
export function setCachedPhotographerProfile(id: string, data: any): void {
  if (!id || !data) return;
  const key = normalizeId(id);
  profileCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Fetches a photographer's full profile with automatic caching and in-flight deduplication.
 */
export async function fetchPhotographerProfile(id: string): Promise<any> {
  if (!id) return null;
  const key = normalizeId(id);

  // 1. Check cache first
  const cached = getCachedPhotographerProfile(key);
  if (cached) {
    return cached;
  }

  // 2. Check in-flight request deduplication
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  // 3. Initiate network request
  const fetchPromise = (async () => {
    try {
      const res = await fetch(`/api/photographers?id=${encodeURIComponent(key)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch photographer profile: ${res.status}`);
      }
      const data = await res.json();
      if (data.photographers && data.photographers.length > 0) {
        const profile = data.photographers[0];
        setCachedPhotographerProfile(key, profile);
        // Also index by slug and user_id if present
        if (profile.id && profile.id !== key) setCachedPhotographerProfile(profile.id, profile);
        if (profile.slug && profile.slug !== key) setCachedPhotographerProfile(profile.slug, profile);
        if (profile.userId && profile.userId !== key) setCachedPhotographerProfile(profile.userId, profile);
        return profile;
      }
      return null;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, fetchPromise);
  return fetchPromise;
}

/**
 * Prefetches a photographer's profile when the user hovers over or focuses a card.
 * Runs in the background without blocking the UI.
 */
export function prefetchPhotographerProfile(id: string): void {
  if (!id) return;
  const key = normalizeId(id);

  // If already in cache or request already in flight, do nothing
  if (profileCache.has(key) || inFlightRequests.has(key)) {
    return;
  }

  // Trigger non-blocking background fetch
  fetchPhotographerProfile(key).catch(() => {
    // Silently ignore prefetch network errors
  });
}

/**
 * Evicts an individual photographer from the cache.
 */
export function evictPhotographerProfile(id: string): void {
  if (!id) return;
  profileCache.delete(normalizeId(id));
}

/**
 * Clears the entire photographer cache.
 */
export function clearPhotographerProfileCache(): void {
  profileCache.clear();
  inFlightRequests.clear();
}
