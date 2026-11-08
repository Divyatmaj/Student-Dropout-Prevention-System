/**
 * Central API Client Configuration for Udaan Frontend
 * Prepared to connect to Express + PostgreSQL backend.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Standard fetch wrapper with JSON serialization & error propagation
 */
export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(
      errorBody.message || `API request failed with status ${response.status}`
    );
    error.status = response.status;
    error.data = errorBody;
    throw error;
  }

  return response.json();
}
