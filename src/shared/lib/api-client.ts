import Cookies from 'js-cookie';

/**
 * Shared HTTP client for EcoCore API.
 * Automatically attaches the JWT auth-token from cookies to every request.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3022';

function getToken(): string | null {
  return Cookies.get('auth-token') || null;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | undefined | null>;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, params, headers, ...rest } = options;

  // Build query string
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (qs) url = `${url}?${qs}`;
  }

  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear token from cookies
      Cookies.remove('auth-token');

      // Clear user info from localStorage and redirect to login page
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    const errorBody = await response.json().catch(() => ({}));
    const message =
      (errorBody as { message?: string }).message ??
      `Error ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as T;

  const json = await response.json();
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}
