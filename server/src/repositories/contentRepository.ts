import { Types } from 'mongoose';
import { Content, IContent } from '../models/Content';

export const contentRepository = {
  /** Returns all content items for a user, newest first. */
  async findAllByUser(userId: string): Promise<IContent[]> {
    return Content.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
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
};
