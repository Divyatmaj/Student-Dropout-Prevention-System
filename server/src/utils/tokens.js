/**
 * Login tokens: HS256 JWTs carrying the user id, role and school id.
 * The authenticate middleware still reloads the user on every request, so a
 * deactivated account or a role change takes effect immediately.
 */
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { AppError, unauthorized } from './AppError.js';

const ALGORITHM = 'HS256';
const ISSUER = 'udaan-api';

function secret() {
  if (!env.JWT_SECRET) {
    throw new AppError({
      status: 503,
      code: 'AUTH_NOT_CONFIGURED',
      message: 'Sign-in is not configured. Set JWT_SECRET for the Udaan API.',
    });
  }
  return env.JWT_SECRET;
}

export function signToken(user) {
  return jwt.sign({ role: user.role, schoolId: user.schoolId }, secret(), {
    algorithm: ALGORITHM,
    subject: user.id,
    issuer: ISSUER,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

/** @returns {{ sub, role, schoolId, exp }} or throws 401 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, secret(), { algorithms: [ALGORITHM], issuer: ISSUER });
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw err?.name === 'TokenExpiredError'
      ? new AppError({ status: 401, code: 'TOKEN_EXPIRED', message: 'Your session has expired. Please sign in again.' })
      : unauthorized('Your session is not valid. Please sign in again.');
  }
}
