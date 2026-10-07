/**
 * Best-effort URL metadata extraction.
 *
 * This module fetches the HTML of a URL and extracts basic metadata from
 * Open Graph tags and standard HTML head elements.
 *
 * Critical contract: this function MUST NOT throw. If anything goes wrong
 * (network error, timeout, parse failure, etc.) it returns null so that the
 * caller can proceed with whatever user-supplied data is available.
 */

export interface UrlMetadata {
  title?: string;
  description?: string;
  domain?: string;
  thumbnailUrl?: string;
}

/** Timeout in milliseconds for the external HTTP request. */
const FETCH_TIMEOUT_MS = 5_000;

/**
 * Extracts the content of a meta tag by property or name attribute.
 * Returns undefined if not found or empty.
 */
function extractMeta(html: string, attr: string, value: string): string | undefined {
  const re = new RegExp(
    `<meta[^>]+(?:${attr})=["'](${value})["'][^>]+content=["']([^"']+)["']|` +
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:${attr})=["'](${value})["']`,
    'i'
  );
  const m = html.match(re);
  if (m) {
    const val = m[2] ?? m[3];
    return val?.trim() || undefined;
  }
  return undefined;
}

/**
 * Attempts to extract the page title from a <title> tag.
 */
function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() || undefined;
}

/**
 * Attempts to fetch and parse basic metadata from the given URL.
 * Returns null on any failure — never throws.
 */
export async function fetchUrlMetadata(url: string): Promise<UrlMetadata | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; BrainCache/1.0; +https://braincache.app/bot)',
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) return null;

    const reader = response.body?.getReader();
    if (!reader) return null;

    let html = '';
    let bytesRead = 0;
    const MAX_BYTES = 100_000;
    const decoder = new TextDecoder();

    while (bytesRead < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      bytesRead += value.byteLength;
      if (html.toLowerCase().includes('</head>')) break;
    }
    reader.cancel().catch(() => undefined);

    const metadata: UrlMetadata = {};

    metadata.title =
      extractMeta(html, 'property', 'og:title') ??
      extractMeta(html, 'name', 'twitter:title') ??
      extractTitle(html);

    metadata.description =
      extractMeta(html, 'property', 'og:description') ??
      extractMeta(html, 'name', 'description') ??
      extractMeta(html, 'name', 'twitter:description');

    metadata.thumbnailUrl =
      extractMeta(html, 'property', 'og:image') ??
      extractMeta(html, 'name', 'twitter:image');

    try {
      metadata.domain = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      // ignore
    }

    const hasAnyValue =
      metadata.title || metadata.description || metadata.thumbnailUrl || metadata.domain;
    return hasAnyValue ? metadata : null;
  } catch {
    return null;
  }
}
