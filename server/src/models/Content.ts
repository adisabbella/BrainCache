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
  // Sharing fields — stored in the schema per the design doc, but
  // sharing functionality is NOT implemented until a later milestone.
  isShared: boolean;
  shareToken?: string;
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
    // Sharing fields present in the schema per the database design doc.
    // The sharing feature itself is NOT implemented in this milestone.
    isShared: {
      type: Boolean,
      default: false,
    },
    shareToken: {
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

export const Content: Model<IContent> = model<IContent>('Content', contentSchema);
