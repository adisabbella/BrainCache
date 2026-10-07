import { AppError } from '../errors/AppError';
import { contentRepository } from '../repositories/contentRepository';
import { fetchUrlMetadata } from '../utils/metadata';
import { generateShareToken, hashShareToken } from '../utils/shareToken';
import { normalizeUrl } from '../utils/normalizeUrl';
import type { ContentQueryInput, CreateContentInput, UpdateContentInput } from '../validators/contentSchemas';

/** Safe shape returned to the authenticated owner. Includes isShared status. */
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
 * Safe public shape — never exposes userId, note, or any internal fields.
 * Only returned via the public share endpoint.
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

/** Pagination metadata included in collection responses. */
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

export const contentService = {
  /**
   * Returns a paginated, optionally searched/filtered page of the user's content.
   * All queries are scoped to the authenticated user — ownership is enforced in
   * the repository layer and cannot be bypassed through query parameters.
   */
  async listForUserWithQuery(
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

  /**
   * Returns a single random content item belonging to the authenticated user.
   * Returns null if the user has no saved content.
   */
  async getRandom(userId: string): Promise<SafeContent | null> {
    const item = await contentRepository.findRandom(userId);
    return item ? toSafeContent(item) : null;
  },

  /** Returns a single content item, verifying ownership. */
  async getOne(userId: string, contentId: string): Promise<SafeContent> {
    const item = await contentRepository.findById(contentId);

    // Return 404 for both "not found" and "belongs to another user"
    // to avoid leaking the existence of other users' content.
    if (!item || String(item.userId) !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    return toSafeContent(item);
  },

  /** Creates a new content item for the authenticated user. */
  async create(userId: string, input: CreateContentInput): Promise<SafeContent> {
    const normalized = normalizeUrl(input.url);

    // --- Metadata extraction (best-effort, never blocks save) ---
    // Run metadata fetch concurrently. If it fails for any reason, proceed anyway.
    let metadata: Awaited<ReturnType<typeof fetchUrlMetadata>> = null;
    try {
      metadata = await fetchUrlMetadata(input.url);
    } catch {
      // Swallow — metadata is optional enrichment.
    }

    // User-supplied values take priority over extracted metadata.
    const title = input.title || metadata?.title || undefined;
    const description = input.description || metadata?.description || undefined;
    const thumbnailUrl = metadata?.thumbnailUrl || undefined;

    let domain = input.domain;
    if (!domain) {
      domain =
        metadata?.domain ||
        (() => {
          try {
            return new URL(input.url).hostname.replace(/^www\./, '');
          } catch {
            return undefined;
          }
        })();
    }

    try {
      const item = await contentRepository.create({
        userId,
        url: input.url,
        normalizedUrl: normalized,
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
      // MongoDB duplicate-key error on (userId, normalizedUrl)
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

  /** Updates an existing content item, verifying ownership first. */
  async update(
    userId: string,
    contentId: string,
    input: UpdateContentInput
  ): Promise<SafeContent> {
    // Verify ownership
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

  /** Deletes an existing content item, verifying ownership first. */
  async delete(userId: string, contentId: string): Promise<void> {
    const existing = await contentRepository.findById(contentId);
    if (!existing || String(existing.userId) !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    await contentRepository.deleteById(contentId);
  },

  /**
   * Enables public sharing for a content item.
   * Generates a cryptographically secure token, stores only its hash.
   * Returns the raw token (caller embeds it in the public URL).
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

  /**
   * Disables public sharing for a content item.
   * Immediately invalidates any previously issued share links.
   */
  async disableSharing(userId: string, contentId: string): Promise<void> {
    const existing = await contentRepository.findById(contentId);
    if (!existing || String(existing.userId) !== userId) {
      throw new AppError(404, 'NOT_FOUND', 'Content not found.');
    }

    await contentRepository.disableSharing(contentId);
  },

  /**
   * Retrieves the public representation of a shared content item by raw token.
   * Returns only safe public fields — never exposes userId, note, or internals.
   * Returns 404 whether the token doesn't exist OR sharing has been disabled,
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
