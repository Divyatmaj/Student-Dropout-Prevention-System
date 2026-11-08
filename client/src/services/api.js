/**
 * Central API client for the Udaan web app.
 *
 * - Calls the Udaan API under a relative base path (`/api/v1` by default), so
 *   the same build works locally (Vite proxy) and on Vercel (same origin).
 * - Attaches the JWT from storage as `Authorization: Bearer <token>`.
 * - Unwraps the standard response envelope `{ success, data, message }` and
 *   turns `{ success: false, error }` / non-2xx responses into `ApiError`s.
 * - On `401`, clears the stored token and broadcasts `UNAUTHORIZED_EVENT` so
 *   the auth context can sign the user out.
 *
 * Mock mode: when `VITE_USE_MOCKS=true`, services return local mock data
 * instead of calling the API (frontend-only development). The default is the
 * real API. Mock data is never used to hide a real API error.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

/** Show the demo-account buttons on the login page (always on in mock mode). */
export const SHOW_DEMO_ACCOUNTS = USE_MOCKS || import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true';

/**
 * Give up on a request after this long. Generous because the first request
 * after a quiet period can wait for the database to wake up (a few seconds).
 */
export const REQUEST_TIMEOUT_MS = 25_000;

export const UNAUTHORIZED_EVENT = 'udaan:unauthorized';

const TOKEN_KEY = 'udaan.authToken';

/**
 * Token storage. localStorage is used for this prototype so a refresh keeps
 * the session; an HTTP-only secure cookie is preferable for production.
 * Only the token is stored here — never student data or notes.
 */
export const tokenStorage = {
  get() {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage unavailable (private mode etc.) — session lasts until refresh.
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

export class ApiError extends Error {
  constructor({ message, status = 0, code = 'UNKNOWN_ERROR', details = [] }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Perform a request against the Udaan API.
 *
 * @param {string} endpoint  Path relative to the API base, e.g. `/students`.
 * @param {object} options   fetch options plus:
 *                           - `auth` (default true): attach token / handle 401.
 * @returns the unwrapped `data` field of the response envelope.
 */
export async function apiClient(endpoint, options = {}) {
  const { auth = true, headers = {}, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const requestHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  const token = auth ? tokenStorage.get() : null;
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(url, { ...fetchOptions, headers: requestHeaders, signal: controller.signal });
  } catch (err) {
    throw err?.name === 'AbortError'
      ? new ApiError({
          message: 'The Udaan API took too long to respond. Please try again.',
          code: 'TIMEOUT',
        })
      : new ApiError({
          message: 'Unable to reach the Udaan API. Check your connection and try again.',
          code: 'NETWORK_ERROR',
        });
  } finally {
    clearTimeout(timer);
  }

  const payload = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    if (response.status === 401 && auth) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    // Without a structured error body (e.g. proxy/gateway failure), fall back
    // to a readable message rather than a bare status code.
    const fallbackMessage =
      response.status >= 500
        ? 'The Udaan API is unavailable right now. Please try again shortly.'
        : `Request failed with status ${response.status}`;

    throw new ApiError({
      status: response.status,
      code: payload?.error?.code || 'HTTP_ERROR',
      message: payload?.error?.message || fallbackMessage,
      details: payload?.error?.details || [],
    });
  }

  if (payload && typeof payload === 'object' && 'success' in payload) {
    return payload.data;
  }
  return payload;
}

/** Small artificial latency so loading states are visible in mock mode. */
export function mockDelay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Build a `?a=b` query string, skipping empty values. */
export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      query.set(key, value);
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}
