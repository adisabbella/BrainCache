import { FilterQuery, Types } from 'mongoose';
import { Content, IContent } from '../models/Content';
import type { ContentQueryInput } from '../validators/contentSchemas';

export interface PaginatedResult {
  items: IContent[];
  totalItems: number;
}

export const contentRepository = {
  /** Returns paginated, filtered, searched content for a user. */
  async findWithQuery(userId: string, query: ContentQueryInput): Promise<PaginatedResult> {
    const { search, category, tag, sort, page, limit } = query;

    // Always scope to the authenticated user — this is a security boundary.
    const filter: FilterQuery<IContent> = { userId: new Types.ObjectId(userId) };

    if (category) {
      filter['category'] = category;
    }

    if (tag) {
      // tags is stored as an array; match documents that contain this tag.
      filter['tags'] = tag.toLowerCase().replace(/\s+/g, '-');
    }

    if (search) {
      // MongoDB full-text search — uses the text index defined on the model.
      filter['$text'] = { $search: search };
    }

    const sortOrder: Record<string, 1 | -1> = { createdAt: sort === 'oldest' ? 1 : -1 };

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      Content.find(filter).sort(sortOrder).skip(skip).limit(limit).exec(),
      Content.countDocuments(filter).exec(),
    ]);

    return { items, totalItems };
  },

  /** Returns a single random content item belonging to the user, or null. */
  async findRandom(userId: string): Promise<IContent | null> {
    const results = await Content.aggregate<IContent>([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $sample: { size: 1 } },
    ]).exec();

    return results[0] ?? null;
  },

  /** Returns a single content item by _id (no ownership check here). */
  async findById(id: string): Promise<IContent | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Content.findById(id).exec();
  },

  /** Creates a new content item. */
  async create(data: {
    userId: string;
    url: string;
    normalizedUrl: string;
    title?: string;
    description?: string;
    domain?: string;
    thumbnailUrl?: string;
    category: string;
    tags: string[];
    note?: string;
  }): Promise<IContent> {
    const content = new Content({
      ...data,
      userId: new Types.ObjectId(data.userId),
    });
    return content.save();
  },

  /** Updates a content item by _id. Returns the updated document or null. */
  async updateById(
    id: string,
    data: {
      title?: string;
      description?: string;
      domain?: string;
      category?: string;
      tags?: string[];
      note?: string;
    }
  ): Promise<IContent | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Content.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).exec();
  },

  /** Deletes a content item by _id. Returns true if deleted, false if not found. */
  async deleteById(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Content.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  },

  /** Returns all content items for a user, newest first (kept for internal use). */
  async findAllByUser(userId: string): Promise<IContent[]> {
    return Content.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  },

  /**
   * Enables sharing on a content item: stores the token hash and sets isShared=true.
   * Returns the updated document.
   */
  async enableSharing(id: string, shareTokenHash: string): Promise<IContent | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Content.findByIdAndUpdate(
      id,
      { $set: { isShared: true, shareTokenHash } },
      { new: true, runValidators: true }
    ).exec();
  },

  /**
   * Disables sharing on a content item: clears token hash and sets isShared=false.
   * Returns the updated document.
   */
  async disableSharing(id: string): Promise<IContent | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Content.findByIdAndUpdate(
      id,
      { $set: { isShared: false }, $unset: { shareTokenHash: '' } },
      { new: true }
    ).exec();
  },

  /**
   * Finds shared content by the SHA-256 hash of the share token.
   * Returns null if not found or sharing is disabled.
   */
  async findByShareTokenHash(tokenHash: string): Promise<IContent | null> {
    return Content.findOne({ shareTokenHash: tokenHash, isShared: true }).exec();
  },
};
