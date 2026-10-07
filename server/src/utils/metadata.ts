/**
 * Best-effort URL metadata extraction.
 *
 * Fetches the HTML of a URL and extracts basic metadata from Open Graph tags
 * and standard HTML head elements.
 *
 * This function must not throw — on any failure it returns null so the caller
 * can proceed with whatever user-supplied data is available.
 */

export interface UrlMetadata {
  title?: string;
  description?: string;
  domain?: string;
  thumbnailUrl?: string;
}

const FETCH_TIMEOUT_MS = 5_000;

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

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim() || undefined;
}

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
