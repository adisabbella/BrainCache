import { AppError } from '../errors/AppError';
import { contentRepository } from '../repositories/contentRepository';
import { normalizeUrl } from '../utils/normalizeUrl';
import type { ContentQueryInput, CreateContentInput, UpdateContentInput } from '../validators/contentSchemas';

/** Safe public shape of a content item returned to clients. */
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
  createdAt: string;
  updatedAt: string;
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
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
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

    // Extract domain from the URL for storage.
    let domain = input.domain;
    if (!domain) {
      try {
        domain = new URL(input.url).hostname.replace(/^www\./, '');
      } catch {
        domain = undefined;
      }
    }

    try {
      const item = await contentRepository.create({
        userId,
        url: input.url,
        normalizedUrl: normalized,
        title: input.title,
        description: input.description,
        domain,
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
};
