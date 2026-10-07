import { AppError } from '../errors/AppError';
import { contentRepository } from '../repositories/contentRepository';
import { fetchUrlMetadata } from '../utils/metadata';
import { generateShareToken, hashShareToken } from '../utils/shareToken';
import { normalizeUrl } from '../utils/normalizeUrl';
import type { ContentQueryInput, CreateContentInput, UpdateContentInput } from '../validators/contentSchemas';

/** Shape returned to the authenticated owner. */
export interface SafeContent {
  id: string;
  userId: string;
  url: string;
  title?: string;
  description?: string;
  domain?: string;
  category: string;
  tags: string[];
  note?: string;
  thumbnailUrl?: string;
  isShared: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape returned via the public share endpoint.
 * Never exposes userId, note, or any internal fields.
 */
export interface PublicContent {
  title?: string;
  description?: string;
  url: string;
  domain?: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function toSafeContent(doc: {
  _id: unknown;
  userId: unknown;
  url: string;
  title?: string;
  description?: string;
  domain?: string;
  category: string;
  tags: string[];
  note?: string;
  thumbnailUrl?: string;
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SafeContent {
  return {
    id: String(doc._id),
    userId: String(doc.userId),
    url: doc.url,
    title: doc.title,
    description: doc.description,
    domain: doc.domain,
    category: doc.category,
    tags: doc.tags,
    note: doc.note,
    thumbnailUrl: doc.thumbnailUrl,
    isShared: doc.isShared,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function toPublicContent(doc: {
  url: string;
  title?: string;
  description?: string;
  domain?: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
}): PublicContent {
  return {
    title: doc.title,
    description: doc.description,
    url: doc.url,
    domain: doc.domain,
    category: doc.category,
    tags: doc.tags,
    thumbnailUrl: doc.thumbnailUrl,
  };
}

function extractDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

export const contentService = {
  async listForUser(
    userId: string,
    query: ContentQueryInput
  ): Promise<{ items: SafeContent[]; pagination: PaginationMeta }> {
    const { items, totalItems } = await contentRepository.findWithQuery(userId, query);
    const totalPages = Math.ceil(totalItems / query.limit);

    const pagination: PaginationMeta = {
      page: query.page,
      limit: query.limit,
      totalItems,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1,
    };

    return { items: items.map(toSafeContent), pagination };
  },

  async getRandom(userId: string): Promise<SafeContent | null> {
    const item = await contentRepository.findRandom(userId);
    return item ? toSafeContent(item) : null;
  },

  async getOne(userId: string, contentId: string): Promise<SafeContent> {
    const item = await contentRepository.findById(contentId);

    // Return 404 for both "not found" and "wrong owner" to avoid leaking existence of other users' content.
    if (!item || String(item.userId) !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    return toSafeContent(item);
  },

  async create(userId: string, input: CreateContentInput): Promise<SafeContent> {
    const normalizedUrl = normalizeUrl(input.url);

    // Metadata fetch is best-effort — failures never block saving.
    let metadata: Awaited<ReturnType<typeof fetchUrlMetadata>> = null;
    try {
      metadata = await fetchUrlMetadata(input.url);
    } catch {
      // intentionally swallowed
    }

    const title = input.title || metadata?.title || undefined;
    const description = input.description || metadata?.description || undefined;
    const thumbnailUrl = metadata?.thumbnailUrl || undefined;
    const domain = input.domain || metadata?.domain || extractDomain(input.url);

    try {
      const item = await contentRepository.create({
        userId,
        url: input.url,
        normalizedUrl,
        title,
        description,
        domain,
        thumbnailUrl,
        category: input.category,
        tags: input.tags,
        note: input.note,
      });
      return toSafeContent(item);
    } catch (err: unknown) {
      // MongoDB duplicate-key on (userId, normalizedUrl) — user already saved this URL.
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code: unknown }).code === 11000
      ) {
        throw new AppError(409, 'CONFLICT', 'You have already saved this URL.');
      }
      throw err;
    }
  },

  async update(
    userId: string,
    contentId: string,
    input: UpdateContentInput
  ): Promise<SafeContent> {
    const existing = await contentRepository.findById(contentId);
    if (!existing || String(existing.userId) !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    const updated = await contentRepository.updateById(contentId, input);
    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    return toSafeContent(updated);
  },

  async delete(userId: string, contentId: string): Promise<void> {
    const existing = await contentRepository.findById(contentId);
    if (!existing || String(existing.userId) !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    await contentRepository.deleteById(contentId);
  },

  /**
   * Generates a cryptographically secure token, stores only its SHA-256 hash.
   * The raw token is returned so the caller can embed it in the public URL.
   */
  async enableSharing(userId: string, contentId: string): Promise<{ shareToken: string }> {
    const existing = await contentRepository.findById(contentId);
    if (!existing || String(existing.userId) !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    const rawToken = generateShareToken();
    const tokenHash = hashShareToken(rawToken);

    const updated = await contentRepository.enableSharing(contentId, tokenHash);
    if (!updated) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    return { shareToken: rawToken };
  },

  async disableSharing(userId: string, contentId: string): Promise<void> {
    const existing = await contentRepository.findById(contentId);
    if (!existing || String(existing.userId) !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    await contentRepository.disableSharing(contentId);
  },

  /**
   * Returns the public view of a shared item by raw token.
   * Returns 404 whether sharing is disabled or the token doesn't exist,
   * so callers cannot probe for token existence.
   */
  async getPublicByToken(rawToken: string): Promise<PublicContent> {
    const tokenHash = hashShareToken(rawToken);
    const item = await contentRepository.findByShareTokenHash(tokenHash);
    if (!item) {
      throw new AppError(404, 'NOT_FOUND', 'Shared content not found.');
    }
    return toPublicContent(item);
  },
};
