export interface ContentItem {
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

export interface CreateContentBody {
  url: string;
  title?: string;
  category: string;
  tags?: string[];
  note?: string;
}

export interface UpdateContentBody {
  title?: string;
  category?: string;
  tags?: string[];
  note?: string;
}

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
