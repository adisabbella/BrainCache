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

export const contentApi = {
  list: () => request<{ items: ContentItem[] }>('/api/content'),

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
};
