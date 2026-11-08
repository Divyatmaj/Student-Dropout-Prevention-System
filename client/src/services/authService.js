import { apiClient, ApiError, USE_MOCKS, mockDelay, tokenStorage } from './api.js';
import { mockUsers, DEMO_PASSWORD } from '../data/mockUsersData.js';

const MOCK_TOKEN_PREFIX = 'mock-token.';

// Same generic message for unknown email, wrong password and disabled account,
// so the login form never reveals which accounts exist.
const invalidCredentials = () =>
  new ApiError({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });

/**
 * Sign in with email and password.
 * POST /auth/login → { token, user }
 */
export async function login(email, password) {
  if (!USE_MOCKS) {
    return apiClient('/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
  }

  await mockDelay(400);
  const user = mockUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || !user.isActive || password !== DEMO_PASSWORD) {
    throw invalidCredentials();
  }
  return { token: `${MOCK_TOKEN_PREFIX}${user.id}`, user: { ...user } };
}

/**
 * Load the profile of the currently signed-in user.
 * GET /auth/me → user
 */
export async function getCurrentUser() {
  if (!USE_MOCKS) {
    return apiClient('/auth/me');
  }

  await mockDelay(200);
  const user = getMockSessionUser();
  if (!user) {
    throw new ApiError({ status: 401, code: 'UNAUTHORIZED', message: 'Your session has expired.' });
  }
  return { ...user };
}

/**
 * Mock mode only: the user behind the stored mock token, or null.
 * Lets mock services record "recorded by" the way the API will from the JWT.
 */
export function getMockSessionUser() {
  const token = tokenStorage.get() || '';
  const userId = token.startsWith(MOCK_TOKEN_PREFIX) ? token.slice(MOCK_TOKEN_PREFIX.length) : null;
  const user = mockUsers.find((u) => u.id === userId && u.isActive);
  return user ? { ...user } : null;
}
