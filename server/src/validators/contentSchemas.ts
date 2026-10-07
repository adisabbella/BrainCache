import { z } from 'zod';

export const CATEGORIES = [
  'Education',
  'Technology',
  'Programming',
  'AI & ML',
  'Career',
  'News',
  'Movies',
  'TV Shows',
  'Music',
  'Games',
  'Sports',
  'Travel',
  'Finance',
  'Health & Fitness',
  'Food',
  'Memes',
  'Social Media',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

const tagSchema = z
  .string()
  .trim()
  .min(1, 'Tags must not be empty.')
  .max(50, 'Each tag must be at most 50 characters.')
  .transform((t) => t.toLowerCase().replace(/\s+/g, '-'));

export const CreateContentSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'URL is required.')
    .max(2048, 'URL is too long.')
    .url('Must be a valid URL.'),

  title: z.string().trim().max(500, 'Title must be at most 500 characters.').optional(),

  description: z
    .string()
    .trim()
    .max(2000, 'Description must be at most 2000 characters.')
    .optional(),

  domain: z.string().trim().max(253, 'Domain must be at most 253 characters.').optional(),

  category: z.enum(CATEGORIES, {
    error: `Category must be one of: ${CATEGORIES.join(', ')}.`,
  }),

  tags: z
    .array(tagSchema)
    .max(20, 'You can add at most 20 tags.')
    .default([])
    .transform((tags) => [...new Set(tags)]),

  note: z.string().trim().max(5000, 'Note must be at most 5000 characters.').optional(),
});

export const UpdateContentSchema = z
  .object({
    title: z.string().trim().max(500).optional(),
    description: z.string().trim().max(2000).optional(),
    domain: z.string().trim().max(253).optional(),
    category: z.enum(CATEGORIES, {
      error: `Category must be one of: ${CATEGORIES.join(', ')}.`,
    }),
    tags: z
      .array(tagSchema)
      .max(20, 'You can add at most 20 tags.')
      .transform((tags) => [...new Set(tags)]),
    note: z.string().trim().max(5000).optional(),
  })
  .partial();

export type CreateContentInput = z.infer<typeof CreateContentSchema>;
export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;

export const MAX_PAGE_LIMIT = 100;

export const ContentQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),

  category: z
    .enum(CATEGORIES, { error: `Category must be one of: ${CATEGORIES.join(', ')}.` })
    .optional(),

  tag: z.string().trim().max(50).optional(),

  sort: z.enum(['newest', 'oldest']).default('newest'),

  page: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 1))
    .pipe(z.number().int().min(1, 'page must be at least 1')),

  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 20))
    .pipe(
      z
        .number()
        .int()
        .min(1, 'limit must be at least 1')
        .max(MAX_PAGE_LIMIT, `limit must be at most ${MAX_PAGE_LIMIT}`)
    ),
});

export type ContentQueryInput = z.infer<typeof ContentQuerySchema>;
