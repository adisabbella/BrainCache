/**
 * Conservatively normalizes a URL for duplicate detection.
 *
 * Rules applied (per the database design doc §11):
 * - Lowercase the hostname.
 * - Remove default ports (80 for http, 443 for https).
 * - Remove "www." prefix from the hostname.
 * - Remove a trailing slash from the pathname (root "/" is preserved).
 * - Strip well-known tracking-only query parameters (utm_*, fbclid, gclid, etc.)
 *   while preserving all other query parameters so that resource-identifying
 *   parameters (e.g. YouTube's `v`) are never removed.
 * - Remove the fragment (#…) because fragments are client-side only and never
 *   identify a distinct server resource.
 *
 * The original URL is always stored separately so the user's original input is
 * never altered in the UI.
 */

/** UTM and other known tracking-only parameter names. */
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'msclkid',
  'mc_eid',
  'mc_cid',
  '_ga',
  'ref',
  'referrer',
]);

export function normalizeUrl(rawUrl: string): string {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    // If the URL cannot be parsed return it lowercased as a last resort.
    // Zod validation should catch truly invalid URLs before this point.
    return rawUrl.toLowerCase().trim();
  }

  // Lowercase hostname
  parsed.hostname = parsed.hostname.toLowerCase();

  // Remove "www." prefix
  if (parsed.hostname.startsWith('www.')) {
    parsed.hostname = parsed.hostname.slice(4);
  }

  // Remove default ports
  if (
    (parsed.protocol === 'http:' && parsed.port === '80') ||
    (parsed.protocol === 'https:' && parsed.port === '443')
  ) {
    parsed.port = '';
  }

  // Remove tracking-only query parameters
  const toDelete: string[] = [];
  for (const key of parsed.searchParams.keys()) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      toDelete.push(key);
    }
  }
  for (const key of toDelete) {
    parsed.searchParams.delete(key);
  }

  // Sort remaining params for consistent ordering
  parsed.searchParams.sort();

  // Remove trailing slash from pathname (but keep root "/")
  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  // Remove fragment — fragments are client-side only
  parsed.hash = '';

  return parsed.toString();
}
