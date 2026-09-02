/**
 * Common API Client and HTTP Configuration
 * Centralized fetch wrapper for backend communication.
 */

export class ApiError extends Error {
  public status: number;
  public data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

/**
 * Centralized HTTP request helper
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(url, config);

    if (!res.ok) {
      let errorBody: unknown;
      try {
        errorBody = await res.json();
      } catch {
        errorBody = await res.text();
      }
      throw new ApiError(
        `API request failed: ${res.status} ${res.statusText}`,
        res.status,
        errorBody
      );
    }

    // Handle 204 No Content
    if (res.status === 204) {
      return {} as T;
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      err instanceof Error ? err.message : 'Network communication error',
      0,
      err
    );
  }
}

export default apiFetch;
