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
  // Sharing — isShared flag + SHA-256 hash of the raw token (token itself lives only in the URL).
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
    // Stores SHA-256(rawToken). The raw token is only ever in the public URL.
    shareTokenHash: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

// Unique compound index: prevents a user from saving the same URL twice.
contentSchema.index({ userId: 1, normalizedUrl: 1 }, { unique: true });

// Supports listing a user's content (default sort by newest).
contentSchema.index({ userId: 1, createdAt: -1 });

// Supports category filtering.
contentSchema.index({ userId: 1, category: 1, createdAt: -1 });

// Text search index across the searchable fields (Milestone 4).
// MongoDB allows only one text index per collection; all fields go here.
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

// Sparse unique index: allows efficient lookup by token hash; sparse so null rows are ignored.
contentSchema.index({ shareTokenHash: 1 }, { unique: true, sparse: true });

export const Content: Model<IContent> = model<IContent>('Content', contentSchema);
