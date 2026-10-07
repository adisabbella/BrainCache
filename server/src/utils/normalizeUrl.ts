/**
 * Conservatively normalizes a URL for duplicate detection.
 *
 * - Lowercase the hostname.
 * - Remove "www." prefix.
 * - Remove default ports (80 for http, 443 for https).
 * - Remove trailing slash from the pathname (root "/" is preserved).
 * - Strip known tracking-only query parameters (utm_*, fbclid, etc.)
 *   while preserving all others so resource-identifying parameters (e.g. YouTube's `v`) are kept.
 * - Remove the fragment (#…) — fragments are client-side only.
 *
 * The original URL is stored separately so the user's input is never altered in the UI.
 */

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
    // Zod validation should catch truly invalid URLs before this point.
    return rawUrl.toLowerCase().trim();
  }

  parsed.hostname = parsed.hostname.toLowerCase();

  if (parsed.hostname.startsWith('www.')) {
    parsed.hostname = parsed.hostname.slice(4);
  }

  if (
    (parsed.protocol === 'http:' && parsed.port === '80') ||
    (parsed.protocol === 'https:' && parsed.port === '443')
  ) {
    parsed.port = '';
  }

  const toDelete: string[] = [];
  for (const key of parsed.searchParams.keys()) {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      toDelete.push(key);
    }
  }
  for (const key of toDelete) {
    parsed.searchParams.delete(key);
  }

  parsed.searchParams.sort();

  if (parsed.pathname.length > 1 && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.slice(0, -1);
  }

  parsed.hash = '';

  return parsed.toString();
}
