import type { User } from '../types/auth';

/**
 * All requests use credentials: 'include' so the browser sends the
 * HTTP-only authentication cookie automatically.
 * The JWT is never read or stored by JavaScript.
 */

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

    const json = await res.json();

    if (!res.ok || !json.success) {
      return { data: null, error: json?.error?.message ?? 'Something went wrong.' };
    }

    return { data: json.data as T, error: null };
  } catch {
    return { data: null, error: 'Network error. Please check your connection.' };
  }
}

export const authApi = {
  register: (body: { username: string; email: string; password: string }) =>
    request<{ user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<void>('/api/auth/logout', { method: 'POST' }),

  me: () =>
    request<{ user: User }>('/api/auth/me'),
};
