import Cookies from 'js-cookie';

/**
 * Shared HTTP client for CO2Clean API.
 * Automatically attaches the JWT auth-token from cookies to every request.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3022';

function getToken(): string | null {
  return Cookies.get('auth-token') || null;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const response = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
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
