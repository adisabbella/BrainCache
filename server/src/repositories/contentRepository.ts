import { Types } from 'mongoose';
import { Content, IContent } from '../models/Content';
import type { ContentQueryInput } from '../validators/contentSchemas';

export interface PaginatedResult {
  items: IContent[];
  totalItems: number;
}

export const contentRepository = {
  async findWithQuery(userId: string, query: ContentQueryInput): Promise<PaginatedResult> {
    const { search, category, tag, sort, page, limit } = query;

    // Always scope to the authenticated user — this is a security boundary.
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId) };

    if (category) {
      filter['category'] = category;
    }

    if (tag) {
      filter['tags'] = tag.toLowerCase().replace(/\s+/g, '-');
    }

    if (search) {
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

  async findRandom(userId: string): Promise<IContent | null> {
    const results = await Content.aggregate<IContent>([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $sample: { size: 1 } },
    ]).exec();

    return results[0] ?? null;
  },

  async findById(id: string): Promise<IContent | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Content.findById(id).exec();
  },

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

  async deleteById(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Content.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  },

  async enableSharing(id: string, shareTokenHash: string): Promise<IContent | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Content.findByIdAndUpdate(
      id,
      { $set: { isShared: true, shareTokenHash } },
      { new: true, runValidators: true }
    ).exec();
  },

  async disableSharing(id: string): Promise<IContent | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Content.findByIdAndUpdate(
      id,
      { $set: { isShared: false }, $unset: { shareTokenHash: '' } },
      { new: true }
    ).exec();
  },

  async findByShareTokenHash(tokenHash: string): Promise<IContent | null> {
    return Content.findOne({ shareTokenHash: tokenHash, isShared: true }).exec();
  },
};
