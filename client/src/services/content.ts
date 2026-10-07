import type { ContentItem, CreateContentBody, UpdateContentBody } from '../types/content';

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      credentials: 'include',
    });

    // DELETE returns 204 No Content
    if (res.status === 204) {
      return { data: null, error: null };
    }

    const json = await res.json();

    if (!res.ok || !json.success) {
      return { data: null, error: json?.error?.message ?? 'Something went wrong.' };
    }

    return { data: json.data as T, error: null };
  } catch {
    return { data: null, error: 'Network error. Please check your connection.' };
  }
}

export interface ContentListParams {
  search?: string;
  category?: string;
  tag?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ContentListResponse {
  items: ContentItem[];
  pagination: PaginationMeta;
}

export interface RandomContentResponse {
  content: ContentItem | null;
  empty: boolean;
}

export interface PublicContentItem {
  title?: string;
  description?: string;
  url: string;
  domain?: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
}

export const contentApi = {
  list: (params?: ContentListParams) => {
    const qs = new URLSearchParams();
    if (params?.search)   qs.set('search', params.search);
    if (params?.category) qs.set('category', params.category);
    if (params?.tag)      qs.set('tag', params.tag);
    if (params?.sort)     qs.set('sort', params.sort);
    if (params?.page != null)  qs.set('page', String(params.page));
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const query = qs.toString();
    return request<ContentListResponse>(`/api/content${query ? `?${query}` : ''}`);
  },

  getRandom: () => request<RandomContentResponse>('/api/content/random'),

  getOne: (id: string) => request<{ item: ContentItem }>(`/api/content/${id}`),

  create: (body: CreateContentBody) =>
    request<{ item: ContentItem }>('/api/content', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (id: string, body: UpdateContentBody) =>
    request<{ item: ContentItem }>(`/api/content/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (id: string) =>
    request<null>(`/api/content/${id}`, { method: 'DELETE' }),

  enableSharing: (id: string) =>
    request<{ shareUrl: string }>(`/api/content/${id}/share`, { method: 'POST' }),

  disableSharing: (id: string) =>
    request<null>(`/api/content/${id}/share`, { method: 'DELETE' }),
};

/** Fetch public share data — no auth cookies sent. */
export async function getSharedContent(
  token: string
): Promise<{ data: PublicContentItem | null; error: string | null }> {
  try {
    const res = await fetch(`/api/share/${token}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      return { data: null, error: json?.error?.message ?? 'Content not found.' };
    }
    return { data: json.data.content as PublicContentItem, error: null };
  } catch {
    return { data: null, error: 'Network error.' };
  }
}
