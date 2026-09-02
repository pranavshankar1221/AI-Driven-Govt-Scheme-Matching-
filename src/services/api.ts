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
 * Centralized HTTP request helper with robust single-read body handling
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
    const rawText = await res.text();

    if (!res.ok) {
      let errorData: unknown = rawText;
      try {
        if (rawText && rawText.trim()) {
          errorData = JSON.parse(rawText);
        }
      } catch {
        // use raw text
      }
      throw new ApiError(
        `API request failed: ${res.status} ${res.statusText}`,
        res.status,
        errorData
      );
    }

    // Handle 204 No Content or empty body
    if (res.status === 204 || !rawText || !rawText.trim()) {
      return {} as T;
    }

    try {
      return JSON.parse(rawText) as T;
    } catch {
      return rawText as unknown as T;
    }
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
