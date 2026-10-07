import { Document, Model, Schema, model, Types } from 'mongoose';

export interface IContent extends Document {
  userId: Types.ObjectId;
  url: string;
  normalizedUrl: string;
  title?: string;
  description?: string;
  domain?: string;
  category: string;
  tags: string[];
  note?: string;
  thumbnailUrl?: string;
  // Shares store only the SHA-256 hash; the raw token lives only in the public URL.
  isShared: boolean;
  shareTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contentSchema = new Schema<IContent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedUrl: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    domain: {
      type: String,
      trim: true,
      maxlength: 253,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    note: {
      type: String,
      trim: true,
      maxlength: 5000,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    isShared: {
      type: Boolean,
      default: false,
    },
    shareTokenHash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: prevents a user from saving the same URL twice.
contentSchema.index({ userId: 1, normalizedUrl: 1 }, { unique: true });
contentSchema.index({ userId: 1, createdAt: -1 });
contentSchema.index({ userId: 1, category: 1, createdAt: -1 });

// MongoDB allows only one text index per collection; all searchable fields go here.
contentSchema.index(
  {
    title: 'text',
    description: 'text',
    domain: 'text',
    tags: 'text',
    note: 'text',
  },
  {
    name: 'content_text_search',
    weights: { title: 10, tags: 5, domain: 3, description: 2, note: 1 },
  }
);

// Sparse so documents without a shareTokenHash don't consume index space.
contentSchema.index({ shareTokenHash: 1 }, { unique: true, sparse: true });

export const Content: Model<IContent> = model<IContent>('Content', contentSchema);
